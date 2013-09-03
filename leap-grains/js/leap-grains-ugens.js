
(function () {
    "use strict";
    
    fluid.registerNamespace("flock.ugen.leap");
    
    flock.ugen.leap = function (that) {
        that.onPointablesChanged = fluid.identity;
        
        that.init = function () {
            that.leapMotion = flock.leapMotion.shared || flock.leapMotion();
            that.leapMotion.applier.modelChanged.addListener("*", function (model) {
                that.onPointablesChanged(model.pointables)
            });
        };
    };
    
    flock.ugen.leap.position = function (input, output, options) {
        var that = flock.ugen(input, output, options);
        flock.ugen.leap(that);

        that.gen = function (numSamps) {
            var out = that.output,
                inputs = that.inputs,
                axis = that.options.axis,
                m = that.model,
                id = that.inputs.pointable.output[0],
                lag = that.inputs.lag.output[0],
                lagCoef = m.lagCoef,
                movingAvg = m.movingAvg,
                i,
                pointable,
                val;
            
            if (lag !== lagCoef) {
                lagCoef = lag === 0 ? 0.0 : Math.exp(flock.LOG001 / (lag * m.sampleRate));
                m.lagCoef = lagCoef;
            }

            for (i = 0; i < numSamps; i++) {
                pointable = m.pointables[id];
                val = pointable ? pointable.position[axis] : 0;
                movingAvg = val + lagCoef * (movingAvg - val);
                out[i] = movingAvg;
            }
            
            m.movingAvg = movingAvg;
            that.mulAdd(numSamps);
        };
        
        that.onPointablesChanged = function (pointables) {
            that.model.pointables = pointables;
            flock.onMulAddInputChanged(that);
        };
        
        that.init();
        return that;
    };
    
    fluid.defaults("flock.ugen.leap.position", {
        rate: "control",
        inputs: {
            pointable: null,
            lag: 0.5
        },
        ugenOptions: {
            model: {
                pointables: {},
                movingAvg: 0
            },
            axis: "x"
        }
    });
}());
