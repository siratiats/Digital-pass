/* Digital Pass HQ in its campus (the same ground as the tour: streets, trees, low buildings, hills), with no edges:
   the land fades into the page colour with distance and the canvas is transparent, so the scene sits inside the page.
   The camera orbits the tower; lights and shadows stay fixed, so the shadow map is drawn once. */
import { THREE, setAniso, setTexScale, releaseCanvas, setLang, redrawText, loadBrand, logoGeometry, symbolGeometry, makeSky } from './core.js';
import { buildSite } from './site.js';

const SKY = [[-90, '#d6dadd'], [-2, '#e4e7ea'], [0, '#f2f5f8'], [5, '#e9f0f7'], [15, '#d6e5f3'], [35, '#bcd5ef'], [65, '#a3c4ea'], [90, '#97bce7']];
const tick = () => new Promise((r) => setTimeout(r, 0));

export async function createModel({ canvas, mobile, width, height, dpr, lang = 'ar', fog = 0xffffff, onStep = () => {} }) {
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

  scene.fog = new THREE.Fog(fog, 380, 1250);                                       // distance melts into the page
  const half = mobile ? 150 : 190;
  const light = new THREE.DirectionalLight(0xfff1de, 4.4), aim = new THREE.Vector3(-18, 0, 12);
  light.position.copy(sun).multiplyScalar(500).add(aim); light.target.position.copy(aim);
  light.castShadow = true;
  Object.assign(light.shadow.camera, { left: -half, right: half, top: half, bottom: -half, near: 1, far: 1500 });
  light.shadow.camera.updateProjectionMatrix();
  const ms = Math.min(mobile ? 2048 : 4096, renderer.capabilities.maxTextureSize);
  light.shadow.mapSize.set(ms, ms); light.shadow.bias = -0.0003; light.shadow.normalBias = 0.5;
  scene.add(light, light.target, new THREE.HemisphereLight(0xeef4ff, 0xd8d4cc, 0.45));
  await tick();

  onStep('brand');
  const brand = await loadBrand();
  const brandGeo = { logoDark: logoGeometry(brand, { cap: 1, depth: 0.16 }) }; await tick();
  brandGeo.logoLight = logoGeometry(brand, { cap: 1, depth: 0.12, light: true }); brandGeo.symbol = symbolGeometry(brand, { height: 1, depth: 0.045 });
  await tick();
  onStep('site');
  const site = await buildSite({ brandGeo, windowSize: mobile ? 1024 : 2048, reach: 1250 });
  scene.add(site.group);
  await tick();

  const camera = new THREE.PerspectiveCamera(30, width / height, 2, 2600);
  const target = new THREE.Vector3(-8, 42, 4), R = 74;                            // tower and wing
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
    const d = (R * (camera.aspect > 1.2 ? 1.12 : 1)) / Math.sin(Math.min(vf, hf) / 2) * zoom;     // tower and antenna stay in view at any angle
    camera.position.set(target.x + d * Math.sin(polar) * Math.sin(az), target.y + d * Math.cos(polar), target.z + d * Math.sin(polar) * Math.cos(az));
    camera.lookAt(target);
    camera.near = Math.max(2, d * 0.15);
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
