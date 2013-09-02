
(function () {
    "use strict";
    
    fluid.registerNamespace("flock");
    
    // TODO: Modelize this component. Whenever a pointable changes, it should fire a ChangeApplier event.
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
                args: ["{arguments}.0", "{that}.model", "{that}.applier"]
            }
        },
        
        events: {
            onFrame: null,
            onPointablesChanged: null
        }
    });
    
    flock.leapMotion.createController = function (that) {
        that.controller = new Leap.Controller();
        that.controller.connect();
    };
    
    flock.leapMotion.frameChanged = function (leapFrame, model, applier) {
        if (Object.keys(model.pointables) < 1 && leapFrame.pointables.length < 1) {
            return;
        }
        
        var updatedModel = {},
            i,
            pointable;
        
        for (var i = 0; i < leapFrame.pointables.length; i++) {
            pointable = leapFrame.pointables[i];
            updatedModel[pointable.id] = flock.leapMotion.pointableToModel(leapFrame, pointable);
        }
        
        applier.requestChange("pointables", updatedModel);
    };
    
    flock.leapMotion.pointableToModel = function (frame, p) {
        var normPos = frame.interactionBox.normalizePoint(p.stabilizedTipPosition);
        
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
                // TODO: Normalize?
                x: p.tipVelocity[0],
                y: p.tipVelocity[1],
                z: p.tipVelocity[2]
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
            activeTips: {}
        },
        
        components: {
            leap: {
                type: "flock.leapMotion",
                options: {
                    listeners: {
                        onPointablesChanged: {
                            funcName: "colin.leapGrains.renderFingerTips",
                            args: ["{arguments}.0.pointables", "{leapGrains}.dom.fingerRegion", "{leapGrains}.activeTips", "{leapGrains}.options"]
                        }
                    }
                }
            }
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
        
        maxTipSize: 75
    });
    
    colin.leapGrains.renderFingerTips = function (pointables, fingerRegion, activeTips, options) {
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
                tip = activeTips[id] = colin.leapGrains.renderFingerTip(id, options.markup, options.classes);
                fingerRegion.append(tip);
            }
            colin.leapGrains.updateTipPosition(tip, pointable.position, options.maxTipSize, height, width);
        }
    };
    
    colin.leapGrains.renderFingerTip = function (id, markup, classes) {
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
    
}());
