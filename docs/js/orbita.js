// A órbita: 3 anéis inclinados em volta do núcleo com as 31 tecnologias como cristais
// (cor do grupo, reflexo do HDRI). O hover é por distância na tela (alvo generoso no toque).
import * as THREE from 'three';
import { EQUIRET } from './glsl.js?v=20261125b';

export const ANEIS = [
  { raio: 3.2, rotX: 1.16, rotZ: 0.26, vel: 0.085 },
  { raio: 3.95, rotX: 1.36, rotZ: -0.46, vel: -0.06 },
  { raio: 4.7, rotX: 1.02, rotZ: 0.78, vel: 0.047 },
];

export function criarOrbita(tecnologias, paleta, envTex) {
  const grupo = new THREE.Group();
  const quat = ANEIS.map((a) => new THREE.Quaternion().setFromEuler(new THREE.Euler(a.rotX, 0, a.rotZ, 'ZXY')));

  // ---------- anéis ----------
  const uAneis = [];
  ANEIS.forEach((a, i) => {
    const u = {
      uR: { value: a.raio }, uTempo: { value: 0 }, uVel: { value: a.vel },
      uA: { value: paleta.anelA }, uB: { value: paleta.anelB }, uRealce: { value: 0 },
    };
    uAneis.push(u);
    const geo = new THREE.RingGeometry(a.raio - 0.09, a.raio + 0.09, 360, 1).rotateX(-Math.PI / 2);
    const m = new THREE.Mesh(geo, new THREE.ShaderMaterial({
      uniforms: u, transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
      vertexShader: /* glsl */ `varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: /* glsl */ `
        uniform float uR, uTempo, uVel, uRealce; uniform vec3 uA, uB; varying vec3 vP;
        void main(){
          float r = length(vP.xz);
          float aa = max(fwidth(r), 1e-4);
          float linha = 1.0 - smoothstep(aa * 0.6, aa * 1.8, abs(r - uR));
          float brilho = exp(-abs(r - uR) * 26.0) * 0.22;
          float ang = atan(vP.z, vP.x);
          float tr = fract(ang * 36.0 / 6.2831853 - uTempo * uVel * 6.0);
          float traco = 0.45 + 0.55 * smoothstep(0.2, 0.5, tr) * smoothstep(0.95, 0.65, tr);
          vec3 cor = mix(uA, uB, 0.5 + 0.5 * sin(ang * 2.0 + uTempo * 0.3));
          gl_FragColor = vec4(cor * (linha * traco * (0.9 + uRealce) + brilho), 1.0);
        }`,
    }));
    m.quaternion.copy(quat[i]);
    m.renderOrder = 8;
    grupo.add(m);
  });

  // ---------- cristais ----------
  const n = tecnologias.length;
  const porAnel = [[], [], []];
  tecnologias.forEach((t, i) => porAnel[t.anel - 1].push(i));
  const geo = new THREE.OctahedronGeometry(0.16, 0);
  geo.scale(1, 1.5, 1);
  const cores = new Float32Array(n * 3), estado = new Float32Array(n);
  tecnologias.forEach((t, i) => { const c = new THREE.Color(t.cor); cores.set([c.r, c.g, c.b], i * 3); });
  geo.setAttribute('aCor', new THREE.InstancedBufferAttribute(cores, 3));
  const attrEstado = new THREE.InstancedBufferAttribute(estado, 1);
  attrEstado.setUsage(THREE.DynamicDrawUsage);
  geo.setAttribute('aEstado', attrEstado);
  const uCristal = { tEnv: { value: envTex }, uEnvRot: { value: new THREE.Matrix3() }, uBranco: { value: paleta.chuvaCabeca } };
  const cristais = new THREE.InstancedMesh(geo, new THREE.ShaderMaterial({
    uniforms: uCristal,
    vertexShader: /* glsl */ `
      attribute vec3 aCor; attribute float aEstado; varying vec3 vN, vW, vCor; varying float vEstado;
      void main(){
        mat4 m = modelMatrix * instanceMatrix;
        vec4 w = m * vec4(position * (1.0 + aEstado * 0.8), 1.0);
        vN = normalize(mat3(m) * normal); vW = w.xyz; vCor = aCor; vEstado = aEstado;
        gl_Position = projectionMatrix * viewMatrix * w;
      }`,
    fragmentShader: /* glsl */ `
      uniform sampler2D tEnv; uniform mat3 uEnvRot; uniform vec3 uBranco;
      varying vec3 vN, vW, vCor; varying float vEstado;
      ${EQUIRET}
      void main(){
        vec3 N = normalize(vN); vec3 V = normalize(cameraPosition - vW);
        vec3 e = texture2D(tEnv, equirect(uEnvRot * reflect(-V, N))).rgb;
        float L = dot(e, vec3(0.2126, 0.7152, 0.0722));
        float F = pow(1.0 - max(dot(N, V), 0.0), 2.5);
        vec3 col = vCor * (0.45 + min(L, 6.0) * 0.4) + vCor * F * 1.4 + uBranco * smoothstep(5.0, 20.0, L) * 0.5;
        col *= 1.0 + vEstado * 1.6;
        gl_FragColor = vec4(col, 1.0);
      }`,
  }), n);
  cristais.frustumCulled = false;
  cristais.renderOrder = 9;
  grupo.add(cristais);

  // halos aditivos atrás de cada cristal
  const posHalo = new Float32Array(n * 3);
  const geoHalo = new THREE.BufferGeometry();
  geoHalo.setAttribute('position', new THREE.BufferAttribute(posHalo, 3));
  geoHalo.setAttribute('aCor', new THREE.BufferAttribute(cores, 3));
  geoHalo.setAttribute('aEstado', attrEstado);
  const uHalo = { uPixel: { value: 1 } };
  const halos = new THREE.Points(geoHalo, new THREE.ShaderMaterial({
    uniforms: uHalo, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */ `
      attribute vec3 aCor; attribute float aEstado; uniform float uPixel; varying vec3 vCor; varying float vE;
      void main(){
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = (90.0 + aEstado * 140.0) * uPixel / -mv.z;
        vCor = aCor; vE = aEstado;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      varying vec3 vCor; varying float vE;
      void main(){
        float d = length(gl_PointCoord - 0.5) * 2.0;
        float a = exp(-d * d * 4.0) * (0.22 + vE * 0.55);
        gl_FragColor = vec4(vCor * a, 1.0);
      }`,
  }));
  halos.frustumCulled = false;
  halos.renderOrder = 7;
  grupo.add(halos);

  // raio do núcleo até o cristal em foco
  const geoRaio = new THREE.BufferGeometry();
  geoRaio.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3));
  const matRaio = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
  const raio = new THREE.Line(geoRaio, matRaio);
  raio.frustumCulled = false;
  grupo.add(raio);

  // ---------- estado ----------
  const fase = [0, 0, 0];
  const posicoes = tecnologias.map(() => new THREE.Vector3());
  const alvoEstado = new Float32Array(n);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(1, 1, 1), eu = new THREE.Euler();
  const giroProprio = tecnologias.map(() => Math.random() * Math.PI * 2);
  const anelDoGrupo = {};
  tecnologias.forEach((t) => { anelDoGrupo[t.grupoIndice] = t.anel; });
  const env = new THREE.Matrix4();
  let foco = -1, grupoRealce = -1, lento = 1;
  const corRaio = new THREE.Color();

  function atualizarPosicoes(t, dt) {
    for (let a = 0; a < 3; a++) fase[a] += ANEIS[a].vel * dt * lento;
    porAnel.forEach((lista, a) => {
      const qa = quat[a], r = ANEIS[a].raio;
      lista.forEach((i, k) => {
        const ph = fase[a] + (k / lista.length) * Math.PI * 2;
        posicoes[i].set(Math.cos(ph) * r, Math.sin(t * 0.9 + i) * 0.05, Math.sin(ph) * r).applyQuaternion(qa);
      });
    });
  }

  return {
    grupo,
    posicoes,
    atualizar(t, dt, pixel) {
      lento += ((foco >= 0 ? 0.15 : 1) - lento) * Math.min(1, dt * 3);
      atualizarPosicoes(t, dt);
      for (let i = 0; i < n; i++) {
        alvoEstado[i] = i === foco ? 1 : (grupoRealce >= 0 ? (tecnologias[i].grupoIndice === grupoRealce ? 0.75 : 0) : 0);
        estado[i] += (alvoEstado[i] - estado[i]) * Math.min(1, dt * 9);
        giroProprio[i] += dt * (0.8 + estado[i] * 4);
        q.setFromEuler(eu.set(0.3, giroProprio[i], 0.15));
        m4.compose(posicoes[i], q, s);
        cristais.setMatrixAt(i, m4);
        posHalo.set([posicoes[i].x, posicoes[i].y, posicoes[i].z], i * 3);
      }
      cristais.instanceMatrix.needsUpdate = true;
      attrEstado.needsUpdate = true;
      geoHalo.attributes.position.needsUpdate = true;
      uHalo.uPixel.value = pixel;
      env.makeRotationY(t * 0.05);
      uCristal.uEnvRot.value.setFromMatrix4(env);
      uAneis.forEach((u, a) => {
        u.uTempo.value = t;
        const alvo = (foco >= 0 && tecnologias[foco].anel === a + 1) || (grupoRealce >= 0 && anelDoGrupo[grupoRealce] === a + 1) ? 0.9 : 0;
        u.uRealce.value += (alvo - u.uRealce.value) * Math.min(1, dt * 6);
      });
      // raio até o foco
      if (foco >= 0) {
        const arr = geoRaio.attributes.position.array;
        arr.set([0, 0, 0, posicoes[foco].x, posicoes[foco].y, posicoes[foco].z]);
        geoRaio.attributes.position.needsUpdate = true;
        corRaio.set(tecnologias[foco].cor);
        matRaio.color.copy(corRaio);
      }
      matRaio.opacity += ((foco >= 0 ? 0.9 : 0) - matRaio.opacity) * Math.min(1, dt * 8);
    },
    setFoco(i) { foco = i; },
    getFoco() { return foco; },
    setGrupo(g) { grupoRealce = g; },
  };
}
