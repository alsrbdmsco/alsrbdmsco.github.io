/* Hero globe: the Earth just past dusk over Korea, the night side in the site's navy, amber traffic running into Seoul.
   Scrolling the hero away turns it toward Korea and brings it a little closer; dragging (or a flick) turns it and it eases back.
   On desktops and landscape tablets it stays behind the rest of the page, which slides over it. iPads stutter when that
   full-screen canvas redraws while the page scrolls, so on touch screens it does not zoom and holds still during a scroll. */
import * as THREE from 'three';

const box = document.querySelector('.viz'), canvas = box.querySelector('canvas'), hero = document.querySelector('.hero');
const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = t => t * t * (3 - 2 * t);
const V = (x, y, z) => new THREE.Vector3(x, y, z);

// phones and tablets (iPads in landscape too): 2K textures, no Korea close-up patch, fewer pixels
const touch = matchMedia('(pointer: coarse)').matches, small = innerWidth < 1024 || touch;
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, small ? 1.5 : 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
const camera = new THREE.PerspectiveCamera(30, 1, .05, 20);
const scene = new THREE.Scene();

const manager = new THREE.LoadingManager(() => { box.classList.add('ready'); dirty = true; });
const loader = new THREE.TextureLoader(manager), aniso = Math.min(4, renderer.capabilities.getMaxAnisotropy());
const tex = (file, srgb) => { const t = loader.load('/assets/tex/' + file); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = aniso; return t; };
const shader = (uniforms, frag, opts = {}) => new THREE.ShaderMaterial({ uniforms, ...opts,
  vertexShader: 'varying vec2 vUv; varying vec3 vN, vP; void main(){ vUv = uv; vN = normalize(mat3(modelMatrix) * normal); vec4 p = modelMatrix * vec4(position, 1.); vP = p.xyz; gl_Position = projectionMatrix * viewMatrix * p; }',
  fragmentShader: 'varying vec2 vUv; varying vec3 vN, vP;\n' + frag.replace(/}\s*$/, '#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}') });

const ll = (lat, lon, r = 1) => { const p = (lon + 180) / 180 * Math.PI, t = (90 - lat) / 180 * Math.PI; return V(-Math.cos(p) * Math.sin(t), Math.cos(t), Math.sin(p) * Math.sin(t)).multiplyScalar(r); };
const SEOUL = ll(37.57, 126.98), sun = ll(-6, 18);

// day/night/clouds: Solar System Scope (CC BY 4.0); Korea and Japan (117–142E, 28–45N): NASA Black Marble 2016
const k2 = small ? '_2k' : '';
scene.add(new THREE.Mesh(new THREE.SphereGeometry(1, small ? 96 : 160, small ? 48 : 80), shader(
  { day: { value: tex(`earth_day${k2}.jpg`, true) }, night: { value: tex(`earth_night${k2}.jpg`, true) }, brc: { value: tex('earth_brc.jpg') },
    kn: { value: small ? null : tex('korea_night.jpg', true) }, kr: { value: new THREE.Vector4(297 / 360, 118 / 180, 25 / 360, 17 / 180) },
    sun: { value: sun }, base: { value: new THREE.Color(0x1b2740) } }, `
  uniform sampler2D day, night, brc, kn; uniform vec4 kr; uniform vec3 sun, base;
  void main(){
    vec3 n = normalize(vN), v = normalize(cameraPosition - vP);
    float ndl = dot(n, sun), lit = smoothstep(-.1, .3, ndl);
    vec3 b = texture2D(brc, vUv).rgb;                 // r bump, g roughness, b clouds
    vec3 nl = texture2D(night, vUv).rgb; float km = 0.;
    #ifdef KOREA
    vec2 ku = (vUv - kr.xy) / kr.zw;
    km = smoothstep(0., .06, ku.x) * smoothstep(1., .94, ku.x) * smoothstep(0., .08, ku.y) * smoothstep(1., .92, ku.y);
    nl = mix(nl, texture2D(kn, clamp(ku, 0., 1.)).rgb * .85, km);
    #endif
    float cl = smoothstep(.2, .9, b.b) * (1. - km);
    vec3 col = texture2D(day, vUv).rgb * max(ndl, 0.) * 1.1;
    col = mix(col, vec3(1.) * max(ndl, 0.) * 1.05, cl * .9);
    col += base * (1. - lit);
    col += nl * vec3(1., .78, .5) * 2.4 * (1. - lit) * (1. - cl * .8);
    col += vec3(1., .92, .8) * pow(max(dot(n, normalize(sun + v)), 0.), 50.) * (1. - b.g) * (1. - cl) * lit * .5;
    col += vec3(.3, .55, 1.) * pow(1. - max(dot(n, v), 0.), 3.) * smoothstep(-.3, .5, ndl) * .8;
    gl_FragColor = vec4(col, 1.);
  }`, { defines: small ? {} : { KOREA: '' } })));
