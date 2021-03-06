var colin = colin || {};

(function () {

    colin.shellSeaweed = function () {
        var that = {
            enviro: flock.init({
                bufferSize: 8192
            })
        };

        that.synth = flock.synth({
            synthDef: [
                {
                    id: "granulator",
                    ugen: "flock.ugen.triggerGrains",
                    trigger: {
                        ugen: "flock.ugen.impulse",
                        rate: "control",
                        freq: {
                            id: "trate",
                            ugen: "flock.ugen.lfNoise",
                            rate: "control",
                            options: {
                                interpolation: "linear"
                            },
                            freq: 0.2,
                            mul: 10,
                            add: 40
                        }
                    },
                    buffer: {
                        id: "grainBuffer",
                        url: "shell-seaweed-soundtrack-raw.wav"
                    },
                    centerPos: {
                        ugen: "flock.ugen.phasor",
                        rate: "control",
                        step: {
                            ugen: "flock.ugen.math",
                            source: 0.5,
                            div: 44100 // TODO: Why does this not work with the sampleRate ugen?
                        },
                        start: 0.04,
                        end: 0.69,
                        reset: 0.01,
                        mul: {
                            ugen: "flock.ugen.bufferDuration",
                            rate: "constant",
                            buffer: "grainBuffer"
                        }
                    },
                    dur: 0.25,
                    amp: 0.1,
                    mul: 3.0
                },
                // TODO: This instrument has regressed.
                // Looks like it might have something to do with the bandpass filter.
                {
                    ugen: "flock.ugen.math",
                    mul: 3.0,
                    source: {
                        ugen: "flock.ugen.filter.biquad.bp",
                        freq: {
                            ugen: "flock.ugen.amplitude",
                            source: {
                                ugen: "flock.ugen.playBuffer",
                                buffer: "grainBuffer",
                                speed: 1.0,
                                loop: 1.0,
                                start: 0.04
                            },
                            add: 120,
                            mul: {
                                ugen: "flock.ugen.lfNoise",
                                rate: "control",
                                freq: 1/5,
                                mul: 1000
                            }
                        },
                        q: 20,
                        source:  {
                            ugen: "flock.ugen.playBuffer",
                            buffer: "grainBuffer",
                            speed: 1.0,
                            loop: 1.0,
                            start: 0.04
                        }
                    }
                }
            ]
        });

        that.play = function () {
            that.synth.play();
        };

        that.pause = function () {
            that.clock.clearAll();
            that.synth.pause();
        };

        that.clock = flock.scheduler.async();
        return that;
    };

}());
