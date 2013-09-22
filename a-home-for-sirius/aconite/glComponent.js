(function () {
    "use strict";
    
    // TODO: Move this to aconite.
    fluid.registerNamespace("aconite");
    
    fluid.defaults("aconite.glComponent", {
        gradeNames: ["fluid.viewComponent", "autoInit"],
        
        listeners: {
            onCreate: [
                {
                    funcName: "aconite.glComponent.setupWebGL",
                    args: ["{that}", "{that}.dom.canvas"]
                },
                {
                    funcName: "aconite.loadShaders",
                    args: [
                        "{that}.gl", 
                        "{that}.options.shaders", 
                        "{that}.events.afterShadersLoaded.fire", 
                        "{that}.events.onError.fire"
                    ]
                }
            ],
            
            afterShadersLoaded: {
                funcName: "aconite.glComponent.setupShaders",
                args: ["{that}", "{arguments}.0"]
            }
        },
        
        events: {
            onGLReady: null,
            afterShadersLoaded: null,
            afterShaderProgramCompiled: null,
            onError: null
        },
        
        selectors: {
            canvas: ".aconite-glComponent-canvas"
        }
    });
    
    
    aconite.glComponent.setupWebGL = function (that, canvas) {
        // TODO: Move to member expander
        that.gl = aconite.setupWebGL(canvas[0]);
        that.events.onGLReady.fire(that.gl);
    };
    
    aconite.glComponent.setupShaders = function (that, shaders) {
        // TODO: Make member expander      
        that.shaderProgram = aconite.initShaders(that.gl, that.options.shaderVariables, shaders);
        that.events.afterShaderProgramCompiled.fire(that.shaderProgram);
    };
}());
