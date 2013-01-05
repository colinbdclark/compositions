(
	~barn = Buffer.read(s, "/Users/colin/code/compositions/barn/Utah Barn Sound Only.wav");
)


(
	SynthDef("Barny", {
		arg bufnum, ampScale;
		var player, listener, amp;

		player = PlayBuf.ar(
			numChannels: 2,
			bufnum: bufnum,
			rate: BufRateScale.kr(bufnum)
		);

		listener = SoundIn.ar(0);

		amp = Amplitude.kr(listener);

		Out.ar(0, player * amp * ampScale);

	}).send(s);
)

(
	Synth.new(
		defName: "Barny",
		args: [
		    "bufnum", ~barn,
		    "ampScale", 10.0
	    ]
	);
)