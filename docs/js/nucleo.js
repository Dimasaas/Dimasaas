// O núcleo: um diamante (lapidação brilhante feita aqui mesmo, 112 facetas planas) dentro de uma
// malha geodésica em wireframe que respira com ruído, estufa na direção do ponteiro e ondula no
// clique; em volta, um disco de partículas que foge do ponteiro.
import * as THREE from 'three';
import { RUIDO, HASH, EQUIRET } from './glsl.js';

const V3 = THREE.Vector3;

function geometriaDiamante() {
  const T = [], S = [], P = [], G = [], Gb = [];
  for (let k = 0; k < 8; k++) {
    const a = (k * Math.PI) / 4, b = a + Math.PI / 8;
    T.push(new V3(Math.cos(a) * 0.56, 0.34, Math.sin(a) * 0.56));      // mesa
    S.push(new V3(Math.cos(b) * 0.86, 0.19, Math.sin(b) * 0.86));      // pontas das estrelas
    P.push(new V3(Math.cos(b) * 0.43, -0.55, Math.sin(b) * 0.43));     // pavilhão
  }
  for (let j = 0; j < 16; j++) {
    const a = (j * Math.PI) / 8;
    G.push(new V3(Math.cos(a), 0.025, Math.sin(a)));                   // cintura (topo)
    Gb.push(new V3(Math.cos(a), -0.025, Math.sin(a)));                 // cintura (base)
  }
  const centroMesa = new V3(0, 0.34, 0), culaça = new V3(0, -0.9, 0);
  const tris = [];
  const t = (a, b, c) => tris.push([a, b, c]);
  for (let k = 0; k < 8; k++) {
    const k1 = (k + 1) % 8, km = (k + 7) % 8, g = 2 * k, g1 = 2 * k + 1, g2 = (2 * k + 2) % 16;
    t(centroMesa, T[k], T[k1]);         // mesa
    t(T[k], T[k1], S[k]);                // estrela
    t(T[k], S[km], G[g]);                // bezel
    t(T[k], G[g], S[k]);
    t(S[k], G[g], G[g1]);                // cintura superior
    t(S[k], G[g1], G[g2]);
    t(Gb[g], Gb[g1], P[k]);              // cintura inferior
    t(Gb[g1], Gb[g2], P[k]);
    t(Gb[g], P[km], culaça);             // pavilhão
    t(Gb[g], culaça, P[k]);
  }
  for (let j = 0; j < 16; j++) {
    const j1 = (j + 1) % 16;
    t(G[j], Gb[j], Gb[j1]);
    t(G[j], Gb[j1], G[j1]);
  }
  const pos = [], nor = [];
  const ab = new V3(), ac = new V3(), n = new V3(), c = new V3();
  for (const [a, b, cc] of tris) {
    n.crossVectors(ab.subVectors(b, a), ac.subVectors(cc, a)).normalize();
    c.copy(a).add(b).add(cc).divideScalar(3);
    let B = b, C = cc;
    if (n.dot(c) < 0) { n.negate(); B = cc; C = b; }
    pos.push(a.x, a.y, a.z, B.x, B.y, B.z, C.x, C.y, C.z);
    for (let i = 0; i < 3; i++) nor.push(n.x, n.y, n.z);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  geo.computeBoundingSphere();
  return geo;
}

// deslocamento da malha (usado pela malha e pelos nós, para ficarem juntos)
const DESLOCA = /* glsl */ `
uniform float uTempo, uR, uPtrForca, uOndaT, uBoom;
uniform vec3 uPtrDir, uOndaDir;
float deslocar(vec3 n, out float luz, out float onda) {
  float t = uTempo * 0.22;
  float d = snoise(n * 1.3 + vec3(0.0, t, t * 0.6)) * 0.12 + snoise(n * 3.1 - vec3(t)) * 0.03;
  float bojo = smoothstep(0.6, 1.0, dot(n, uPtrDir));
  luz = bojo * uPtrForca;
  d += bojo * bojo * uPtrForca * 0.5;
  float ot = uTempo - uOndaT;
  float frente = acos(clamp(dot(n, uOndaDir), -1.0, 1.0)) - ot * 2.6;
  onda = exp(-frente * frente * 26.0) * exp(-ot * 1.1) * step(0.0, ot);
  d += onda * 0.32;
  d += uBoom * (0.8 + 0.45 * snoise(n * 4.0 + uTempo));
  return d;
}
`;

export function criarNucleo(paleta, envTex, { particulas = 7000, detalhe = 13 } = {}) {
  const grupo = new THREE.Group();     // posição do núcleo na cena
  const giro = new THREE.Group();      // rotação arrastável (diamante + malha)
  grupo.add(giro);

  // ---------- diamante ----------
  const uGema = {
    tEnv: { value: envTex }, uEnvRot: { value: new THREE.Matrix3() },
    uBaixo: { value: paleta.gemaBaixo }, uMeio: { value: paleta.gemaMeio }, uAlto: { value: paleta.gemaAlto },
    uBrilho: { value: paleta.chuvaCabeca },
    uLuz1: { value: new V3(0.4, 0.8, 0.45).normalize() }, uLuz2: { value: new V3(-0.6, 0.5, 0.6).normalize() },
    uDisp: { value: 0.06 }, uIntens: { value: 1 }, uFlash: { value: 0 }, uHover: { value: 0 },
  };
  const diamante = new THREE.Mesh(geometriaDiamante(), new THREE.ShaderMaterial({
    uniforms: uGema,
    vertexShader: /* glsl */ `
      varying vec3 vN, vW, vNo;
      void main(){
        vNo = normal;
        vN = normalize(mat3(modelMatrix) * normal);
        vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz;
        gl_Position = projectionMatrix * viewMatrix * w;
      }`,
    fragmentShader: /* glsl */ `
      uniform sampler2D tEnv; uniform mat3 uEnvRot; uniform vec3 uBaixo, uMeio, uAlto, uBrilho, uLuz1, uLuz2;
      uniform float uDisp, uIntens, uFlash, uHover;
      varying vec3 vN, vW, vNo;
      ${EQUIRET}
      // o HDRI dá a estrutura das luzes; a cor vem da paleta (âmbar embaixo, magenta no meio, azul no alto),
      // com um deslocamento por faceta para o diamante virar um caleidoscópio da paleta
      vec3 envPal(vec3 d, float desloc) {
        vec3 e = texture2D(tEnv, equirect(uEnvRot * d)).rgb;
        float L = dot(e, vec3(0.2126, 0.7152, 0.0722));
        L = 4.0 * L / (L + 4.0);           // comprime as janelas de luz do estúdio
        float k = fract(d.y * 0.5 + 0.5 + desloc);
        vec3 pal = k < 0.5 ? mix(uBaixo, uMeio, k * 2.0) : mix(uMeio, uAlto, (k - 0.5) * 2.0);
        vec3 c = pal * (0.04 + pow(L, 1.3) * 1.6);
        return mix(c, uBrilho * L * 0.9, smoothstep(2.2, 3.8, L) * 0.4);
      }
      void main(){
        vec3 N = normalize(vN);
        vec3 V = normalize(cameraPosition - vW);
        float faceta = fract(sin(dot(normalize(vNo), vec3(12.989, 78.233, 37.719))) * 43758.5453);
        float NdV = max(dot(N, V), 0.0);
        float F = 0.17 + 0.83 * pow(1.0 - NdV, 5.0);
        vec3 R = reflect(-V, N);
        vec3 refl = envPal(R, faceta * 0.35);
        vec3 acc = vec3(0.0);
        for (int i = 0; i < 3; i++) {
          float ior = 2.42 + (float(i) - 1.0) * uDisp;
          vec3 T = refract(-V, N, 1.0 / ior);
          vec3 Nb = normalize(vec3(-N.x, -abs(N.y) - 0.7, -N.z));
          vec3 T2 = reflect(T, Nb);
          vec3 E = refract(T2, -N, ior);
          if (dot(E, E) < 1e-4) E = reflect(T2, N);
          vec3 s = envPal(E, faceta);
          if (i == 0) acc.r = s.r; else if (i == 1) acc.g = s.g; else acc.b = s.b;
        }
        acc *= 1.15;
        vec3 col = mix(acc, refl, F);
        float g1 = pow(max(dot(R, uLuz1), 0.0), 700.0);
        float g2 = pow(max(dot(R, uLuz2), 0.0), 900.0);
        col += uBrilho * (g1 * 7.0 + g2 * 5.0);
        col *= uIntens * (1.0 + uHover * 0.35);
        col += uMeio * uFlash;
        gl_FragColor = vec4(col, 1.0);
      }`,
  }));
  diamante.scale.setScalar(1.28);
  diamante.rotation.x = 0.2;
  giro.add(diamante);

  // brilho atrás do diamante
  const halo = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.ShaderMaterial({
    uniforms: { uCor: { value: paleta.cascaBrilho }, uCor2: { value: paleta.cascaA }, uForca: { value: 0.09 } },
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main(){
        vUv = uv;
        vec4 c = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
        c.xy += position.xy * 7.5;
        gl_Position = projectionMatrix * c;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uCor, uCor2; uniform float uForca; varying vec2 vUv;
      void main(){
        float d = length(vUv - 0.5) * 2.0;
        float a = exp(-d * d * 5.0) * 0.55 + exp(-d * 9.0) * 0.6;
        gl_FragColor = vec4(mix(uCor2, uCor, exp(-d * 4.0)) * a * uForca, 1.0);
      }`,
  }));
  halo.renderOrder = 2;
  grupo.add(halo);

  // ---------- malha geodésica ----------
  const R = 2.15;
  const geoM = new THREE.IcosahedronGeometry(1, detalhe);
  const nv = geoM.attributes.position.count;
  const bary = new Float32Array(nv * 3), triId = new Float32Array(nv);
  for (let i = 0; i < nv; i += 3) {
    bary.set([1, 0, 0, 0, 1, 0, 0, 0, 1], i * 3);
    const r = Math.random();
    triId[i] = triId[i + 1] = triId[i + 2] = r;
  }
  geoM.setAttribute('aBary', new THREE.BufferAttribute(bary, 3));
  geoM.setAttribute('aTri', new THREE.BufferAttribute(triId, 1));
  const uMalha = {
    uTempo: { value: 0 }, uR: { value: R }, uPtrForca: { value: 0 }, uOndaT: { value: -100 }, uBoom: { value: 0 },
    uPtrDir: { value: new V3(0, 0, 1) }, uOndaDir: { value: new V3(0, 0, 1) },
    uA: { value: paleta.cascaA }, uB: { value: paleta.cascaB }, uBrilho: { value: paleta.cascaBrilho },
    uIntens: { value: 1 },
  };
  const malha = new THREE.Mesh(geoM, new THREE.ShaderMaterial({
    uniforms: uMalha, transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */ `
      attribute vec3 aBary; attribute float aTri;
      varying vec3 vBary; varying float vTri, vLuz, vFres, vH, vOnda;
      ${RUIDO}
      ${DESLOCA}
      void main(){
        vec3 n = normalize(position);
        float luz, onda;
        float d = deslocar(n, luz, onda);
        vec4 w = modelMatrix * vec4(n * (uR + d), 1.0);
        vec3 nw = normalize(mat3(modelMatrix) * n);
        vFres = pow(1.0 - abs(dot(nw, normalize(cameraPosition - w.xyz))), 2.0);
        vBary = aBary; vTri = aTri; vLuz = luz; vOnda = onda; vH = d;
        gl_Position = projectionMatrix * viewMatrix * w;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uA, uB, uBrilho; uniform float uTempo, uIntens;
      varying vec3 vBary; varying float vTri, vLuz, vFres, vH, vOnda;
      ${HASH}
      void main(){
        vec3 fw = fwidth(vBary);
        vec3 e3 = smoothstep(vec3(0.0), fw * 1.05, vBary);
        float aresta = 1.0 - min(min(e3.x, e3.y), e3.z);
        float frente = gl_FrontFacing ? 1.0 : 0.3;
        vec3 cor = mix(uA, uB, clamp(vH * 2.2 + 0.5, 0.0, 1.0));
        cor = mix(cor, uBrilho, clamp(vLuz * 1.1 + vOnda * 1.2, 0.0, 1.0));
        float pisca = step(0.988, hash11(vTri * 997.0 + floor(uTempo * 2.2)));
        float a = aresta * (0.12 + vFres * 1.35 + vLuz * 1.4 + vOnda * 2.2);
        a += 0.003 + pisca * 0.1 + vFres * 0.02;
        gl_FragColor = vec4(cor * a * frente * uIntens * 0.8, 1.0);
      }`,
  }));
  malha.renderOrder = 10;
  giro.add(malha);

  // nós nos vértices
  const unicos = new Map();
  const pa = new THREE.IcosahedronGeometry(1, detalhe).attributes.position;
  for (let i = 0; i < pa.count; i++) {
    const k = `${pa.getX(i).toFixed(4)},${pa.getY(i).toFixed(4)},${pa.getZ(i).toFixed(4)}`;
    if (!unicos.has(k)) unicos.set(k, [pa.getX(i), pa.getY(i), pa.getZ(i)]);
  }
  const posNos = new Float32Array(unicos.size * 3), semNos = new Float32Array(unicos.size);
  [...unicos.values()].forEach((v, i) => { posNos.set(v, i * 3); semNos[i] = Math.random(); });
  const geoNos = new THREE.BufferGeometry();
  geoNos.setAttribute('position', new THREE.BufferAttribute(posNos, 3));
  geoNos.setAttribute('aSem', new THREE.BufferAttribute(semNos, 1));
  const uNos = { ...uMalha, uPixel: { value: 1 } };
  const nos = new THREE.Points(geoNos, new THREE.ShaderMaterial({
    uniforms: uNos, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */ `
      attribute float aSem; uniform float uPixel; varying float vB; varying float vLuz;
      ${RUIDO}
      ${DESLOCA}
      void main(){
        vec3 n = normalize(position);
        float luz, onda;
        float d = deslocar(n, luz, onda);
        vec4 mv = modelViewMatrix * vec4(n * (uR + d), 1.0);
        float pisca = 0.5 + 0.5 * sin(uTempo * (1.0 + aSem * 3.0) + aSem * 60.0);
        vB = (0.25 + 0.75 * step(0.82, aSem) * pisca) + luz * 1.5 + onda * 2.0;
        vLuz = clamp(luz + onda, 0.0, 1.0);
        gl_PointSize = (1.6 + 2.6 * step(0.82, aSem) + luz * 3.0) * uPixel * (11.0 / -mv.z);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uB, uBrilho; uniform float uIntens; varying float vB; varying float vLuz;
      void main(){
        float a = smoothstep(0.5, 0.05, length(gl_PointCoord - 0.5));
        gl_FragColor = vec4(mix(uB, uBrilho, vLuz) * vB * a * uIntens * 1.1, 1.0);
      }`,
  }));
  nos.renderOrder = 11;
  giro.add(nos);

  // ---------- partículas ----------
  const par = new Float32Array(particulas * 4), ext = new Float32Array(particulas * 4);
  for (let i = 0; i < particulas; i++) {
    const disco = Math.random() < 0.72;
    const r = disco ? 2.6 + Math.pow(Math.random(), 1.6) * 6.5 : 2.4 + Math.random() * 7.5;
    const y = disco ? (Math.random() - 0.5) * 0.5 * Math.sqrt(r) * (Math.random() < 0.5 ? 1 : 0.4)
      : (Math.random() - 0.5) * 9;
    const sorteio = Math.random();
    const cor = sorteio < 0.03 ? 3 : sorteio < 0.2 ? 2 : sorteio < 0.6 ? 0 : 1;
    par.set([r, Math.random() * Math.PI * 2, y, (0.25 + Math.random() * 0.45) * (Math.random() < 0.08 ? -1 : 1)], i * 4);
    ext.set([Math.random(), 0.6 + Math.pow(Math.random(), 3) * 2.6, cor, disco ? 1 : 0], i * 4);
  }
  const geoP = new THREE.BufferGeometry();
  geoP.setAttribute('position', new THREE.BufferAttribute(new Float32Array(particulas * 3), 3));
  geoP.setAttribute('aPar', new THREE.BufferAttribute(par, 4));
  geoP.setAttribute('aExt', new THREE.BufferAttribute(ext, 4));
  const uPart = {
    uTempo: { value: 0 }, uPixel: { value: 1 }, uPtr: { value: new V3(0, 0, 99) }, uPtrForca: { value: 0 }, uBurst: { value: 0 },
    uInclina: { value: new THREE.Matrix3().setFromMatrix4(new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(0.32, 0, -0.18))) },
    uC0: { value: paleta.particulaA }, uC1: { value: paleta.particulaB }, uC2: { value: paleta.particulaC }, uC3: { value: paleta.particulaAcento },
    uIntens: { value: 1 },
  };
  const pontos = new THREE.Points(geoP, new THREE.ShaderMaterial({
    uniforms: uPart, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */ `
      attribute vec4 aPar; attribute vec4 aExt;
      uniform float uTempo, uPixel, uPtrForca, uBurst; uniform vec3 uPtr; uniform mat3 uInclina;
      uniform vec3 uC0, uC1, uC2, uC3;
      varying vec3 vCor; varying float vA;
      void main(){
        float r = aPar.x;
        float ang = aPar.y + uTempo * aPar.w / sqrt(r);
        vec3 p = vec3(cos(ang) * r, aPar.z, sin(ang) * r);
        p = aExt.w > 0.5 ? uInclina * p : p;
        float s = aExt.x;
        p += 0.12 * vec3(sin(uTempo * 0.7 + s * 30.0), cos(uTempo * 0.53 + s * 20.0), sin(uTempo * 0.61 + s * 50.0));
        vec3 wp = (modelMatrix * vec4(p, 1.0)).xyz;
        vec3 c0 = modelMatrix[3].xyz;
        vec3 dp = wp - uPtr;
        float dd = length(dp);
        wp += dp / max(dd, 1e-3) * uPtrForca * 1.5 * exp(-dd * dd * 0.3);
        wp += normalize(wp - c0 + 1e-4) * uBurst * (0.6 + s * 2.4);
        vec4 mv = viewMatrix * vec4(wp, 1.0);
        gl_PointSize = aExt.y * uPixel * (24.0 / -mv.z);
        vCor = aExt.z < 0.5 ? uC0 : (aExt.z < 1.5 ? uC1 : (aExt.z < 2.5 ? uC2 : uC3));
        float pisca = 0.6 + 0.4 * sin(uTempo * (1.5 + s * 4.0) + s * 90.0);
        vA = pisca * (0.55 + 0.45 * aExt.w) * smoothstep(1.5, 5.0, -mv.z);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform float uIntens; varying vec3 vCor; varying float vA;
      void main(){
        float d = length(gl_PointCoord - 0.5);
        float a = smoothstep(0.5, 0.0, d);
        gl_FragColor = vec4(vCor * vA * a * a * 1.15 * uIntens, 1.0);
      }`,
  }));
  pontos.frustumCulled = false;
  pontos.renderOrder = 12;
  grupo.add(pontos);

  // ---------- estado ----------
  const vel = new THREE.Vector2(0, 0);     // velocidade angular do arrasto
  const qTmp = new THREE.Quaternion(), eixoX = new V3(1, 0, 0), eixoY = new V3(0, 1, 0);
  const env = new THREE.Matrix4();
  let boom = 0, flash = 0, burst = 0, giroExtra = 0, hover = 0;
  const ptrDirAlvo = new V3(0, 0, 1);
  let ptrForcaAlvo = 0;

  return {
    grupo, diamante, malha,
    raio: R,
    atualizar(t, dt, pixel) {
      // giro: arrasto com inércia + rotação própria do diamante
      giro.quaternion.premultiply(qTmp.setFromAxisAngle(eixoY, vel.x * dt));
      giro.quaternion.premultiply(qTmp.setFromAxisAngle(eixoX, vel.y * dt));
      const atrito = Math.exp(-dt * 1.6);
      vel.multiplyScalar(atrito);
      giroExtra *= Math.exp(-dt * 1.2);
      diamante.rotation.y += dt * (0.35 + giroExtra);
      env.makeRotationY(t * 0.05);
      uGema.uEnvRot.value.setFromMatrix4(env);
      boom *= Math.exp(-dt * 2.4); flash *= Math.exp(-dt * 4.0); burst *= Math.exp(-dt * 2.2);
      uMalha.uTempo.value = t;
      uMalha.uBoom.value = boom;
      uMalha.uPtrForca.value += (ptrForcaAlvo - uMalha.uPtrForca.value) * Math.min(1, dt * 5);
      uMalha.uPtrDir.value.lerp(ptrDirAlvo, Math.min(1, dt * 9)).normalize();
      uNos.uPixel.value = pixel;
      uGema.uFlash.value = flash;
      uGema.uHover.value += (hover - uGema.uHover.value) * Math.min(1, dt * 8);
      uPart.uTempo.value = t;
      uPart.uPixel.value = pixel;
      uPart.uBurst.value = burst;
    },
    // direção do ponteiro no espaço local da malha (ou null) e posição no mundo para as partículas
    ponteiro(dirLocal, forca, mundo, forcaParticulas) {
      if (dirLocal) ptrDirAlvo.copy(dirLocal);
      ptrForcaAlvo = forca;
      if (mundo) uPart.uPtr.value.lerp(mundo, 0.35);
      uPart.uPtrForca.value += (forcaParticulas - uPart.uPtrForca.value) * 0.12;
    },
    arrastar(dx, dy) { vel.x += dx * 0.012; vel.y += dy * 0.009; },
    onda(dirLocal, t) { uMalha.uOndaDir.value.copy(dirLocal); uMalha.uOndaT.value = t; },
    sobrecarga() { boom = 1; flash = 1.6; burst = 1.4; giroExtra = 9; },
    setHover(v) { hover = v ? 1 : 0; },
    giro,
  };
}
