(function () {
    "use strict";

    fluid.registerNamespace("colin");

    flock.init();

    fluid.defaults("colin.greenwichPark", {
        gradeNames: ["fluid.eventedComponent", "autoInit"],

        members: {
            bufferUrls: {
                uke: {
                    expander: {
                        funcName: "flock.urlsForFileSequence",
                        args: ["audio/uke/ukulele-%n.wav", 1, 37]
                    }
                },

                drums: {
                    expander: {
                        funcName: "flock.mergeURLsForMultipleFileSequences",
                        args: [
                            ["audio/kick/kick-%n.wav", "audio/snare/snare-%n.wav"],
                            [1, 1],
                            [23, 34]
                        ]
                    }
                }
            }
        },

        components: {
            synth: {
                createOnEvent: "onBuffersReady",
                type: "colin.greenwichPark.synth",
                options: {
                    listeners: {
                        onCreate: {
                            funcName: "demo.toggleButtonView",
                            args: ["{that}", ".playButton"]
                        }
                    }
                }
            },

            ukeLoader: {
                type: "flock.bufferLoader",
                options: {
                    bufferDefs: {
                        expander: {
                            funcName: "flock.bufferLoader.expandFileSequence",
                            args: ["{greenwichPark}.bufferUrls.uke"]
                        }
                    }
                }
            },

            drumLoader: {
                type: "flock.bufferLoader",
                options: {
                    bufferDefs: {
                        expander: {
                            funcName: "flock.bufferLoader.expandFileSequence",
                            args: ["{greenwichPark}.bufferUrls.drums"]
                        }
                    }
                }
            }
        },

        events: {
            onBuffersReady: {
                events: {
                    afterUkesLoaded: "{ukeLoader}.events.afterBuffersLoaded",
                    afterDrumsLoaded: "{drumLoader}.events.afterBuffersLoaded"
                }
            }
        }
    });

    fluid.defaults("colin.greenwichPark.inCameraAudioPlayer", {
        gradeNames: ["fluid.littleComponent", "autoInit"],

        ugenDef: {
            ugen: "flock.ugen.playBuffer",
            buffer: {
                id: "camera-audio",
                url: "audio/camera/in-camera-audio.wav"
            }
        }
    });

    fluid.defaults("colin.greenwichPark.aeolianHarpTriggerPlayer", {
        gradeNames: ["colin.greenwichPark.inCameraAudioPlayer", "autoInit"],

        ugenDef: {
            mul: 1.3
        }
    });

    fluid.defaults("colin.greenwichPark.aeolianHarpBufferScannerPlayer", {
        gradeNames: ["colin.greenwichPark.inCameraAudioPlayer", "autoInit"],

        ugenDef: {
            mul: 0.5
        }
    });

    fluid.defaults("colin.greenwichPark.ukuleleAeolianHarp", {
        gradeNames: ["fluid.littleComponent", "autoInit"],

        components: {
            aeolianHarpTriggerPlayer: {
                type: "colin.greenwichPark.aeolianHarpTriggerPlayer"
            },

            aeolianHarpBufferScannerPlayer: {
                type: "colin.greenwichPark.aeolianHarpBufferScannerPlayer"
            }
        },

        ugenDef: {
            ugen: "flock.ugen.triggerBuffers",
            trigger: {
                ugen: "flock.ugen.dust",
                density: {
                    ugen: "flock.ugen.amplitude",
                    attack: 0.0001,
                    release: 0.0001,
                    mul: 10,
                    add: 0.2,
                    source: "{aeolianHarpTriggerPlayer}.options.ugenDef"
                }
            },

            bufferIndex: {
                ugen: "flock.ugen.lfNoise",
                freq: 1/10,
                mul: {
                    ugen: "flock.ugen.math",
                    rate: "audio",
                    source: 1.0,
                    sub: "{aeolianHarpBufferScannerPlayer}.options.ugenDef"
                },
                add: {
                    ugen: "flock.ugen.whiteNoise",
                    mul: 0.1
                },
                options: {
                    interpolation: "linear"
                }
            },

            options: {
                // TODO: Factor this more cleanly into the bufferLoaderComponent
                bufferIDs: {
                    expander: {
                        funcName: "flock.bufferLoader.idsFromURLs",
                        args: "{greenwichPark}.bufferUrls.uke"
                    }
                }
            }
        }
    });

    fluid.defaults("colin.greenwichPark.clockBufferScannerPlayer", {
        gradeNames: ["colin.greenwichPark.inCameraAudioPlayer", "autoInit"],

        ugenDef: {
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
    });

    fluid.defaults("colin.greenwichPark.drumClock", {
        gradeNames: ["fluid.littleComponent", "autoInit"],

        components: {
            clockBufferScannerPlayer: {
                type: "colin.greenwichPark.clockBufferScannerPlayer"
            }
        },

        ugenDef: {
            ugen: "flock.ugen.triggerBuffers",
            trigger: {
                ugen: "flock.ugen.impulse",
                phase: 0,
                freq: 1
            },
            bufferIndex: {
                ugen: "flock.ugen.amplitude",
                source: "{clockBufferScannerPlayer}.options.ugenDef"
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

    fluid.defaults("colin.greenwichPark.synth", {
        gradeNames: ["flock.synth", "autoInit"],

        components: {
            ukuleleAeolianHarp: {
                type: "colin.greenwichPark.ukuleleAeolianHarp"
            },

            inCameraAudioPlayer: {
                type: "colin.greenwichPark.inCameraAudioPlayer"
            },

            drumClock: {
                type: "colin.greenwichPark.drumClock"
            }
        },

        synthDef: {
            ugen: "flock.ugen.sum",
            sources: [
                "{ukuleleAeolianHarp}.options.ugenDef",
                "{inCameraAudioPlayer}.options.ugenDef",
                "{drumClock}.options.ugenDef"
            ]
        }
    });

}());
