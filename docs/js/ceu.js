// Céu synthwave: degradê até a névoa magenta do horizonte, sol listrado (âmbar → magenta → roxo),
// nebulosa discreta no alto (assada uma vez numa textura) e estrelas.
import * as THREE from 'three';
import { RUIDO, EQUIRET } from './glsl.js';

// Direção do sol: no horizonte, para o fundo da cena (-z), um pouco acima da linha.
export const SOL_DIR = new THREE.Vector3(0, Math.sin(THREE.MathUtils.degToRad(7.5)), -Math.cos(THREE.MathUtils.degToRad(7.5))).normalize();
export const SOL_RAIO = THREE.MathUtils.degToRad(11);

// GLSL do sol, usado pelo céu e pelo reflexo no chão.
export const SOL_GLSL = /* glsl */ `
uniform vec3 uSol0, uSol1, uSol2, uSolDir;
uniform float uSolRaio;
// devolve a cor do sol e, em 'm', a máscara do disco (0..1); 'halo' é o brilho em volta
vec3 sol(vec3 d, float tempo, out float m, out float halo) {
  vec3 f = uSolDir;
  vec3 r = normalize(cross(f, vec3(0.0, 1.0, 0.0)));
  vec3 u = cross(r, f);
  float c = dot(d, f);
  vec2 q = vec2(dot(d, r), dot(d, u)) / (max(c, 1e-3) * tan(uSolRaio));
  float rr = length(q);
  float aa = max(fwidth(rr), 1e-4) * 1.5;
  float disco = smoothstep(1.0 + aa, 1.0 - aa, rr) * step(0.0, c);
  float faixas = 1.0;
  float y = q.y;
  if (y < 0.25) {
    float t = clamp((0.25 - y) / 1.25, 0.0, 1.0);
    float s = fract(y * 7.0 + tempo * 0.18);
    float vao = mix(0.08, 0.62, t);
    float w = max(fwidth(y * 7.0), 1e-4) * 1.2;
    faixas = smoothstep(vao - w, vao + w, s);
  }
  m = disco * faixas;
  float g = clamp(0.5 - 0.5 * y, 0.0, 1.0);
  vec3 cor = g < 0.5 ? mix(uSol0, uSol1, g * 2.0) : mix(uSol1, uSol2, (g - 0.5) * 2.0);
  float fora = max(rr - 1.0, 0.0);
  halo = step(0.0, c) * (exp(-fora * 1.6) * 0.30 + exp(-fora * 7.0) * 0.35);
  return cor;
}
`;

