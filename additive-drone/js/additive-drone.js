var colin = colin || {};

(function () {

    // TODO: Provide an easier means for components
    // to configure their own environment/audioSystem instances via IoC.
    flock.init({
        chans: 2,
        numBuses: 2,
        numInputBuses: 0,
        bufferSize: 8192 * 2
    });

    // A bank of oscillators added together.
    // TODO: Remove all these globals.
    var harmonics = [1, 2, 3, 5, 6, 7, 9, 11, 13, 14, 15, 17, 19, 21, 24, 29, 44],
        ugenTypes = ["flock.ugen.sin", "flock.ugen.lfSaw", "flock.ugen.lfPulse", "flock.ugen.lfNoise"],
        fundamentalMultiplier = 60,
        maxFreq = 11025 * 1.5,
        maxAmp = 0.3,
        intervals = [
            1.0192443785950769, // 33 cents
            0.9811189749983187, // -33 cents
            1.029302236643492, // 50 cents
            0.9715319411536059, // -50 cents
            1.0388591032976644, // 66 cents
            0.9625944431017514, // -66 cents
            8/7,
            7/8
        ];

    var makeHarmonic = function (ugenTypes, fundamental, harmonic, octave, maxAmp) {
        var freqScale = (harmonic * octave),
            ugen = flock.choose(ugenTypes),
            freq = fundamental * freqScale,
            startingFreq = freq * (Math.random() + 0.5), // Was (Math.random() * 2.5)
            rampDuration = (Math.random() * 20) + 0.1; // Was (Math.random() * 10) + 0.1

        return {
            ugen: ugen,
            rate: "audio",
            freq: {
                ugen: "flock.ugen.xLine",
                start: startingFreq,
                end: freq,
                duration: rampDuration
            },
            mul: maxAmp / freqScale
        };
    };

    var makeHarmonics = function (fundamental) {
        var sources = [],
            freqs = [];

        $.each(harmonics, function (i, harmonic) {
            var freq = fundamental,
                octave = 1;

            while (freq <= maxFreq) {
                var ugenDef = makeHarmonic(ugenTypes, fundamental, harmonic, octave, maxAmp);
                freq = ugenDef.freq.end;
                if (freq <= maxFreq && freqs.indexOf(freq) === -1) {
                    freqs.push(freq);
                    sources.push(ugenDef);
                }
                octave++;
            }
        });

        return sources;
    };

    fluid.defaults("colin.additiveDrone", {
        gradeNames: ["fluid.viewRelayComponent", "autoInit"],

        model: {
            intervalCap: 1
        },

        invokers: {
            periodicHarmonicShift: "colin.additiveDrone.periodicHarmonicShift({synth})",
            changeFundamental: "colin.additiveDrone.changeFundamental({synth}, {that}.model)",
            emphasizeHarmonics: "colin.additiveDrone.emphasizeHarmonics({that})"
        },

        components: {
            synth: {
                type: "colin.additiveDrone.synth"
            },

            clock: "{environment}.asyncScheduler",

            playButton: {
                type: "flock.ui.enviroPlayButton",
                container: "{that}.dom.playButton",
                options: {
                    fadeDuration: 2.0
                }
            }
        },

        events: {
            onPlay: "{playButton}.events.onPlay",
            onPause: "{playButton}.events.afterFadeOut"
        },

        listeners: {
            onPlay: [
                // Every 1/10 of a second, change the pitch of one harmonic.
                "{that}.clock.repeat(0.1, {that}.periodicHarmonicShift)",

                // Every half minute or so, change the fundamental pitch of the whole instrument.
                "{that}.clock.repeat(31, {that}.changeFundamental)",

                "colin.additiveDrone.scheduleEmphasis({that})",

                "{synth}.play()"
            ],

            onPause: [
                "{that}.clock.clearAll()",
                "{synth}.pause()"
            ]
        },

        selectors: {
            playButton: ".playButton"
        }
    });

    colin.additiveDrone.periodicHarmonicShift = function (synth) {
        var harm = flock.choose(synth.get("adder.sources")),
            freqUGen = harm.get("freq"),
            currentFreq = freqUGen.model.level,
            end = freqUGen.get("end") * flock.choose(intervals),
            dur = (Math.random() * 60) + 0.1,
            amp = harm.get("mul");

        harm.set({
            "freq.start": currentFreq,
            "freq.end": end,
            "freq.duration": dur,
            "mul": amp * flock.choose(intervals)
        });

        //var idx = $.inArray(that.synth.get("adder.sources"), harm);
    };

    colin.additiveDrone.changeFundamental = function (synth, model) {
        var interval = flock.choose(intervals.slice(0, model.intervalCap)),
            harmonics = synth.get("adder.sources"),
            fundamental = synth.get("adder.sources.0.freq.end"),
            fundAmp = synth.get("adder.sources.0.mul"),
            intervalScale = fundamental * interval;

        $.each(harmonics, function (idx, harmonic) {
            var freqUGen = harmonic.get("freq"),
                currentFreq = freqUGen.model.level,
                end = intervalScale * (idx + 1),
                dur = (Math.random() * 30) + 5;

            freqUGen.set({
                "start": currentFreq,
                "end": end,
                "duration": dur
            });
            //harmonic.set("mul", fundAmp / (idx + 1));
        });

        if (model.intervalCap <= intervals.length) {
            model.intervalCap++;
        }
    };

    colin.additiveDrone.emphasizeHarmonics = function (that) {
        // TODO:
        //  - Choose from a range of the lower harmonics, not just the tenth.
        //  - Use a weighted distribution to emphasize either lower harmonics
        //    or harmonics currently in motion.
        var harmonic = flock.choose(that.synth.get("adder.sources")),
            tenthAmp = that.synth.get("adder.sources.11.mul"),
            harmAmp = harmonic.get("mul"),
            prevHarmAmp;

        if (that.emphasized) {
            prevHarmAmp = that.emphasized.get("mul");
            that.synth.set("adder.sources.11.mul", prevHarmAmp);
            that.emphasized.set("mul", tenthAmp);
            tenthAmp = prevHarmAmp;
        }

        harmonic.set("mul", tenthAmp);
        that.synth.set("adder.sources.11.mul", harmAmp);
        that.emphasized = harmonic;
    };

    colin.additiveDrone.scheduleEmphasis = function (that) {
        // 45 seconds into the piece, start emphasizing individual harmonics.
        var emphasizeListener;
        that.clock.once(45, function () {
            emphasizeListener = that.clock.repeat(0.5, that.emphasizeHarmonics);
        });

        // After about two minutes, stop emphasizing the harmonics for a while.
        that.clock.once(120, function () {
            that.clock.clear(emphasizeListener);
        });

        // TODO: After about 3-4 minutes, start to "interleave" harmonics at wider spacing to bring out chords
        // At the same time, the interleaving should slowly involve changes to the fundamental
        // --presumably by dropping portions of the lower harmonics from one synth and introducing those from another
    };


    fluid.defaults("colin.additiveDrone.synth", {
        gradeNames: ["flock.synth", "autoInit"],

        synthDef: [{
            ugen: "flock.ugen.sum",
            sources: makeHarmonics(fundamentalMultiplier)
        },{
            id: "adder",
            ugen: "flock.ugen.sum",
            sources: makeHarmonics(fundamentalMultiplier)
        }]
    });

}());
