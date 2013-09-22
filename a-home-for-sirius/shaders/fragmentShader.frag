precision highp float;

uniform sampler2D siriusSampler;
uniform sampler2D lightSampler;
uniform float threshold;

void main(void) {
    vec2 coords = vec2(gl_FragCoord.x / 1280.0, gl_FragCoord.y / 720.0);
    vec4 siriusFrag = texture2D(siriusSampler, coords);
    float colourAvg = (siriusFrag.r + siriusFrag.g + siriusFrag.b) / 3.0;
    
    if (colourAvg < threshold) {
        vec4 lightFrag = texture2D(lightSampler, coords);
        gl_FragColor = vec4(
            siriusFrag.r + (lightFrag.r - colourAvg), 
            siriusFrag.g + (lightFrag.g - colourAvg),
            siriusFrag.b + (lightFrag.b - colourAv),
            lightFrag.a
        );
    } else {
        gl_FragColor = siriusFrag;
    }    
}
