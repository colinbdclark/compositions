(
	var makeOutputController,
	    makeBufferSynth,
	    trackSynthState,
	    makeSynthsForChannel,
	    makeGaussianRandomizer,
	    makePeriodicSetter,
	    offEvent, onEvent,
	    makeEventFirer,
	    dramaResponder,
	    shortSilentDuration, longSilentDuration, shortSoundDuration, longSoundDuration,
	    synthGroup, leftSynths, rightSynths, loopers,
	    leftEventFirer, leftShardFirer, rightEventFirer, rightShardFirer,
	    loopVolumeRoutine, loopPitchRoutine,
	    scoreTimer;


	makeOutputController = {
		arg riverBusNum, looperBusNum, channelOffset;

		Synth.new(
			defName: "OutputController",
			args: [
				"riverBusNum", riverBusNum,
				"looperBusNum", looperBusNum,
				"outputBusNum", channelOffset
			],
			addAction: \addToTail
		);
	};

	makeBufferSynth = {
		arg defName, buffer, outputBusNum, group = Group.new;

		Synth.new(
			defName: defName,
			args: ["bufnum", buffer.bufnum, "outputBusNum", outputBusNum],
			target: group,
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

	makeSynthsForChannel = {
		arg channelIdx, group, buffer;
		var riverBus, river,
		    looperBus, looper,
		    output,
		    shardBus, shard, shardOutput,
		    synthBundle;

		riverBus = Bus.audio(s, 1);
		river = makeBufferSynth.value("River", buffer, riverBus.index, group);
		looperBus = Bus.audio(s, 1);
		looper = makeBufferSynth.value("Looper", buffer, looperBus.index, group);
		output = makeOutputController.value(riverBus.index, looperBus.index, channelIdx);

		shardBus = Bus.audio(s, 1);
		shard = makeBufferSynth.value("River", buffer, shardBus.index, group);
		shardOutput = makeOutputController.value(shardBus.index, looperBus.index, channelIdx);

		synthBundle = Dictionary.new;
		synthBundle.put("river", river);
		synthBundle.put("looper", looper);
		synthBundle.put("output", output);
		synthBundle.put("shard", shard);
		synthBundle.put("state", trackSynthState.value([river], "volTrigger"));

		synthBundle;
	};

	makeGaussianRandomizer = {
		arg centre, deviation;

		{
			centre.gauss(deviation);
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
		arg states, synth;
		var state = 0.0;

		states.put(synth, state);
		synth.set("volTrigger", 0.0);
		("Triggered " + synth.nodeID + "off.").postln;
	};

	onEvent = {
		arg states, synth;
		var state = 1.0,
		    vol = 1.0.rand() * 1.5,
		    volAttack = 0.3.gauss(0.2),
		    volRelease = 0.3.gauss(0.2),
		    speed = [0.25, 0.50, 0.75, 1.0].choose;

		states.put(synth, state);
		synth.set("volLevel", vol);
		synth.set("speed", speed);
		synth.set("volTrigger", 1.0);
		("Triggered " + synth.nodeID + "on." +
		 "Volume:" + vol + ", attack:" + volAttack + "release:" + volRelease + "speed:" + speed).postln;
	};

	makeEventFirer = {
		arg synthBundle, synthName, silentDuration, soundDuration;
		var synth, states, eventRoutine;

		synth = synthBundle.at(synthName);
		states = synthBundle.at("state");

		eventRoutine = Routine.new({
			inf.do({
				var state, dur, event;

				// Check its state
				state = states.at(synth);
				if (state == 1.0, {
					dur = soundDuration.value;
					event = offEvent;
				}, {
					dur = silentDuration.value;
					event = onEvent;
				});

				("Waiting" + dur + "seconds.").postln;
				dur.wait;
				event.value(states, synth);
			});
		});
		eventRoutine.play(SystemClock);

		eventRoutine;
	};

	// Duration calculators.
	shortSilentDuration = makeGaussianRandomizer.value(12, 3);
	shortSoundDuration = {
		0.01.betarand(0.1);
	};//makeGaussianRandomizer.value(0.01, 2);
	longSilentDuration = makeGaussianRandomizer.value(120, 20);
	longSoundDuration = makeGaussianRandomizer.value(30, 9);

	// Live state.
	synthGroup = Group.new;
	leftSynths = makeSynthsForChannel.value(0, synthGroup, ~left);
	rightSynths = makeSynthsForChannel.value(1, synthGroup, ~right);
	loopers = [leftSynths.at("looper"), rightSynths.at("looper")];
	leftEventFirer = makeEventFirer.value(leftSynths, "river", longSilentDuration, longSoundDuration);
	leftShardFirer = makeEventFirer.value(leftSynths, "shard", shortSilentDuration, shortSoundDuration);
	rightEventFirer = makeEventFirer.value(rightSynths, "river", longSilentDuration, longSoundDuration);
	rightShardFirer = makeEventFirer.value(rightSynths, "shard", shortSilentDuration, shortSoundDuration);


	// Periodic routines to change the volume and speed of the loopers,
	// which  run all the time but are not necessarily  audible.
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

	scoreTimer = Routine.new({
		((13 * 60) + 20).wait;

		// Stop all the routines.
		leftEventFirer.stop;
		leftShardFirer.stop;
		rightEventFirer.stop;
		rightShardFirer.stop;
		loopVolumeRoutine.stop;
		loopPitchRoutine.stop;
		dramaResponder.remove;

		// Untrigger all the synths so they release to silence, waiting a brief period to make sure they do.
		leftSynths.at("river").set("volTrigger", 0.0);
		leftSynths.at("shard").set("volTrigger", 0.0);
		rightSynths.at("river").set("volTrigger", 0.0);
		rightSynths.at("shard").set("volTrigger", 0.0);
		2.wait;

		// Clean up memory.
		synthGroup.freeAll;
		synthGroup.free;
		("Done!").postln;
	});
	scoreTimer.play(SystemClock);
)
