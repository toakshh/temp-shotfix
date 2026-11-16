// The cyclorama: a full-screen light wall behind the page. One number, the phase, runs it from
// blackout (0) through cobalt rise, rose gather and dawn bloom to white day (1). Sections ask for a
// phase; the wall fades to it over a fixed time, the way a lighting desk crossfades between cues.

// phase, top of the wall, middle, horizon light, floor, horizon height (fraction from the bottom), bloom
const STOPS = [
  [0.0, '#030306', '#05060d', '#0b1238', '#020203', 0.17, 0.25],
  [0.18, '#03040c', '#060f45', '#0a33ff', '#02030b', 0.2, 1.0],
  [0.42, '#0a1260', '#4527b8', '#ff6aae', '#1b0b2c', 0.27, 1.0],
  [0.62, '#b9a6f0', '#ff9fcf', '#ffe1ec', '#f4a3c4', 0.33, 0.85],
  [0.82, '#efeaff', '#fde7f1', '#ffffff', '#ffd6e4', 0.37, 0.55],
  [1.0, '#fbfaff', '#fdf6fa', '#ffffff', '#fbecf2', 0.4, 0.3],
];

// colour maths in OKLab so cobalt to rose passes through violet, not grey
const toLin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const toSrgb = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);
const hexToLab = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => toLin(v / 255));
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s];
};
const labToRgb = ([L, a, b]) => {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s].map((v) => Math.min(1, Math.max(0, toSrgb(v))));
};
const LAB = STOPS.map(([p, t, m, g, f, h, b]) => [p, hexToLab(t), hexToLab(m), hexToLab(g), hexToLab(f), h, b]);
const mixLab = (a, b, k) => a.map((v, i) => v + (b[i] - v) * k);

export function palette(phase) {
  const p = Math.min(1, Math.max(0, phase));
  let i = 0;
  while (i < LAB.length - 2 && p > LAB[i + 1][0]) i++;
  const A = LAB[i], B = LAB[i + 1];
  const k = (p - A[0]) / (B[0] - A[0]);
  const e = k * k * (3 - 2 * k);
  return {
    top: labToRgb(mixLab(A[1], B[1], e)),
    mid: labToRgb(mixLab(A[2], B[2], e)),
    glow: labToRgb(mixLab(A[3], B[3], e)),
    floor: labToRgb(mixLab(A[4], B[4], e)),
    horizon: A[5] + (B[5] - A[5]) * e,
    bloom: A[6] + (B[6] - A[6]) * e,
  };
}

const VERT = 'attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }';
const FRAG = `
precision highp float;
uniform vec2 uRes;
uniform float uTime, uHorizon, uBloom, uDim, uSpot, uHaze;
uniform vec3 uTop, uMid, uGlow, uFloor;
float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float noise(vec2 p){ vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y); }
float fbm(vec2 p){ float v = 0.0, a = 0.5; for (int i = 0; i < 4; i++) { v += a * noise(p); p *= 2.03; a *= 0.5; } return v; }
void main(){
  vec2 uv = gl_FragCoord.xy / uRes;
  float h = uHorizon, y = uv.y;
  float up = clamp((y - h) / (1.0 - h), 0.0, 1.0);
  vec3 sky = mix(uGlow, uMid, smoothstep(0.0, 0.45, up));
  sky = mix(sky, uTop, smoothstep(0.35, 1.0, up));
  float down = clamp((h - y) / max(h, 0.001), 0.0, 1.0);
  vec3 flo = mix(mix(uGlow, uFloor, 0.55), uFloor, smoothstep(0.0, 0.5, down));
  vec3 col = mix(flo, sky, smoothstep(-0.004, 0.004, y - h));
  float d = abs(y - h);
  float spot = exp(-pow((uv.x - uSpot) * 1.35, 2.0));
  col += uGlow * uBloom * (0.5 * exp(-d * 90.0) + 0.32 * exp(-d * 9.0)) * mix(0.5, 1.0, spot);
  vec2 q = vec2(uv.x * (uRes.x / uRes.y) * 1.6, uv.y * 2.4);
  float n = fbm(q + vec2(uTime * 0.018, -uTime * 0.006));
  col += (n - 0.5) * uHaze * (0.3 + uBloom) * smoothstep(0.0, 0.6, 1.0 - d * 1.4);
  float lum = dot(uTop, vec3(0.299, 0.587, 0.114));
  vec2 c = uv - 0.5;
  col *= mix(1.0 - dot(c, c) * 0.6, 1.0, smoothstep(0.3, 0.8, lum));
  col *= uDim;
  col += (hash(gl_FragCoord.xy + fract(uTime) * 61.0) - 0.5) * (1.5 / 255.0);
  gl_FragColor = vec4(col, 1.0);
}`;

