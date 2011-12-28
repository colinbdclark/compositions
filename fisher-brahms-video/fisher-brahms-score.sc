// TODO: Smooth mix between loop and playback
// Relatioship between playback speed and overall volume
// Unweight the slowest speed slightly
// Ramp speed up and down more smoothly
// Increase the length of events
// Separate the volume sensitivity for the left and right loopers?

(
	var makeGroupedSynths, makeOutputController,
	    trackSynthState, flipState,
	    makePeriodicSetter, makeGaussianRandomizer,
	    riversBus, rivers, loopersBus, loopers, leftOutput, rightOutput,
	    leftSynths, rightSynths,
	    volTriggerStates,
	    volumeRoutine, speedRoutine, sustainLevelRoutine, 
	    dramaResponder,
	    loopVolumeRoutine,
	    loopPitchRoutine;

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
	
	flipState = {
		arg states, synth;
		var state = states.at(synth);
		
		if (state == 1.0, {
			state = 0.0;
		}, {
			state =1.0;
		});
		states.put(synth, state);
		
		state;
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
	
	makeGaussianRandomizer = {
		arg centre, deviation;
		
		{
			centre.gaussian(deviation);
		}
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
	
	// Periodically trigger both synths' volume envelopes randomly.
	volTriggerStates = trackSynthState.value(rivers);
	volumeRoutine = makePeriodicSetter.value(rivers, "volTrigger", makeGaussianRandomizer.value(6.0, 3.0), {
		arg synth;
			
		flipState.value(volTriggerStates, synth);
	});
	
	// And the sustain level.
	sustainLevelRoutine = makePeriodicSetter.value(rivers, "volLevel", makeGaussianRandomizer.value(4.0, 3.0), {
		// Put this on a line so transitions are smooth
		1.0.rand();
	});
	
	// Periodically change the playback speed.
	speedRoutine = makePeriodicSetter.value(rivers, "speed", makeGaussianRandomizer.value(10.0, 3.0), {
		// Put this on a line so transitions are smooth; maybe only on speed up?
		[0.25, 0.50, 0.50, 0.75, 0.75, 1.0, 1.0, 1.0, 1.0].choose;
	});
	
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
