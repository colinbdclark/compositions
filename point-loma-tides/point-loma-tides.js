var colin = colin || {};

(function () {
    
    flock.interpolate.isNotNaN = function (val) {
        return !isNaN(val);
    };
    
    flock.interpolate.removeNaNs = function (buffer, interpFn) {
        var i,
            val,
            prevIdx,
            nextIdx,
            distance,
            j;
        for (i = 0; i < buffer.length; i++) {
            val = buffer[i];
            if (isNaN(val)) {
                nextIdx = flock.interpolate.findAdjacent(buffer, i, true, flock.interpolate.isNotNaN);
                prevIdx = flock.interpolate.findAdjacent(buffer, i, false, flock.interpolate.isNotNaN);
                distance = nextIdx - prevIdx + 1;
                for (j = prevIdx + 1; j < nextIdx + 1; j++) {
                    buffer[j] = interpFn((1.0 / distance) * (j - prevIdx), [buffer[prevIdx], buffer[nextIdx]]);
                }
            }
        }
    };
    
    flock.interpolate.findAdjacent = function (buffer, idx, direction, testFn) {
        var inc = direction ? 1 : -1,
            boundary = direction ? buffer.length : 0,
            val,
            i;
        
        for (i = idx; i !== boundary; i += inc) {
            val = buffer[i];
            if (testFn(val, i, buffer)) {
                return i;
            }
        }
        
        return;
    };
    
    colin.pointLomaTides = function (options) {        
        var that = {
            options: options || {
                tidesPath: "san-diego-high-res-water-level.csv"
            }
        };
        
        that.play = function () {
            that.synth.play();
        };
        
        that.pause = function () {
            that.clock.clearAll();
            that.synth.pause();
        };
        
        that.init = function () {        
            colin.pointLomaTides.fetchPredictions(that.options.tidesPath, function (data) {
                that.synth = colin.pointLomaTides.synthFromTidePredictions(data);
                that.playButtonView = demo.toggleButtonView(that.synth, ".playButton");
            });
        };
        
        that.init();
        return that;
    };
    
    colin.pointLomaTides.fetchPredictions = function (url, success) {
        $.ajax({
            url: url,
            method: "GET",
            dataType: "text",
            success: success,
            error: function () {
                console.log("errar!");
            }
        });
    };
    
    colin.pointLomaTides.synthFromTidePredictions = function (tideTableStr) {
        var predictions = colin.pointLomaTides.highResTableParser(tideTableStr),
            tideVals = colin.pointLomaTides.allValuesForUnit(predictions, "feet");
        
        flock.scale(tideVals, -1.0, 1.0);
        flock.interpolate.removeNaNs(tideVals, flock.interpolate.linear);
        
        for (var i = 0; i < tideVals.length; i++) {
            if (isNaN(tideVals[i])) {
                console.log("NaN found at index " + i);
            }
        }
        
        var bufView = flock.view.scope("#buffer-graph", {
            values: tideVals,
            strokeColor: "#888",
            strokeWidth: 1
        });
        bufView.refreshView();
        
        return flock.synth({
            synthDef: {
                ugen: "flock.ugen.scope",
                source: {
                    ugen: "flock.ugen.osc",
                    table: tideVals,
                    freq: {
                        ugen: "flock.ugen.osc",
                        rate: "control",
                        table: tideVals,
                        freq: 0.0001,
                        add: 3,
                        mul: 2.5,
                        options: {
                            interpolation: "linear"
                        }
                    },
                    options: {
                        interpolation: "none"
                    }
                },
                options: {
                    canvas: "#waveform",
                    styles: {
                        strokeColor: "#888",
                        strokeWidth: 1
                    }
                }
            }
        });
    };
    
    colin.pointLomaTides.tideTableParser = function (tideTableStr) {
        var lines = tideTableStr.split("\r\n");
        
        return fluid.transform(lines, function (line) {
            var tokens = line.split("\t");
            return {
                date: tokens[0],
                day: tokens[1],
                time: tokens[2],
                feet: tokens[3],
                cm: tokens[4],
                mark: tokens[5] === "L" ? "low" : "high"
            };
        });
    };
    
    colin.pointLomaTides.highResTableParser = function (tideTableStr) {
        var lines = tideTableStr.split("\n");
        
        return fluid.transform(lines, function (line) {
            var tokens = line.split(",");
            return {
                date: tokens[0],
                time: tokens[1],
                feet: tokens[2]
            }
        });
    };
    
    colin.pointLomaTides.allValuesForUnit = function (predictions, unit) {
        return fluid.transform(predictions, function (prediction, i) {
            var val = prediction[unit];
            if (val === "") {
                return NaN;
            }
            return Number(val);
        });
    };
    
}());
