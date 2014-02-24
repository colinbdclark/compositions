(function () {
    fluid.registerNamespace("colin");
    
    // TODO: This is nonesense that should be removed when flock.synth.group works properly.
    fluid.defaults("flock.band", {
        gradeNames: ["fluid.eventedComponent", "autoInit"],
        
        invokers: {
            play: {
                funcName: "flock.band.play",
                args: ["{that}"]
            },
            
            pause: {
                funcName: "flock.band.pause",
                args: ["{that}"]
            }
        }
    });
    
    flock.band.collectComponents = function (that, componentsOption) {
        var componentNames = Object.keys(componentsOption),
            components = fluid.transform(componentNames, function (componentName) {
            return that[componentName];
        });
        
        return components;
    };
    
    flock.band.invokeOnEach = function (fnName, collection) {
        fluid.each(collection, function (item) {
            var fn = item[fnName];
            if (fn && typeof fn === "function") {
                item[fnName].apply(item);
            }
        });
    };
    
    flock.band.play = function (that) {
        var components = flock.band.collectComponents(that, that.options.components);
        flock.band.invokeOnEach("play", components);
    };
    
    flock.band.pause = function (that) {
        var components = flock.band.collectComponents(that, that.options.components);
        flock.band.invokeOnEach("pause", components);
    };
    
    
    fluid.defaults("colin.whiteout", {
        gradeNames: ["fluid.eventedComponent", "autoInit"],
        
        components: {
            band: {
                type: "colin.whiteout.band"
            },
            
            // clock: {
            //     type: "colin.whiteout.conductor"
            // },
            
            random: {
                type: "colin.whiteout.random"
            }
        }
    });
    
    fluid.defaults("colin.whiteout.band", {
        gradeNames: ["flock.band", "autoInit"],
        
        components: {
            mandolin: {
                type: "colin.whiteout.mandolin",
                options: {
                    gradeNames: ["colin.whiteout.stereo"]
                }
            },
            
            highGuitar: {
                type: "colin.whiteout.guitarGranulator",
                options: {
                    gradeNames: ["colin.whiteout.left"]
                }
            },
            
            lowGuitar: {
                type: "colin.whiteout.lowGuitarGranulator",
                options: {
                    gradeNames: ["colin.whiteout.right"]
                }
            },
            
            highImpulse: {
                type: "colin.whiteout.impulseGranulator",
                options: {
                    gradeNames: ["colin.whiteout.right"]
                }
            },
            
            lowImpulse: {
                type: "colin.whiteout.lowImpulseGranulator",
                options: {
                    gradeNames: ["colin.whiteout.left"]
                }
            }
        }
    });
    
    fluid.defaults("colin.whiteout.conductor", {
        gradeNames: ["flock.scheduler.async.tempo", "autoInit"],
        
        bpm: 60,
        
        score: [
            {
                interval: "repeat",
                time: 3,
                change: {
                    synth: "impulseGranulator",
                    values: {
                        "granulator.grainDur": {
                            synthDef: "{random}.options.synthDef"
                        }
                    }
                }
            },
            {
                interval: "repeat",
                time: 4,
                change: {
                    synth: "lowImpulseGranulator",
                    values: {
                        "granulator.grainDur": {
                            synthDef: "{random}.options.synthDef"
                        }
                    }
                }
            }
        ]
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
    
    fluid.defaults("colin.whiteout.output", {
        gradeNames: ["flock.synth", "autoInit"],
        
        synthDef: {
            ugen: "flock.ugen.out"
        }
    });
    
    fluid.defaults("colin.whiteout.left", {
        gradeNames: ["colin.whiteout.output", "autoInit"],
        
        synthDef: {
            bus: 0,
            expand: 1
        }
    });
    
    fluid.defaults("colin.whiteout.right", {
        gradeNames: ["colin.whiteout.output", "autoInit"],
        
        synthDef: {
            bus: 1,
            expand: 1
        }
    });
    
    fluid.defaults("colin.whiteout.stereo", {
        gradeNames: ["colin.whiteout.output", "autoInit"],
        
        synthDef: {
            bus: {
                ugen: "flock.ugen.sequence",
                rate: "audio",
                list: [0, 1],
                loop: 1,
                freq: {
                    ugen: "flock.ugen.lfNoise",
                    freq: 1/3,
                    mul: 1,
                    add: 1,
                    options: {
                        interpolate: "linear"
                    }
                }
            },
            expand: 1
        }
    });
    
    fluid.defaults("colin.whiteout.guitarGranulator", {
        gradeNames: ["colin.whiteout.output", "autoInit"],
        
        synthDef: {
            sources: {
                id: "granulator",
                ugen: "flock.ugen.triggerGrains",
                dur: 1,
                centerPos: {
                    ugen: "flock.ugen.lfNoise",
                    rate: "control",
                    freq: 1/2,
                    options: {
                        interpolation: "linear"
                    }
                },
                trigger: {
                    ugen: "flock.ugen.impulse",
                    freq: 10
                },
                buffer: {
                    id: "high-guitar",
                    url: "audio/high-bowed-guitar.wav"
                },
                mul: {
                    ugen: "flock.ugen.sinOsc",
                    freq: 1/30,
                    mul: 0.5,
                    add: 0.5,
                    options: {
                        interpolation: "linear"
                    }
                }
            }
        }
    });
    
    fluid.defaults("colin.whiteout.lowGuitarGranulator", {
        gradeNames: ["colin.whiteout.guitarGranulator", "autoInit"],
        
        synthDef: {
            sources: {
                buffer: {
                    id: "low-guitar",
                    url: "audio/low-bowed-guitar.wav"
                },
                mul: {
                    end: 1
                }
            }
        }
    });
    
    fluid.defaults("colin.whiteout.impulseGranulator", {
        gradeNames: ["colin.whiteout.output", "autoInit"],
        
        synthDef: {
            sources: {
                id: "granulator",
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
                mul: {
                    ugen: "flock.ugen.lfPulse",
                    freq: {
                        ugen: "flock.ugen.lfNoise",
                        rate: "control",
                        freq: 1/10,
                        mul: 0.25,
                        add: 0.25
                    },
                    mul: 0.5,
                    add: 0.5,
                    options: {
                        interpolation: "linear"
                    }
                }
            }
        }
    });
    
    fluid.defaults("colin.whiteout.lowImpulseGranulator", {
        gradeNames: ["colin.whiteout.impulseGranulator", "autoInit"],
        
        synthDef: {
            sources: {
                grainDur: 0.002,
                numGrains: {
                    freq: 5,
                    mul: 100,
                    add: 105
                },
                source: {
                    freq: 60
                }
            }
        }
    });

    fluid.defaults("colin.whiteout.mandolin", {
        gradeNames: ["colin.whiteout.output", "autoInit"],

        synthDef: {
            sources: {
                ugen: "flock.ugen.triggerGrains",
                buffer: {
                    id: "mandolin",
                    url: "audio/mandolin.wav"
                },
                dur: {
                    ugen: "flock.ugen.lfNoise",
                    freq: 1/10,
                    mul: 1,
                    add: 1.075
                },
                centerPos: {
                    ugen: "flock.ugen.lfNoise",
                    rate: "control",
                    freq: 1/2,
                    mul: {
                        ugen: "flock.ugen.math",
                        source: {
                            ugen: "flock.ugen.bufferLength",
                            buffer: "mandolin",
                        },
                        div: 2
                    },
                    add: {
                        ugen: "flock.ugen.math",
                        source: {
                            ugen: "flock.ugen.bufferLength",
                            buffer: "mandolin"
                        },
                        div: 2
                    },
                    options: {
                        interpolation: "linear"
                    }
                },
                trigger: {
                    ugen: "flock.ugen.dust",
                    rate: "control",
                    density: {
                        ugen: "flock.ugen.sinOsc",
                        rate: "control",
                        freq: {
                            ugen: "flock.ugen.lfNoise",
                            rate: "control",
                            mul: 1/45,
                            add: 1/45
                        },
                        mul: 2,
                        add: 2,
                        options: {
                            interpolation: "linear"
                        }
                    }
                },
                mul: 0.1
            }
        }
    });

}());
