
"use strict";

var fluid = require("infusion"),
    flock = fluid.require("flocking");

fluid.registerNamespace("colin.motors");

fluid.defaults("colin.motors.triggeredBufferSynth", {
    gradeNames: ["flock.synth", "autoInit"],

    synthDef: {
        ugen: "flock.ugen.playBuffer",
        loop: 0,
        trigger: {
            ugen: "flock.ugen.impulse",
            freq: {
                ugen: "flock.ugen.triOsc",
                freq: 1/10,
                mul: 0.5,
                add: 1.25
            }
        }
    }
});

fluid.defaults("colin.motors.kick", {
    gradeNames: ["colin.motors.triggeredBufferSynth", "autoInit"],

    synthDef: {
        id: "kick",
        buffer: {
            id: "kick",
            url: "audio/kick-20.wav"
        }
    }
});

fluid.defaults("colin.motors.rimshot", {
    gradeNames: ["colin.motors.triggeredBufferSynth", "autoInit"],

    synthDef: {
        id: "rim",
        buffer: {
            id: "rimshot",
            url: "audio/rimshot.wav"
        },
        trigger: {
            freq: 1.1
        }
    }
});

fluid.defaults("colin.motors.snare", {
    gradeNames: ["colin.motors.triggeredBufferSynth", "autoInit"],

    synthDef: {
        id: "snare",
        buffer: {
            id: "snare",
            url: "audio/snare-07.wav"
        },
        trigger: {
            freq: 1/2.25
        },
        mul: 0.5
    }
});

fluid.defaults("colin.whiteout.output", {
    gradeNames: ["flock.synth", "autoInit"],

    synthDef: {
        ugen: "flock.ugen.out"
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
                url: "../whiteout/audio/low-bowed-guitar.wav"
            }
        },
        mul: {
            ugen: "flock.ugen.env.simpleASR",
            attack: 0.1,
            release: 0.1,
            gate: {
                ugen: "flock.ugen.lfPulse",
                freq: 0.5
            }
        }
    }
});

fluid.defaults("colin.motors.app", {
    gradeNames: ["fluid.eventedComponent", "fluid.modelComponent", "autoInit"],

    components: {
        kick: {
            type: "colin.motors.kick"
        },

        otherKick: {
            type: "colin.motors.kick",
            options: {
                synthDef: {
                    trigger: {
                        freq: 1/2
                    }
                }
            }
        },


        rimshot: {
            type: "colin.motors.rimshot"
        },

        snare: {
            type: "colin.motors.snare"
        },

        bass: {
            type: "flock.synth",
            options: {
                synthDef: {
                    ugen: "flock.ugen.filter.moog",
                    cutoff: {
                        ugen: "flock.ugen.lfNoise",
                        freq: 2,
                        mul: 5000,
                        add: 7000,
                        options: {
                            interpolation: "linear"
                        }
                    },
                    resonance: 3,
                    source: {
                        ugen: "flock.ugen.lfSaw",
                        freq: {
                            ugen: "flock.ugen.sequence",
                            list: [90, 105, 60, 120, 90, 60],
                            loop: 1,
                            freq: {
                                ugen: "flock.ugen.lfNoise",
                                freq: 1,
                                options: {
                                    interpolate: "linear"
                                }
                            }
                        }
                    },
                    mul: {
                        ugen: "flock.ugen.env.simpleASR",
                        gate: {
                            ugen: "flock.ugen.lfPulse",
                            freq: 1
                        },
                        attack: 0.001,
                        sustain: 0.25,
                        release: 0.001
                    }
                }
            }
        }
    }
});
