(function () {
    "use strict";

    fluid.registerNamespace("colin");

    flock.init();

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

                kick: {
                    expander: {
                        funcName: "flock.urlsForFileSequence",
                        args: ["audio/kick/kick-%n.wav", 1, 23]
                    }
                },

                snare: {
                    expander: {
                        funcName: "flock.urlsForFileSequence",
                        args: ["audio/snare/snare-%n.wav", 1, 2, 2]
                    }
                }
            }
        },

        components: {
            synth: {
                createOnEvent: "onBuffersReady",
                type: "colin.greenwichPark.synth",
                options: {
                    ukeBranch: {
                        options: {
                            bufferIDs: {
                                expander: {
                                    funcName: "flock.bufferLoader.idsFromURLs",
                                    args: "{greenwichPark}.bufferUrls.uke"
                                }
                            }
                        }
                    },

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
                    }
                }
            },

            kickLoader: {
                type: "flock.bufferLoader",
                options: {
                    bufferDefs: {
                        expander: {
                            funcName: "flock.bufferLoader.expandFileSequence",
                            args: ["{greenwichPark}.bufferUrls.kick"]
                        }
                    }
                }
            },

            snareLoader: {
                type: "flock.bufferLoader",
                options: {
                    bufferDefs: {
                        expander: {
                            funcName: "flock.bufferLoader.expandFileSequence",
                            args: ["{greenwichPark}.bufferUrls.snare"]
                        }
                    }
                }
            }

        },

        events: {
            onBuffersReady: {
                events: {
                    afterUkesLoaded: "{ukeLoader}.events.afterBuffersLoaded",
                    afterKicksLoaded: "{kickLoader}.events.afterBuffersLoaded",
                    afterSnaresLoaded: "{snareLoader}.events.afterBuffersLoaded"
                }
            }
        }
    });

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


    fluid.defaults("colin.greenwichPark.synth", {
        gradeNames: ["flock.synth", "autoInit"],

        ukeBranch: {
            ugen: "flock.ugen.bufferBank",
            trigger: {
                ugen: "flock.ugen.dust",
                density: {
                    ugen: "flock.ugen.amplitude",
                    mul: 50,
                    source: {
                        ugen: "flock.ugen.playBuffer",
                        buffer: {
                            id: "camera-audio",
                            url: "audio/camera/in-camera-audio.wav"
                        },
                        mul: 1.3
                    }
                }
            },

            bufferIndex: {
                ugen: "flock.ugen.whiteNoise"
            }
        },

        synthDef: {
            ugen: "flock.ugen.sum",
            sources: [
                // Uke.
                "{that}.options.ukeBranch",

                {
                    ugen: "flock.ugen.sum",
                    sources: [
                        // In-camera audio.
                        "{that}.options.ukeBranch.trigger.density.source",

                        // The snares
                        {
                            ugen: "flock.ugen.bufferBank",
                            trigger: {
                                ugen: "flock.ugen.impulse",
                                phase: 0,
                                freq: 1/4
                            },
                            bufferIndex: {
                                ugen: "flock.ugen.whiteNoise"
                            },
                            options: {
                                bufferIDs: {
                                    expander: {
                                        funcName: "flock.bufferLoader.idsFromURLs",
                                        args: "{greenwichPark}.bufferUrls.snare"
                                    }
                                }
                            }
                        },

                        // The kicks.
                        {
                            ugen: "flock.ugen.bufferBank",
                            mul: 3,
                            trigger: {
                                ugen: "flock.ugen.impulse",
                                phase: 0.5,
                                freq: 1/2
                            },
                            bufferIndex: {
                                ugen: "flock.ugen.whiteNoise"
                            },
                            options: {
                                bufferIDs: {
                                    expander: {
                                        funcName: "flock.bufferLoader.idsFromURLs",
                                        args: "{greenwichPark}.bufferUrls.kick"
                                    }
                                }
                            }
                        }
                    ]
                }
            ]
        }
    });

    // TODO: Insufficient documentation.
    /**
     * Provides a bank of buffers that are played back whenever a trigger fires.
     * In this implementation, buffers are always allowed to play until their end.
     * A subsequent trigger while a buffer is still blaying won't interrupt it; another will be added to the mix.
     */
    flock.ugen.bufferBank = function (inputs, output, options) {
        var that = flock.ugen(inputs, output, options);

        // TODO: add an input that controls playback speed.
        that.gen = function (numSamps) {
            var m = that.model,
                strides = m.strides,
                out = that.output,
                inputs = that.inputs,
                buffers = that.buffers,
                numBuffers = buffers.length - 1,
                prevTrigger = m.prevTrigger,
                maxVoices = m.maxVoices,
                activeVoices = m.activeVoices,
                freeVoices = m.freeVoices,
                trigger = inputs.trigger.output,
                triggerInc = strides.trigger,
                triggerIdx = 0,
                bufferIndex = inputs.bufferIndex.output,
                bufferIndexInc = strides.bufferIndex,
                bufferIndexIdx = 0,
                speed = inputs.speed.output,
                speedInc = strides.speed,
                speedIdx = 0,
                chan = that.inputs.channel.output[0],
                i,
                triggerVal,
                voice,
                bufIdx,
                bufDesc,
                j,
                buffer,
                numSampsToWriteForVoice,
                k,
                samp;

            // Create a data structure containing all the active voices.
            for (i = 0; i < numSamps; i++) {
                triggerVal = trigger[triggerIdx];
                if (triggerVal > 0.0 && prevTrigger <= 0.0 && activeVoices.length < maxVoices) {
                    voice = freeVoices.pop();
                    voice.speed = speed[speedIdx];
                    voice.currentIdx = 0;
                    voice.writePos = i;
                    bufIdx = Math.round(bufferIndex[bufferIndexIdx] * numBuffers);
                    bufDesc = buffers[bufIdx];
                    voice.buffer = bufDesc.data.channels[chan];
                    //voice.sampleRate = bufDesc.format.sampRate;
                    activeVoices.push(voice);
                }

                // Update stride indexes.
                triggerIdx += triggerInc;
                speedIdx += speedInc;
                bufferIndexIdx += bufferIndexInc;

                // Clear out old values in the buffer.
                out[i] = 0.0;

                prevTrigger = triggerVal;
            }

            // Loop through each active voice and write it out to the block.
            for (j = 0; j < activeVoices.length;) {
                voice = activeVoices[j];
                buffer = voice.buffer;
                numSampsToWriteForVoice = Math.min(buffer.length - voice.currentIdx, numSamps);

                for (k = voice.writePos; k < numSampsToWriteForVoice; k++) {
                    // TODO: deal with speed and sample rate converstion.
                    samp = that.interpolate ? that.interpolate(voice.currentIdx, buffer) : buffer[voice.currentIdx | 0];
                    out[k] += samp;
                    voice.currentIdx++;
                }

                if (voice.currentIdx >= buffer.length) {
                    // This voice is done.
                    freeVoices.push(voice);
                    activeVoices.splice(j, 1);
                } else {
                    voice.writePos = 0;
                    j++;
                }
            }

            m.prevTrigger = prevTrigger;
            that.mulAdd(numSamps);
        };

        that.init = function () {
            that.buffers = [];
            that.allocateVoices();
            that.onInputChanged();
        };

        that.allocateVoices = function () {
            for (var i = 0; i < that.model.maxVoices; i++) {
                that.model.freeVoices.push({});
            }
        };

        that.onInputChanged = function () {
            // TODO: Hardcoded reference to the shared environment.
            // Plus is this is a pretty lame way to manage buffers.
            var enviroBufs = flock.enviro.shared.buffers,
                bufIDs = that.options.bufferIDs,
                i,
                bufID,
                bufDesc;

            // Clear the list of buffers.
            that.buffers.length = 0;

            for (i = 0; i < bufIDs.length; i++) {
                bufID = bufIDs[i];
                bufDesc = enviroBufs[bufID];
                that.buffers.push(bufDesc);
            }

            flock.onMulAddInputChanged(that);
            that.calculateStrides();
        };

        that.init();
        return that;
    };

    fluid.defaults("flock.ugen.bufferBank", {
        inputs: {
            trigger: 0,
            bufferIndex: 0, // A normalized value between 0 and 1.0
            speed: 1,
            channel: 0
        },
        ugenOptions: {
            model: {
                prevTrigger: 0,
                maxVoices: 128,
                activeVoices: [],
                freeVoices: [],
                channel: 0
            },
            bufferIDs: [],
            strideInputs: ["trigger", "bufferIndex", "speed"]
        }
    });
}());
