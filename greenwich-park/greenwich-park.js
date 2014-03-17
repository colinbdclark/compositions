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
                    ukeBranch: {
                        options: {
                            bufferIDs: {
                                expander: {
                                    funcName: "flock.bufferLoader.idsFromURLs",
                                    args: "{greenwichPark}.bufferUrls.uke"
                                }
                            }
                        }
                    },

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


    fluid.defaults("colin.greenwichPark.synth", {
        gradeNames: ["flock.synth", "autoInit"],

        ukeBranch: {
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
                        ugen: "flock.ugen.playBuffer",
                        buffer: {
                            id: "camera-audio",
                            url: "audio/camera/in-camera-audio.wav"
                        },
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
                        ugen: "flock.ugen.amplitude",
                        source: {
                            ugen: "flock.ugen.playBuffer",
                            buffer: {
                                id: "camera-audio"
                            },
                            mul: 0.5
                        }
                    }
                },
                add: {
                    ugen: "flock.ugen.whiteNoise",
                    mul: 0.1
                },
                options: {
                    interpolation: "linear"
                }
            }
        },

        synthDef: {
            ugen: "flock.ugen.sum",
            sources: [
                // Uke.
                "{that}.options.ukeBranch",

                {
                    ugen: "flock.ugen.sum",
                    sources: [
                        // In-camera audio.
                        "{that}.options.ukeBranch.trigger.density.source",

                        // The drums
                        {
                            ugen: "flock.ugen.triggerBuffers",
                            trigger: {
                                ugen: "flock.ugen.impulse",
                                phase: 0,
                                freq: 1
                            },
                            bufferIndex: {
                                ugen: "flock.ugen.amplitude",
                                source: {
                                    ugen: "flock.ugen.playBuffer",
                                    buffer: {
                                        id: "camera-audio",
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
                    ]
                }
            ]
        }
    });

}());
