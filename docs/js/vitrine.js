// A vitrine: os projetos como painéis de vidro num carrossel sobre a grade. Arrastar gira,
// clicar no painel da frente abre o repositório, clicar num do lado traz ele para a frente.
import * as THREE from 'three';
import { SYNTHWAVE as S } from './temas.js';

const L = 1024, A = 640;

function quebrar(ctx, texto, largura) {
  const palavras = texto.split(' ');
  const linhas = [];
  let atual = '';
  for (const p of palavras) {
    const teste = atual ? `${atual} ${p}` : p;
    if (ctx.measureText(teste).width > largura && atual) { linhas.push(atual); atual = p; } else atual = teste;
  }
  if (atual) linhas.push(atual);
  return linhas;
}

function retangulo(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function texturaPainel(p, i, total) {
  const cv = document.createElement('canvas');
  cv.width = L; cv.height = A;
  const ctx = cv.getContext('2d');
  ctx.textBaseline = 'alphabetic';
  // topo: índice e linguagem
  ctx.font = '500 30px "JetBrains Mono", monospace';
  ctx.fillStyle = S.textoSecundario;
  ctx.fillText(`${String(i + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}`, 64, 92);
  ctx.font = '600 28px "JetBrains Mono", monospace';
  const lw = ctx.measureText(p.lang).width + 40;
  retangulo(ctx, L - 64 - lw, 58, lw, 46, 23);
  ctx.strokeStyle = S.ambar; ctx.lineWidth = 2.5; ctx.stroke();
  ctx.fillStyle = S.ambar;
  ctx.fillText(p.lang, L - 64 - lw + 20, 92);
  // título
  ctx.fillStyle = S.texto;
  let tam = 104;
  ctx.font = `700 ${tam}px "Space Grotesk", sans-serif`;
  while (ctx.measureText(p.nome).width > L - 128 && tam > 60) { tam -= 4; ctx.font = `700 ${tam}px "Space Grotesk", sans-serif`; }
  ctx.fillText(p.nome, 60, 230);
  // descrição
  ctx.font = '400 40px "Space Grotesk", sans-serif';
  ctx.fillStyle = S.textoSecundario;
  quebrar(ctx, p.desc, L - 128).slice(0, 3).forEach((l, k) => ctx.fillText(l, 64, 312 + k * 54));
  // pilha
  ctx.font = '500 26px "JetBrains Mono", monospace';
  let x = 64;
  for (const s of p.stack) {
    const w = ctx.measureText(s).width + 32;
    retangulo(ctx, x, 470, w, 42, 21);
    ctx.strokeStyle = 'rgba(124,92,255,0.85)'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = S.texto;
    ctx.fillText(s, x + 16, 500);
    x += w + 14;
  }
  // rodapé
  ctx.font = '600 28px "JetBrains Mono", monospace';
  ctx.fillStyle = S.magenta;
  ctx.fillText(`github.com/Dimasaas/${p.repo}  ↗`, 64, 590);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

export function criarVitrine(projetos, paleta) {
  const grupo = new THREE.Group();
  const carrossel = new THREE.Group();
  grupo.add(carrossel);
  const n = projetos.length, R = 7, passo = (Math.PI * 2) / n;
  const W = 2.72, H = 1.7;
  const geo = new THREE.PlaneGeometry(W, H);
  const uOpacidade = { value: 1 };
  let opacidadeAlvo = 1;
  const paineis = projetos.map((p, i) => {
    const u = {
      tTex: { value: texturaPainel(p, i, n) }, uTempo: { value: 0 }, uHover: { value: 0 }, uAtivo: { value: 0 },
      uA: { value: paleta.painel }, uB: { value: paleta.anelA }, uC: { value: paleta.anelB }, uFundo: { value: paleta.chao },
      uSemente: { value: i * 1.7 }, uOpacidade: uOpacidade,
    };
    const m = new THREE.Mesh(geo, new THREE.ShaderMaterial({
      uniforms: u, transparent: true, depthWrite: false, side: THREE.DoubleSide,
      vertexShader: /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: /* glsl */ `
        uniform sampler2D tTex; uniform float uTempo, uHover, uAtivo, uSemente, uOpacidade; uniform vec3 uA, uB, uC, uFundo;
        varying vec2 vUv;
        void main(){
          vec2 p = (vUv - 0.5) * vec2(1.6, 1.0);
          float r = 0.055;
          vec2 q = abs(p) - (vec2(0.8, 0.5) - r);
          float sd = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
          float aa = max(fwidth(sd), 1e-4);
          float dentro = smoothstep(aa, -aa, sd);
          float borda = smoothstep(aa * 1.8, 0.0, abs(sd + 0.004));
          float brilho = exp(-max(sd, 0.0) * 60.0) * step(0.0, sd) * 0.0;
          float ang = atan(p.y, p.x);
          float w = 0.5 + 0.5 * sin(ang * 1.0 - uTempo * 1.4 + uSemente);
          vec3 corBorda = w < 0.5 ? mix(uA, uB, w * 2.0) : mix(uB, uC, (w - 0.5) * 2.0);
          float ativo = 0.35 + 0.65 * uAtivo;
          if (!gl_FrontFacing) {
            gl_FragColor = vec4(corBorda * borda * 0.6 * ativo, borda * 0.6 * uOpacidade);
            return;
          }
          vec3 fundo = mix(uFundo * 1.6 + vec3(0.03, 0.01, 0.06), uFundo * 0.8, vUv.y);
          float scan = 0.012 * sin(vUv.y * 420.0 - uTempo * 3.0);
          vec4 t = texture2D(tTex, vUv);
          vec3 col = fundo + scan;
          col = mix(col, t.rgb * (0.85 + 0.25 * uHover), t.a);
          col *= ativo;
          col += corBorda * borda * (1.4 + 2.4 * uHover) * ativo;
          float alfa = dentro * (0.86 + 0.1 * uAtivo) + borda;
          gl_FragColor = vec4(col, clamp(alfa, 0.0, 1.0) * uOpacidade);
        }`,
    }));
    const a = i * passo;
    m.position.set(Math.sin(a) * R, 0, Math.cos(a) * R);
    m.rotation.y = a;
    m.userData = { indice: i, u };
    m.renderOrder = 20;
    carrossel.add(m);
    return m;
  });

  let angulo = 0, alvo = 0, velArrasto = 0, arrastando = false;
  const indiceFrente = () => ((Math.round(-alvo / passo) % n) + n) % n;

  return {
    grupo,
    paineis,
    atualizar(t, dt, hoverIndice) {
      uOpacidade.value += (opacidadeAlvo - uOpacidade.value) * Math.min(1, dt * 4);
      grupo.visible = uOpacidade.value > 0.01;
      if (!arrastando) {
        if (Math.abs(velArrasto) > 0.02) { alvo += velArrasto * dt; velArrasto *= Math.exp(-dt * 3); }
        else { velArrasto = 0; alvo += (Math.round(alvo / passo) * passo - alvo) * Math.min(1, dt * 6); }
      }
      angulo += (alvo - angulo) * Math.min(1, dt * 7);
      carrossel.rotation.y = angulo;
      const frente = indiceFrente();
      paineis.forEach((m, i) => {
        const u = m.userData.u;
        u.uTempo.value = t;
        u.uHover.value += ((i === hoverIndice ? 1 : 0) - u.uHover.value) * Math.min(1, dt * 10);
        u.uAtivo.value += ((i === frente ? 1 : 0) - u.uAtivo.value) * Math.min(1, dt * 6);
        m.position.y = Math.sin(t * 0.8 + i) * 0.06;
        const esc = 1 + u.uHover.value * 0.04 + u.uAtivo.value * 0.05;
        m.scale.set(esc, esc, 1);
      });
    },
    frente: indiceFrente,
    setVisivel(v) { opacidadeAlvo = v ? 1 : 0; },
    irPara(i) {
      // menor caminho até o painel i ficar de frente
      const alvoBruto = -i * passo;
      const k = Math.round((alvo - alvoBruto) / (Math.PI * 2));
      alvo = alvoBruto + k * Math.PI * 2;
      velArrasto = 0;
    },
    passo(d) { alvo = (Math.round(alvo / passo) - d) * passo; velArrasto = 0; },
    arrastar(dx, dtSeg) {
      arrastando = true;
      alvo += dx * 0.006;
      const v = (dx * 0.006) / Math.max(dtSeg, 0.008);
      velArrasto = velArrasto * 0.6 + v * 0.4;
    },
    soltar() { arrastando = false; },
  };
}
