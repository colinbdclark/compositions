(function () {
    "use strict";

    fluid.registerNamespace("colin");

    flock.init({
        numBuses: 16
    });

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
            band: {
                createOnEvent: "onBuffersReady",
                type: "colin.greenwichPark.firstBand",
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
                    },
                    listeners: {
                        afterBuffersLoaded: {
                            "this": "console",
                            method: "log",
                            args: ["Ukes loaded."]
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
                    },
                    listeners: {
                        afterBuffersLoaded: {
                            "this": "console",
                            method: "log",
                            args: ["Drums loaded."]
                        }
                    }
                }
            },

            cameraLoader: {
                type: "flock.bufferLoader",
                options: {
                    bufferDefs: [
                        {
                            id: "camera-audio",
                            url: "audio/camera/in-camera-audio.wav"
                        }
                    ],
                    listeners: {
                        afterBuffersLoaded: {
                            "this": "console",
                            method: "log",
                            args: ["Camera audio loaded."]
                        }
                    }
                }
            }
        },

        events: {
            onBuffersReady: {
                events: {
                    afterUkesLoaded: "{ukeLoader}.events.afterBuffersLoaded",
                    afterDrumsLoaded: "{drumLoader}.events.afterBuffersLoaded",
                    afterCameraLoaded: "{cameraLoader}.events.afterBuffersLoaded"
                }
            }
        }
    });

    fluid.defaults("colin.greenwichPark.drumClock", {
        gradeNames: ["flock.synth", "autoInit"],

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
                    bus: 15,
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
            },
            options: {
                bufferIDs: {
                    expander: {
                        funcName: "flock.bufferLoader.idsFromURLs",
                        args: "{greenwichPark}.bufferUrls.drums"
                    }
                }
            }
        },

        addToEnvironment: "tail"
    });

    fluid.defaults("colin.greenwichPark.ukuleleAeolianHarp", {
        gradeNames: ["flock.synth", "autoInit"],

        synthDef: {
            ugen: "flock.ugen.triggerBuffers",
            trigger: {
                ugen: "flock.ugen.dust",
                density: {
                    ugen: "flock.ugen.amplitude",
                    attack: 0.0001,
                    release: 0.0001,
                    mul: 10,
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
        },

        addToEnvironment: "tail"
    });

    fluid.defaults("colin.greenwichPark.inCameraAudio", {
        gradeNames: ["flock.synth", "autoInit"],

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
        },

        addToEnvironment: "head"
    });

    fluid.defaults("colin.greenwichPark.firstBand", {
        gradeNames: ["flock.band", "autoInit"],

        components: {
            inCameraAudioPlayer: {
                type: "flock.synth",
                options: {
                    synthDef: {
                        ugen: "flock.ugen.out",
                        bus: 0,
                        expand: 2,
                        sources: {
                            ugen: "flock.ugen.in",
                            bus: 15
                        }
                    },
                    addToEnvironment: "tail"
                }
            },

            ukuleleAeolianHarp: {
                type: "colin.greenwichPark.ukuleleAeolianHarp",
                options: {
                    addToEnvironment: "tail"
                }
            },

            drumClock: {
                type: "colin.greenwichPark.drumClock",
                options: {
                    addToEnvironment: "tail"
                }
            },

            inCameraAudioWriter: {
                type: "colin.greenwichPark.inCameraAudio",
                options: {
                    addToEnvironment: "head"
                }
            }
        }
    });
}());
