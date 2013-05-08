var colin = colin || {};

(function () {

    colin.shellSeaweed = function () {
        var that = {};
        
        that.synth = flock.synth([
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
                    selector: ".fileSelector .fileBrowser"
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
            {
                ugen: "flock.ugen.filter.biquad.bp",
                freq: {
                    ugen: "flock.ugen.amplitude",
                    source: {
                        ugen: "flock.ugen.playBuffer",
                        buffer: {
                            id: "grainBuffer",
                            selector: ".fileSelector .fileBrowser"
                        },
                        speed: 1.0,
                        loop: 1.0
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
                    buffer: {
                        id: "grainBuffer",
                        selector: ".fileSelector .fileBrowser"
                    },
                    speed: 1.0,
                    loop: 1.0
                }
            }
        ]);
        
        that.fileSelector = demo.fileSelectorView(that.synth, {
            playerId: "granulator",
            selectors: {
                input: ".fileSelector .fileBrowser",
                button: ".fileSelector .browse",
                fileName: ".fileSelector .filePath"
            }
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
