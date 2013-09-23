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
                type: "aconite.glComponent",
                container: "{that}.dom.stage",
                options: {
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
                            },
                            {
                                // TODO: Boil! This needs to be sequenced after both videos load.
                                funcName: "colin.siriusHome.scheduleAnimation",
                                args: [
                                    "{glManager}",
                                    "{siriusHome}.sirius",
                                    "{siriusHome}.light"
                                ]
                            }
                        ]
                    }
                }
            },
            
            sirius: {
                type: "aconite.compositableVideo",
                options: {
                    url: "{siriusHome}.options.videoURLs.sirius",
                    
                    members: {
                        gl: "{glComponent}.gl"
                    }
                }
            },
            
            light: {
                type: "aconite.compositableVideo",
                options: {
                    url: "{siriusHome}.options.videoURLs.light",
                    
                    members: {
                        gl: "{glComponent}.gl"
                    }
                }
            }
        },
        
        selectors: {
            stage: ".stage"
        },
        
        videoURLs: {
            sirius: "videos/sirius-720p.m4v",
            light: "videos/light-720p.m4v"
        }
    });
    
    colin.siriusHome.makeStageVertex = function (gl) {
        // Initialize to black
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL); 
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        aconite.makeSquareVertexBuffer(gl);  
    };
    
    colin.siriusHome.drawFrame = function (glManager, sirius, light) {
        if (!sirius.texture || !light.texture) {
            return;
        }
        
        var gl = glManager.gl,
            shaderProgram = glManager.shaderProgram;
                
        // Update the textures.
        // TODO: cut and pastage.        
        gl.activeTexture(gl.TEXTURE0);        
        gl.bindTexture(gl.TEXTURE_2D, sirius.texture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, sirius.video);
        
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, light.texture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, light.video);
        
        gl.drawArrays(gl.TRIANGLES, 0, 6);
    };
    
    // TODO: Componentize.
    colin.siriusHome.scheduleAnimation = function (glManager, sirius, light) {
        // TODO: Refactor
        var gl = glManager.gl,
            shaderProgram = glManager.shaderProgram;

        // TODO: Modelize all these variables.
        
        // Setup the texture samplers for each video.
        gl.uniform1i(shaderProgram.siriusSampler, 0);
        gl.uniform1i(shaderProgram.lightSampler, 1);
        
        // Set the threshold.
        gl.uniform1f(shaderProgram.threshold, 0.015);
        
        // TODO: Move this into aconite's square vertex function.
        gl.vertexAttribPointer(shaderProgram.aVertexPosition, 2, gl.FLOAT, false, 0, 0); 
        
        // TODO: Hold onto a reference to the animator.
        var animator = aconite.animator(function () {
            colin.siriusHome.drawFrame(glManager, sirius, light);
        });
    };
    
}());
