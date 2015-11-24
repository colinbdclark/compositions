(function () {

    fluid.defaults("colin.mPulse.filterSynth", {
        gradeNames: "flock.synth",
        synthDef: {
            id: "master",
            ugen: "flock.ugen.out",
            bus: 1,
            expand: 1,
            sources: {
                id: "filter",
                ugen: "flock.ugen.filter.moog",
                cutoff: {
                    id: "cutoff",
                    ugen: "flock.ugen.lfNoise",
                    freq: {
                        ugen: "flock.ugen.lfNoise",
                        freq: 1/2,
                        mul: 1/20,
                        add: 1/20,
                        options: {
                            interpolation: "linear"
                        }
                    },
                    mul: 600,
                    add: 600,
                },
                resonance: 4,
                source: {
                    ugen: "flock.ugen.lfPulse",
                    freq: {
                        id: "gaussian",
                        ugen: "flock.ugen.random.normal",
                        sigma: 0,
                        mu: 0
                    },
                    mul: {
                        ugen: "flock.ugen.triOsc",
                        rate: "control",
                        freq: 1
                    }
                },
                mul: {
                    ugen: "flock.ugen.line",
                    start: 0.0,
                    end: 0.25,
                    dur: 60.0
                }
            }
        }
    });

    fluid.defaults("colin.mPulse.noiseSynth", {
        gradeNames: "flock.synth",
        synthDef: {
            id: "master",
            ugen: "flock.ugen.out",
            bus: 0,
            expand: 1,
            mul: 1.0,
            sources: {
                id: "noise",
                ugen: "flock.ugen.whiteNoise",
                // TODO: This is a bug.
                // The whiteNoise unit generator doesn't have
                // a freq input.
                freq: {
                    ugen: "flock.ugen.lfNoise",
                    freq: 1/10,
                    mul: 1,
                    add: 1,
                    options: {
                        interpolation: "linear"
                    }
                },
                mul: {
                    id: "envelope",
                    ugen: "flock.ugen.triOsc",
                    rate: "control",
                    freq: {
                        ugen: "flock.ugen.sinOsc",
                        rate: "control",
                        freq: 1/10,
                        mul: 1/2,
                        add: 1/2
                    },
                    mul: {
                        ugen: "flock.ugen.lfPulse",
                        rate: "control",
                        freq: {
                            ugen: "flock.ugen.value",
                            rate: "control",
                            value: 1/2
                        },
                        mul: {
                            id: "envelopeScale",
                            ugen: "flock.ugen.lfNoise",
                            rate: "control",
                            freq: 440,
                            mul: 0,
                            add: 0,
                            options: {
                                interpolation: "linear"
                            }
                        },
                        add: 0.01
                    }
                }
            }
        }
    });

    fluid.defaults("colin.mPulse.controller",{
        gradeNames: "flock.midi.controller",

        components: {
            synthContext: "{band}"
        },

        controlMap: {
            "0": {
                synth: "filterSynth",
                input: "gaussian.sigma"
            },

            "1": {
                synth: "filterSynth",
                input: "gaussian.mu"
            },

            "2": {
                synth: "filterSynth",
                input: "cutoff.freq.freq",
                valuePath: "source",
                transform: {
                    ugen: "flock.ugen.math",
                    div: 64
                }
            },

            "3": {
                synth: "filterSynth",
                input: "cutoff.mul",
                transform: {
                    mul: 8,
                    add: 60
                }
            },

            "4": {
                synth: "filterSynth",
                input: "cutoff.add",
                transform: {
                    mul: 8,
                    add: 60
                }
            },

            "5": {
                synth: "filterSynth",
                input: "filter.resonance",
                transform: {
                    mul: 1/64,
                    add: 3.5
                }
            },

            "16": {
                synth: "noiseSynth",
                input: "envelope.freq.freq",
                valuePath: "source",
                transform: {
                    ugen: "flock.ugen.math",
                    div: 512
                }
            },

            "17": {
                synth: "noiseSynth",
                input: "envelope.freq.add",
                valuePath: "source",
                transform: {
                    ugen: "flock.ugen.math",
                    div: 127
                }
            },

            "18": {
                synth: "noiseSynth",
                input: "envelope.mul.freq",
                valuePath: "source",
                transform: {
                    ugen: "flock.ugen.math",
                    div: 64
                }
            },

            "19": {
                synth: "noiseSynth",
                input: "envelopeScale.freq",
                transform: {
                    mul: 10
                }
            },

            "20": {
                synth: "noiseSynth",
                input: "envelopeScale.mul",
                valuePath: "source",
                transform: {
                    ugen: "flock.ugen.math",
                    div: 16
                }

            },

            "21": {
                synth: "noiseSynth",
                input: "envelopeScale.add",
                valuePath: "source",
                transform: {
                    ugen: "flock.ugen.math",
                    div: 127
                }
            }
        }
    });

    fluid.defaults("colin.mPulse.band", {
        gradeNames: "flock.band",

        components: {
            filterSynth: {
                type: "colin.mPulse.filterSynth"
            },

            noiseSynth: {
                type: "colin.mPulse.noiseSynth"
            },

            nanoKontrol: {
                type: "colin.mPulse.controller"
            }
        }
    });

}());
