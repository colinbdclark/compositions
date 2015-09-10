/*jslint node: true*/

/*global require*/

"use strict";

var fluid = require("infusion"),
    flock = fluid.require("flocking");

fluid.registerNamespace("colin.motors");

fluid.defaults("colin.motors.triggeredBufferSynth", {
    gradeNames: "flock.synth",

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
        },
        mul: {
            ugen: "flock.ugen.sequence",
            freq: {
                ugen: "flock.ugen.triOsc",
                freq: 1/10,
                mul: 0.5,
                add: 1.25
            },
            values: [0.4, 0.4, 0.4, 0.8, 0.4, 0.4, 0.8, 0.4],
            loop: 1
        }
    }
});

fluid.defaults("colin.motors.kick", {
    gradeNames: "colin.motors.triggeredBufferSynth",

    synthDef: {
        ugen: "flock.ugen.filter.biquad.rlp",
        freq: 66,
        q: 20,
        source: {
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
            },
            id: "kick",
            buffer: {
                id: "kick",
                url: "audio/kick-20.wav"
            },
            mul: 0.25
        }
    }
});

fluid.defaults("colin.motors.rimshot", {
    gradeNames: "colin.motors.triggeredBufferSynth",

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
    gradeNames: "colin.motors.triggeredBufferSynth",

    synthDef: {
        id: "snare",
        buffer: {
            id: "snare",
            url: "audio/snare-07.wav"
        },
        trigger: {
            freq: {
                ugen: "flock.ugen.lfNoise",
                rate: "control",
                freq: 10,
                mul: 1/3.5,
                add: 1/7
            }
        },
        mul: {
            ugen: "flock.ugen.whiteNoise",
            mul: 0.5
        }
    }
});


fluid.defaults("colin.motors.app", {
    gradeNames: ["flock.band", "fluid.modelComponent"],

    components: {
        kick: {
            type: "colin.motors.kick"
        },

        otherKick: {
            type: "colin.motors.kick",
            options: {
                synthDef: {
                    freq: {
                        ugen: "flock.ugen.lfNoise",
                        freq: 1/5,
                        add: 60,
                        mul: 60
                    },
                    q: 10,
                    source: {
                        trigger: {
                            freq: 1/2
                        },
                        mul: 0.25
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
                        mul: 1200,
                        add: 20,
                        options: {
                            interpolation: "linear"
                        }
                    },
                    resonance: 3,
                    source: {
                        ugen: "flock.ugen.lfSaw",
                        freq: {
                            ugen: "flock.ugen.sequence",
                            values: [60, 0, 0, 76, 60, 0, 88, 92, 54, 0],
                            loop: 1,
                            freq: {
                                ugen: "flock.ugen.lfNoise",
                                freq: 1,
                                mul: {
                                    ugen: "flock.ugen.triOsc",
                                    phase: 0.5,
                                    freq: 1/60,
                                    mul: 1/2,
                                    add: 1/2
                                },
                                options: {
                                    interpolate: "linear"
                                }
                            }
                        },
                        mul: {
                            ugen: "flock.ugen.env.simpleASR",
                            gate: {
                                ugen: "flock.ugen.lfPulse",
                                freq: {
                                    ugen: "flock.ugen.triOsc",
                                    phase: 0.5,
                                    freq: 1/60,
                                    mul: 1/2,
                                    add: 1/2
                                }
                            },
                            attack: 0.01,
                            sustain: 0.4,
                            release: 0.1
                        }
                    }
                }
            }
        }
    }
});
