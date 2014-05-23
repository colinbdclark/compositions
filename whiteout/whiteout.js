(function () {
    fluid.registerNamespace("colin");

    fluid.defaults("colin.whiteout", {
        gradeNames: ["fluid.eventedComponent", "autoInit"],

        components: {
            band: {
                type: "colin.whiteout.band"
            },

            random: {
                type: "colin.whiteout.random"
            }
        },

        // In seconds.
        landmarks: [
            6,      // cut from black.
                // This is more of a forward/backward effect, though focus does move left/right subtly
                // Start with clattering mandolins and some noise, more fading in and out than panning?
            95,     // section 1-2 crossfade.
                // This section is somehow more austere. It feels pretty clearly like just focus in/out.
            138,    // section 2-3 crossfade.
                // This is where the prominent left-right effect is most visible
            379,    // section 3-4 crossfade.
                // Hand held. Lots of prominent left-right focus effects, as well as general movement, shake.
            577,    // section 4-cat cut
                // Silent.
            587,    // cat-section 5 cut
                // Also hand-held. Everything here.
            619     // end
        ]
    });

    fluid.defaults("colin.whiteout.band", {
        gradeNames: ["flock.band", "autoInit"],

        components: {
            mandolin: {
                type: "colin.whiteout.mandolin",
                options: {
                    gradeNames: ["colin.whiteout.panning"]
                }
            },

            highGuitar: {
                type: "colin.whiteout.guitarGranulator",
                options: {
                    gradeNames: ["colin.whiteout.right"]
                }
            },

            /*
            lowGuitar: {
                type: "colin.whiteout.lowGuitarGranulator",
                options: {
                    gradeNames: ["colin.whiteout.left"]
                }
            },

            highImpulse: {
                type: "colin.whiteout.impulseGranulator",
                options: {
                    gradeNames: ["colin.whiteout.stereo"],
                    synthDef: {
                        sources: {
                            pan: {
                                freq: 1/120
                            }
                        }
                    }
                }
            }
            */

            lowImpulse: {
                type: "colin.whiteout.lowImpulseGranulator",
                options: {
                    gradeNames: ["colin.whiteout.left"]
                }
            }
        }
    });

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
            bus: 0,
            expand: 1
        }
    });

    fluid.defaults("colin.whiteout.panning", {
        gradeNames: ["colin.whiteout.stereo", "autoInit"],

        synthDef: {
            sources: {
                ugen: "flock.ugen.pan2",
                pan: {
                    ugen: "flock.ugen.triOsc",
                    rate: "audio",
                    freq: 1/20,
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
                    mul: 1000,
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
                    ugen: "flock.ugen.triOsc",
                    freq: 1/5,
                    mul: 0.025,
                    add: 0.03,
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
                    ugen: "flock.ugen.triOsc",
                    freq: {
                        ugen: "flock.ugen.lfNoise",
                        rate: "control",
                        freq: 1/2,
                        mul: 1/5,
                        add: 1/5
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
                source: {
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
        }
    });

}());
