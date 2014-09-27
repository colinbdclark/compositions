(function () {
    fluid.registerNamespace("colin");

    flock.init({
        bufferSize: 2048
    });

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
                type: "colin.whiteout.mandolin.thick",
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

            lowGuitar: {
                type: "colin.whiteout.lowGuitarGranulator",
                options: {
                    gradeNames: ["colin.whiteout.left"]
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

    fluid.defaults("colin.whiteout.band.mandolins", {
        gradeNames: ["flock.band", "autoInit"],

        components: {
            thin: {
                type: "colin.whiteout.mandolin.thin",
                options: {
                    gradeNames: ["colin.whiteout.panning"]
                }
            },
            thick: {
                type: "colin.whiteout.mandolin.thick",
                options: {
                    gradeNames: ["colin.whiteout.panning"]
                }
            }
        }
    });

    fluid.defaults("colin.whiteout.band.bothGuitars", {
        gradeNames: ["flock.band", "autoInit"],

        components: {
            highGuitar: {
                type: "colin.whiteout.guitarGranulator",
                options: {
                    gradeNames: ["colin.whiteout.right"]
                }
            },

            lowGuitar: {
                type: "colin.whiteout.lowGuitarGranulator",
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
                dur: 1 * 1.08843537414966,
                centerPos: {
                    ugen: "flock.ugen.lfNoise",
                    rate: "control",
                    freq: 1/2,
                    mul: 1000 * 1.08843537414966,
                    options: {
                        interpolation: "linear"
                    }
                },
                trigger: {
                    ugen: "flock.ugen.impulse",
                    rate: "control",
                    freq: 10
                },
                buffer: {
                    id: "high-guitar",
                    url: "audio/high-bowed-guitar.wav"
                },
                mul: {
                    ugen: "flock.ugen.triOsc",
                    rate: "control",
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
                centerPos: {
                    mul: {
                        ugen: "flock.ugen.line",
                        rate: "control",
                        start: 50 * 1.08843537414966,
                        end: 800 * 1.08843537414966,
                        duration: 60
                    }
                },

                buffer: {
                    id: "low-guitar",
                    url: "audio/low-bowed-guitar.wav"
                },
                mul: {
                    end: 0.8
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
                    rate: "control",
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
                    rate: "control",
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
                        id: "grainDur",
                        ugen: "flock.ugen.lfNoise",
                        rate: "control",
                        freq: 1/10,
                        mul: 1 * 1.08843537414966,
                        add: 1.075 * 1.08843537414966
                    },
                    centerPos: {
                        id: "grainCentre",
                        ugen: "flock.ugen.lfNoise",
                        rate: "control",
                        freq: 1/2,
                        mul: {
                            ugen: "flock.ugen.math",
                            rate: "constant",
                            source: {
                                ugen: "flock.ugen.bufferLength",
                                buffer: "mandolin",
                            },
                            div: 2
                        },
                        add: {
                            ugen: "flock.ugen.math",
                            rate: "constant",
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
                            id: "grainDensity",
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

    fluid.defaults("colin.whiteout.mandolin.thin", {
        gradeNames: ["colin.whiteout.mandolin", "autoInit"],
        synthDef: {
            sources: {
                pan: {
                    freq: 1/30
                },
                source: {
                    dur: 3.1 * 1.08843537414966,
                    centerPos: {
                        freq: 10,
                        mul: {
                            ugen: "flock.ugen.lfNoise",
                            rate: "control",
                            options: {
                                interpolation: "linear"
                            },
                            freq: 1/2,
                            mul: 5 * 1.08843537414966,
                            add: 10 * 1.08843537414966
                        },
                        add: {
                            ugen: "flock.ugen.math",
                            rate: "constant",
                            source: {
                                ugen: "flock.ugen.bufferLength",
                                buffer: "mandolin"
                            },
                            div: 0.111
                        },
                        options: {
                            interpolation: "linear"
                        }
                    },
                    trigger: {
                        ugen: "flock.ugen.impulse",
                        rate: "control",
                        freq: {
                            ugen: "flock.ugen.lfNoise",
                            rate: "control",
                            freq: 2,
                            mul: 0.15,
                            add: 0.25
                        }
                    },
                    mul: 0.25
                }
            }
        }
    });

    fluid.defaults("colin.whiteout.mandolin.thick", {
        gradeNames: ["colin.whiteout.mandolin.thin", "autoInit"],

        synthDef: {
            sources: {
                pan: {
                    freq: 1/30
                },
                source: {
                    dur: {
                        ugen: "flock.ugen.lfNoise",
                        rate: "control",
                        freq: 1/2,
                        mul: 4 * 1.08843537414966,
                        add: 6 * 1.08843537414966
                    },
                    centerPos: {
                        ugen: "flock.ugen.lfNoise",
                        rate: "control",
                        options: {
                            interpolation: "linear"
                        },
                        freq: 10,
                        mul: 2 * 1.08843537414966,
                        add: 51 * 1.08843537414966
                    },
                    trigger: {
                        freq: {
                            ugen: "flock.ugen.lfNoise",
                            rate: "control",
                            options: {
                                interpolation: "linear"
                            },
                            freq: 2,
                            mul: 0.10,
                            add: 0.10
                        }
                    }
                }
            }
        }
    });

}());
