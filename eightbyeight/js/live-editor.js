(function () {

    fluid.defaults("flock.ui.liveEditor", {
        gradeNames: ["fluid.modelRelayComponent", "autoInit"],

        model: {},

        invokers: {
            evalSelection: {
                funcName: "flock.ui.liveEditor.evalSelection",
                args: ["{arguments}.0", "{parser}", "{that}.applier.change"]
            }
        },

        components: {
            synthContext: {
                type: "flock.band"
            },

            codeMirror: {
                type: "flock.ui.codeEditor.cm",
                container: "#source-view",
                options: {
                    cmOptions: {
                        extraKeys: {
                            "Ctrl-Alt-Enter": "{liveEditor}.evalSelection"
                        }
                    }
                }
            },

            parser: {
                type: "flock.expressionParser",
                options: {
                    components: {
                        synthContext: "{liveEditor}.synthContext"
                    }
                }
            }
        },

        modelListeners: {
            "": {
                funcName: "flock.ui.liveEditor.updateSynths",
                args: ["{synthContext}", "{change}.value"]
            }
        }
    });

    flock.ui.liveEditor.evalSelection = function (cm, parser, setter) {
        //var model = flock.ui.codeEditor.cm.getSelection(cm, true);
        var content = cm.doc.getValue();
        try {
            var model = JSON.parse(content);
            model = parser.eval(model);
            flock.ui.liveEditor.updateModel(model, setter);
            fluid.log(fluid.logLevel.WARN, "more flock, less talk");
        } catch (e) {
            flock.fail(e.message);
        }
    };

    // TODO: This should go.
    flock.ui.liveEditor.updateModel = function (model, setter) {
        for (var synthName in model) {
            var modelForSynth = model[synthName],
                changeSpec = flock.ui.liveEditor.flattenModel(modelForSynth);

            model[synthName] = changeSpec;
        }

        setter(synthName, changeSpec);
    };

    flock.ui.liveEditor.flattenModel = function (model) {
        var flatModel = {};

        flock.ui.liveEditor.flattenModel.impl(model, flatModel, "");

        return flatModel;
    };

    flock.ui.liveEditor.flattenModel.impl = function (model, flatModel, path) {
        for (var key in model) {
            var value = model[key],
                newPath = fluid.pathUtil.composePath(path, key.toString());

            if (fluid.isPrimitive(value) || value.ugen) {
                flatModel[newPath] = value;
            } else {
                flock.ui.liveEditor.flattenModel.impl(value, flatModel, newPath);
            }
        }

        return flatModel;
    };

    flock.ui.liveEditor.updateSynths = function (synthContext, changedModel) {
        for (var synthName in changedModel) {
            var synth = synthContext[synthName];

            if (!synth) {
                flock.fail("No synth named '" + synthName + "' was found.");
                return;
            }

            var changeSpec = changedModel[synthName];
            synth.set(changeSpec);
        }
    };

    // Monkeypatch fluid.doLog to display errors in the status window.
    var old_doLog = fluid.doLog;
    fluid.doLog = function (args) {
        var str = args.join(" ");
        $("#status").text(str);
        old_doLog(args);
    };
}());
