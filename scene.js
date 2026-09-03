/* =====================================================================
   Oma Helga — Sommerstaub & Streusel (Three.js)
   Eine Aufgabe: Tiefe. Weiche Pastellpunkte, durch die die Kamera beim
   Scrollen gleitet (unendlicher Tunnel per modulo), leicht auf den Zeiger
   reagierend. Normales Blending auf hellem Grund, nie vor dem Text.
   Pausiert, wenn die Bühne geparkt oder der Tab unsichtbar ist. Wird unter
   prefers-reduced-motion und ohne WebGL nicht gestartet.
   ===================================================================== */
import * as THREE from './vendor/three.module.min.js';

const canvas = document.getElementById('stageStars');
const stage = document.getElementById('stage');
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (canvas && stage && !reduce) init();

function init() {
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: 'low-power' }); }
  catch (e) { canvas.remove(); return; }
  const DPR = Math.min(window.devicePixelRatio || 1, 1.5);
  renderer.setPixelRatio(DPR);
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 200);

  const isSmall = window.innerWidth < 900;
  const COUNT = isSmall ? 320 : 620;
  const DEPTH = 140;
  const pos = new Float32Array(COUNT * 3), col = new Float32Array(COUNT * 3), size = new Float32Array(COUNT), phase = new Float32Array(COUNT);
  const palette = [new THREE.Color('#f6c6d0'), new THREE.Color('#cfe8d2'), new THREE.Color('#f7cba4'), new THREE.Color('#bfd9e6'), new THREE.Color('#ffffff')];
  for (let i = 0; i < COUNT; i++) {
    const ang = Math.random() * Math.PI * 2;
    const rad = 8 + Math.pow(Math.random(), 0.7) * 44;
    pos[i * 3] = Math.cos(ang) * rad * 1.35;
    pos[i * 3 + 1] = Math.sin(ang) * rad;
    pos[i * 3 + 2] = -Math.random() * DEPTH;
    const c = palette[Math.floor(Math.random() * palette.length)];
    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    size[i] = 1.0 + Math.pow(Math.random(), 2.0) * 3.2;
    phase[i] = Math.random() * Math.PI * 2;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aColor', new THREE.BufferAttribute(col, 3));
  geo.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
  geo.setAttribute('aPhase', new THREE.BufferAttribute(phase, 1));

  const uniforms = { uTime: { value: 0 }, uTravel: { value: 0 }, uDepth: { value: DEPTH }, uPixelRatio: { value: DPR }, uFade: { value: 1 } };
  const mat = new THREE.ShaderMaterial({
    uniforms, transparent: true, depthWrite: false, depthTest: false, blending: THREE.NormalBlending,
    vertexShader: `
      attribute vec3 aColor; attribute float aSize; attribute float aPhase;
      uniform float uTime; uniform float uTravel; uniform float uDepth; uniform float uPixelRatio;
      varying vec3 vColor; varying float vTwinkle; varying float vDepthFade;
      void main(){
        vColor = aColor;
        vec3 p = position;
        p.z = mod(p.z + uTravel, uDepth) - uDepth + 4.0;
        p.y += sin(uTime * 0.2 + aPhase) * 0.8;
        p.x += cos(uTime * 0.15 + aPhase * 1.3) * 0.6;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        float tw = 0.7 + 0.3 * sin(uTime * 1.1 + aPhase * 3.0);
        vTwinkle = tw;
        float near = smoothstep(-2.0, -14.0, mv.z);
        float far = 1.0 - smoothstep(-uDepth * 0.5, -uDepth, mv.z);
        vDepthFade = near * far;
        gl_PointSize = aSize * uPixelRatio * (150.0 / -mv.z) * (0.85 + 0.15 * tw);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      uniform float uFade;
      varying vec3 vColor; varying float vTwinkle; varying float vDepthFade;
      void main(){
        vec2 c = gl_PointCoord - 0.5;
        float d = length(c);
        if (d > 0.5) discard;
        float soft = smoothstep(0.5, 0.18, d);
        float a = soft * vTwinkle * vDepthFade * uFade * 0.55;
        gl_FragColor = vec4(vColor, a);
      }`,
  });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  scene.add(points);

  const target = { rx: 0, ry: 0 }, cur = { rx: 0, ry: 0 };
  let running = false, visible = !document.hidden, parked = false, raf = 0;
  const clock = new THREE.Clock();
  function resize() { const w = canvas.clientWidth || window.innerWidth, h = canvas.clientHeight || window.innerHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
  resize();
  let pointerT = 0;
  function onPointer(e) { const now = performance.now(); if (now - pointerT < 32) return; pointerT = now; target.ry = ((e.clientX / window.innerWidth) * 2 - 1) * 0.045; target.rx = -((e.clientY / window.innerHeight) * 2 - 1) * 0.03; }
  function onLeave() { target.rx = 0; target.ry = 0; }
  function frame() {
    raf = 0; if (!running) return;
    const t = clock.getElapsedTime(); const nm = window.NM || {};
    uniforms.uTime.value = t;
    uniforms.uTravel.value = (nm.cinema || 0) * 70 + (nm.scroll || 0) * 20 + t * 0.9;
    uniforms.uFade.value = 1 - Math.min(1, Math.max(0, nm.dim || 0));
    cur.rx += (target.rx - cur.rx) * 0.06; cur.ry += (target.ry - cur.ry) * 0.06;
    camera.rotation.x = cur.rx; camera.rotation.y = cur.ry;
    renderer.render(scene, camera);
    raf = requestAnimationFrame(frame);
  }
  function update() { const should = visible && !parked; if (should && !running) { running = true; clock.start(); if (!raf) raf = requestAnimationFrame(frame); } else if (!should && running) { running = false; if (raf) { cancelAnimationFrame(raf); raf = 0; } } }
  window.addEventListener('resize', resize);
  window.addEventListener('pointermove', onPointer, { passive: true });
  window.addEventListener('blur', onLeave);
  document.addEventListener('mouseleave', onLeave);
  document.addEventListener('visibilitychange', () => { visible = !document.hidden; update(); });
  const mo = new MutationObserver(() => { parked = stage.classList.contains('is-parked'); update(); });
  mo.observe(stage, { attributes: true, attributeFilter: ['class'] });
  parked = stage.classList.contains('is-parked');
  update();
  canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); running = false; if (raf) cancelAnimationFrame(raf); raf = 0; }, false);
  canvas.addEventListener('webglcontextrestored', () => { update(); }, false);
  window.addEventListener('pagehide', () => { running = false; if (raf) cancelAnimationFrame(raf); mo.disconnect(); geo.dispose(); mat.dispose(); renderer.dispose(); }, { once: true });
}
