(function () {
    "use strict";

    fluid.registerNamespace("colin");

    flock.init({
        numBuses: 16
    });

    // In the middle of a field in Greenwich Park on a grey weekday morning.
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
                        // TODO: this API is confusing!
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
                type: "colin.greenwichPark.band",
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

}());
