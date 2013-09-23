(function () {
    "use strict";
    
    fluid.registerNamespace("colin");
    
    fluid.defaults("colin.siriusHome", {
        gradeNames: ["fluid.viewComponent", "autoInit"],

        model: {
            frameCount: 0
        },
        
        components: {
            glManager: {
                type: "colin.siriusHome.glManager",
                container: "{that}.dom.stage"
            },
            
            clock: {
                type: "flock.scheduler.async"
            },
            
            sirius: {
                type: "colin.siriusHome.siriusLayer"
            },
            
            light: {
                type: "colin.siriusHome.lightLayer",
            }
        },
        
        invokers: {
            loadOtherSirius: {
                funcName: "colin.siriusHome.loadOtherSirius",
                args: ["{that}.sirius.source", "{that}.options.videoURLs.otherSirius"]
            }
        },
        
        events: {
            onVideosReady: {
                events: {
                    siriusLoaded: "{that}.sirius.source.events.onVideoLoaded",
                    lightLoaded: "{that}.light.source.events.onVideoLoaded"
                },
                args: ["{arguments}.siriusLoaded.0", "{arguments}.lightLoaded.0"]
            },
            onStart: null
        },
        
        listeners: {
            onVideosReady: {
                funcName: "colin.siriusHome.scheduleAnimation",
                args: [
                    "{glManager}",
                    "{siriusHome}.sirius",
                    "{siriusHome}.light",
                    "{siriusHome}.events.onStart"
                ]
            },
            
            onStart: {
                funcName: "{clock}.schedule",
                args: ["{that}.options.score"]
            }
        },
        
        selectors: {
            stage: ".stage"
        },
        
        videoURLs: {
            sirius: "videos/sirius-720p.m4v",
            otherSirius: "videos/sirius-chair.m4v",
            light: "videos/light-720p.m4v"
        },
        
        score: [
            {
                interval: "once",
                time: 52,
                change: "{that}.loadOtherSirius"
            }
        ]
    });
    
    fluid.defaults("colin.siriusHome.glManager", {
        gradeNames: ["aconite.glComponent", "autoInit"],
        
        shaders: {
            fragment: "shaders/fragmentShader.frag",
            vertex: "shaders/vertexShader.vert"
        },

        shaderVariables: {
            aVertexPosition: {
                storage: "attribute",
                type: "vertexAttribArray"
            },

            siriusSampler: {
                storage: "uniform"
            },

            lightSampler: {
                storage: "uniform"
            },

            threshold: {
                storage: "uniform"
            }
        },
        
        listeners: {
            afterShaderProgramCompiled: [
                {
                    funcName: "colin.siriusHome.makeStageVertex",
                    args: ["{glManager}.gl"]
                }
            ]
        }
    });
    
    fluid.defaults("colin.siriusHome.siriusLayer", {
        gradeNames: ["aconite.compositableVideo", "autoInit"],
        members: {
            gl: "{glManager}.gl"
        },
        
        components: {
            source: {
                options: {
                    url: "{siriusHome}.options.videoURLs.sirius"
                }
            }
        },
        
        bindToTextureUnit: "TEXTURE0"
    });
    
    fluid.defaults("colin.siriusHome.lightLayer", {
        gradeNames: ["aconite.compositableVideo", "autoInit"],
        
        members: {
            gl: "{glManager}.gl"
        },
        
        components: {
            source: {
                options: {
                    url: "{siriusHome}.options.videoURLs.light"
                }
            }
        },
        
        bindToTextureUnit: "TEXTURE1"
    });
    
    // TODO: Refactor this.
    colin.siriusHome.loadOtherSirius = function (source, url) {
        source.setURL(url);
    };
    
    colin.siriusHome.makeStageVertex = function (gl) {
        // Initialize to black
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL); 
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        aconite.makeSquareVertexBuffer(gl);  
    };
    
    colin.siriusHome.drawFrame = function (glManager, sirius, light) {
        var gl = glManager.gl;
                        
        sirius.refresh();
        light.refresh();
        
        gl.drawArrays(gl.TRIANGLES, 0, 6);
    };
    
    // TODO: Componentize.
    colin.siriusHome.scheduleAnimation = function (glManager, sirius, light, onStart) {
        // TODO: Refactor
        var gl = glManager.gl,
            shaderProgram = glManager.shaderProgram;

        // TODO: Modelize all these variables.
        
        // Setup the texture samplers for each video.
        gl.uniform1i(shaderProgram.siriusSampler, 0);
        gl.uniform1i(shaderProgram.lightSampler, 1);
        
        // Set the threshold.
        gl.uniform1f(shaderProgram.threshold, 0.01);
        
        // TODO: Move this into aconite's square vertex function.
        gl.vertexAttribPointer(shaderProgram.aVertexPosition, 2, gl.FLOAT, false, 0, 0); 
        
        // TODO: Hold onto a reference to the animator.
        var animator = aconite.animator(function () {
            colin.siriusHome.drawFrame(glManager, sirius, light);
        });
        
        onStart.fire();
    };
    
}());
