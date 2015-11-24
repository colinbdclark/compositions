(function () {
    "use strict";

    fluid.defaults("colin.greenwichPark.clock", {
        gradeNames: "flock.synth",

        synthDef: {
            ugen: "flock.ugen.triggerBuffers",
            trigger: {
                ugen: "flock.ugen.impulse",
                phase: 0,
                freq: 1
            },
            bufferIndex: {
                ugen: "flock.ugen.amplitude",
                source: {
                    ugen: "flock.ugen.in",
                    bus: 15
                },
                mul: { // 7.5
                    ugen: "flock.ugen.lfNoise",
                    freq: 1/10,
                    mul: 3.75,
                    add: 3.75,
                    options: {
                        interpolation: "linear"
                    }
                }
            }
        }
    });

    fluid.defaults("colin.greenwichPark.drumClock", {
        gradeNames: "colin.greenwichPark.clock",

        synthDef: {
            mul: {
                ugen: "flock.ugen.amplitude",
                source: {
                    ugen: "flock.ugen.in",
                    bus: 15,
                },
                mul: 2,
                add: 0.4
            },
            bufferIndex: {
                mul: {
                    freq: 1
                }
            },
            options: {
                bufferIDs: {
                    expander: {
                        funcName: "flock.bufferLoader.idsFromURLs",
                        args: "{greenwichPark}.bufferUrls.drums"
                    }
                }
            }
        }
    });

    fluid.defaults("colin.greenwichPark.ukeClock", {
        gradeNames: "colin.greenwichPark.clock",

        synthDef: {
            options: {
                bufferIDs: {
                    expander: {
                        funcName: "flock.bufferLoader.idsFromURLs",
                        args: "{greenwichPark}.bufferUrls.uke"
                    }
                }
            }
        }
    });

    fluid.defaults("colin.greenwichPark.aeolianHarp", {
        gradeNames: "flock.synth",

        synthDef: {
            ugen: "flock.ugen.triggerBuffers",
            trigger: {
                ugen: "flock.ugen.dust",
                density: {
                    ugen: "flock.ugen.amplitude",
                    attack: 0.0001,
                    release: 0.0001,
                    mul: 20,
                    add: 0.2,
                    source: {
                        ugen: "flock.ugen.in",
                        bus: 15,
                        mul: 1.3
                    }
                }
            },

            bufferIndex: {
                ugen: "flock.ugen.lfNoise",
                freq: 1/10,
                mul: {
                    ugen: "flock.ugen.math",
                    rate: "audio",
                    source: 1.0,
                    sub: {
                        ugen: "flock.ugen.in",
                        bus: 15,
                        mul: 0.5
                    }
                },
                add: {
                    ugen: "flock.ugen.whiteNoise",
                    mul: 0.05,
                    add: 0.05
                },
                options: {
                    interpolation: "linear"
                }
            }
        }
    });

    fluid.defaults("colin.greenwichPark.ukuleleAeolianHarp", {
        gradeNames: "colin.greenwichPark.aeolianHarp",

        synthDef: {
            trigger: {
                ugen: "flock.ugen.impulse",
                freq: {
                    ugen: "flock.ugen.amplitude",
                    attack: 0.0001,
                    release: 0.0001,
                    mul: 20,
                    add: {  // More sparse and wobbly, but hopefully only noticeable when the volume is low.
                        ugen: "flock.ugen.lfNoise",
                        freq: 1,
                        mul: 0.1,
                        add: 0.01,
                        options: {
                            interpolation: "linear"
                        }
                    },
                    source: {
                        ugen: "flock.ugen.in",
                        bus: 15,
                        mul: 1.3
                    }
                },
                density: null
            },

            bufferIndex: {
                mul: {
                    sub: {
                        mul: 0.3
                    }
                }
            },

            options: {
                // TODO: Factor URL/ID management more cleanly in the bufferLoaderComponent
                bufferIDs: {
                    expander: {
                        funcName: "flock.bufferLoader.idsFromURLs",
                        args: "{greenwichPark}.bufferUrls.uke"
                    }
                }
            }
        }
    });

    fluid.defaults("colin.greenwichPark.drumAeolianHarp", {
        gradeNames: "colin.greenwichPark.aeolianHarp",

        synthDef: {
            mul: 0.75,
            options: {
                // TODO: Factor URL/ID management more cleanly in the bufferLoaderComponent
                bufferIDs: {
                    expander: {
                        funcName: "flock.bufferLoader.idsFromURLs",
                        args: "{greenwichPark}.bufferUrls.drums"
                    }
                }
            }
        }
    });

    fluid.defaults("colin.greenwichPark.inCameraAudio", {
        gradeNames: "flock.synth",

        synthDef: {
            ugen: "flock.ugen.out",
            bus: 15,
            expand: 1,
            sources: {
                ugen: "flock.ugen.playBuffer",
                buffer: {
                    id: "camera-audio",
                    url: "audio/camera/in-camera-audio.wav"
                }
            }
        }
    });

    fluid.defaults("colin.greenwichPark.inCameraAudioOutput", {
        gradeNames: "flock.synth",

        synthDef: {
            ugen: "flock.ugen.out",
            bus: 0,
            expand: 2,
            sources: {
                ugen: "flock.ugen.in",
                bus: 15,
                mul: 0.25
            }
        }
    });

}());
