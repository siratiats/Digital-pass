/* Digital Pass HQ as an architectural model on a plinth: the tower, wing, forecourt and the nearest streets, trimmed to
   a white base with the logo on its front. The camera orbits around it; lights and shadows stay fixed, so the shadow map
   is drawn once and each frame is a single cheap render. */
import { THREE, setAniso, setTexScale, releaseCanvas, setLang, redrawText, loadBrand, logoGeometry, symbolGeometry, makeSky } from './core.js';
import { buildSite } from './site.js';

const SKY = [[-90, '#d6dadd'], [-2, '#e4e7ea'], [0, '#f2f5f8'], [5, '#e9f0f7'], [15, '#d6e5f3'], [35, '#bcd5ef'], [65, '#a3c4ea'], [90, '#97bce7']];
export const PLOT = { x0: -60, x1: 44, z0: -42, z1: 62 };   // tower, wing, forecourt and a row of trees
const tick = () => new Promise((r) => setTimeout(r, 0));

export async function createModel({ canvas, mobile, width, height, dpr, lang = 'ar', onStep = () => {} }) {
  onStep('renderer');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance', stencil: false });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(dpr); renderer.setSize(width, height, false);
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 0.62;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = mobile ? THREE.PCFShadowMap : THREE.PCFSoftShadowMap; renderer.shadowMap.autoUpdate = false;
  setAniso(Math.min(8, renderer.capabilities.getMaxAnisotropy()));
  setTexScale(mobile ? 0.75 : 1);
  setLang(lang);
  if (document.fonts) await Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1200))]);

  const scene = new THREE.Scene();
  onStep('sky');
  // the sky only lights the model (reflections in the glass); the page's own background shows behind it
  const sun = await makeSky(scene, renderer, { stops: SKY, W: mobile ? 1024 : 2048 });
  const sky = scene.background; scene.background = null; if (sky) { sky.dispose(); if (sky.image) { sky.image.width = 1; sky.image.height = 1; } }

  const cx = (PLOT.x0 + PLOT.x1) / 2, cz = (PLOT.z0 + PLOT.z1) / 2, half = Math.max(PLOT.x1 - PLOT.x0, PLOT.z1 - PLOT.z0) / 2 + 12;
  const light = new THREE.DirectionalLight(0xfff1de, 4.4), aim = new THREE.Vector3(cx, 0, cz);
  light.position.copy(sun).multiplyScalar(500).add(aim); light.target.position.copy(aim);
  light.castShadow = true;
  Object.assign(light.shadow.camera, { left: -half * 1.25, right: half * 1.25, top: half * 1.25, bottom: -half * 1.25, near: 1, far: 1400 });
  light.shadow.camera.updateProjectionMatrix();
  const ms = Math.min(mobile ? 1536 : 2048, renderer.capabilities.maxTextureSize);
  light.shadow.mapSize.set(ms, ms); light.shadow.bias = -0.0003; light.shadow.normalBias = 0.5;
  scene.add(light, light.target, new THREE.HemisphereLight(0xeef4ff, 0xd8d4cc, 0.45));
  await tick();

  onStep('brand');
  const brand = await loadBrand();
  const brandGeo = { logoDark: logoGeometry(brand, { cap: 1, depth: 0.16 }) }; await tick();
  brandGeo.logoLight = logoGeometry(brand, { cap: 1, depth: 0.12, light: true }); brandGeo.symbol = symbolGeometry(brand, { height: 1, depth: 0.045 });
  await tick();
  onStep('site');
  const site = await buildSite({ brandGeo, windowSize: mobile ? 1024 : 2048, plot: PLOT });
  scene.add(site.group);
  await tick();

  const camera = new THREE.PerspectiveCamera(30, width / height, 5, 4000);
  const target = new THREE.Vector3(cx + 2, 40, cz - 4), R = Math.hypot(PLOT.x1 - PLOT.x0, PLOT.z1 - PLOT.z0) / 2;
  onStep('compile');
  if (renderer.compileAsync) await renderer.compileAsync(scene, camera); else renderer.compile(scene, camera);
  onStep('textures');
  const textures = new Set();
  scene.traverse((m) => { for (const mat of [].concat(m.material || [])) for (const k of ['map', 'emissiveMap']) if (mat[k]) textures.add(mat[k]); });
  let n = 0; for (const tex of textures) { renderer.initTexture(tex); releaseCanvas(tex); if (++n % 3 === 0) await tick(); }
  renderer.shadowMap.needsUpdate = true;
  onStep('ready');

  let w = width, h = height, first = true;
  /* az: angle around the model (0 = looking at the entrance side), polar: angle from straight above */
  function render(az, polar, zoom = 1) {
    camera.aspect = w / h;
    const vf = THREE.MathUtils.degToRad(camera.fov), hf = 2 * Math.atan(Math.tan(vf / 2) * camera.aspect);
    const d = (R * (camera.aspect > 1.2 ? 1.08 : 0.98)) / Math.sin(Math.min(vf, hf) / 2) * zoom;   // plinth and antenna stay in view at any angle
    camera.position.set(target.x + d * Math.sin(polar) * Math.sin(az), target.y + d * Math.cos(polar), target.z + d * Math.sin(polar) * Math.cos(az));
    camera.lookAt(target);
    camera.near = Math.max(5, d - R * 2.2); camera.far = d + R * 2.5;
    camera.updateProjectionMatrix();
    if (first) onStep('first render');
    renderer.render(scene, camera);
    if (first) { first = false; onStep('first render done'); }
  }
  return {
    renderer, scene, render,
    resize(nw, nh, d) { w = nw; h = nh; renderer.setPixelRatio(d); renderer.setSize(nw, nh, false); },
    setLang(l) { setLang(l); redrawText(); }
  };
}
