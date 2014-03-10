(function () {
    "use strict";

    fluid.registerNamespace("colin");

    flock.init();

    fluid.defaults("colin.greenwichPark", {
        gradeNames: ["fluid.eventedComponent", "autoInit"],

        components: {
            synth: {
                createOnEvent: "onBuffersReady",
                type: "colin.greenwichPark.synth",
                options: {
                    listeners: {
                        onCreate: {
                            funcName: "demo.toggleButtonView",
                            args: ["{that}", ".playButton"]
                        }
                    }
                }
            },

            bufferLoader: {
                type: "flock.bufferLoader",
                options: {
                    bufferDefs: [
                        {
                            id: "cat",
                            url: "audio/kick/kick-01.wav"
                        },
                        {
                            id: "hamster",
                            url: "audio/uke/ukulele-01.wav"
                        }
                    ]
                }
            }
        },

        events: {
            onBuffersReady: "{bufferLoader}.events.afterBuffersLoaded"
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

        synthDef: {
            ugen: "flock.ugen.bufferBank",
            trigger: {
                ugen: "flock.ugen.dust",
                density: 100
            },
            bufferIndex: {
                ugen: "flock.ugen.whiteNoise"
            },
            options: {
                bufferIDs: ["cat", "hamster"]
            }

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
