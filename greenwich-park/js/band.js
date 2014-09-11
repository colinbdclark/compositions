(function () {
    "use strict";

    fluid.defaults("colin.greenwichPark.unmutedSynth", {
        gradeNames: ["fluid.littleComponent", "autoInit"],
        synthDef: {
            id: "main"
        }
    });

    fluid.defaults("colin.greenwichPark.mutedSynth", {
        gradeNames: ["fluid.littleComponent", "autoInit"],
        synthDef: {
            id: "main",
            mul: 0
        }
    });

    fluid.defaults("colin.greenwichPark.band", {
        gradeNames: ["flock.band", "autoInit"],

        components: {
            scheduler: {
                createOnEvent: "onPlay",
                type: "colin.greenwichPark.scheduler"
            },

            inCameraAudioWriter: {
                type: "colin.greenwichPark.inCameraAudio",
                options: {
                    addToEnvironment: "head"
                }
            },

            inCameraAudioPlayer: {
                type: "colin.greenwichPark.inCameraAudioOutput"
            },

            ukuleleAeolianHarp: {
                type: "colin.greenwichPark.ukuleleAeolianHarp",
                options: {
                    gradeNames: ["colin.greenwichPark.unmutedSynth"]
                }
            },

            drumClock: {
                type: "colin.greenwichPark.drumClock",
                options: {
                    gradeNames: ["colin.greenwichPark.unmutedSynth"]
                }
            },

            drumAeolianHarp: {
                type: "colin.greenwichPark.drumAeolianHarp",
                options: {
                    gradeNames: ["colin.greenwichPark.mutedSynth"]
                }
            },

            ukeClock: {
                type: "colin.greenwichPark.ukeClock",
                options: {
                    gradeNames: ["colin.greenwichPark.mutedSynth"]
                }
            }
        }
    });

}());
