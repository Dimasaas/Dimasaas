// Entrada da página: tela de boot, fontes, cena 3D, interface (dock, legenda, vitrine, rótulos,
// dica flutuante), atalhos, código Konami e "sudo". Sem WebGL2 ou com movimento reduzido, fica
// no modo leve (o conteúdo em texto do index.html).
import { GRUPOS, TECNOLOGIAS, PROJETOS } from './dados.js';
import { criarTerminal } from './terminal.js';

const html = document.documentElement;
const og = html.classList.contains('og');
const $ = (s) => document.querySelector(s);

// ---------------- modo leve ----------------
if (html.classList.contains('modo-leve')) {
  const aviso = $('#leve-aviso');
  const motivo = html.dataset.motivo;
  if (motivo === 'movimento') {
    aviso.innerHTML = 'Você pediu menos movimento, então a versão 3D ficou desligada. <button type="button" id="ver-3d">ver em 3D mesmo assim</button>';
    $('#ver-3d').addEventListener('click', () => { location.search = '?3d=1'; });
  } else if (motivo === 'webgl') {
    aviso.textContent = 'Este navegador não tem WebGL2, então a versão 3D não abre aqui. O conteúdo é o mesmo.';
  }
} else {
  iniciar().catch((erro) => {
    console.error(erro);
    html.classList.remove('saindo', 'pronto');
    html.classList.add('modo-leve');
    $('#leve-aviso').textContent = 'A versão 3D não carregou neste aparelho. O conteúdo é o mesmo.';
  });
}

// ---------------- boot ----------------
function criarBoot() {
  const el = $('#boot-texto'), barra = $('#boot-progresso');
  const linhas = [];
  const desenhar = () => { el.innerHTML = linhas.map((l) => l.html).join('\n'); };
  const ok = '<span class="ok">[  OK  ]</span>';
  const ag = '<span class="mag">[  ..  ]</span>';
  return {
    linha(id, texto, feito = false) {
      const l = linhas.find((x) => x.id === id);
      const h = `${feito ? ok : ag} ${texto}`;
      if (l) l.html = h; else linhas.push({ id, html: h });
      desenhar();
    },
    texto(t) { linhas.push({ id: Math.random(), html: t }); desenhar(); },
    progresso(p) { barra.style.width = `${Math.round(p * 100)}%`; },
  };
}

function barraTexto(p) {
  const n = 14, c = Math.round(p * n);
  return `${'█'.repeat(c)}${'░'.repeat(n - c)} ${String(Math.round(p * 100)).padStart(3, ' ')}%`;
}

async function carregarFontes() {
  const pedidos = [
    '700 64px "Space Grotesk"', '400 32px "Space Grotesk"',
    '500 28px "JetBrains Mono"', '600 28px "JetBrains Mono"',
    '500 64px "Kana Chuva"',
  ].map((f) => document.fonts.load(f, f.includes('Kana') ? 'ｱｲ' : 'Aa'));
  await Promise.race([Promise.all(pedidos), new Promise((r) => setTimeout(r, 3500))]);
}

