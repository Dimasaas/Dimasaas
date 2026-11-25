// Céu: nebulosa assada uma vez numa textura equiretangular (densidades em tons de cinza,
// coloridas no shader pela paleta do tema) + estrelas em pontos.
import * as THREE from 'three';
import { RUIDO, EQUIRET } from './glsl.js';

export function criarCeu(renderer, paleta, { estrelas = 2600 } = {}) {
  const grupo = new THREE.Group();

  // 1) Assa as densidades (R: nuvem, G: filamentos, B: poeira escura, A: nós brilhantes).
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
          vec3 eixo = normalize(vec3(0.25, 1.0, 0.35));
          float faixa = exp(-pow(dot(d, eixo) / 0.55, 2.0));
          float nuvem = fbm3(d * 1.7 + 3.0) * 0.5 + 0.5;
          nuvem = smoothstep(0.35, 0.95, nuvem) * (0.25 + 0.75 * faixa);
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

  // 2) Esfera do céu (sempre no plano de fundo).
  const uniformsCeu = {
    tNeb: { value: rt.texture },
    uF0: { value: paleta.fundo0 },
    uF1: { value: paleta.fundo1 },
    uN0: { value: paleta.neb0 },
    uN1: { value: paleta.neb1 },
    uN2: { value: paleta.neb2 },
    uRot: { value: new THREE.Matrix3() },
  };
  const ceu = new THREE.Mesh(
    new THREE.SphereGeometry(180, 48, 24),
    new THREE.ShaderMaterial({
      uniforms: uniformsCeu, side: THREE.BackSide, depthWrite: false,
      vertexShader: /* glsl */ `
        varying vec3 vDir;
        void main(){
          vDir = position;
          vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          gl_Position = p.xyww;
        }`,
      fragmentShader: /* glsl */ `
        uniform sampler2D tNeb; uniform vec3 uF0, uF1, uN0, uN1, uN2; uniform mat3 uRot;
        varying vec3 vDir;
        ${EQUIRET}
        void main(){
          vec3 d = normalize(vDir);
          vec4 n = texture2D(tNeb, equirect(uRot * d));
          vec3 col = mix(uF0, uF1, smoothstep(-0.6, 0.9, d.y));
          col += uN0 * n.r * 0.9 + uN1 * n.r * n.r * 0.7 + uN2 * (n.g * 0.22 + n.a * 0.6);
          col *= 1.0 - n.b * 0.6;
          gl_FragColor = vec4(col, 1.0);
        }`,
    }),
  );
  ceu.renderOrder = -100;
  ceu.frustumCulled = false;
  grupo.add(ceu);

  // 3) Estrelas.
  const pos = new Float32Array(estrelas * 3);
  const dados = new Float32Array(estrelas * 2);
  for (let i = 0; i < estrelas; i++) {
    const u = Math.random() * 2 - 1, a = Math.random() * Math.PI * 2;
    const r = Math.sqrt(1 - u * u);
    pos.set([Math.cos(a) * r * 150, u * 150, Math.sin(a) * r * 150], i * 3);
    dados.set([Math.random(), Math.pow(Math.random(), 3)], i * 2);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aDado', new THREE.BufferAttribute(dados, 2));
  const uniformsEstrelas = { uTempo: { value: 0 }, uPixel: { value: 1 }, uCor: { value: paleta.particulaA } };
  const pontos = new THREE.Points(geo, new THREE.ShaderMaterial({
    uniforms: uniformsEstrelas, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */ `
      attribute vec2 aDado; uniform float uTempo, uPixel; varying float vBrilho; varying float vTom;
      void main(){
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        float pisca = 0.65 + 0.35 * sin(uTempo * (0.6 + aDado.x * 2.5) + aDado.x * 40.0);
        vBrilho = (0.22 + aDado.y * 1.5) * pisca;
        vTom = aDado.x;
        gl_PointSize = (1.2 + aDado.y * 2.6) * uPixel;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uCor; varying float vBrilho; varying float vTom;
      void main(){
        vec2 c = gl_PointCoord - 0.5;
        float a = smoothstep(0.5, 0.0, length(c));
        vec3 col = mix(vec3(0.85, 0.9, 1.0), uCor, vTom * 0.6);
        gl_FragColor = vec4(col * vBrilho, a);
      }`,
  }));
  pontos.renderOrder = -99;
  pontos.frustumCulled = false;
  grupo.add(pontos);

  const eixoGiro = new THREE.Vector3(0.2, 1, 0.1).normalize();
  const m4 = new THREE.Matrix4();
  return {
    grupo,
    atualizar(t, pixel) {
      m4.makeRotationAxis(eixoGiro, t * 0.004);
      uniformsCeu.uRot.value.setFromMatrix4(m4);
      uniformsEstrelas.uTempo.value = t;
      uniformsEstrelas.uPixel.value = pixel;
      pontos.rotation.y = t * 0.004;
    },
  };
}
