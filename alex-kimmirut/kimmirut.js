var scsiduck = scsiduck || {};

(function () {

    scsiduck.kimmirut = function () {
        var that = {};
        
        /*************************************
         * Original SuperCollider Instrument *
         *************************************/
        
        /*
        SynthDef("quadgrain", {
        	arg bufNum = 0, pan = -1.0, pos = 0.5, trate = 40, motuFirstOut = 0, posCrawl = 0.5,
        		rate = 0.6, posWiggle = 0;

        	var dur, clk, sound, panSound, bufPos;

        	//trate = MouseY.kr(8,150,1);
        	dur = 0.25;
        	clk = Impulse.kr(trate+LFNoise1.kr(0.2,10));
        	//pos = MouseX.kr(0,BufDur.kr(b));
        	pos = Phasor.kr(0,posCrawl/SampleRate.ir,0.01,0.69,0.01) + posWiggle;
        	bufPos = pos * BufDur.kr(b);
        	pan = WhiteNoise.kr(0.6);
        	sound = TGrains.ar(2, clk, bufNum, rate, bufPos, dur, pan, 0.1);
        	panSound = Mix.ar(sound);

        	Out.ar(motuFirstOut,Pan2.ar(panSound,pan));


        }).load(s);

        w = Synth.new("quadgrain",[\bufNum,b[0].bufnum,\outPan,-1.0,\motuFirstOut,0,\posCrawl,0.5,\rate,0.7]);
        */
        
        
        /********************
         * Flocking Version *
         ********************/
         
        that.synth = flock.synth({
            synthDef: [
                {
                    id: "left-granulator",
                    ugen: "flock.ugen.triggerGrains",
                    trigger: {
                        ugen: "flock.ugen.impulse",
                        rate: "control", // TODO: Why does this not work when impulse is audio rate?
                        freq: {
                            id: "left-trate",
                            ugen: "flock.ugen.lfNoise",
                            rate: "control",
                            options: {
                                interpolation: "linear"
                            },
                            freq: 0.2,
                            mul: 10,
                            add: 40
                        }
                    },
                    buffer: {
                        id: "grainBuffer",
                        selector: ".fileSelector .fileBrowser"
                    },
                    centerPos: {
                        ugen: "flock.ugen.phasor",
                        rate: "control",
                        step: {
                            id: "left-posCrawl",
                            ugen: "flock.ugen.math",
                            source: {
                                ugen: "flock.ugen.sampleRate"
                            },
                            div: 0.5
                        },
                        start: 0.01,
                        end: 0.69,
                        reset: 0.01,
                        mul: {
                            ugen: "flock.ugen.bufferDuration",
                            rate: "constant",
                            buffer: "grainBuffer"
                        }
                    },
                    dur: 0.25,
                    amp: 0.1,
                    speed: 1.0,
                    mul: 3.0
                },
                {
                    id: "right-granulator",
                    ugen: "flock.ugen.triggerGrains",
                    trigger: {
                        ugen: "flock.ugen.impulse",
                        rate: "control",
                        freq: {
                            id: "right-trate",
                            ugen: "flock.ugen.lfNoise",
                            rate: "control",
                            options: {
                                interpolation: "linear"
                            },
                            freq: 0.2,
                            mul: 10,
                            add: 40
                        }
                    },
                    buffer: {
                        id: "grainBuffer",
                        selector: ".fileSelector .fileBrowser"
                    },
                    centerPos: {
                        ugen: "flock.ugen.phasor",
                        rate: "control",
                        step: {
                            id: "right-posCrawl",
                            ugen: "flock.ugen.math",
                            source: {
                                ugen: "flock.ugen.sampleRate"
                            },
                            div: 0.4
                        },
                        start: 0.01,
                        end: 0.69,
                        reset: 0.01,
                        mul: {
                            ugen: "flock.ugen.bufferDuration",
                            rate: "constant",
                            buffer: "grainBuffer"
                        }
                    },
                    dur: 0.25,
                    amp: 0.1,
                    speed: 0.7,
                    mul: 3.0
                }
            ]
        });
        
        that.fileSelector = demo.fileSelectorView(that.synth, {
            playerId: ["left-granulator", "right-granulator"],
            selectors: {
                input: ".fileSelector .fileBrowser",
                button: ".fileSelector .browse",
                fileName: ".fileSelector .filePath"
            }
        });
        
        that.play = function () {
            that.synth.play();
        };
        
        that.pause = function () {
            that.clock.clearAll();
            that.synth.pause();
        };
        
        that.clock = flock.scheduler.async();
        return that;
    };
    
}());