// atmosphere: a thin blue rim on the lit side (additive glow would vanish on cream)
scene.add(new THREE.Mesh(new THREE.SphereGeometry(1.018, 96, 48), shader({ sun: { value: sun } }, `
  uniform vec3 sun;
  void main(){
    vec3 n = normalize(vN), v = normalize(cameraPosition - vP);
    float a = pow(smoothstep(0., .18, -dot(n, v)), 1.5) * (.12 + smoothstep(-.35, .5, dot(n, sun)));
    gl_FragColor = vec4(vec3(.32, .52, .9), a * .9);
  }`, { side: THREE.BackSide, transparent: true, depthWrite: false })));

// light running along great-circle arcs from other regions into Seoul
const arcMat = new THREE.ShaderMaterial({
  uniforms: { time: { value: 0 } }, transparent: true, depthWrite: false,
  vertexShader: 'attribute float seed; varying float vU, vS; void main(){ vU = uv.x; vS = seed; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
  fragmentShader: `uniform float time; varying float vU, vS;
    void main(){ float d = fract(time * .16 + vS) * 1.3 - vU; float g = d > 0. ? exp(-d * 9.) : exp(d * 150.);
      gl_FragColor = vec4(mix(vec3(.72, .34, .04), vec3(1., .66, .2), clamp(g, 0., 1.)), clamp(.22 + g * 2.6, 0., 1.)); }`
});
[[35.68, 139.69], [1.35, 103.82], [22.32, 114.17], [34.05, -118.24], [19.08, 72.88], [50.11, 8.68], [-33.87, 151.21], [37.39, -122.08]].forEach(([la, lo], i) => {
  const a = ll(la, lo), q = new THREE.Quaternion().setFromUnitVectors(a, SEOUL), h = .02 + a.angleTo(SEOUL) * .12, pts = [];
  for (let k = 0; k <= 48; k++) pts.push(a.clone().applyQuaternion(new THREE.Quaternion().slerp(q, k / 48)).multiplyScalar(1 + h * Math.sin(Math.PI * k / 48)));
  const g = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 96, small ? .0034 : .0022, 6);
  g.setAttribute('seed', new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count).fill(i * .377 % 1), 1));
  scene.add(new THREE.Mesh(g, arcMat));
});

// camera: lat, lon, altitude (earth radii) from the top of the page to the hero leaving the screen; always looks at the centre.
// Desktop: the canvas is fixed to the window and the globe grows only so far, drifting right so it never sits under the copy,
// and the sections below slide over it.
// Below 1024px the canvas is a square under the copy, so the globe only turns (growing would cut it at the box edge).
const FROM = [22, 112, 4.2], TO = [33, 126, 2];
const drag = { lat: 0, lon: 0, vlat: 0, vlon: 0, plat: 0, plon: 0, on: false, x: 0, y: 0, idle: 0 };
const target = () => touch && innerWidth > 1023 ? 0 : smooth(clamp(scrollY / hero.offsetHeight));
let scrolled = 0;
addEventListener('scroll', () => { scrolled = performance.now(); }, { passive: true });
const view = { lat: 0, lon: 0, s: target() }; // drawn values, eased toward drag and scroll
let intro = still ? 0 : -75; // the globe turns into place on load
let W = 1, H = 1, wide = true;
function place() {
  const s = view.s;
  const lat = FROM[0] + (TO[0] - FROM[0]) * s + view.lat, lon = FROM[1] + (TO[1] - FROM[1]) * s + view.lon + intro;
  camera.position.copy(ll(clamp(lat, -60, 70), lon, 1 + FROM[2] * Math.pow(TO[2] / FROM[2], wide ? s : 0)));
  camera.lookAt(0, 0, 0);
  if (wide) camera.setViewOffset(W, H, -W * (.23 + .07 * s), 0, W, H); else camera.clearViewOffset();
}

