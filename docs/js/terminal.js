// Terminal de mentira: abre ao digitar "sudo" em qualquer lugar (ou pelo botão) e entende
// alguns comandos. O principal é "sudo contratar --joao".
import { PERFIL, GRUPOS, PROJETOS, TECNOLOGIAS } from './dados.js?v=20261125b';

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const espera = (ms) => new Promise((r) => setTimeout(r, ms));

export function criarTerminal(raiz, acoes) {
  const saida = raiz.querySelector('.term-saida');
  const form = raiz.querySelector('.term-linha');
  const entrada = raiz.querySelector('.term-entrada');
  const historico = [];
  let posHist = 0, ocupado = false, aberto = false;

  function linha(html, classe = '') {
    const d = document.createElement('div');
    d.className = `term-l ${classe}`;
    d.innerHTML = html;
    saida.appendChild(d);
    saida.scrollTop = saida.scrollHeight;
    return d;
  }
  const prompt = (cmd) => linha(`<span class="t-prompt">visitante@diamantino</span><span class="t-dim">:~$</span> ${esc(cmd)}`);

  async function digitar(cmd) {
    const d = linha('<span class="t-prompt">visitante@diamantino</span><span class="t-dim">:~$</span> <span class="t-dig"></span>');
    const alvo = d.querySelector('.t-dig');
    for (const ch of cmd) { alvo.textContent += ch; await espera(28 + Math.random() * 40); }
    await espera(180);
  }

  const link = (url, texto) => `<a href="${url}" target="_blank" rel="noopener">${esc(texto)}</a>`;

  const COMANDOS = {
    help: () => [
      'comandos:',
      '  <b>sudo contratar --joao</b>   o comando mais importante deste sistema',
      '  <b>whoami</b>                   quem é o dono da máquina',
      '  <b>neofetch</b>                 ficha do sistema',
      '  <b>stack</b>                    as 31 tecnologias, por grupo',
      '  <b>projetos</b>                 a vitrine; <b>abrir &lt;nome&gt;</b> abre o repositório',
      '  <b>github</b> · <b>linkedin</b>        os links',
      '  <b>tema</b>                     troca o tema (ou digite o código Konami: ↑↑↓↓←→←→BA)',
      '  <b>ir núcleo|stack|projetos</b>  move a câmera',
      '  <b>clear</b> · <b>exit</b>',
    ],
    ajuda: () => COMANDOS.help(),
    whoami: () => [`<span class="t-mag">${esc(PERFIL.nome)}</span>`, `1001 Negócios Imobiliários · Goiânia, GO`, 'eu construo o software que roda a operação de uma imobiliária de loteamentos.'],
    neofetch: () => [
      '<pre class="t-ascii t-mag">' + esc(String.raw`
      ________
     / /    \ \
    /_/______\_\
    \ \      / /
     \ \    / /
      \ \  / /
       \ \/ /
        \  /
         \/`.slice(1)) + '</pre>',
      `<span class="t-mag">visitante</span>@<span class="t-mag">diamantino</span>`,
      '----------------------------',
      `<b>SO</b>: DIAMANTINO.OS 3.1 (synthwave)`,
      `<b>Dono</b>: ${esc(PERFIL.nome)}`,
      `<b>Local</b>: Goiânia, GO`,
      `<b>Stack</b>: ${TECNOLOGIAS.length} tecnologias em 3 anéis`,
      `<b>Vitrine</b>: ${PROJETOS.length} projetos de código aberto`,
      `<b>Tema</b>: ${esc(acoes.temaAtual())}`,
      `<b>Tela</b>: ${window.innerWidth}×${window.innerHeight} · ${acoes.fps()} fps`,
    ],
    stack: () => GRUPOS.flatMap((g) => [`<span class="t-mag">${esc(g.nome)}</span> <span class="t-dim">(anel ${g.anel})</span>`, '  ' + g.itens.map(esc).join(' · ')]),
    projetos: () => PROJETOS.map((p) => `${link(p.url, p.nome.padEnd(18, ' '))} <span class="t-dim">${esc(p.desc)}</span>`),
    ls: () => ['<span class="t-azul">projetos/</span>  stack.txt  sobre.txt  <span class="t-ok">contratar*</span>'],
    cat: (args) => {
      if (args[0] === 'sobre.txt') return COMANDOS.whoami();
      if (args[0] === 'stack.txt') return COMANDOS.stack();
      return [`cat: ${esc(args[0] || '')}: arquivo não encontrado`];
    },
    abrir: (args) => {
      const nome = (args[0] || '').toLowerCase();
      const p = PROJETOS.find((x) => x.nome.toLowerCase() === nome || x.repo.toLowerCase() === nome);
      if (!p) return [`abrir: projeto "${esc(args[0] || '')}" não existe. digite <b>projetos</b>.`];
      window.open(p.url, '_blank', 'noopener');
      return [`abrindo ${link(p.url, p.url)} ...`];
    },
    github: () => { window.open(PERFIL.github, '_blank', 'noopener'); return [`abrindo ${link(PERFIL.github, 'github.com/Dimasaas')} ...`]; },
    linkedin: () => { window.open(PERFIL.linkedin, '_blank', 'noopener'); return [`abrindo ${link(PERFIL.linkedin, 'linkedin.com/in/diamantinojv')} ...`]; },
    tema: () => { const nome = acoes.proximoTema(); return [`tema: <span class="t-mag">${esc(nome)}</span>`]; },
    matrix: () => { const nome = acoes.temaPorId('matrix'); return ['acorda, Neo...', `tema: <span class="t-mag">${esc(nome)}</span>`]; },
    ir: (args) => {
      const mapa = { 'núcleo': 'nucleo', nucleo: 'nucleo', stack: 'stack', projetos: 'projetos', explorar: 'explorar' };
      const e = mapa[(args[0] || '').toLowerCase()];
      if (!e) return ['uso: ir núcleo | stack | projetos | explorar'];
      acoes.irPara(e);
      return [`câmera → ${esc(args[0])}`];
    },
    contratar: () => ['contratar: permissão negada. <span class="t-dim">(tente com sudo)</span>'],
    date: () => [new Date().toLocaleString('pt-BR')],
    echo: (args) => [esc(args.join(' '))],
    clear: () => { saida.innerHTML = ''; return []; },
    limpar: () => COMANDOS.clear(),
    exit: () => { fechar(); return []; },
    sair: () => COMANDOS.exit(),
  };

  async function sudo(args) {
    const resto = args.join(' ');
    if (/^rm\s+-rf/.test(resto)) return ['boa tentativa. o núcleo tem backup diário. <span class="t-dim">;)</span>'];
    if (!/^contratar(\s+--joao)?$/.test(resto)) return [`sudo: ${esc(args[0] || '')}: comando não encontrado`];
    const l = linha('[sudo] senha para visitante: ');
    for (let i = 0; i < 8; i++) { l.textContent += '*'; await espera(55); }
    await espera(250);
    linha('<span class="t-ok">[ OK ]</span> verificando credenciais');
    await espera(220);
    linha('<span class="t-ok">[ OK ]</span> 31 tecnologias carregadas');
    await espera(220);
    linha('<span class="t-ok">[ OK ]</span> café na conta');
    await espera(260);
    return [
      '<pre class="t-ascii t-mag">' + esc([
        '╔══════════════════════════════════════╗',
        '║   ACESSO CONCEDIDO.  Boa escolha.    ║',
        '╚══════════════════════════════════════╝',
      ].join('\n')) + '</pre>',
      'processo "contratar" iniciado em segundo plano...',
      `próximo passo: ${link(PERFIL.linkedin, 'linkedin.com/in/diamantinojv')} <span class="t-dim">(ou ${link(PERFIL.github, 'github.com/Dimasaas')})</span>`,
    ];
  }

  async function executar(cmd) {
    const limpo = cmd.trim();
    if (!limpo) return;
    historico.push(limpo); posHist = historico.length;
    const [nome, ...args] = limpo.split(/\s+/);
    let res;
    if (nome === 'sudo') res = await sudo(args);
    else if (COMANDOS[nome.toLowerCase()]) res = COMANDOS[nome.toLowerCase()](args);
    else res = [`comando não encontrado: ${esc(nome)}. digite <b>help</b>.`];
    (res || []).forEach((r) => linha(r));
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (ocupado) return;
    const cmd = entrada.value;
    entrada.value = '';
    prompt(cmd);
    ocupado = true;
    try { await executar(cmd); } finally { ocupado = false; }
  });
  entrada.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp' && historico.length) { posHist = Math.max(0, posHist - 1); entrada.value = historico[posHist]; e.preventDefault(); }
    else if (e.key === 'ArrowDown') { posHist = Math.min(historico.length, posHist + 1); entrada.value = historico[posHist] || ''; e.preventDefault(); }
    else if (e.key === 'Escape') fechar();
    else if (e.key === 'Tab') {
      e.preventDefault();
      const v = entrada.value;
      const op = [...Object.keys(COMANDOS), 'sudo contratar --joao'].filter((c) => c.startsWith(v));
      if (op.length === 1) entrada.value = op[0];
    }
  });
  raiz.querySelector('.term-fechar').addEventListener('click', fechar);
  raiz.addEventListener('pointerdown', (e) => { if (e.target === raiz) fechar(); });

  function fechar() {
    if (!aberto) return;
    aberto = false;
    raiz.classList.remove('aberto');
    raiz.setAttribute('aria-hidden', 'true');
    acoes.aoFechar?.();
  }

  async function abrir({ autoSudo = false } = {}) {
    if (!aberto) {
      aberto = true;
      raiz.classList.add('aberto');
      raiz.setAttribute('aria-hidden', 'false');
      if (!saida.childElementCount) {
        linha('DIAMANTINO.OS 3.1 · tty1', 't-dim');
        linha('digite <b>help</b> para ver os comandos.', 't-dim');
      }
    }
    if (autoSudo && !ocupado) {
      ocupado = true;
      try {
        await digitar('sudo contratar --joao');
        await executar('sudo contratar --joao');
      } finally { ocupado = false; }
    }
    setTimeout(() => entrada.focus({ preventScroll: true }), 30);
  }

  return { abrir, fechar, get aberto() { return aberto; } };
}
