(function () {
    fluid.registerNamespace("colin");
    
    fluid.defaults("colin.whiteout", {
        gradeNames: ["fluid.eventedComponent", "autoInit"],
        
        components: {
            stereo: {
                type: "colin.whiteout.stereo"
            },
            
            clock: {
                type: "colin.whiteout.conductor"
            },
            
            random: {
                type: "colin.whiteout.random"
            }
        }
    });
    
    fluid.defaults("colin.whiteout.conductor", {
        gradeNames: ["flock.scheduler.async.tempo", "autoInit"],
        
        bpm: 60,
        
        score: {
            interval: "repeat",
            time: 2,
            change: {
                synth: "stereo",
                values: {
                    "left.dur": {
                        synthDef: "{random}.options.synthDef"
                    },
                    "right.grainDur": {
                        synthDef: "{random}.options.synthDef"
                    }
                }
            }
        }// ,
//         
//         listeners: {
//             onCreate: {
//                 funcName: "colin.whiteout.conductor.schedule",
//                 args: ["{that}", "{that}.options.score"]
//             }
//         }
    });
    
    // TODO: Confirm that this exists only because the scheduler is an archaic styled component.
    colin.whiteout.conductor.schedule = function (clock, score) {
        clock.schedule(score);
    };
    
    fluid.defaults("colin.whiteout.random", {
        gradeNames: ["fluid.littleComponent", "autoInit"],
        
        synthDef: {
            ugen: "flock.ugen.whiteNoise"
        }
    });
    
    fluid.defaults("colin.whiteout.stereo", {
        gradeNames: ["flock.synth", "autoInit"],
        
        synthDef: [
            {
                id: "left",
                ugen: "flock.ugen.triggerGrains",
                dur: 0.0002,
                centerPos: {
                    ugen: "flock.ugen.lfNoise",
                    rate: "control",
                    options: {
                        interpolation: "linear"
                    }
                },
                trigger: {
                    ugen: "flock.ugen.impulse",
                    freq: {
                        ugen: "flock.ugen.lfNoise",
                        freq: 0.5,
                        mul: 100,
                        add: 105,
                        options: {
                            interpolation: "linear"
                        }
                    }
                 },
                buffer: {
                    id: "mandolin",
                    url: "audio/mandolin.wav"
                },
                mul: 0.5
            },
            {
                id: "right",
                ugen: "flock.ugen.granulator",
                grainDur: 0.001,
                numGrains: {
                    ugen: "flock.ugen.lfNoise",
                    freq: 20,
                    mul: 250,
                    add: 255,
                    options: {
                        interpolation: "linear"
                    }
                },
                source: {
                    ugen: "flock.ugen.impulse",
                    freq: 123
                },
                mul: 0.9
            }
        ]
    });
        
}());
