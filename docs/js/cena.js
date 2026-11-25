// Monta a cena e cuida do laço: câmera com estações, parallax, modo explorar (OrbitControls),
// ponteiro (hover, arrasto, clique), temas interpolados e qualidade adaptativa.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';
import { criarCeu } from './ceu.js';
import { criarPaisagem, CHAO_Y } from './paisagem.js';
import { criarChuva } from './chuva.js';
import { criarNucleo } from './nucleo.js';
import { criarOrbita } from './orbita.js';
import { criarVitrine } from './vitrine.js';
import { criarPos, BLOOM_BASE } from './pos.js';
import { TEMAS, CHAVES_COR } from './temas.js';
import { TECNOLOGIAS, PROJETOS } from './dados.js';

const V3 = THREE.Vector3;
export const NUCLEO_Y = 1.6;
export const VITRINE_Y = -8.3;
export const ORDEM = ['nucleo', 'stack', 'projetos'];

const BASE = {
  nucleo: { pos: new V3(0, 2.1, 11.8), alvo: new V3(0, 1.3, 0), meia: 5.3, foco: new V3(0, NUCLEO_Y, 0) },
  stack: { pos: new V3(-6.2, 8.4, 9.4), alvo: new V3(0, 0.9, 0), meia: 5.6, foco: new V3(0, NUCLEO_Y, 0) },
  projetos: { pos: new V3(0, -7.2, 12.7), alvo: new V3(0, -8.05, 0), meia: 1.75, foco: new V3(0, VITRINE_Y, 7) },
  og: { pos: new V3(0, -0.4, 15), alvo: new V3(0, -0.2, 0), meia: 5.0, foco: new V3(0, NUCLEO_Y, 0) },
  explorar: { pos: new V3(13, 3.4, 21.5), alvo: new V3(0, -2.4, 0), meia: 9.5, foco: new V3(0, -2.4, 0) },
};

const suave = (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);

function carregarHDR(url, aoProgresso) {
  return new Promise((ok, erro) => new HDRLoader().load(url, ok,
    (e) => { if (e.lengthComputable) aoProgresso(e.loaded / e.total); }, erro));
}

