precision highp float;

uniform sampler2D siriusSampler;
uniform sampler2D lightSampler;
uniform float threshold;

void main(void) {
    
    vec2 coords = vec2(gl_FragCoord.x / 1280.0, gl_FragCoord.y / 720.0);
    vec4 siriusFrag = texture2D(siriusSampler, coords);
    
    // Y = 0.2126 R + 0.7152 G + 0.0722 B, assuming colours are linear here.
    float luminance = siriusFrag.r * 0.2126 + siriusFrag.g * 0.7152 + siriusFrag.b * 0.0722;
    
    if (luminance > threshold) {
        gl_FragColor = siriusFrag;
    } else if (luminance * 1.5 > threshold) {
        vec4 lightFrag = texture2D(lightSampler, coords);
        gl_FragColor = lightFrag * siriusFrag;
    } else {
        vec4 lightFrag = texture2D(lightSampler, coords);
        vec4 combined = vec4(
            siriusFrag.r + (lightFrag.r - luminance),
            siriusFrag.g + (lightFrag.g - luminance),
            siriusFrag.b + (lightFrag.b - luminance),
            lightFrag.a
        );
        //vec4 combined = lightFrag * siriusFrag;
        gl_FragColor = combined;
    }
}
