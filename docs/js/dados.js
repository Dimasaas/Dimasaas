// Dados da página. As tecnologias seguem dados/tecnologias.json (critério: roda em
// produção ou no fluxo de trabalho toda semana; biblioteca não conta).

export const PERFIL = {
  nome: 'João Victor Diamantino',
  cargo: 'C.T.O',
  github: 'https://github.com/Dimasaas',
  linkedin: 'https://www.linkedin.com/in/diamantinojv/',
};

// Cor de cada grupo, tirada da paleta Synthwave: as cores puras (magenta, roxo, azul, âmbar,
// lavanda) e dois pontos do meio dos degradês da paleta (magenta↔roxo e âmbar↔magenta).
export const GRUPOS = [
  { nome: 'Linguagens e frameworks', anel: 1, cor: '#FF4FA3', itens: ['Ruby', 'Ruby on Rails 8', 'Hotwire', 'JavaScript', 'Node.js', 'Python', 'Bash'] },
  { nome: 'Dados', anel: 1, cor: '#FFB86B', itens: ['PostgreSQL 17', 'SQLite'] },
  { nome: 'Infra e DevOps', anel: 2, cor: '#7C5CFF', itens: ['Linux (Ubuntu)', 'Docker', 'Docker Compose', 'Caddy', 'Cloudflare', 'systemd', 'Uptime Kuma', 'rclone', 'Git/GitHub'] },
  { nome: 'Gestão de TI', anel: 2, cor: '#C3A8E6', itens: ['MeshCentral', 'AdGuard Home'] },
  { nome: 'Integrações', anel: 3, cor: '#4D8BFF', itens: ['ERP Senior (ProUAU)', 'WhatsApp Business Platform', 'APIs do Sicoob (mTLS + OAuth2)', 'Clicksign', 'Google Workspace', 'NFS-e'] },
  { nome: 'IA e mídia', anel: 3, cor: '#BD55D1', itens: ['LLM (API)', 'RAG', 'faster-whisper', 'FFmpeg'] },
  { nome: 'Mobile', anel: 3, cor: '#FF8387', itens: ['Android (Google Play)'] },
];

export const TECNOLOGIAS = GRUPOS.flatMap((g, gi) =>
  g.itens.map((nome) => ({ nome, grupo: g.nome, grupoIndice: gi, anel: g.anel, cor: g.cor })));

export const PROJETOS = [
  { nome: 'Breather', repo: 'breather', lang: 'Ruby', stack: ['HTTP 503', 'cooperativo'], desc: 'Freio global cooperativo para APIs que devolvem 503.' },
  { nome: 'Penny', repo: 'penny', lang: 'Ruby', stack: ['centavos', 'ITF', 'SVG'], desc: 'Dinheiro em centavos inteiros e boleto ITF em SVG.' },
  { nome: 'Plotline', repo: 'plotline', lang: 'Ruby', stack: ['GeoJSON', 'SVG'], desc: 'GeoJSON de lotes vira planta em SVG, com projeção, rotação e escala.' },
  { nome: 'Gatehouse', repo: 'gatehouse', lang: 'Node', stack: ['MCP', 'auditoria'], desc: 'Gateway MCP de leitura com escopo por pessoa e auditoria.' },
  { nome: 'Breeze', repo: 'breeze', lang: 'Python', stack: ['Linux', 'systemd'], desc: 'Ventoinha inteligente do MacBook que virou servidor.' },
  { nome: 'Shopkeep', repo: 'shopkeep', lang: 'TypeScript', stack: ['Discord', 'tickets'], desc: 'Bot de loja no Discord, com tickets e pagamento plugável.' },
  { nome: 'RendeChapa', repo: 'RendeChapa', lang: 'TypeScript', stack: ['Node.js', 'PostgreSQL'], desc: 'Plano de corte de chapas para marcenaria, com otimizador guilhotinado.' },
  { nome: 'dias-uteis-br', repo: 'dias-uteis-br', lang: 'Ruby', stack: ['JavaScript'], desc: 'Dias úteis e feriados do Brasil, em Ruby com espelho em JS.' },
  { nome: 'DiscordNodeStereo', repo: 'DiscordNodeStereo', lang: 'C#', stack: ['Discord', 'áudio'], desc: 'Microfone estéreo a 512 kbps no Discord.' },
].map((p) => ({ ...p, url: `https://github.com/Dimasaas/${p.repo}` }));