export async function criarCena(canvas, { og = false, progresso = () => {}, eventos = {} } = {}) {
  const toque = matchMedia('(pointer: coarse)').matches;
  const renderer = new THREE.WebGLRenderer({
    canvas, antialias: false, alpha: false, stencil: false,
    powerPreference: 'high-performance', preserveDrawingBuffer: og,
  });
  renderer.setClearColor(0x0a0418, 1);
  // teto de 1.5: num Intel UHD, 1920x1080 a 1x custa ~10 ms por quadro; a 1.5 ainda fica acima de 60 fps
  const pixelMax = og ? 1 : Math.min(window.devicePixelRatio || 1, 1.5);
  let pixel = pixelMax;
  const tamanho = () => (og ? [1200, 627] : [window.innerWidth, window.innerHeight]);
  let [largura, altura] = tamanho();
  renderer.setPixelRatio(pixel);
  renderer.setSize(largura, altura, false);

  // ---------- assets ----------
  progresso('hdri', 0);
  const env = await carregarHDR('assets/hdri/ferndale_studio_12_1k.hdr', (p) => progresso('hdri', p));
  progresso('hdri', 1);
  const ruido = await new THREE.TextureLoader().loadAsync('assets/texturas/blue-noise-128.png');
  ruido.wrapS = ruido.wrapT = THREE.RepeatWrapping;
  ruido.minFilter = ruido.magFilter = THREE.NearestFilter;
  ruido.generateMipmaps = false;
  ruido.colorSpace = THREE.NoColorSpace;
  progresso('ruido', 1);

  // ---------- paleta viva (as cores dos shaders apontam para estes objetos) ----------
  const paleta = {}, alvoPaleta = {};
  CHAVES_COR.forEach((k) => { paleta[k] = new THREE.Color(TEMAS[0][k]); alvoPaleta[k] = new THREE.Color(TEMAS[0][k]); });
  let temaIdx = 0;

  // ---------- cena ----------
  const cena = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, largura / altura, 0.5, 420);
  const ceu = criarCeu(renderer, paleta, { estrelas: toque ? 1500 : 2600 });
  cena.add(ceu.grupo);
  const paisagem = criarPaisagem(paleta);
  cena.add(paisagem.grupo);
  const chuva = criarChuva(paleta, { colunas: toque ? 150 : 250 });
  cena.add(chuva.malha);
  const nucleo = criarNucleo(paleta, env, { particulas: toque ? 3600 : 7500, detalhe: toque ? 9 : 11 });
  nucleo.grupo.position.y = NUCLEO_Y;
  cena.add(nucleo.grupo);
  const orbita = criarOrbita(TECNOLOGIAS, paleta, env);
  orbita.grupo.position.y = NUCLEO_Y;
  cena.add(orbita.grupo);
  const vitrine = criarVitrine(PROJETOS, paleta);
  vitrine.grupo.position.y = VITRINE_Y;
  vitrine.setVisivel(false);
  cena.add(vitrine.grupo);
  progresso('cena', 1);

  const hdr = renderer.extensions.has('EXT_color_buffer_float') || renderer.extensions.has('EXT_color_buffer_half_float');
  // sem MSAA: num Intel UHD ele custava 8 ms por quadro; linhas e bordas já têm antisserrilhado no shader
  const pos = criarPos(renderer, cena, camera, { ruidoTex: ruido, hdr, amostras: 0, escalaBloom: toque ? 0.4 : 0.5 });
  pos.ajustar(largura, altura, pixel);

  // compila os shaders antes de mostrar (evita engasgo no primeiro quadro)
  await renderer.compileAsync(cena, camera);
  progresso('shaders', 1);

  // ---------- câmera ----------
  const camPos = new V3(), camAlvo = new V3();
  let estacao = og ? 'og' : 'nucleo';
  let modo = 'estacao';           // 'estacao' | 'explorar'
  let tween = null;

  function fovPara(aspecto) { return aspecto < 1 ? 52 : 42; }
  function destino(nome) {
    const b = BASE[nome];
    const aspecto = largura / altura;
    const tanV = Math.tan(THREE.MathUtils.degToRad(fovPara(aspecto) / 2));
    const off = b.pos.clone().sub(b.foco);
    const precisa = b.meia / (aspecto * tanV);
    const f = Math.max(1, precisa / off.length());
    const alvo = b.alvo.clone().sub(b.foco).multiplyScalar(f).add(b.foco);
    if (nome === 'nucleo') {
      // a câmera gira (não anda): núcleo e sol vão juntos para a direita no paisagem,
      // e sobem no retrato, abrindo espaço para o texto
      if (aspecto > 1.15) alvo.x -= THREE.MathUtils.clamp((aspecto - 1.15) * 3.2, 0, 2.4);
      else alvo.y -= THREE.MathUtils.clamp((1.15 - aspecto) * 6.5, 0, 3.6);
    }
    if (nome === 'stack' && aspecto < 1) {
      // no retrato a legenda fica embaixo: a órbita sobe na tela
      alvo.y -= THREE.MathUtils.clamp((1 - aspecto) * 6, 0, 3.4);
    }
    if (nome === 'projetos' && aspecto < 1) {
      // no retrato o cartão fica embaixo: o painel sobe na tela
      alvo.y -= THREE.MathUtils.clamp((1 - aspecto) * 3.4, 0, 2.2);
    }
    if (nome === 'stack' && aspecto > 1.15) {
      // a legenda fica à direita: o núcleo vai um pouco para a esquerda
      alvo.add(new V3(1, 0, 0.66).multiplyScalar(THREE.MathUtils.clamp((aspecto - 1.15) * 2.6, 0, 2.0)));
    }
    return { pos: b.foco.clone().add(off.multiplyScalar(f)), alvo };
  }
  {
    const d = destino(estacao);
    camPos.copy(d.pos); camAlvo.copy(d.alvo);
  }

  const controles = new OrbitControls(camera, canvas);
  controles.enabled = false;
  controles.enableDamping = true;
  controles.dampingFactor = 0.07;
  controles.minDistance = 4;
  controles.maxDistance = 46;
  controles.maxPolarAngle = Math.PI / 2 + 0.14;
  controles.autoRotateSpeed = 0.5;
  controles.addEventListener('start', () => { controles.autoRotate = false; });

  const efeitos = { glitch: 0, ac: 0, bloomExtra: 0 };

  function irPara(nome) {
    if (!BASE[nome]) return;
    if (modo === 'explorar') sairExplorar(false);
    estacao = nome;
    const d = destino(nome);
    tween = { dp: camPos.clone(), da: camAlvo.clone(), pp: d.pos, pa: d.alvo, k: 0, dur: 1.7 };
    efeitos.glitch = Math.max(efeitos.glitch, 0.35);
    if (nome !== 'stack') orbita.setGrupo(-1);
    vitrine.setVisivel(nome === 'projetos');
    eventos.onEstacao?.(nome);
  }

  function entrarExplorar() {
    if (modo === 'explorar') return;
    // primeiro um voo até a vista geral; os controles ligam quando ele termina
    modo = 'explorar';
    const d = destino('explorar');
    tween = { dp: camPos.clone(), da: camAlvo.clone(), pp: d.pos, pa: d.alvo, k: 0, dur: 1.6, explorar: true };
    efeitos.glitch = Math.max(efeitos.glitch, 0.35);
    vitrine.setVisivel(true);
    eventos.onEstacao?.('explorar');
  }
  function ligarControles() {
    controles.target.copy(camAlvo);
    camera.position.copy(camPos);
    controles.enabled = true;
    controles.autoRotate = true;
    controles.update();
  }
  function sairExplorar(voltar = true) {
    if (modo !== 'explorar') return;
    modo = 'estacao';
    if (controles.enabled) {
      controles.enabled = false;
      camPos.copy(camera.position);
      camAlvo.copy(controles.target);
      paralaxe.set(0, 0, 0);
    } else {
      tween = null; // saiu no meio do voo: continua de onde está
    }
    if (voltar) irPara(estacao === 'og' ? 'nucleo' : estacao);
  }

  // ---------- ponteiro ----------
  const ponteiro = { ndc: new THREE.Vector2(9, 9), ativo: false, noChao: null, x: -999, y: -999, movido: true };
  const chaoTmp = new V3();
  const raycaster = new THREE.Raycaster();
  const esfera = new THREE.Sphere(new V3(0, NUCLEO_Y, 0), nucleo.raio * 1.05);
  const esferaGema = new THREE.Sphere(new V3(0, NUCLEO_Y, 0), 1.4);
  const planoTela = new THREE.Plane();
  const tmp = new V3(), tmp2 = new V3(), quatInv = new THREE.Quaternion();
  let hover = { tipo: null, i: -1 };
  let arrasto = null;
  let cliquesGema = [];

  function atualizarNdc(e) {
    const r = canvas.getBoundingClientRect();
    ponteiro.x = e.clientX - r.left;
    ponteiro.y = e.clientY - r.top;
    ponteiro.ndc.set((ponteiro.x / r.width) * 2 - 1, -(ponteiro.y / r.height) * 2 + 1);
    ponteiro.movido = true;
  }

  canvas.addEventListener('pointermove', (e) => {
    atualizarNdc(e);
    ponteiro.ativo = true;
    if (arrasto) {
      const dx = e.clientX - arrasto.x, dy = e.clientY - arrasto.y;
      const agora = performance.now();
      const dtS = (agora - arrasto.t) / 1000;
      arrasto.x = e.clientX; arrasto.y = e.clientY; arrasto.t = agora;
      arrasto.total += Math.abs(dx) + Math.abs(dy);
      if (arrasto.total > 6 && modo !== 'explorar') {
        arrasto.ativo = true;
        canvas.classList.add('arrastando');
        if (estacao === 'projetos') vitrine.arrastar(dx, dtS);
        else nucleo.arrastar(dx, dy);
      }
    }
  });
  canvas.addEventListener('pointerleave', () => { ponteiro.ativo = false; ponteiro.noChao = null; });
  canvas.addEventListener('pointerdown', (e) => {
    atualizarNdc(e);
    ponteiro.ativo = true;
    arrasto = { x: e.clientX, y: e.clientY, t: performance.now(), total: 0, ativo: false };
    if (modo !== 'explorar') canvas.setPointerCapture?.(e.pointerId);
  });
  const soltar = (e) => {
    if (!arrasto) return;
    const foiArrasto = arrasto.total > 6;
    arrasto = null;
    canvas.classList.remove('arrastando');
    vitrine.soltar();
    if (!foiArrasto && e.type === 'pointerup') clique();
    if (e.pointerType !== 'mouse') ponteiro.ativo = false;
  };
  canvas.addEventListener('pointerup', soltar);
  canvas.addEventListener('pointercancel', soltar);

  let rodaAcum = 0, rodaUltima = 0;
  canvas.addEventListener('wheel', (e) => {
    if (modo === 'explorar') return;
    e.preventDefault();
    const agora = performance.now();
    if (estacao === 'projetos' && Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
      rodaAcum += e.deltaX;
      if (Math.abs(rodaAcum) > 80 && agora - rodaUltima > 350) { vitrine.passo(Math.sign(rodaAcum)); rodaAcum = 0; rodaUltima = agora; }
      return;
    }
    rodaAcum += e.deltaY;
    if (Math.abs(rodaAcum) > 70 && agora - rodaUltima > 900) {
      const i = Math.max(0, ORDEM.indexOf(estacao));
      const j = THREE.MathUtils.clamp(i + Math.sign(rodaAcum), 0, ORDEM.length - 1);
      if (j !== i) irPara(ORDEM[j]);
      rodaAcum = 0; rodaUltima = agora;
    }
  }, { passive: false });

  function projetar(v, saida) {
    tmp.copy(v).project(camera);
    saida.x = (tmp.x * 0.5 + 0.5) * largura;
    saida.y = (-tmp.y * 0.5 + 0.5) * altura;
    saida.z = tmp.z;
    return saida;
  }

  const projTmp = { x: 0, y: 0, z: 0 };
  const posMundoTec = TECNOLOGIAS.map(() => new V3());
  function atualizarPosTec() {
    orbita.posicoes.forEach((p, i) => posMundoTec[i].copy(p).add(orbita.grupo.position));
  }

  function calcularHover() {
    raycaster.setFromCamera(ponteiro.ndc, camera);
    let novo = { tipo: null, i: -1 };
    if (ponteiro.ativo) {
      // tecnologias: a mais próxima na tela, dentro do raio
      const limite = toque ? 34 : 24;
      let melhor = limite * limite, mi = -1;
      posMundoTec.forEach((p, i) => {
        projetar(p, projTmp);
        if (projTmp.z > 1) return;
        const d = (projTmp.x - ponteiro.x) ** 2 + (projTmp.y - ponteiro.y) ** 2;
        if (d < melhor) { melhor = d; mi = i; }
      });
      if (mi >= 0) novo = { tipo: 'tec', i: mi };
      if (!novo.tipo && vitrine.grupo.visible) {
        const hits = raycaster.intersectObjects(vitrine.paineis, false);
        for (const h of hits) {
          // só a face da frente
          tmp2.set(0, 0, 1).applyQuaternion(h.object.getWorldQuaternion(quatInv));
          if (tmp2.dot(raycaster.ray.direction) < 0) { novo = { tipo: 'projeto', i: h.object.userData.indice }; break; }
        }
      }
      if (!novo.tipo && raycaster.ray.intersectsSphere(esferaGema)) novo = { tipo: 'gema', i: 0 };
    }
    if (novo.tipo !== hover.tipo || novo.i !== hover.i) {
      hover = novo;
      canvas.style.cursor = hover.tipo ? 'pointer' : '';
      nucleo.setHover(hover.tipo === 'gema');
      eventos.onHover?.(hover);
    }

    // malha: direção do ponteiro no espaço local do giro
    const centro = esfera.center;
    let forca = 0;
    if (ponteiro.ativo) {
      if (raycaster.ray.intersectSphere(esfera, tmp)) { forca = 1; }
      else {
        raycaster.ray.closestPointToPoint(centro, tmp);
        const dist = tmp.distanceTo(centro);
        forca = Math.exp(-(dist - esfera.radius) * 0.9) * 0.55;
      }
      tmp.sub(centro).normalize();
      nucleo.giro.getWorldQuaternion(quatInv).invert();
      tmp.applyQuaternion(quatInv);
    }
    // partículas: ponteiro no plano do núcleo, de frente para a câmera
    camera.getWorldDirection(tmp2);
    planoTela.setFromNormalAndCoplanarPoint(tmp2, centro);
    const mundo = raycaster.ray.intersectPlane(planoTela, chaoTmp) ? chaoTmp.clone() : null;
    nucleo.ponteiro(forca > 0 ? tmp.clone() : null, forca, mundo, ponteiro.ativo ? 1 : 0);
    // chão
    ponteiro.noChao = ponteiro.ativo && raycaster.ray.intersectPlane(paisagem.plano, chaoTmp) && chaoTmp.length() < 120 ? chaoTmp.clone() : null;
  }

  function clique() {
    raycaster.setFromCamera(ponteiro.ndc, camera);
    if (hover.tipo === 'tec') {
      const novo = orbita.getFoco() === hover.i ? -1 : hover.i;
      orbita.setFoco(novo);
      eventos.onFocoTec?.(novo);
      return;
    }
    if (hover.tipo === 'projeto') {
      if (estacao !== 'projetos' && modo !== 'explorar') { irPara('projetos'); vitrine.irPara(hover.i); return; }
      if (vitrine.frente() === hover.i) eventos.onAbrirProjeto?.(PROJETOS[hover.i]);
      else vitrine.irPara(hover.i);
      return;
    }
    if (hover.tipo === 'gema') {
      nucleo.sobrecarga();
      efeitos.glitch = 0.6; efeitos.ac = 0.012; efeitos.bloomExtra = 1.2;
      const agora = performance.now();
      cliquesGema = cliquesGema.filter((c) => agora - c < 2500);
      cliquesGema.push(agora);
      if (cliquesGema.length >= 5) { cliquesGema = []; eventos.onSegredo?.('gema'); }
      return;
    }
    if (orbita.getFoco() >= 0) { orbita.setFoco(-1); eventos.onFocoTec?.(-1); }
    // onda: chuva, chão e malha
    chuva.choque(ponteiro.ndc, t);
    if (raycaster.ray.intersectPlane(paisagem.plano, chaoTmp)) paisagem.onda(chaoTmp.x, chaoTmp.z, t, 1);
    raycaster.ray.closestPointToPoint(esfera.center, tmp);
    tmp.sub(esfera.center).normalize();
    nucleo.giro.getWorldQuaternion(quatInv).invert();
    nucleo.onda(tmp.applyQuaternion(quatInv), t);
    efeitos.ac = Math.max(efeitos.ac, 0.004);
  }

  // ---------- temas ----------
  function aplicarTema(i) {
    temaIdx = ((i % TEMAS.length) + TEMAS.length) % TEMAS.length;
    CHAVES_COR.forEach((k) => alvoPaleta[k].set(TEMAS[temaIdx][k]));
    efeitos.glitch = 1;
    eventos.onTema?.(TEMAS[temaIdx]);
    return TEMAS[temaIdx].nome;
  }

  // ---------- tamanho e qualidade ----------
  function redimensionar() {
    [largura, altura] = tamanho();
    camera.aspect = largura / altura;
    camera.fov = og ? 40 : fovPara(camera.aspect);
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(pixel);
    renderer.setSize(largura, altura, false);
    pos.ajustar(largura, altura, pixel);
    if (modo !== 'explorar' && !tween) { const d = destino(estacao); camPos.copy(d.pos); camAlvo.copy(d.alvo); }
  }
  window.addEventListener('resize', redimensionar);
  redimensionar();

  let somaDt = 0, quadros = 0, fps = 60, avaliacoes = 0;
  function avaliarDesempenho(dt) {
    somaDt += dt; quadros++;
    if (somaDt < 2) return;
    fps = quadros / somaDt;
    somaDt = 0; quadros = 0; avaliacoes++;
    eventos.onFps?.(fps);
    if (og || avaliacoes < 2) return;
    // baixa a resolução interna em degraus; abaixo de 1x só em último caso
    // (modo economia de bateria trava o navegador em 30 fps e não deve borrar a cena)
    if (fps < 52 && pixel > 1) { pixel = Math.max(1, pixel - 0.25); redimensionar(); }
    else if (fps < 26 && pixel > 0.75) { pixel = 0.75; redimensionar(); }
  }

  // ---------- laço ----------
  // na capa o instante é fixo (dá para escolher outro com ?og=1&t=NN) e o grão é mínimo, para o PNG ficar leve
  let t = og ? (Number(new URLSearchParams(location.search).get('t')) || 15.5) : 0, ultimo = performance.now(), rodando = true;
  if (og) {
    pos.final.uniforms.uGrao.value = 0.012;
    pos.final.uniforms.uLinhas.value = 0;
    nucleo.diamante.rotation.x = 0.5; // a câmera da capa vê o diamante de baixo: inclina a mesa para ela
  }
  const paralaxe = new V3(), paralaxeAlvo = new V3();
  const direita = new V3(), cima = new V3();

  function passo(dt) {
    t += dt;
    // cores
    const kCor = Math.min(1, dt * 2.2);
    CHAVES_COR.forEach((k) => paleta[k].lerp(alvoPaleta[k], kCor));

    // câmera
    if (modo === 'explorar' && controles.enabled) {
      controles.update(dt);
      // não deixa a câmera atravessar o chão nem o alvo fugir da cena
      controles.target.y = THREE.MathUtils.clamp(controles.target.y, CHAO_Y + 2, 8);
      controles.target.x = THREE.MathUtils.clamp(controles.target.x, -25, 25);
      controles.target.z = THREE.MathUtils.clamp(controles.target.z, -25, 25);
      if (camera.position.y < CHAO_Y + 0.8) camera.position.y = CHAO_Y + 0.8;
    } else {
      if (tween) {
        tween.k = Math.min(1, tween.k + dt / tween.dur);
        const k = suave(tween.k);
        camPos.lerpVectors(tween.dp, tween.pp, k);
        camPos.y += Math.sin(k * Math.PI) * 1.4;
        camAlvo.lerpVectors(tween.da, tween.pa, k);
        if (tween.k >= 1) {
          const eraExplorar = tween.explorar;
          tween = null;
          if (eraExplorar && modo === 'explorar') { paralaxe.set(0, 0, 0); ligarControles(); }
        }
      }
      const mx = ponteiro.ativo && !toque ? ponteiro.ndc.x : 0;
      const my = ponteiro.ativo && !toque ? ponteiro.ndc.y : 0;
      direita.set(1, 0, 0); cima.set(0, 1, 0);
      paralaxeAlvo.set(0, 0, 0)
        .addScaledVector(direita, mx * 0.6 + Math.sin(t * 0.21) * 0.25)
        .addScaledVector(cima, my * 0.35 + Math.sin(t * 0.17) * 0.12);
      if (og) paralaxeAlvo.set(0, 0, 0);
      paralaxe.lerp(paralaxeAlvo, Math.min(1, dt * 2.5));
      camera.position.copy(camPos).add(paralaxe);
      camera.lookAt(camAlvo);
    }
    camera.updateMatrixWorld();

    atualizarPosTec();
    if (ponteiro.movido || ponteiro.ativo || true) calcularHover();
    ponteiro.movido = false;

    ceu.atualizar(t, pixel);
    paisagem.atualizar(t, dt, ponteiro);
    chuva.atualizar(t, dt, ponteiro, largura / altura);
    nucleo.atualizar(t, dt, pixel);
    orbita.atualizar(t, dt, pixel);
    vitrine.atualizar(t, dt, hover.tipo === 'projeto' ? hover.i : -1);

    efeitos.glitch *= Math.exp(-dt * 3.2);
    efeitos.ac *= Math.exp(-dt * 3.0);
    efeitos.bloomExtra *= Math.exp(-dt * 2.5);
    pos.final.uniforms.uGlitch.value = efeitos.glitch < 0.01 ? 0 : efeitos.glitch;
    pos.final.uniforms.uAC.value = 0.0022 + efeitos.ac;
    if (pos.bloom) pos.bloom.strength = BLOOM_BASE + efeitos.bloomExtra;
    pos.render(t, dt);
    eventos.aposQuadro?.();
  }

  function quadro(agora) {
    if (!rodando) return;
    requestAnimationFrame(quadro);
    const dt = Math.min(0.1, (agora - ultimo) / 1000);
    ultimo = agora;
    passo(dt);
    avaliarDesempenho(dt);
  }

  canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); rodando = false; eventos.onPerda?.(); });

  return {
    iniciar() { ultimo = performance.now(); requestAnimationFrame(quadro); },
    // usado no modo og: avança alguns quadros fixos e para
    quadrosFixos(n = 6) { for (let i = 0; i < n; i++) passo(1 / 60); rodando = false; },
    // medição (?debug=1): n quadros seguidos, esperando a GPU terminar; devolve ms por quadro
    medir(n = 60) {
      const gl = renderer.getContext();
      const px = new Uint8Array(4);
      const sincronizar = () => gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
      passo(1 / 60); sincronizar();
      const t0 = performance.now();
      for (let i = 0; i < n; i++) { passo(1 / 60); if (i % 4 === 3) sincronizar(); }
      sincronizar();
      return (performance.now() - t0) / n;
    },
    get pixel() { return pixel; },
    get _interno() { return { cena, pos, ceu, paisagem, chuva, nucleo, orbita, vitrine, camera }; },
    irPara,
    alternarExplorar() { if (modo === 'explorar') sairExplorar(true); else entrarExplorar(); return modo; },
    get modo() { return modo; },
    get estacao() { return modo === 'explorar' ? 'explorar' : estacao; },
    proximoTema() { return aplicarTema(temaIdx + 1); },
    temaPorId(id) { const i = TEMAS.findIndex((x) => x.id === id); return aplicarTema(i < 0 ? 0 : i); },
    get tema() { return TEMAS[temaIdx]; },
    setGrupo(g) { orbita.setGrupo(g); },
    setFocoTec(i) { orbita.setFoco(i); },
    vitrinePasso(d) { vitrine.passo(d); },
    vitrineFrente() { return vitrine.frente(); },
    vitrineIr(i) { vitrine.irPara(i); },
    projetarTec(i, saida) {
      projetar(posMundoTec[i], saida);
      // atrás do núcleo? (mais longe da câmera que o centro)
      saida.atras = posMundoTec[i].distanceToSquared(camera.position) > esfera.center.distanceToSquared(camera.position) + 1.5;
      return saida;
    },
    get fps() { return Math.round(fps); },
    get tamanho() { return [largura, altura]; },
    renderer,
  };
}
