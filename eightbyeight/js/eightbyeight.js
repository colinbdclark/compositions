(function () {
    flock.debug.failHard = false;
    flock.init();

    fluid.defaults("colin.eightByEight", {
        gradeNames: ["fluid.modelRelayComponent", "autoInit"],

        components: {
            editor: {
                type: "flock.ui.liveEditor",
                options: {
                    components: {
                        synthContext: "{band}"
                    }
                }
            },

            band: {
                type: "colin.mPulse.band"
            }
        },

        listeners: {
          onCreate: {
              funcName: "colin.eightByEight.start"
          }
        }
    });

    colin.eightByEight.start = function () {
        setTimeout(function () {
            flock.enviro.shared.play();
            fluid.log(fluid.logLevel.WARN, "brush, ping");

        }, 10000);
    }
}());
