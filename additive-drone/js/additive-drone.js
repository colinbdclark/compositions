var colin = colin || {};

(function () {
    
    // A bank of oscillators added together.
    var harmonics = [1, 2, 3, 5, 6, 7, 9, 11, 13, 14, 15, 17, 19, 21, 24, 29, 44],
        ugenTypes = ["flock.ugen.sin", "flock.ugen.lfSaw", "flock.ugen.lfPulse", "flock.ugen.lfNoise"],
        fundamentalMultiplier = 60,
        maxFreq = flock.enviro.shared.audioSettings.rates.audio / 3,
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
            freq = fundamental * freqScale;
            
        return {
            ugen: ugen,
            rate: "audio",
            freq: {
                ugen: "flock.ugen.xLine",
                start: freq * (Math.random() * 2.5),
                end: freq,
                duration: (Math.random() * 10) + 0.1
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
                var ugenDef = makeHarmonic(ugenTypes, fundamental, harmonic, octave, 0.5);
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

    colin.additiveDrone = function () {
        var that = {};
        
        that.synth = flock.synth({
            id: "adder",
            ugen: "flock.ugen.sum",
            sources: makeHarmonics(fundamentalMultiplier)
        });
        
        that.periodicHarmonicShift = function () {
            var harm = flock.choose(that.synth.input("adder.sources")),
                freqUGen = harm.input("freq"),
                currentFreq = freqUGen.model.level,
                end = freqUGen.input("end") * flock.choose(intervals),
                dur = (Math.random() * 60) + 0.1,
                amp = harm.input("mul");

            freqUGen.input("start", currentFreq);
            freqUGen.input("end", end);
            freqUGen.input("duration", dur);

            var idx = $.inArray(that.synth.input("adder.sources"), harm);
            harm.input("mul", amp * flock.choose(intervals));
        };

        that.play = function () {
            flock.enviro.shared.conductor.schedulePeriodic(100, that.periodicHarmonicShift);
            that.synth.play();
        };
        
        that.pause = function () {
            flock.enviro.shared.conductor.clearPeriodic(100);
            that.synth.pause();
        };
        
        return that;
    };
    
}());