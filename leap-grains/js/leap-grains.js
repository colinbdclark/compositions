
(function () {
    "use strict";
    
    fluid.registerNamespace("flock");
    
    fluid.defaults("flock.leapMotion", {
        gradeNames: ["fluid.eventedComponent", "fluid.modelComponent", "autoInit"],
        
        model: {
            pointables: {}
        },
        
        listeners: {
            onCreate: [
                {
                    funcName: "flock.leapMotion.createController",
                    args: "{that}"
                },
                {
                    "this": "{that}.controller",
                    method: "on",
                    args: ["animationFrame", "{that}.events.onFrame.fire"]
                },
                {
                    "this": "{that}.applier.modelChanged",
                    method: "addListener",
                    args: ["*", "{that}.events.onPointablesChanged.fire"]
                }
            ],
            onFrame: {
                funcName: "flock.leapMotion.frameChanged",
                args: ["{arguments}.0", "{that}.model", "{that}.applier", "{that}.events"]
            }
        },
        
        events: {
            onFrame: null,
            onPointablesChanged: null,
            onPointableAdded: null,
            onPointableLost: null
        }
    });
        
    flock.leapMotion.createController = function (that) {
        that.controller = new Leap.Controller();
        that.controller.connect();
        flock.leapMotion.shared = that;
    };
    
    flock.leapMotion.frameChanged = function (leapFrame, model, applier, events) {
        if (Object.keys(model.pointables) < 1 && leapFrame.pointables.length < 1) {
            return;
        }
        
        var updatedModel = {},
            id,
            i,
            pointable;
        
        // TODO: Replace the onPointableLost and onPoitntableAdded events with finer-grained use of the ChangeApplier.
        for (id in model.pointables) {
            if (!leapFrame.pointablesMap[id]) {
                events.onPointableLost.fire(id);
            }
        }
        
        for (i = 0; i < leapFrame.pointables.length; i++) {
            pointable = leapFrame.pointables[i];
            pointable = updatedModel[pointable.id] = flock.leapMotion.pointableToModel(leapFrame, pointable);
            
            if (!model.pointables[pointable.id]) {
                events.onPointableAdded.fire(pointable);
            }
        }
        
        applier.requestChange("pointables", updatedModel);
    };
    
    // TODO: Use the model transformation framework.
    flock.leapMotion.pointableToModel = function (frame, p) {
        var normPos = frame.interactionBox.normalizePoint(p.stabilizedTipPosition),
            normVel = frame.interactionBox.normalizePoint(p.tipVelocity);
        
        return {
            id: p.id,
            timeVisible: p.timeVisible,
            touchDistance: p.touchDistance,
            touchZone: p.touchZone,
            valid: p.valid,
            position: {
                x: normPos[0],
                y: normPos[1],
                z: normPos[2]
            },
            velocity: {
                x: normVel[0],
                y: normVel[1],
                z: normVel[2]
            },
            direction: {
                // TODO: Normalize?
                x: p.direction[0],
                y: p.direction[1],
                z: p.direction[2]
            },
            isTool: p.tool
        };
    };
    
    
    fluid.registerNamespace("colin");
    
    fluid.defaults("colin.leapGrains", {
        gradeNames: ["fluid.viewComponent", "autoInit"],
        
        members: {
            activeTips: {},
            synthMap: {}
        },
                
        components: {
            leap: {
                type: "flock.leapMotion",
                options: {
                    listeners: {
                        onPointablesChanged: {
                            funcName: "colin.leapGrains.renderTips",
                            args: [
                                "{arguments}.0.pointables", 
                                "{leapGrains}.dom.fingerRegion", 
                                "{leapGrains}.activeTips", 
                                "{leapGrains}.options"
                            ]
                        },
                        
                        onPointableLost: {
                            funcName: "colin.leapGrains.removeSynth",
                            args: [
                                "{leapGrains}.synthMap",
                                "{arguments}.0",
                                "{scheduler}"
                            ]
                        }
                    }
                }
            }
        },
        
        dynamicComponents: {
            synth: {
                createOnEvent: "onPointableAdded",
                type: "flock.synth",
                options: {
                    source: "{arguments}.0",
                    synthDef: {
                        id: "carrier",
                        ugen: "flock.ugen.sinOsc",
                        freq: {
                            id: "freqPos",
                            ugen: "flock.ugen.leap.position",
                            pointable: "{arguments}.0.id",
                            mul: 540,
                            add: {
                               ugen: "flock.ugen.sinOsc",
                               freq: {
                                   id: "modPos",
                                   ugen: "flock.ugen.leap.position",
                                   pointable: "{arguments}.0.id",
                                   options: {
                                       axis: "y"
                                   },
                                   mul: 540,
                                   add: 270
                               }
                            },
                            options: {
                                axis: "x"
                            }
                        },
                        mul: {
                            id: "volumePos",
                            ugen: "flock.ugen.leap.position",
                            pointable: "{arguments}.0.id",
                            options: {
                                axis: "z"
                            }
                        }
                    },
                    pointableId: "{arguments}.0.id",
                    listeners: {
                        onCreate:{
                            funcName: "colin.leapGrains.mapSynthById",
                            args: ["{leapGrains}.synthMap", "{that}"]
                        }
                    }
                }
            }
        },
        
        listeners: {
            onCreate: [
                {
                    funcName: "flock.init",
                    args: [{
                        bufferSize: "{that}.options.bufferSize"
                    }]
                },
                {
                    funcName: "flock.enviro.shared.play"
                }
            ]
        },
        
        events: {
            onPointableAdded: "{leap}.events.onPointableAdded"
        },
        
        selectors: {
            fingerRegion: ".fingers",
            audioRegion: ".audio"
        },
        
        classes: {
            finger: "finger"
        },
        
        markup: {
            finger: "<div />"
        },
        
        maxTipSize: 75,
        bufferSize: 8192
    });
    
    colin.leapGrains.renderTips = function (pointables, fingerRegion, activeTips, options) {
        var drawingRegion = $("body"),
            height = drawingRegion.height(),
            width = drawingRegion.width(),
            id,
            pointable,
            tip;

        
        colin.leapGrains.clearInactiveTips(pointables, activeTips);
            
        for (id in pointables) {
            pointable = pointables[id];
            tip = activeTips[id];
            if (!tip) {
                tip = activeTips[id] = colin.leapGrains.renderTip(id, options.markup, options.classes);
                fingerRegion.append(tip);
            }
            colin.leapGrains.updateTipPosition(tip, pointable.position, options.maxTipSize, height, width);
        }
    };
    
    colin.leapGrains.renderTip = function (id, markup, classes) {
        var tip = $(markup.finger);
        tip.addClass(classes.finger);
        tip.attr("id", id);
        
        return tip;
    };
    
    colin.leapGrains.updateTipPosition = function (tip, fingerPos, maxTipSize, height, width) {
        var tipSize = maxTipSize / fingerPos.z;
        var tipPos = {
            width: tipSize,
            height: tipSize,
            bottom: (fingerPos.y * width),
            left: (fingerPos.x * height)
        };
        tip.css(tipPos);
    };
    
    colin.leapGrains.clearInactiveTips = function (pointables, activeTips) {
        var id,
            tip;
            
        for (id in activeTips) {
            tip = activeTips[id];
            if (!pointables[id]) {
                tip.fadeOut(1000, tip.remove);
                delete activeTips[id];
            }
        }
    };
    
    colin.leapGrains.mapSynthById = function (synthMap, synth) {
        synthMap[synth.options.pointableId] = synth;
    };
    
    colin.leapGrains.removeSynth = function (synthMap, id) {
        var synth = synthMap[id];
        if (synth) {
            delete synthMap[id];
            synth.destroy();
        }
    };
    
}());