export function criarCeu(renderer, paleta, { estrelas = 2600 } = {}) {
  const grupo = new THREE.Group();

  // 1) Densidades da nebulosa (R: nuvem, G: filamentos, B: poeira escura, A: nós brilhantes).
  const rt = new THREE.WebGLRenderTarget(1024, 512, { depthBuffer: false });
  const assar = new THREE.Mesh(
    new THREE.PlaneGeometry(2, 2),
    new THREE.ShaderMaterial({
      depthTest: false, depthWrite: false,
      vertexShader: /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
      fragmentShader: /* glsl */ `
        varying vec2 vUv;
        ${RUIDO}
        void main(){
          float phi = (vUv.x - 0.5) * 6.283185307;
          float th = (vUv.y - 0.5) * 3.141592653;
          vec3 d = vec3(cos(phi) * cos(th), sin(th), sin(phi) * cos(th));
          vec3 eixo = normalize(vec3(0.35, 1.0, -0.2));
          float faixa = exp(-pow(dot(d, eixo) / 0.6, 2.0));
          float nuvem = fbm3(d * 1.7 + 3.0) * 0.5 + 0.5;
          nuvem = smoothstep(0.35, 0.95, nuvem) * (0.3 + 0.7 * faixa);
          float fil = 1.0 - abs(snoise(d * 3.4 + 11.0));
          fil = pow(fil, 5.0) * smoothstep(0.2, 0.8, nuvem + faixa * 0.3);
          float poeira = smoothstep(0.15, 0.75, fbm3(d * 2.6 + 7.0) * 0.5 + 0.5) * faixa;
          float nos = pow(max(snoise(d * 7.0 + 5.0), 0.0), 4.0) * faixa;
          gl_FragColor = vec4(nuvem, fil, poeira, nos);
        }`,
    }),
  );
  const cenaAssar = new THREE.Scene();
  cenaAssar.add(assar);
  const anterior = renderer.getRenderTarget();
  renderer.setRenderTarget(rt);
  renderer.render(cenaAssar, new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1));
  renderer.setRenderTarget(anterior);
  assar.geometry.dispose();
  assar.material.dispose();

  // 2) Esfera do céu (sempre no plano de fundo, no infinito).
  const uniforms = {
    tNeb: { value: rt.texture },
    uZenite: { value: paleta.ceuZenite },
    uHorizonte: { value: paleta.ceuHorizonte },
    uNeblina: { value: paleta.neblina },
    uN0: { value: paleta.neb0 }, uN1: { value: paleta.neb1 }, uN2: { value: paleta.neb2 },
    uSol0: { value: paleta.sol0 }, uSol1: { value: paleta.sol1 }, uSol2: { value: paleta.sol2 },
    uSolDir: { value: SOL_DIR }, uSolRaio: { value: SOL_RAIO }, uSolBrilho: { value: 1.0 },
    uRot: { value: new THREE.Matrix3() },
    uTempo: { value: 0 },
  };
  const ceu = new THREE.Mesh(
    new THREE.SphereGeometry(180, 64, 32),
    new THREE.ShaderMaterial({
      uniforms, side: THREE.BackSide, depthWrite: false,
      vertexShader: /* glsl */ `
        varying vec3 vDir;
        void main(){
          vDir = position;
          vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          gl_Position = p.xyww;
        }`,
      fragmentShader: /* glsl */ `
        uniform sampler2D tNeb; uniform mat3 uRot; uniform float uTempo, uSolBrilho;
        uniform vec3 uZenite, uHorizonte, uNeblina, uN0, uN1, uN2;
        varying vec3 vDir;
        ${EQUIRET}
        ${SOL_GLSL}
        void main(){
          vec3 d = normalize(vDir);
          float e = d.y;
          vec3 col = mix(uHorizonte * 0.85, uZenite, smoothstep(-0.02, 0.45, e));
          col += uNeblina * (0.10 * exp(-abs(e) * 18.0) + 0.03 * exp(-abs(e) * 5.0));
          float alto = smoothstep(0.06, 0.45, e);
          vec4 n = texture2D(tNeb, equirect(uRot * d));
          col += (uN0 * n.r * 0.55 + uN1 * n.r * n.r * 0.16 + uN2 * (n.g * 0.06 + n.a * 0.22)) * alto;
          col *= 1.0 - n.b * 0.45 * alto;
          float m, halo;
          vec3 cs = sol(d, uTempo, m, halo);
          col += uSol1 * halo * 0.3;
          col = mix(col, cs * uSolBrilho, m);
          gl_FragColor = vec4(col, 1.0);
        }`,
    }),
  );
  ceu.renderOrder = -100;
  ceu.frustumCulled = false;
  grupo.add(ceu);

  // 3) Estrelas (só no alto do céu).
  const pos = new Float32Array(estrelas * 3);
  const dados = new Float32Array(estrelas * 2);
  for (let i = 0; i < estrelas; i++) {
    const u = Math.random() * 0.97 + 0.03, a = Math.random() * Math.PI * 2;
    const r = Math.sqrt(1 - u * u);
    pos.set([Math.cos(a) * r * 150, u * 150, Math.sin(a) * r * 150], i * 3);
    dados.set([Math.random(), Math.pow(Math.random(), 3)], i * 2);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aDado', new THREE.BufferAttribute(dados, 2));
  const uniformsEstrelas = { uTempo: { value: 0 }, uPixel: { value: 1 }, uCor: { value: paleta.chuvaCabeca } };
  const pontos = new THREE.Points(geo, new THREE.ShaderMaterial({
    uniforms: uniformsEstrelas, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */ `
      attribute vec2 aDado; uniform float uTempo, uPixel; varying float vBrilho;
      void main(){
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        float pisca = 0.6 + 0.4 * sin(uTempo * (0.6 + aDado.x * 2.5) + aDado.x * 40.0);
        float alto = smoothstep(0.04, 0.3, position.y / 150.0);
        vBrilho = (0.18 + aDado.y * 1.3) * pisca * alto;
        gl_PointSize = (1.1 + aDado.y * 2.4) * uPixel;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uCor; varying float vBrilho;
      void main(){
        float a = smoothstep(0.5, 0.0, length(gl_PointCoord - 0.5));
        gl_FragColor = vec4(uCor * vBrilho, a);
      }`,
  }));
  pontos.renderOrder = -99;
  pontos.frustumCulled = false;
  grupo.add(pontos);

  const eixoGiro = new THREE.Vector3(0.2, 1, 0.1).normalize();
  const m4 = new THREE.Matrix4();
  return {
    grupo,
    uniforms,
    atualizar(t, pixel) {
      m4.makeRotationAxis(eixoGiro, t * 0.003);
      uniforms.uRot.value.setFromMatrix4(m4);
      uniforms.uTempo.value = t;
      uniformsEstrelas.uTempo.value = t;
      uniformsEstrelas.uPixel.value = pixel;
    },
  };
}
