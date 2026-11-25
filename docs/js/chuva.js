// Chuva de caracteres no céu: colunas instanciadas, cada uma uma faixa vertical cujo shader
// desenha os glifos, as gotas caindo, a luz do ponteiro (que abre a cortina) e a onda do clique.
import * as THREE from 'three';
import { HASH } from './glsl.js?v=20261125b';

const KATAKANA = Array.from({ length: 56 }, (_, i) => String.fromCharCode(0xFF66 + i));

function criarAtlas() {
  const N = 8, C = 128;
  const cv = document.createElement('canvas');
  cv.width = cv.height = N * C;
  const ctx = cv.getContext('2d');
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const glifos = [...KATAKANA.slice(0, 46), ...'0123456789', ...':=+*<>Z|'];
  glifos.forEach((g, i) => {
    const kana = g.charCodeAt(0) >= 0xFF66;
    ctx.save();
    ctx.translate((i % N) * C + C / 2, Math.floor(i / N) * C + C / 2 + 4);
    if (kana) ctx.scale(-1, 1); // espelhado, como no filme
    ctx.font = kana ? '500 104px "Kana Chuva", "JetBrains Mono", monospace' : '600 92px "JetBrains Mono", monospace';
    ctx.fillText(g, 0, 0);
    ctx.restore();
  });
  const tex = new THREE.CanvasTexture(cv);
  tex.flipY = false;
  tex.colorSpace = THREE.NoColorSpace;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.anisotropy = 4;
  return tex;
}

