// ============================================================
// DarkVeil — WebGL animated background
// Installed via: npx shadcn@latest add @react-bits/DarkVeil-TS-TW
// Manual implementation matching the exact prop interface
// Props: hueShift, noiseIntensity, scanlineIntensity, speed,
//        scanlineFrequency, warpAmount, resolutionScale
// ============================================================
import { useEffect, useRef } from 'react';

interface DarkVeilProps {
  hueShift?: number;
  noiseIntensity?: number;
  scanlineIntensity?: number;
  speed?: number;
  scanlineFrequency?: number;
  warpAmount?: number;
  resolutionScale?: number;
}

const VERT_SRC = `
  attribute vec2 a_position;
  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

const FRAG_SRC = `
  precision mediump float;
  uniform float u_time;
  uniform vec2  u_resolution;
  uniform float u_hueShift;
  uniform float u_noise;
  uniform float u_scanline;
  uniform float u_scanFreq;
  uniform float u_warp;

  // Pseudo-random number
  float rand(vec2 co) {
    return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
  }

  // 2D smooth noise
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = rand(i);
    float b = rand(i + vec2(1.0, 0.0));
    float c = rand(i + vec2(0.0, 1.0));
    float d = rand(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  // HSL to RGB conversion
  vec3 hsl2rgb(vec3 c) {
    vec3 rgb = clamp(abs(mod(c.x * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
    return c.z + c.y * (rgb - 0.5) * (1.0 - abs(2.0 * c.z - 1.0));
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution;

    // Warp UV with noise
    float warpX = noise(uv * 3.0 + u_time * 0.3) - 0.5;
    float warpY = noise(uv * 3.0 + u_time * 0.3 + 5.0) - 0.5;
    vec2 warpedUV = uv + vec2(warpX, warpY) * u_warp * 0.05;

    // Base dark colour with subtle hue
    float hue = u_hueShift / 360.0 + noise(warpedUV * 2.0 + u_time * 0.1) * 0.04;
    float sat = 0.15 + u_noise * 0.1;
    float lum = 0.04 + noise(warpedUV * 5.0 + u_time * 0.2) * 0.03;
    vec3 colour = hsl2rgb(vec3(hue, sat, lum));

    // Screen noise
    float grainT = floor(u_time * 10.0);
    colour += (rand(uv + grainT) - 0.5) * u_noise * 0.06;

    // Scanlines
    float scanline = sin(gl_FragCoord.y * u_scanFreq) * 0.5 + 0.5;
    colour -= scanline * u_scanline * 0.08;

    gl_FragColor = vec4(clamp(colour, 0.0, 1.0), 1.0);
  }
`;

function createShader(gl: WebGLRenderingContext, type: number, src: string): WebGLShader {
  const shader = gl.createShader(type)!;
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  return shader;
}

function createProgram(gl: WebGLRenderingContext): WebGLProgram {
  const prog = gl.createProgram()!;
  gl.attachShader(prog, createShader(gl, gl.VERTEX_SHADER, VERT_SRC));
  gl.attachShader(prog, createShader(gl, gl.FRAGMENT_SHADER, FRAG_SRC));
  gl.linkProgram(prog);
  return prog;
}

const DarkVeil: React.FC<DarkVeilProps> = ({
  hueShift = 0,
  noiseIntensity = 0.5,
  scanlineIntensity = 0.3,
  speed = 0.5,
  scanlineFrequency = 60,
  warpAmount = 0.5,
  resolutionScale = 1,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext('webgl');
    if (!gl) return;

    const prog = createProgram(gl);
    gl.useProgram(prog);

    // Full-screen quad
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW
    );
    const aPos = gl.getAttribLocation(prog, 'a_position');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(prog, 'u_time');
    const uRes = gl.getUniformLocation(prog, 'u_resolution');
    const uHue = gl.getUniformLocation(prog, 'u_hueShift');
    const uNoise = gl.getUniformLocation(prog, 'u_noise');
    const uScan = gl.getUniformLocation(prog, 'u_scanline');
    const uScanFreq = gl.getUniformLocation(prog, 'u_scanFreq');
    const uWarp = gl.getUniformLocation(prog, 'u_warp');

    const startTime = performance.now();
    let animId: number;

    const render = () => {
      const w = Math.floor(canvas.offsetWidth * resolutionScale);
      const h = Math.floor(canvas.offsetHeight * resolutionScale);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }

      const t = ((performance.now() - startTime) / 1000) * speed;
      gl.uniform1f(uTime, t);
      gl.uniform2f(uRes, w, h);
      gl.uniform1f(uHue, hueShift);
      gl.uniform1f(uNoise, noiseIntensity);
      gl.uniform1f(uScan, scanlineIntensity);
      gl.uniform1f(uScanFreq, scanlineFrequency);
      gl.uniform1f(uWarp, warpAmount);

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    rafRef.current = animId;

    return () => cancelAnimationFrame(animId);
  }, [hueShift, noiseIntensity, scanlineIntensity, speed, scanlineFrequency, warpAmount, resolutionScale]);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }}
      aria-hidden="true"
    />
  );
};

export default DarkVeil;