async function iniciar() {
  const boot = criarBoot();
  const t0 = performance.now();
  let pular = false;
  if (!og) {
    boot.texto('<span class="forte">DIAMANTINO.OS 3.1</span>  <span class="mag">synthwave</span>');
    boot.texto('');
    boot.linha('kernel', 'iniciando o kernel do perfil', true);
    boot.linha('fontes', 'carregando fontes');
  }
  await carregarFontes();
  if (!og) {
    boot.linha('fontes', 'fontes: Space Grotesk, JetBrains Mono, Noto Sans JP', true);
    boot.linha('three', 'carregando three.js r182');
    boot.progresso(0.12);
  }
  const { criarCena } = await import('./cena.js');
  if (!og) { boot.linha('three', 'three.js r182', true); boot.progresso(0.25); }

  const ui = criarUI();
  const cena = await criarCena($('#palco'), {
    og,
    progresso(etapa, p) {
      if (og) return;
      if (etapa === 'hdri') { boot.linha('hdri', `ambiente HDR  ${barraTexto(p)}`, p >= 1); boot.progresso(0.25 + p * 0.45); }
      if (etapa === 'cena') { boot.linha('orbita', `${TECNOLOGIAS.length} tecnologias em órbita`, true); boot.linha('vitrine', `${PROJETOS.length} projetos na vitrine`, true); boot.linha('shaders', 'compilando shaders'); boot.progresso(0.8); }
      if (etapa === 'shaders') { boot.linha('shaders', 'shaders compilados', true); boot.linha('chuva', 'chuva de caracteres: ligada', true); boot.progresso(1); }
    },
    eventos: ui.eventos,
  });
  ui.ligar(cena);
  if (new URLSearchParams(location.search).has('debug')) window.__diamantino = cena;

  if (og) {
    cena.quadrosFixos(8);
    html.classList.add('pronto');
    html.dataset.ogPronto = '1';
    return;
  }

  boot.texto('');
  boot.texto('bem-vindo, <span class="mag">visitante</span>.');
  const minimo = 1500;
  const fim = () => { pular = true; };
  $('#boot').addEventListener('pointerdown', fim, { once: true });
  window.addEventListener('keydown', fim, { once: true });
  const restante = Math.max(0, minimo - (performance.now() - t0));
  await new Promise((r) => {
    const t = setTimeout(r, restante + 450);
    const checar = () => { if (pular) { clearTimeout(t); r(); } else if (performance.now() - t0 < minimo + 500) requestAnimationFrame(checar); };
    checar();
  });
  cena.iniciar();
  html.classList.add('saindo');
  requestAnimationFrame(() => html.classList.add('pronto'));
  ui.glitchNome();
}