const ray = new THREE.Raycaster(), ball = new THREE.Sphere(new THREE.Vector3(), 1), ndc = new THREE.Vector2();
function onGlobe(e) {
  const r = canvas.getBoundingClientRect();
  ndc.set((e.clientX - r.left) / r.width * 2 - 1, 1 - (e.clientY - r.top) / r.height * 2);
  ray.setFromCamera(ndc, camera);
  return ray.ray.intersectsSphere(ball);
}
canvas.addEventListener('pointerdown', e => {
  if (!onGlobe(e)) return;
  drag.on = true; drag.x = e.clientX; drag.y = e.clientY; canvas.setPointerCapture(e.pointerId);
  if (e.pointerType === 'mouse') canvas.style.cursor = 'grabbing';
});
canvas.addEventListener('pointermove', e => {
  if (!drag.on) { if (e.pointerType === 'mouse') canvas.style.cursor = onGlobe(e) ? 'grab' : ''; return; }
  const k = 60 / box.clientHeight;
  drag.lon -= (e.clientX - drag.x) * k;
  if (e.pointerType !== 'touch') drag.lat = clamp(drag.lat + (e.clientY - drag.y) * k, -40, 40);
  drag.x = e.clientX; drag.y = e.clientY; drag.idle = 0;
});
['pointerup', 'pointercancel'].forEach(t => canvas.addEventListener(t, e => {
  drag.on = false; if (e.pointerType === 'mouse') canvas.style.cursor = onGlobe(e) ? 'grab' : '';
}));

let visible = true, dirty = true;
new ResizeObserver(() => {
  W = box.clientWidth; H = box.clientHeight; wide = innerWidth > 1023;
  renderer.setSize(W, H, false); camera.aspect = W / H; camera.fov = wide ? 30 : 25;
  place(); renderer.render(scene, camera);
}).observe(box);
new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(box);

let last = performance.now();
renderer.setAnimationLoop(now => {
  const dt = Math.min(now - last, 50) / 1000; last = now;
  if (!visible || document.hidden) return;
  if (intro) { intro *= Math.exp(-dt * 1.6); if (intro > -.05) intro = 0; dirty = true; }
  if (drag.on) { // remember the swipe speed so a flick keeps turning after release
    const f = Math.min(1, dt * 20);
    drag.vlon += ((drag.lon - drag.plon) / dt - drag.vlon) * f; drag.vlat += ((drag.lat - drag.plat) / dt - drag.vlat) * f;
  } else if (Math.abs(drag.vlon) + Math.abs(drag.vlat) > 1) {
    drag.lon += drag.vlon * dt; drag.lat = clamp(drag.lat + drag.vlat * dt, -40, 40);
    const f = Math.exp(-dt * 3); drag.vlon *= f; drag.vlat *= f; drag.idle = 0;
  } else if ((drag.lat || drag.lon) && (drag.idle += dt) > 1.2) { // ease back so the scroll still lands on Korea
    const f = Math.exp(-dt * 2); drag.lat *= f; drag.lon *= f;
    if (Math.abs(drag.lat) + Math.abs(drag.lon) < .01) drag.lat = drag.lon = 0;
  }
  drag.plon = drag.lon; drag.plat = drag.lat;
  const e = 1 - Math.exp(-dt * 14), t = target();
  if (Math.abs(drag.lon - view.lon) + Math.abs(drag.lat - view.lat) + Math.abs(t - view.s) > 1e-4) {
    view.lon += (drag.lon - view.lon) * e; view.lat += (drag.lat - view.lat) * e; view.s += (t - view.s) * e; dirty = true;
  }
  const hold = touch && (now - scrolled < 300 || scrollY > hero.offsetHeight); // touch: no redraws while scrolling or once covered
  if (!still && !hold && (view.s < .99 || !wide)) { arcMat.uniforms.time.value = now / 1000; dirty = true; } // no redraws once the page covers it
  if (!dirty) return;
  place(); renderer.render(scene, camera); dirty = false;
});
