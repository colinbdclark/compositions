(function () {
    "use strict";

    fluid.registerNamespace("aconite");
    
    aconite.setupWebGL = function (canvas, options) {
        function signalError (msg) {
            var str = window.WebGLRenderingContext ? OTHER_PROBLEM : GET_A_WEBGL_BROWSER;
            str += "\nError: " + msg;
            throw new Error(str);
        };
    
        canvas.addEventListener("webglcontextcreationerror", function (e) {
            signalError(e.statusMessage);
        }, false);

        var gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");

        if (!gl) {
            if (!window.WebGLRenderingContext) {
                signalError("");
            }
        }
        
        return gl;
    };
    
    aconite.textToShader = function (gl, text, type) {
        var shader;
        
        if (type === "fragment") {
            shader = gl.createShader(gl.FRAGMENT_SHADER);
        } else if (type === "vertex") {
            shader = gl.createShader(gl.VERTEX_SHADER);
        } else {
            throw new Error("Unrecognised shader type: " + type);
        }

        gl.shaderSource(shader, text);
        gl.compileShader(shader);
        
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            throw new Error("Error compiling " + type + " shader: " + gl.getShaderInfoLog(shader));
        }
        
        return shader;
    };
    
    aconite.loadShaders = function (gl, shaderSpecs, success, error) {
        var deferreds = [],
            shaders = {};
            
        var handleError = function (error, callback) {
            if (callback) {
                callback(error.message);
            } else {
                throw error;
            }
        };
        
        fluid.each(shaderSpecs, function (file, key) {
            deferreds.push($.ajax({
                type: "GET",
                dataType: "text",
                url: file,
                success: function(data) {
                    try {
                        shaders[key] = aconite.textToShader(gl, data, key);
                    } catch (e) {
                        handleError(e, error);
                    }
                },
                
                error: function(jqXHR, textStatus, errorThrown) {
                    handleError(new Error(textStatus + " " + errorThrown), error);
                }
            }));
        });

        $.when.apply($, deferreds).then(function() {
            success(shaders);
        });
    };
    
    aconite.getUniformLocation = function (gl, shaderProgram, variable) {
        var location = gl.getUniformLocation(shaderProgram, variable);
        shaderProgram[variable] = location;  
    };
    
    aconite.initShaders = function (gl, variables, shaders) {
        var shaderProgram = gl.createProgram();
        gl.attachShader(shaderProgram, shaders.vertex);
        gl.attachShader(shaderProgram, shaders.fragment);
        gl.linkProgram(shaderProgram);

        if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
            throw new Error("Could not link shaders: " + gl.getProgramInfoLog(shaderProgram) + 
                " code " + gl.getError());
        }
        gl.useProgram(shaderProgram);
        
        fluid.each(variables, function (info, variable) {
            if (typeof(info) === "string") {
                info = {
                    storage: info
                };
            }
            
            if (info.storage === "uniform") {
                if (info.struct) {
                    var struct = fluid.getGlobalValue(info.struct);
                    for (var i = 0; i < info.count; ++i) {
                        for (var key in struct) {
                            var fullvar = variable + "[" + i + "]." + key;
                            aconite.getUniformLocation(gl, shaderProgram, fullvar);
                        }
                    } 
                } else {
                    aconite.getUniformLocation(gl, shaderProgram, variable);
                }
            } else if (info.storage === "attribute") {
                var pos = gl.getAttribLocation(shaderProgram, variable);
                if (info.type === "vertexAttribArray") {
                    gl.enableVertexAttribArray(pos);
                } else {
                    throw new Error("Unrecognised attribute type " + info.type);
                }
                shaderProgram[variable] = pos;
            }
            else {
                throw new Error("Unrecognised variable storage type " + info.storage);
            }
        });
        
        return shaderProgram;
    };
    
    aconite.makeSquareVertexBuffer = function(gl) {   
        var info = {
            vertices: new Float32Array([
                -1, 1,   1,  1,   1, -1,  // Triangle 1
                -1, 1,   1, -1,  -1, -1   // Triangle 2
            ]),
            size: 2        
        };
        
        info.count = info.vertices.length / info.vertexSize;
        info.buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, info.buffer);
        gl.bufferData(gl.ARRAY_BUFFER, info.vertices, gl.STATIC_DRAW);
        
        return info;
    };
    
    aconite.animator = function (callback) {
        var raf = window.requestAnimationFrame || window.webkitRequestAnimationFrame;
             
        var that = {
            cancelled: false
        };
        
        that.ticker = function () {
            if (!that.cancelled) {
                callback();
                raf(that.ticker);
            };
        };
        
        that.cancel = function () {
            that.cancelled = true;
        };
        
        that.ticker();
        return that;    
    };
    
}());