// ---------------- interface ----------------
function criarUI() {
  let cena = null;
  const dica = $('#dica-flutuante');
  const aviso = $('#aviso');
  let avisoTimer = 0;
  const avisar = (txt, ms = 2600) => {
    aviso.innerHTML = txt;
    aviso.classList.add('vis');
    clearTimeout(avisoTimer);
    avisoTimer = setTimeout(() => aviso.classList.remove('vis'), ms);
  };

  // rótulos das tecnologias
  const camada = $('#rotulos');
  const rotulos = TECNOLOGIAS.map((t) => {
    const d = document.createElement('div');
    d.className = 'rotulo';
    d.style.setProperty('--cor', t.cor);
    d.innerHTML = `<i></i>${t.nome}`;
    camada.appendChild(d);
    return d;
  });

  // legenda
  const legenda = $('#legenda');
  let grupoFixo = -1;
  GRUPOS.forEach((g, gi) => {
    const li = document.createElement('li');
    li.innerHTML = `<button type="button" aria-pressed="false"><span class="ponto" style="color:${g.cor}"></span>${g.nome}<span class="qtd">${g.itens.length}</span></button>`;
    const b = li.querySelector('button');
    b.addEventListener('pointerenter', () => cena?.setGrupo(gi));
    b.addEventListener('pointerleave', () => cena?.setGrupo(grupoFixo));
    b.addEventListener('focus', () => cena?.setGrupo(gi));
    b.addEventListener('blur', () => cena?.setGrupo(grupoFixo));
    b.addEventListener('click', () => {
      grupoFixo = grupoFixo === gi ? -1 : gi;
      legenda.querySelectorAll('button').forEach((x, k) => x.setAttribute('aria-pressed', String(k === grupoFixo)));
      cena?.setGrupo(grupoFixo);
    });
    legenda.appendChild(li);
  });

  // vitrine
  let frenteVista = -1;
  const atualizarProjeto = (i) => {
    const p = PROJETOS[i];
    $('#proj-nome').textContent = p.nome;
    $('#proj-desc').textContent = p.desc;
    $('#proj-abrir').href = p.url;
    $('#proj-abrir').setAttribute('aria-label', `abrir o repositório ${p.nome}`);
  };
  $('#proj-ant').addEventListener('click', () => cena?.vitrinePasso(-1));
  $('#proj-prox').addEventListener('click', () => cena?.vitrinePasso(1));

  // dock
  const botoes = [...document.querySelectorAll('[data-estacao], [data-acao]')];
  const marcar = (nome) => {
    document.querySelectorAll('.dock button').forEach((b) => {
      const ativo = b.dataset.estacao === nome || (b.dataset.acao === 'explorar' && nome === 'explorar');
      b.setAttribute('aria-pressed', String(ativo));
    });
    $('#hero').classList.toggle('recolhido', nome !== 'nucleo');
    $('#cartao-stack').hidden = nome !== 'stack';
    $('#cartao-projetos').hidden = nome !== 'projetos';
    $('#cartao-explorar').hidden = nome !== 'explorar';
  };
  let terminal = null;
  botoes.forEach((b) => b.addEventListener('click', () => {
    if (!cena) return;
    if (b.dataset.estacao) cena.irPara(b.dataset.estacao);
    else if (b.dataset.acao === 'explorar') cena.alternarExplorar();
    else if (b.dataset.acao === 'terminal') terminal.abrir();
  }));
  $('#sair-explorar').addEventListener('click', () => { if (cena?.modo === 'explorar') cena.alternarExplorar(); });

  // logo: volta ao núcleo; três toques rápidos trocam o tema (o Konami do celular)
  let toquesLogo = [];
  $('#logo').addEventListener('click', () => {
    if (!cena) return;
    const agora = performance.now();
    toquesLogo = toquesLogo.filter((x) => agora - x < 900);
    toquesLogo.push(agora);
    if (toquesLogo.length >= 3) { toquesLogo = []; const nome = cena.proximoTema(); avisar(`tema: <b>${nome}</b>`); return; }
    cena.irPara('nucleo');
  });

  // glitch do nome de tempos em tempos
  const nome = $('.glitch');
  const glitchNome = () => {
    nome.classList.remove('falhando');
    void nome.offsetWidth;
    nome.classList.add('falhando');
  };
  setInterval(() => { if (!document.hidden) glitchNome(); }, 5200);

  // teclado: atalhos, Konami e "sudo"
  const KONAMI = ['arrowup', 'arrowup', 'arrowdown', 'arrowdown', 'arrowleft', 'arrowright', 'arrowleft', 'arrowright', 'b', 'a'];
  let seq = [], letras = '';
  window.addEventListener('keydown', (e) => {
    if (!cena || terminal?.aberto) return;
    if (e.target.closest && e.target.closest('input, textarea')) return;
    const k = e.key.toLowerCase();
    seq = [...seq, k].slice(-KONAMI.length);
    if (KONAMI.every((x, i) => seq[i] === x)) {
      seq = [];
      const nomeTema = cena.proximoTema();
      avisar(`↑↑↓↓←→←→BA · tema: <b>${nomeTema}</b>`);
      return;
    }
    if (k.length === 1 && /[a-z]/.test(k)) {
      letras = (letras + k).slice(-4);
      if (letras === 'sudo') { letras = ''; terminal.abrir({ autoSudo: true }); return; }
    }
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (k === '1') cena.irPara('nucleo');
    else if (k === '2') cena.irPara('stack');
    else if (k === '3') cena.irPara('projetos');
    else if (k === '4') cena.alternarExplorar();
    else if (k === '5') terminal.abrir();
    else if (k === 'escape' && cena.modo === 'explorar') cena.alternarExplorar();
    else if (cena.estacao === 'projetos' && (k === 'arrowleft' || k === 'arrowright')) cena.vitrinePasso(k === 'arrowright' ? 1 : -1);
  });

  // dica flutuante
  let hoverAtual = { tipo: null, i: -1 };
  let px = 0, py = 0;
  const guardar = (e) => { px = e.clientX; py = e.clientY; };
  window.addEventListener('pointermove', guardar, { passive: true });
  window.addEventListener('pointerdown', guardar, { passive: true });
  const mostrarDica = (h) => {
    if (h.tipo === 'tec') {
      const t = TECNOLOGIAS[h.i];
      dica.innerHTML = `<strong>${t.nome}</strong><span><i class="cor" style="background:${t.cor}"></i>${t.grupo} · anel ${t.anel}</span>`;
    } else if (h.tipo === 'projeto') {
      const p = PROJETOS[h.i];
      const frente = cena.vitrineFrente() === h.i && cena.estacao === 'projetos';
      dica.innerHTML = `<strong>${p.nome}</strong><span>${frente ? 'clique para abrir o repositório ↗' : 'clique para trazer para a frente'}</span>`;
    } else if (h.tipo === 'gema') {
      dica.innerHTML = '<strong>o núcleo</strong><span>clique para sobrecarregar · arraste para girar</span>';
    }
    dica.classList.toggle('vis', !!h.tipo);
  };

  // atualização por quadro (rótulos e dica seguem a cena)
  const proj = { x: 0, y: 0, z: 0 };
  let focoTec = -1;
  function aposQuadro() {
    const est = cena.estacao;
    const todos = est === 'stack';
    const [w, h] = cena.tamanho;
    for (let i = 0; i < rotulos.length; i++) {
      const vis = todos || i === focoTec || (hoverAtual.tipo === 'tec' && hoverAtual.i === i);
      const r = rotulos[i];
      if (!vis) { if (r.classList.contains('vis')) r.classList.remove('vis'); continue; }
      cena.projetarTec(i, proj);
      const dentro = proj.z < 1 && proj.x > -50 && proj.x < w + 50 && proj.y > -20 && proj.y < h + 20;
      r.classList.toggle('vis', dentro);
      r.classList.toggle('atras', proj.atras && i !== focoTec && !(hoverAtual.tipo === 'tec' && hoverAtual.i === i));
      if (dentro) r.style.transform = `translate(${proj.x.toFixed(1)}px, ${proj.y.toFixed(1)}px) translate(-50%, -170%)`;
    }
    if (hoverAtual.tipo) {
      let x = px + 16, y = py + 18;
      if (hoverAtual.tipo === 'tec' && matchMedia('(pointer: coarse)').matches) { cena.projetarTec(hoverAtual.i, proj); x = proj.x + 14; y = proj.y + 14; }
      const bw = dica.offsetWidth, bh = dica.offsetHeight;
      x = Math.min(x, w - bw - 8); y = Math.min(y, h - bh - 8);
      dica.style.transform = `translate(${x}px, ${y}px)`;
    }
    if (cena.estacao === 'projetos') {
      const f = cena.vitrineFrente();
      if (f !== frenteVista) { frenteVista = f; atualizarProjeto(f); }
    }
  }

  let dicaToqueTimer = 0;
  const eventos = {
    onEstacao(nome) { marcar(nome); },
    onHover(h) {
      hoverAtual = h;
      if (h.tipo) mostrarDica(h);
      else dica.classList.remove('vis');
      if (h.tipo && matchMedia('(pointer: coarse)').matches) {
        clearTimeout(dicaToqueTimer);
        dicaToqueTimer = setTimeout(() => dica.classList.remove('vis'), 2600);
      }
    },
    onFocoTec(i) { focoTec = i; },
    onAbrirProjeto(p) { window.open(p.url, '_blank', 'noopener'); },
    onTema(tema) {
      Object.entries({
        '--fundo': tema.css.fundo, '--fundo-profundo': tema.css.fundoProfundo, '--superficie': tema.css.superficie,
        '--destaque': tema.css.destaque, '--roxo': tema.css.roxo, '--azul': tema.css.azul, '--ambar': tema.css.ambar,
        '--texto': tema.css.texto, '--texto2': tema.css.texto2, '--borda': tema.css.borda,
      }).forEach(([k, v]) => html.style.setProperty(k, v));
      $('#st-tema').textContent = tema.nome;
      glitchNome();
    },
    onFps(f) { $('#st-fps').textContent = `${Math.round(f)} fps`; },
    onSegredo() { avisar('calma, é só um diamante. <span style="opacity:.7">(lapidado à mão, 112 facetas)</span>', 3200); },
    onPerda() {
      html.classList.add('modo-leve');
      $('#leve-aviso').textContent = 'O navegador desligou o 3D (contexto WebGL perdido). O conteúdo é o mesmo.';
    },
    aposQuadro: () => aposQuadro(),
  };

  return {
    eventos,
    glitchNome,
    ligar(c) {
      cena = c;
      terminal = criarTerminal($('#terminal'), {
        proximoTema: () => { const n = cena.proximoTema(); return n; },
        temaPorId: (id) => cena.temaPorId(id),
        temaAtual: () => cena.tema.nome,
        irPara: (e) => { if (e === 'explorar') { if (cena.modo !== 'explorar') cena.alternarExplorar(); } else cena.irPara(e); },
        fps: () => cena.fps,
      });
      if (matchMedia('(pointer: coarse)').matches) {
        $('#st-dica').innerHTML = 'toque em <kbd>terminal</kbd>';
        $('#cartao-stack .cartao-dica').textContent = 'toque num grupo para acender; toque num cristal para ver o nome';
        $('#hero-dica').textContent = 'arraste para girar o diamante · toque nos cristais';
      }
      atualizarProjeto(0);
      marcar('nucleo');
    },
  };
}
