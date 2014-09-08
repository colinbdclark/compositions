(function () {

    fluid.defaults("flock.midi.controller", {
        gradeNames: ["fluid.eventedComponent", "autoInit"],

        members: {
            controlMap: "@expand:flock.midi.controller.optimizeControlMap({that}.options.controlMap)"
        },

        controlMap: {},                       // Needs to be specified by the user.

        components: {
            synthContext: {                   // Also user-specified.
                type: "flock.band"            // This is typically a flock.band instance,
            },                                // but can be anything that has a set of named synths.

            connection: {
                type: "flock.midi.connection",
                options: {
                    ports: {
                        input: "*"              // Connect to the first available input port.
                    },

                    openImmediately: true,    // Immediately upon instantiating the connection.

                    listeners: {
                        control: {
                            func: "{controller}.map"
                        }
                    }
                }
            }
        },

        invokers: {
            map: {
                funcName: "flock.midi.controller.map",
                args: ["{arguments}.0", "{that}.synthContext", "{that}.controlMap"]
            }
        }
    });

    flock.midi.controller.optimizeControlMap = function (controlMap) {
        var controlMapArray = new Array(127);
        fluid.each(controlMap, function (mapSpec, controlNum) {
            var idx = Number(controlNum);
            controlMapArray[idx] = mapSpec;
        });

        return controlMapArray;
    };

    flock.midi.controller.expandControlMapSpec = function (valueUGenID, mapSpec) {
        mapSpec.transform.id = valueUGenID;

        // TODO: THe key "valuePath" is confusin;
        // it actually points to the location in the
        // transform synth where the value should be set.
        mapSpec.valuePath = mapSpec.valuePath || "value";

        if (!mapSpec.transform.ugen) {
            mapSpec.transform.ugen = "flock.ugen.value";
        }

        return mapSpec;
    };

    flock.midi.controller.makeValueSynth = function (value, id, mapSpec) {
        mapSpec = flock.midi.controller.expandControlMapSpec(id, mapSpec);

        var transform = mapSpec.transform,
            valuePath = mapSpec.valuePath;

        flock.set(transform, valuePath, value);

        // Instantiate the new value synth.
        var valueSynth = flock.synth.value({
            synthDef: transform
        });

        // Update the value path so we can quickly update the synth's input value.
        mapSpec.valuePath = id + "." + valuePath;

        return valueSynth;
    };

    flock.midi.controller.transformValue = function (midiMsg, mapSpec) {
        var transform = mapSpec.transform,
            value = midiMsg.value,
            type = typeof transform;

        if (type === "function") {
            return transform(value, midiMsg);
        }
        // TODO: Add support for string-based transforms
        // that bind to globally-defined synths (e.g. "flock.synth.midiFreq" or "flock.synth.midiAmp")
        // TODO: Factor this into a separate function.
        if (!mapSpec.transformSynth) {
            // We have a raw synthDef.
            // Instantiate a value synth to transform incoming control values.

            // TODO: In order to support multiple inputs (e.g. a multi-arg OSC message),
            // this special path needs to be scoped to the argument name. In the case of MIDI,
            // this would be the CC number. In the case of OSC, it would be a combination of
            // OSC message address and argument index.
            mapSpec.transformSynth = flock.midi.controller.makeValueSynth(value, "flock-midi-controller-in", mapSpec);
        } else {
            // TODO: When the new node architecture is in in place, we can directly connect this
            // synth to the target synth at instantiation time.
            // TODO: Add support for arrays of values, such as multi-arg OSC messages.
            mapSpec.transformSynth.set(mapSpec.valuePath, value);
        }

        return mapSpec.transformSynth.value();
    };

    flock.midi.controller.map = function (midiMsg, synthContext, controlMap) {
        var map = controlMap[midiMsg.number];

        if (!map) {
            return;
        }

        var value = map.transform ? flock.midi.controller.transformValue(midiMsg, map) : midiMsg.value,
            synth = synthContext[map.synth] || synthContext;

        synth.set(map.input, value);
    };

}());
