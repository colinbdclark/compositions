(function () {

   fluid.defaults("flock.expressionParser", {
        gradeNames: ["fluid.littleComponent", "autoInit"],

        tokens: {
            expression: "@exp:",
            valuePrefix: "${",
            valueSuffix: "}"
        },

        invokers: {
            eval: "flock.expressionParser.eval({arguments}.0, {that}.options.tokens, {synthContext})"
        },

        components: {
            synthContext: {
                type: "fluid.emptySubcomponent"
            }
        }
    });

    flock.expressionParser.eval = function (o, tokens, synthContext) {
        var type = typeof o;

        if (type === "string") {
            return flock.expressionParser.evalString(o, tokens, synthContext);
        } else if (flock.isIterable(o)) {
            return flock.expressionParser.evalArray(o, tokens, synthContext);
        } else if (type === "object") {
            return flock.expressionParser.evalObject(o, tokens, synthContext);
        }

        return o;
    };

    flock.expressionParser.evalString = function (expr, tokens, synthContext) {
        var result = expr,
            exprToken = tokens.expression,
            exprTokenLen = exprToken.length,
            valuePrefix = tokens.valuePrefix,
            valueSuffix = tokens.valueSuffix;

        // TODO: This currently will evaluate an arbitrary JavaScript code.
        // We should at least implement a regexp that will fail in case of
        // function invocation or definition.
        if (expr.indexOf(exprToken) === 0) {
            var toEval = expr.substring(exprTokenLen);
            result = eval(toEval);
        } else if (synthContext && synthContext.typeName !== "fluid.emptySubcomponent") {
            // TODO: This should be factored out.
            var prefixIdx = result.indexOf(valuePrefix),
                suffixIdx = result.indexOf(valueSuffix);

            if (prefixIdx === 0 && suffixIdx === result.length - 1) {
                  var path = result.substring(valuePrefix.length, suffixIdx);
                  result = flock.expressionParser.getValue(synthContext, path);
            }
        }

        return result;
    };

    flock.expressionParser.getValue = function (synthContext, path) {
        var synthName = fluid.pathUtil.getHeadPath(path),
            cdr = fluid.pathUtil.getFromHeadPath(path),
            synth = synthContext[synthName],
            value = synth.get(cdr);

        if (!synth) {
            return 0;
        }

        if (typeof value === "object") {
            if (value.model && value.model !== undefined) {
                value = value.model.value;
            } else if (value.output !== undefined) {
                value = value.output[0];
            }
        }

        return value;
    };

    flock.expressionParser.evalArray = function (arr, token, len, synthContext) {
        for (var i = 0; i < arr.length; i++) {
            var value = arr[i];
            arr[i] = flock.expressionParser.eval(value, token, len, synthContext);
        }

        return arr;
    };

     flock.expressionParser.evalObject = function (o, token, len, synthContext) {
        for (var key in o) {
            var value = o[key];
            o[key] = flock.expressionParser.eval(value, token, len, synthContext);
        }

        return o;
    };
}());
