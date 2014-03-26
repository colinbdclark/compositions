(function () {
    "use strict";

    fluid.defaults("colin.greenwichPark.scheduler", {
        gradeNames: ["flock.scheduler.async", "autoInit"],

        cutTime: (60 * 5) + 19, // 5'19"
        fadeDuration: 0.01,

        fadeInChange: {
            "main.mul": {
                ugen: "flock.ugen.line",
                start: 0,
                end: 1,
                duration: "{that}.options.fadeDuration"
            }
        },

        fadeOutChange: {
            "main.mul": {
                ugen: "flock.ugen.line",
                start: 1,
                end: 0,
                duration: "{that}.options.fadeDuration"
            }
        },

        // TODO: Need to be to target multiple changes at multiple synths at one time.
        // Even something like this would do:
        //     change: {
        //         "ukeClock": {...},
        //         "drumClock": {...}
        //     }
        score: [
            {
                interval: "once",
                time: "{that}.options.cutTime",
                change: {
                    synth: "ukeClock",
                    values: "{that}.options.fadeInChange"
                }
            },
            {
                interval: "once",
                time: "{that}.options.cutTime",
                change: {
                    synth: "drumClock",
                    values: "{that}.options.fadeOutChange"
                }
            },
            {
                interval: "once",
                time: "{that}.options.cutTime",
                change: {
                    synth: "drumAeolianHarp",
                    values: "{that}.options.fadeInChange"
                }
            },
            {
                interval: "once",
                time: "{that}.options.cutTime",
                change: {
                    synth: "ukuleleAeolianHarp",
                    values: "{that}.options.fadeOutChange"
                }
            }
        ]
    });
}());
