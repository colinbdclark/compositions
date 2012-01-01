(
	~left = Buffer.read(s, "/Users/colin/code/compositions/fisher-brahms-video/Violin Solo.L.wav");
	~right =  Buffer.read(s,  "/Users/colin/code/compositions/fisher-brahms-video/Violin Solo.R.wav");
)


(
	SynthDef("River", {
		arg bufnum, outputBusNum, 
		       volTrigger = 0.0, 
		       volAttack = 1,  volRelease = 2, volLevel = 1.0,
		       speed = 1.0,
		       dramaticVolumeThreshold = 0.5;
		       
		var fadeEnv, speedEnv, rate, driver, player, envelopedPlayer, dramaListener, dramaOnSender, dramaOffSender;
	
		// An envelope to shape the attack and decay of the buffer when playback is triggered.
		fadeEnv = Env.asr(
			attackTime: volAttack, 
			sustainLevel: volLevel, 
			releaseTime: volRelease
		);
		
		// Control the playback of the buffer.
		driver = Phasor.ar(
			trig: 0,
			rate: BufRateScale.kr(bufnum) * speed,
			start: 0,
			end: BufFrames.kr(bufnum)
		);
		
		player = BufRd.ar(
			numChannels: 1,
			bufnum: bufnum,
			phase: driver
		);

		envelopedPlayer = player * EnvGen.ar(fadeEnv, gate: volTrigger);
		
		// Listen for swells in ampltude and send a trigger to the language if it crosses the threshold.

		dramaListener = Latch.ar(
			in: Amplitude.ar(
				in: player,
				attackTime: 0.01,
				releaseTime: 0.01
			),
			trig: Dust.kr(0.2)
		);
		
		dramaOnSender = SendTrig.ar(dramaListener > dramaticVolumeThreshold, 1, driver);	
		dramaOffSender = SendTrig.ar(dramaListener < dramaticVolumeThreshold, 0, driver);
		
		Out.ar(outputBusNum, envelopedPlayer);
		
	}).send(s);
	
	SynthDef("Looper", {
		arg bufnum, 
		       outputBusNum, 
		       speed = 0.5,
		       trig = 0,
		       start = 0,
		       end = BufFrames.kr(bufnum),
		       volLevel = 0.2;
		
		var looper, player;
		
		looper = Phasor.ar(
			trig: trig,
			rate: BufRateScale.kr(bufnum) * speed,
			start: start,
			end: end
		);
		
		player = BufRd.ar(
			numChannels: 1,
			bufnum: bufnum,
			phase: looper,
			loop: 1
		) * volLevel; /** EnvGen.ar(fadeEnv, gate: volTrigger)*/ // TODO: Envelope the looper
		
		Out.ar(outputBusNum, player);
	}).send(s);


	SynthDef("OutputController", {
		arg riverBusNum, looperBusNum, 
		    outputBusNum, 
		    riverTrig = 1.0, looperTrig = 0.0;
		
		var river, looper, fadeEnv;
		
		fadeEnv = Env.asr(
			attackTime: 2, 
			sustainLevel: 0.5, 
			releaseTime: 2
		);
		
		
		river = In.ar(riverBusNum, 1) *  EnvGen.ar(fadeEnv, gate: riverTrig);
		looper = In.ar(looperBusNum, 1) * EnvGen.ar(fadeEnv, gate: looperTrig);
		
		Out.ar(
			bus: outputBusNum,
			channelsArray: Mix.new([
				river, looper
			])
		);
	}).send(s);
)
