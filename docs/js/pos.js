// Pós-processamento: bloom (UnrealBloomPass do three.js, em resolução reduzida) e um passe final
// próprio com aberração cromática, tone mapping, vinheta, grão em blue noise e um glitch curto.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { HASH } from './glsl.js';

export const BLOOM_BASE = 0.62;

const FINAL = {
  uniforms: {
    tDiffuse: { value: null }, tRuido: { value: null },
    uRes: { value: new THREE.Vector2(1, 1) }, uRuidoOff: { value: new THREE.Vector2() },
    uTempo: { value: 0 }, uAC: { value: 0.0022 }, uGrao: { value: 0.05 }, uVinheta: { value: 0.42 },
    uGlitch: { value: 0 }, uExposicao: { value: 0.92 }, uLinhas: { value: 0.035 },
  },
  vertexShader: /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse, tRuido; uniform vec2 uRes, uRuidoOff;
    uniform float uTempo, uAC, uGrao, uVinheta, uGlitch, uExposicao, uLinhas;
    varying vec2 vUv;
    ${HASH}
    // curva filmica (ajuste de Narkowicz) por canal: mantém o magenta saturado
    vec3 filmico(vec3 x) { return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0); }
    vec3 paraSRGB(vec3 c) { return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c)); }
    void main(){
      vec2 uv = vUv;
      if (uGlitch > 0.001) {
        float faixa = floor(uv.y * 26.0);
        float r = hash12(vec2(faixa, floor(uTempo * 20.0)));
        if (r < uGlitch * 0.55) uv.x += (hash12(vec2(faixa, floor(uTempo * 20.0) + 7.0)) - 0.5) * 0.1 * uGlitch;
      }
      vec2 dc = uv - 0.5;
      float r2 = dot(dc, dc);
      vec2 off = dc * (uAC + uGlitch * 0.012) * (0.4 + r2 * 3.2);
      vec3 col;
      col.r = texture2D(tDiffuse, uv + off).r;
      col.g = texture2D(tDiffuse, uv).g;
      col.b = texture2D(tDiffuse, uv - off).b;
      col = filmico(col * uExposicao);
      vec2 dv = dc * vec2(uRes.x / uRes.y, 1.0);
      float vin = smoothstep(1.2, 0.3, length(dv) * 1.05);
      col *= mix(1.0 - uVinheta, 1.0, vin);
      col = paraSRGB(col);
      vec3 bn = texture2D(tRuido, gl_FragCoord.xy / 128.0 + uRuidoOff).rgb;
      col += (bn - 0.5) * uGrao;
      col *= 1.0 - uLinhas * (0.5 + 0.5 * sin(gl_FragCoord.y * 3.14159));
      gl_FragColor = vec4(col, 1.0);
    }`,
};

export function criarPos(renderer, cena, camera, { amostras = 0, ruidoTex, escalaBloom = 0.5, hdr = true } = {}) {
  const tamanho = renderer.getDrawingBufferSize(new THREE.Vector2());
  const rt = new THREE.WebGLRenderTarget(tamanho.x, tamanho.y, {
    type: hdr ? THREE.HalfFloatType : THREE.UnsignedByteType,
    samples: amostras,
  });
  const composer = new EffectComposer(renderer, rt);
  composer.addPass(new RenderPass(cena, camera));
  // o bloom precisa de alvo em ponto flutuante; sem isso a cena segue sem ele
  let bloom = null;
  let escala = escalaBloom;
  if (hdr) {
    bloom = new UnrealBloomPass(new THREE.Vector2(tamanho.x * escalaBloom, tamanho.y * escalaBloom), BLOOM_BASE, 0.5, 0.92);
    const setSizeOriginal = bloom.setSize.bind(bloom);
    bloom.setSize = (w, h) => setSizeOriginal(Math.max(1, Math.round(w * escala)), Math.max(1, Math.round(h * escala)));
    composer.addPass(bloom);
  }
  const final = new ShaderPass(FINAL);
  final.uniforms.tRuido.value = ruidoTex;
  composer.addPass(final);

  return {
    composer, bloom, final,
    ajustar(largura, altura, pixel) {
      composer.setPixelRatio(pixel);
      composer.setSize(largura, altura);
      final.uniforms.uRes.value.set(largura * pixel, altura * pixel);
    },
    setEscalaBloom(e, largura, altura, pixel) { escala = e; this.ajustar(largura, altura, pixel); },
    render(t, dt) {
      final.uniforms.uTempo.value = t;
      final.uniforms.uRuidoOff.value.set(Math.random(), Math.random());
      composer.render(dt);
    },
  };
}
