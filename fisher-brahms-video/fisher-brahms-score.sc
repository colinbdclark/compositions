(
	var makeGroupedSynths, makeOutputController,
	    trackSynthState,
	    makePeriodicSetter, makeGaussianRandomizer,
	    onEvent, offEvent, makeEventFirer,
	    riversBus, rivers, loopersBus, loopers, leftOutput, rightOutput,
	    leftSynths, rightSynths,
	    volTriggerStates,
	    shortSilentDuration, longSilentDuration, shortSoundDuration, longSoundDuration,
	    leftEventFirer, rightEventFirer,
	    dramaResponder,
	    loopVolumeRoutine,loopPitchRoutine;

	makeGroupedSynths = {
		arg defName, buffers, outputBusNum;
		
		var group = Group.new,
		       synths = List.new;
		
		buffers.do({
			arg buffer, idx;
			var synth = Synth.new(
				defName: defName,
				args: ["bufnum", buffer.bufnum, "outputBusNum", outputBusNum + idx],
				target: group,
				addAction: \addToTail
			);
			synths.add(synth);
		});
		
		synths;
	};
	
	makeOutputController = {
		arg riverBusNum, looperBusNum, channelOffset;
		
		Synth.new(
			defName: "OutputController",
			args: [
				"riverBusNum", riverBusNum  + channelOffset,
				"looperBusNum", looperBusNum  + channelOffset,
				"outputBusNum", channelOffset
			],
			addAction: \addToTail
		);		
	};
	
	trackSynthState = {
		arg synths, stateParam;
		var states = IdentityDictionary.new;
		
		synths.do({
			arg synth;
			synth.get(stateParam, {
				arg val;
				states.put(synth, val);
			});
		});
		
		states;
	};
	
		
	makeGaussianRandomizer = {
		arg centre, deviation;
		
		{
			centre.gaussian(deviation);
		}
	};
	
	makePeriodicSetter = {
		arg synths, paramName, waitRandomizer, paramCalculator, debug = true, runFor = inf;
		
		var setter = Routine.new({
			runFor.do({
				var waitDur = waitRandomizer.value(),
				       synth, paramValue;
				 
				waitDur.wait;
				synth = synths.choose;
				paramValue = paramCalculator.value(synth, paramName, waitDur);
				synth.set(paramName, paramValue);
				
				if (debug == true, { 
					("After" + waitDur + "seconds, set" + paramName + 
				 		"on syth" + synth.nodeID + "to" + paramValue).postln; 
				});
			});
		}); 
		setter.play(SystemClock);
		setter;
	};
	
	offEvent = {
		arg states, synth, durationCalculator;
		var state = 0.0;
		
		states.put(synth, state);
		synth.set("volTrigger", 0.0);
		("Triggered " + synth.nodeID + "off.").postln;
		
		durationCalculator.value;
	};
	
	onEvent = {
		arg states, synth, durationCalculator;
		var state = 1.0,
		    vol = 1.0.rand() * 1.5,
		    volAttack = 1.gaussian(0.75),
		    volRelease = 1.gaussian(0.5),
		    speed = [0.25, 0.50, 0.50, 0.75, 0.75, 1.0, 1.0].choose;
		
		states.put(synth, state);
		synth.set("volLevel", vol);
		synth.set("speed", speed);
		synth.set("volTrigger", 1.0);
		("Triggered " + synth.nodeID + "on with volume of" + vol + ", attack of" + volAttack + "release of" + volRelease + "and speed of" + speed).postln;
		
		durationCalculator.value;
	};
	
		
	makeEventFirer = {
		arg river, states, silentDuration, soundDuration;
		var eventRoutine = Routine.new({
			inf.do({
				var state, dur, vol, speed;
				
				// Check its state
				state = states.at(river);
				if (state == 1.0, {
					dur = offEvent.value(states, river, silentDuration);
				}, {
					dur = onEvent.value(states, river, soundDuration);
				});
				
				("Waiting" + dur + "seconds.").postln;
				dur.wait;
	
			});
		});
		eventRoutine.play(SystemClock);
		
		eventRoutine;
	};

	
	// Live state.
	riversBus = Bus.audio(s, 2);
	rivers = makeGroupedSynths.value("River", [~left, ~right],  riversBus.index);
	loopersBus = Bus.audio(s, 2);
	loopers = makeGroupedSynths.value("Looper", [~left, ~right], loopersBus.index);
	leftOutput = makeOutputController.value(riversBus.index, loopersBus.index, 0);
	rightOutput = makeOutputController.value(riversBus.index, loopersBus.index, 1);
	
	leftSynths = Dictionary.new;
	leftSynths.put("river", rivers[0]);
	leftSynths.put("looper", loopers[0]);
	leftSynths.put("output", leftOutput);
	
	rightSynths = Dictionary.new;
	rightSynths.put("river", rivers[1]);
	rightSynths.put("looper", loopers[1]);
	rightSynths.put("output", rightOutput);
	
	volTriggerStates = trackSynthState.value(rivers);
	
	shortSilentDuration = makeGaussianRandomizer.value(5, 4);
	longSilentDuration = makeGaussianRandomizer.value(60, 15);
	shortSoundDuration = makeGaussianRandomizer.value(0.8, 0.5);
	longSoundDuration = makeGaussianRandomizer.value(30, 20);
	
	leftEventFirer = makeEventFirer.value(rivers[0], volTriggerStates, longSilentDuration, longSoundDuration);
	rightEventFirer = makeEventFirer.value(rivers[1], volTriggerStates, longSilentDuration, longSoundDuration);
	
	// Reports volume increases to the output controller.
	dramaResponder = OSCresponderNode(s.addr, "/tr", {
		arg time, responder, msg;
		
		var nodeId = msg[1],
		       state = msg[2],
		       frameIdx = msg[3],
		       channelSynths,
		       looper,
		       output;
		       
		 ("Recieved message from" + nodeId + ":" + "drama is" + state + ", frameIdx is" + frameIdx).postln;
		 
		 if (nodeId == leftSynths.at("river").nodeID, {
			 channelSynths = leftSynths;
		 }, {
			 channelSynths = rightSynths;
		 });
		 
		 looper = channelSynths.at("looper");
		 output = channelSynths.at("output");
		 looper.set("start", frameIdx);
		 looper.set("end", frameIdx + [64, 128, 256, 512, 1024, 2048].choose); // TODO: Dynamically set the loop length.
		 looper.set("speed", [0.25, 0.25, 0.5, 0.5, 0.5, 1.0].choose);
		 looper.set("trig", 1.0);

		 if (state === 1, {
			 output.set("riverTrig", 0.0);
			 output.set("looperTrig", 1.0);
		 }, {
			 output.set("riverTrig", 1.0);
			 output.set("looperTrig", 0.0);
		 });
	});
	dramaResponder.add;
	
	loopVolumeRoutine = makePeriodicSetter.value(
		loopers, 
		"volLevel", 
		makeGaussianRandomizer.value(0.5, 0.3), 
		makeGaussianRandomizer.value(0.05, 0.05),
		false
	);
	
	loopPitchRoutine = makePeriodicSetter.value(
		loopers, 
		"speed", 
		makeGaussianRandomizer.value(2, 1), 
		makeGaussianRandomizer.value(0.5, 0.3),
		false
	);
)
