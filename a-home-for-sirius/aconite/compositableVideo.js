(function () {
    "use strict";
    
    fluid.registerNamespace("aconite");
    
    fluid.defaults("aconite.compositableVideo", {
        gradeNames: ["fluid.eventedComponent", "autoInit"],
        
        members: {
            video: {
                expander: {
                    funcName: "aconite.compositableVideo.setupVideo",
                    args: ["{that}"]
                }
            }
        },
        
        events: {
            onVideoLoaded: null,
            onTextureReady: null
        },
        
        listeners: {
            onVideoLoaded: {
                funcName: "aconite.compositableVideo.setupTexture",
                args: ["{that}"]
            }
        },
        
        url: null,
        
        templates: {
            video: "<video src='%url' autoplay='true' muted='true'/>"
        } 
    });
    
    aconite.compositableVideo.setupVideo = function (that) {
        var videoHTML = fluid.stringTemplate(that.options.templates.video, {
            url: that.options.url
        });
        var video = $(videoHTML);
        
        video.bind("canplay", function () {
            that.events.onVideoLoaded.fire(that);
        });
        
        return video[0];
    };
    

    aconite.compositableVideo.setupTexture = function (that) {
        // TODO: Figure out why this doesn't work as a member expander.
        var gl = that.gl,
            texture = gl.createTexture();
        
        gl.bindTexture(gl.TEXTURE_2D, texture);
        
        //these properties let you upload textures of any size
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        //these determine how interpolation is made if the image is being scaled up or down
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        
        gl.bindTexture(gl.TEXTURE_2D, null);
        
        that.texture = texture;
        that.events.onTextureReady.fire(texture);
        
        return texture;
    };
}());
