(function () {
    "use strict";

    flock.urlsForFileSequence = function (filenameTemplate, start, end, digits) {
        if (digits === undefined) {
            digits = end.toString().length;
        }

        var urls = [],
            i,
            url;

        for (i = start; i <= end; i++) {
            url = fluid.stringTemplate(filenameTemplate, {
                n: flock.urlsForFileSequence.zeroPad(i, digits)
            });

            urls.push(url);
        }

        return urls;
    };

    // Based on code from:
    // http://stackoverflow.com/questions/1267283/how-can-i-create-a-zerofilled-value-using-javascript
    flock.urlsForFileSequence.zeroPad = function (num, numDigits) {
        var n = Math.abs(num),
            digitsInN = Math.floor(n).toString().length,
            zeros = Math.max(0, numDigits - digitsInN),
            zeroString = Math.pow(10, zeros).toString().substr(1);

        if (num < 0) {
            zeroString = "-" + zeroString;
        }

        return zeroString + n;
    };

    flock.mergeURLsForMultipleFileSequences = function (filenameTemplates, starts, ends) {
        var urls = [],
            i;

        for (i = 0; i < filenameTemplates.length; i++) {
            urls = urls.concat(flock.urlsForFileSequence(filenameTemplates[i], starts[i], ends[i]));
        }

        return urls;
    };

    
    fluid.defaults("flock.bufferLoader", {
        gradeNames: ["fluid.eventedComponent", "autoInit"],

        members: {
            buffers: []
        },

        bufferDefs: [],

        events: {
            afterBuffersLoaded: null
        },

        listeners: {
            onCreate: {
                funcName: "flock.bufferLoader.loadBuffers",
                args: ["{that}.options.bufferDefs", "{that}.buffers", "{that}.events.afterBuffersLoaded.fire"]
            }
        }
    });

    flock.bufferLoader.idFromURL = function (url) {
        var lastSlash = url.lastIndexOf("/"),
            idStart = lastSlash > -1 ? lastSlash + 1 : 0,
            ext = url.lastIndexOf("."),
            idEnd = ext > -1 ? ext : url.length;

        return url.substring(idStart, idEnd);
    };

    flock.bufferLoader.idsFromURLs = function (urls) {
        return fluid.transform(urls, flock.bufferLoader.idFromURL);
    };

    flock.bufferLoader.expandFileSequence = function (fileURLs) {
        fileURLs = fileURLs || [];

        var bufDefs = [],
            i,
            url,
            lastSlash,
            idStart,
            ext,
            idEnd,
            id;

        for (i = 0; i < fileURLs.length; i++) {
            url = fileURLs[i];
            id = flock.bufferLoader.idFromURL(url);
            bufDefs.push({
                id: id,
                url: url
            });
        }

        return bufDefs;
    };

    flock.bufferLoader.loadBuffers = function (bufferDefs, decodedBuffers, afterBuffersLoaded) {
        // TODO: This is a sign that the flock.parse.bufferForDef is still terribly broken.
        var stupidFakeUGen = {
            setBuffer: function (decoded) {
                decodedBuffers.push(decoded);

                if (decodedBuffers.length === bufferDefs.length) {
                    afterBuffersLoaded(decodedBuffers);
                }
            }
        };

        for (var i = 0; i < bufferDefs.length; i++) {
            // TODO: Hardcoded reference to the shared environment.
            flock.parse.bufferForDef(bufferDefs[i], stupidFakeUGen, flock.enviro.shared);
        }
    };

}());