export function createCyc(canvas, { reduced = false } = {}) {
  const state = { phase: 0, target: 0, dim: 0, spot: 0.62, spotTarget: 0.62, fade: 0.9, running: true };
  const fallback = document.querySelector('.cyc-fallback');
  const css = (rgb) => `rgb(${rgb.map((v) => Math.round(v * 255)).join(' ')})`;
  const paintFallback = () => {
    const pal = palette(state.phase);
    fallback.style.setProperty('--top', css(pal.top));
    fallback.style.setProperty('--mid', css(pal.mid));
    fallback.style.setProperty('--glow', css(pal.glow));
    fallback.style.setProperty('--floor', css(pal.floor));
    fallback.style.opacity = String(state.dim);
  };

  const gl = canvas.getContext('webgl', { antialias: false, alpha: false, depth: false, powerPreference: 'low-power', preserveDrawingBuffer: false });
  let uni = null;
  if (gl) {
    const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null; };
    const vs = sh(gl.VERTEX_SHADER, VERT), fs = sh(gl.FRAGMENT_SHADER, FRAG);
    const prog = vs && fs && gl.createProgram();
    if (prog) {
      gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
      if (gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        gl.useProgram(prog);
        const buf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
        const loc = gl.getAttribLocation(prog, 'p');
        gl.enableVertexAttribArray(loc);
        gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
        uni = Object.fromEntries(['uRes', 'uTime', 'uHorizon', 'uBloom', 'uDim', 'uSpot', 'uHaze', 'uTop', 'uMid', 'uGlow', 'uFloor'].map((n) => [n, gl.getUniformLocation(prog, n)]));
      }
    }
  }
  if (!uni) document.documentElement.classList.add('no-webgl');

  // half resolution is plenty for a soft light wall, and keeps it cheap on phones
  const resize = () => {
    if (!uni) return;
    const scale = Math.min(window.devicePixelRatio || 1, 2) * 0.5;
    canvas.width = Math.max(2, Math.round(innerWidth * scale));
    canvas.height = Math.max(2, Math.round(innerHeight * scale));
    gl.viewport(0, 0, canvas.width, canvas.height);
  };
  resize();
  addEventListener('resize', resize);
  if (!reduced) addEventListener('pointermove', (e) => { state.spotTarget = 0.35 + (e.clientX / innerWidth) * 0.4; }, { passive: true });

  let last = performance.now();
  let raf = 0;
  const t0 = last;
  const draw = (now) => {
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    const k = reduced ? 1 : 1 - Math.exp(-dt / (state.fade / 3));
    state.phase += (state.target - state.phase) * k;
    state.spot += (state.spotTarget - state.spot) * (1 - Math.exp(-dt / 1.2));
    if (uni) {
      const pal = palette(state.phase);
      gl.uniform2f(uni.uRes, canvas.width, canvas.height);
      gl.uniform1f(uni.uTime, reduced ? 0 : (now - t0) / 1000);
      gl.uniform1f(uni.uHorizon, pal.horizon);
      gl.uniform1f(uni.uBloom, pal.bloom);
      gl.uniform1f(uni.uDim, state.dim);
      gl.uniform1f(uni.uSpot, state.spot);
      gl.uniform1f(uni.uHaze, reduced ? 0 : 0.06);
      gl.uniform3fv(uni.uTop, pal.top);
      gl.uniform3fv(uni.uMid, pal.mid);
      gl.uniform3fv(uni.uGlow, pal.glow);
      gl.uniform3fv(uni.uFloor, pal.floor);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    } else paintFallback();
    const settled = Math.abs(state.target - state.phase) < 0.0005;
    // with motion reduced there is no drifting haze, so only draw while the light is still moving
    if (state.running && (!reduced || !settled)) raf = requestAnimationFrame(draw);
    else raf = 0;
  };
  const wake = () => { if (!raf && state.running) { last = performance.now(); raf = requestAnimationFrame(draw); } };
  document.addEventListener('visibilitychange', () => {
    state.running = !document.hidden;
    if (state.running) wake(); else { cancelAnimationFrame(raf); raf = 0; }
  });
  wake();

  return {
    state,
    set(phase, fade) { state.target = phase; if (fade) state.fade = fade; wake(); },
    jump(phase) { state.phase = state.target = phase; wake(); },
    dim(v) { state.dim = v; wake(); },
  };
}
