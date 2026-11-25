// Paisagem synthwave: chão com grade neon em perspectiva (com reflexo do sol, brilho no ponteiro
// e onda no clique) e um anel de montanhas em wireframe no horizonte.
import * as THREE from 'three';
import { SOL_GLSL, SOL_DIR, SOL_RAIO } from './ceu.js';

export const CHAO_Y = -10;

const LINHA = /* glsl */ `
float linha(float c, float w) {
  float d = abs(fract(c - 0.5) - 0.5);
  float fw = max(fwidth(c), 1e-4);
  return 1.0 - smoothstep(w * fw, (w + 1.2) * fw, d);
}
`;

function ruido1(seed) {
  // ruído de valor 1D periódico, determinístico
  const n = 64, v = [];
  let s = seed;
  for (let i = 0; i < n; i++) { s = (s * 16807) % 2147483647; v.push(s / 2147483647); }
  return (x) => {
    const xi = Math.floor(x), f = x - xi, t = f * f * (3 - 2 * f);
    const a = v[((xi % n) + n) % n], b = v[(((xi + 1) % n) + n) % n];
    return a + (b - a) * t;
  };
}

export function criarPaisagem(paleta) {
  const grupo = new THREE.Group();

  // ---------- chão ----------
  const uChao = {
    uTempo: { value: 0 },
    uPerto: { value: paleta.gradePerto }, uLonge: { value: paleta.gradeLonge },
    uBase: { value: paleta.chao }, uHorizonte: { value: paleta.ceuHorizonte }, uNeblina: { value: paleta.neblina },
    uSol0: { value: paleta.sol0 }, uSol1: { value: paleta.sol1 }, uSol2: { value: paleta.sol2 },
    uSolDir: { value: SOL_DIR }, uSolRaio: { value: SOL_RAIO },
    uPtr: { value: new THREE.Vector3(0, 0, 0) },      // x, z, força
    uOnda: { value: new THREE.Vector4(0, 0, -100, 0) }, // x, z, início, força
  };
  const chao = new THREE.Mesh(
    new THREE.PlaneGeometry(420, 420, 1, 1).rotateX(-Math.PI / 2),
    new THREE.ShaderMaterial({
      uniforms: uChao,
      vertexShader: /* glsl */ `
        varying vec3 vW;
        void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
      fragmentShader: /* glsl */ `
        uniform float uTempo; uniform vec3 uPerto, uLonge, uBase, uHorizonte, uNeblina, uPtr; uniform vec4 uOnda;
        varying vec3 vW;
        ${LINHA}
        ${SOL_GLSL}
        void main(){
          vec2 p = vec2(vW.x, vW.z - uTempo * 1.6) / 3.0;
          float g = max(linha(p.x, 0.7), linha(p.y, 0.7));
          float fw = max(fwidth(p.x), fwidth(p.y));
          g *= 1.0 - smoothstep(0.18, 0.55, fw);
          float dist = length(vW.xz - cameraPosition.xz);
          vec3 corLinha = mix(uPerto, uLonge, smoothstep(8.0, 90.0, dist));
          vec3 col = uBase * 0.9;
          // reflexo do sol no chão brilhante
          vec3 V = normalize(cameraPosition - vW);
          vec3 R = reflect(-V, vec3(0.0, 1.0, 0.0));
          float m, halo;
          vec3 cs = sol(R, uTempo, m, halo);
          float mancha = exp(-abs(vW.x) * 0.14);
          col += cs * (m * 0.22 + halo * 0.12) * mancha;
          col += corLinha * g * (0.8 + 0.5 * m);
          // luz que segue o ponteiro
          float pd = length(vW.xz - uPtr.xy);
          col += uPerto * uPtr.z * exp(-pd * pd * 0.035) * (0.10 + g * 1.4);
          // onda do clique
          float od = length(vW.xz - uOnda.xy);
          float ot = uTempo - uOnda.z;
          float frente = od - ot * 10.0;
          col += uSol1 * uOnda.w * exp(-frente * frente * 0.6) * exp(-ot * 0.7) * step(0.0, ot) * (0.25 + g * 2.2);
          // névoa até o horizonte (mesma cor do céu na linha do horizonte)
          vec3 neblina = uHorizonte * 0.85 + uNeblina * 0.13;
          col = mix(col, neblina, smoothstep(35.0, 175.0, dist));
          gl_FragColor = vec4(col, 1.0);
        }`,
    }),
  );
  chao.position.y = CHAO_Y;
  chao.renderOrder = -50;
  grupo.add(chao);

  // ---------- montanhas ----------
  const A = 220, P = 14, R0 = 128, R1 = 178;
  const ruidoA = ruido1(7), ruidoB = ruido1(91), ruidoC = ruido1(313);
  const pos = new Float32Array((A + 1) * (P + 1) * 3);
  const grade = new Float32Array((A + 1) * (P + 1) * 3);
  const idx = [];
  for (let i = 0; i <= A; i++) {
    const th = (i / A) * Math.PI * 2;
    // distância angular até a direção do sol (-z)
    let dth = Math.abs(((th - (-Math.PI / 2)) % (Math.PI * 2) + Math.PI * 3) % (Math.PI * 2) - Math.PI);
    const abertura = THREE.MathUtils.smoothstep(dth, 0.12, 0.75);
    const envelope = 9 + 34 * abertura;
    for (let j = 0; j <= P; j++) {
      const t = j / P;
      const r = R0 + (R1 - R0) * t;
      const forma = Math.pow(Math.sin(Math.PI * Math.min(1, t * 1.15)), 1.3);
      const k = i / A * 40;
      const rug = 0.45 * ruidoA(k) + 0.35 * ruidoB(k * 2.3 + j * 0.7) + 0.2 * ruidoC(k * 5.1 + j * 1.9);
      const h = envelope * forma * (0.35 + 0.95 * rug);
      const n = (i * (P + 1) + j);
      // a base fica um pouco abaixo do chão para não brigar com ele no depth buffer
      pos.set([Math.cos(th) * r, CHAO_Y - 0.4 + Math.max(0, h), Math.sin(th) * r], n * 3);
      grade.set([i / 2, j, h / 46], n * 3);
    }
  }
  for (let i = 0; i < A; i++) {
    for (let j = 0; j < P; j++) {
      const a = i * (P + 1) + j, b = (i + 1) * (P + 1) + j;
      idx.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }
  const geoM = new THREE.BufferGeometry();
  geoM.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geoM.setAttribute('aGrade', new THREE.BufferAttribute(grade, 3));
  geoM.setIndex(idx);
  const uMont = {
    uLinha: { value: paleta.montanhaLinha }, uCrista: { value: paleta.montanhaCrista },
    uFundo: { value: paleta.montanhaFundo }, uHorizonte: { value: paleta.ceuHorizonte }, uNeblina: { value: paleta.neblina },
    uTempo: { value: 0 },
  };
  const montanhas = new THREE.Mesh(geoM, new THREE.ShaderMaterial({
    uniforms: uMont, side: THREE.DoubleSide,
    vertexShader: /* glsl */ `
      attribute vec3 aGrade; varying vec3 vG; varying float vY;
      void main(){ vG = aGrade; vY = position.y; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uLinha, uCrista, uFundo, uHorizonte, uNeblina; uniform float uTempo;
      varying vec3 vG; varying float vY;
      ${LINHA}
      void main(){
        float g = max(linha(vG.x, 0.6), linha(vG.y, 0.6));
        float alt = clamp(vG.z, 0.0, 1.0);
        vec3 col = mix(uFundo, uHorizonte * 0.6, 0.35);
        vec3 corLinha = mix(uLinha, uCrista, smoothstep(0.25, 0.85, alt));
        float pulso = 0.85 + 0.15 * sin(uTempo * 0.8 + vG.x * 0.15);
        col += corLinha * g * (0.35 + 0.8 * alt) * pulso;
        float base = 1.0 - smoothstep(0.0, 9.0, vY + 10.0);
        col = mix(col, uHorizonte * 0.85 + uNeblina * 0.13, base * 0.85);
        gl_FragColor = vec4(col, 1.0);
      }`,
  }));
  montanhas.renderOrder = -40;
  grupo.add(montanhas);

  const plano = new THREE.Plane(new THREE.Vector3(0, 1, 0), -CHAO_Y);
  const ptrAlvo = new THREE.Vector3();
  let ptrForca = 0;

  return {
    grupo,
    plano,
    atualizar(t, dt, ponteiro) {
      uChao.uTempo.value = t;
      uMont.uTempo.value = t;
      // ponteiro no chão (x, z) com suavização
      const alvoForca = ponteiro.noChao ? 1 : 0;
      ptrForca += (alvoForca - ptrForca) * Math.min(1, dt * 5);
      if (ponteiro.noChao) ptrAlvo.copy(ponteiro.noChao);
      const u = uChao.uPtr.value;
      u.x += (ptrAlvo.x - u.x) * Math.min(1, dt * 10);
      u.y += (ptrAlvo.z - u.y) * Math.min(1, dt * 10);
      u.z = ptrForca;
    },
    onda(x, z, t, forca = 1) {
      uChao.uOnda.value.set(x, z, t, forca);
    },
  };
}