export function criarChuva(paleta, { colunas = 240 } = {}) {
  const TOPO = 40, BASE = -4;
  const base = new THREE.PlaneGeometry(1, 1, 1, 56);
  const p = base.attributes.position;
  for (let i = 0; i < p.count; i++) p.setY(i, 0.5 - p.getY(i)); // 0 no topo, 1 embaixo
  const geo = new THREE.InstancedBufferGeometry();
  geo.index = base.index;
  geo.setAttribute('position', base.attributes.position);

  const col = new Float32Array(colunas * 4);
  const gota = new Float32Array(colunas * 4);
  for (let i = 0; i < colunas; i++) {
    let ang, r;
    if (i < colunas * 0.62) { // concentradas atrás do núcleo, na direção do sol
      ang = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.3;
      r = 17 + Math.pow(Math.random(), 0.85) * 88;
    } else { // o resto em volta, para o modo explorar
      ang = Math.random() * Math.PI * 2;
      r = 22 + Math.random() * 84;
    }
    const x = Math.cos(ang) * r, z = Math.sin(ang) * r;
    const w = 0.42 + r * 0.0105;
    col.set([x, z, w, Math.random()], i * 4);
    gota.set([
      5 + Math.random() * 10,              // velocidade (células/s)
      10 + Math.random() * 22,             // tamanho do rastro (células)
      0.55 + Math.random() * 0.6 - r * 0.003, // brilho
      Math.random(),                       // mistura de cor
    ], i * 4);
  }
  geo.setAttribute('aCol', new THREE.InstancedBufferAttribute(col, 4));
  geo.setAttribute('aGota', new THREE.InstancedBufferAttribute(gota, 4));
  geo.instanceCount = colunas;

  const uniforms = {
    tGlifos: { value: criarAtlas() },
    uTempo: { value: 0 }, uTopo: { value: TOPO }, uBase: { value: BASE },
    uPtr: { value: new THREE.Vector2(9, 9) }, uPtrForca: { value: 0 }, uAspecto: { value: 1 },
    uChoque: { value: new THREE.Vector3(0, 0, -100) },
    uCabeca: { value: paleta.chuvaCabeca }, uA: { value: paleta.chuvaA }, uB: { value: paleta.chuvaB }, uC: { value: paleta.chuvaC },
    uIntens: { value: 1.25 },
  };

  const mat = new THREE.ShaderMaterial({
    uniforms, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */ `
      attribute vec4 aCol; attribute vec4 aGota;
      uniform float uTempo, uTopo, uBase, uPtrForca, uAspecto; uniform vec2 uPtr; uniform vec3 uChoque;
      varying vec2 vCel; varying vec4 vGota; varying float vSeed, vPtr, vFade, vChoque, vComp;
      void main(){
        float y = mix(uTopo, uBase, position.y);
        vec3 base = vec3(aCol.x, y, aCol.y);
        vec3 paraCam = cameraPosition - base; paraCam.y = 0.0;
        vec3 f = normalize(paraCam + vec3(1e-4, 0.0, 0.0));
        vec3 dir = vec3(f.z, 0.0, -f.x);
        float w = aCol.z;
        vec3 wp = base + dir * (position.x * w);
        vec4 clip = projectionMatrix * viewMatrix * vec4(wp, 1.0);
        float cw = max(clip.w, 1e-3);
        vec2 ndc = clip.xy / cw;
        vec2 dv = ndc - uPtr; dv.x *= uAspecto;
        float empurra = uPtrForca * exp(-dot(dv, dv) * 9.0);
        wp += dir * sign(dv.x + 1e-5) * empurra * cw * 0.05;
        float st = uTempo - uChoque.z;
        vec2 ds = ndc - uChoque.xy; ds.x *= uAspecto;
        float anel = exp(-pow((length(ds) - st * 1.25) * 5.5, 2.0)) * exp(-st * 1.3) * step(0.0, st);
        wp += dir * sign(ds.x + 1e-5) * anel * cw * 0.03;
        vPtr = empurra; vChoque = anel;
        vCel = vec2(position.x + 0.5, (uTopo - y) / w);
        vComp = (uTopo - uBase) / w;
        vGota = aGota; vSeed = aCol.w;
        float dCam = length(cameraPosition - wp);
        vFade = smoothstep(5.0, 14.0, dCam) * (1.0 - smoothstep(95.0, 150.0, dCam)) * smoothstep(uBase, uBase + 8.0, y);
        gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.0);
      }`,
    fragmentShader: /* glsl */ `
      uniform sampler2D tGlifos; uniform float uTempo, uIntens; uniform vec3 uCabeca, uA, uB, uC;
      varying vec2 vCel; varying vec4 vGota; varying float vSeed, vPtr, vFade, vChoque, vComp;
      ${HASH}
      void main(){
        if (vFade <= 0.001) discard;
        float lin = floor(vCel.y);
        float vel = vGota.x, rastro = vGota.y;
        float periodo = vComp + rastro;
        float d1 = mod(uTempo * vel + vSeed * 311.0, periodo) - lin;
        float d2 = mod(uTempo * vel * 0.71 + vSeed * 173.0 + periodo * 0.5, periodo) - lin;
        float b1 = (d1 >= 0.0 && d1 < rastro) ? pow(1.0 - d1 / rastro, 1.7) : 0.0;
        float r2 = rastro * 0.65;
        float b2 = (d2 >= 0.0 && d2 < r2) ? pow(1.0 - d2 / r2, 1.7) * 0.75 : 0.0;
        float b = max(b1, b2);
        float cab = max(step(0.0, d1) * step(d1, 0.999), step(0.0, d2) * step(d2, 0.999));
        float taxa = 0.5 + 3.5 * hash12(vec2(lin, vSeed * 91.0)) + cab * 6.0;
        float gi = floor(hash12(vec2(lin * 1.7 + vSeed * 13.0, floor(uTempo * taxa))) * 64.0);
        vec2 cel = vec2(mod(gi, 8.0), floor(gi / 8.0));
        vec2 uv = (cel + vec2(vCel.x, fract(vCel.y))) / 8.0;
        vec2 cont = vCel / 8.0;
        float a = textureGrad(tGlifos, uv, dFdx(cont), dFdy(cont)).a;
        float k = clamp(min(d1 >= 0.0 ? d1 : 1e3, d2 >= 0.0 ? d2 : 1e3) / rastro, 0.0, 1.0);
        vec3 cor = mix(uA, uB, smoothstep(0.02, 0.45, k));
        cor = mix(cor, uC, vGota.w * smoothstep(0.3, 1.0, k));
        cor = mix(cor, uCabeca, cab);
        cor = mix(cor, uCabeca, clamp(vPtr * 0.5 + vChoque * 0.6, 0.0, 0.7));
        float intens = b * (1.0 + cab * 1.8) + 0.028 + vPtr * 0.95 + vChoque * 1.1;
        intens *= clamp(vGota.z, 0.15, 1.2) * vFade * uIntens;
        gl_FragColor = vec4(cor * intens, a);
      }`,
  });

  const malha = new THREE.Mesh(geo, mat);
  malha.frustumCulled = false;
  malha.renderOrder = 5;

  return {
    malha,
    uniforms,
    atualizar(t, dt, ponteiro, aspecto) {
      uniforms.uTempo.value = t;
      uniforms.uAspecto.value = aspecto;
      const alvo = ponteiro.ativo ? 1 : 0;
      uniforms.uPtrForca.value += (alvo - uniforms.uPtrForca.value) * Math.min(1, dt * 4);
      uniforms.uPtr.value.lerp(ponteiro.ndc, Math.min(1, dt * 12));
    },
    choque(ndc, t) { uniforms.uChoque.value.set(ndc.x, ndc.y, t); },
  };
}
