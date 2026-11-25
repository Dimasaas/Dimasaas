// Temas de cor. O padrão é a paleta Synthwave do perfil (fonte única de cor, vitrine/_ferramentas/
// paleta-synthwave.json): fundo #120726/#0a0418, magenta #FF4FA3 de destaque, roxo #7C5CFF,
// azul #4D8BFF, âmbar #FFB86B só em detalhe, texto #F5EEFF/#C3A8E6.
// Os outros dois são o easter egg do código Konami.

export const SYNTHWAVE = {
  fundo: '#120726', fundoProfundo: '#0a0418', superficie: '#1e0d3d', roxoProfundo: '#2b0f52',
  magenta: '#FF4FA3', roxo: '#7C5CFF', azul: '#4D8BFF', ambar: '#FFB86B',
  texto: '#F5EEFF', textoSecundario: '#C3A8E6',
};

const S = SYNTHWAVE;

export const TEMAS = [
  {
    id: 'synthwave', nome: 'SYNTHWAVE',
    ceuZenite: S.fundoProfundo, ceuHorizonte: S.roxoProfundo, neblina: S.magenta,
    neb0: S.roxoProfundo, neb1: S.roxo, neb2: S.magenta,
    sol0: S.ambar, sol1: S.magenta, sol2: S.roxo,
    gradePerto: S.azul, gradeLonge: S.roxo, chao: S.fundoProfundo,
    montanhaLinha: S.roxo, montanhaCrista: S.magenta, montanhaFundo: S.fundoProfundo,
    chuvaCabeca: S.texto, chuvaA: S.magenta, chuvaB: S.roxo, chuvaC: S.azul,
    cascaA: S.roxo, cascaB: S.azul, cascaBrilho: S.magenta,
    particulaA: S.roxo, particulaB: S.azul, particulaC: S.magenta, particulaAcento: S.ambar,
    gemaBaixo: S.ambar, gemaMeio: S.magenta, gemaAlto: S.azul,
    anelA: S.roxo, anelB: S.azul, painel: S.magenta,
    css: {
      fundo: S.fundo, fundoProfundo: S.fundoProfundo, superficie: S.superficie,
      destaque: S.magenta, roxo: S.roxo, azul: S.azul, ambar: S.ambar,
      texto: S.texto, texto2: S.textoSecundario, borda: 'rgba(255,79,163,0.28)',
    },
  },
  {
    id: 'matrix', nome: 'MATRIX CLÁSSICO',
    ceuZenite: '#010603', ceuHorizonte: '#04170c', neblina: '#22ff88',
    neb0: '#03200f', neb1: '#0b5c2e', neb2: '#39ff88',
    sol0: '#d4ff6b', sol1: '#22ff88', sol2: '#00a347',
    gradePerto: '#00e676', gradeLonge: '#00a347', chao: '#010603',
    montanhaLinha: '#00c853', montanhaCrista: '#b9ffd6', montanhaFundo: '#010603',
    chuvaCabeca: '#e6ffef', chuvaA: '#22ff88', chuvaB: '#00a347', chuvaC: '#00e676',
    cascaA: '#00e676', cascaB: '#00b248', cascaBrilho: '#b9ffd6',
    particulaA: '#69f0ae', particulaB: '#00c853', particulaC: '#b9ffd6', particulaAcento: '#ccff90',
    gemaBaixo: '#ccff90', gemaMeio: '#22ff88', gemaAlto: '#00c853',
    anelA: '#00e676', anelB: '#00a347', painel: '#00e676',
    css: {
      fundo: '#020a05', fundoProfundo: '#010603', superficie: '#06200f',
      destaque: '#22FF88', roxo: '#00C853', azul: '#69F0AE', ambar: '#CCFF90',
      texto: '#E8FFF1', texto2: '#9ED9B5', borda: 'rgba(34,255,136,0.3)',
    },
  },
  {
    id: 'meia-noite', nome: 'MEIA-NOITE',
    ceuZenite: '#05030f', ceuHorizonte: '#101a4a', neblina: S.azul,
    neb0: S.superficie, neb1: S.azul, neb2: S.roxo,
    sol0: S.textoSecundario, sol1: S.roxo, sol2: S.azul,
    gradePerto: S.azul, gradeLonge: S.roxo, chao: '#05030f',
    montanhaLinha: S.azul, montanhaCrista: S.textoSecundario, montanhaFundo: '#05030f',
    chuvaCabeca: S.texto, chuvaA: S.azul, chuvaB: S.roxo, chuvaC: S.textoSecundario,
    cascaA: S.azul, cascaB: S.roxo, cascaBrilho: S.texto,
    particulaA: S.azul, particulaB: S.roxo, particulaC: S.textoSecundario, particulaAcento: S.magenta,
    gemaBaixo: S.textoSecundario, gemaMeio: S.roxo, gemaAlto: S.azul,
    anelA: S.azul, anelB: S.roxo, painel: S.azul,
    css: {
      fundo: '#0a0b1f', fundoProfundo: '#05030f', superficie: '#141a3d',
      destaque: S.azul, roxo: S.roxo, azul: S.textoSecundario, ambar: S.ambar,
      texto: S.texto, texto2: S.textoSecundario, borda: 'rgba(77,139,255,0.3)',
    },
  },
];

// Chaves de cor que viram THREE.Color compartilhado entre os shaders.
export const CHAVES_COR = Object.keys(TEMAS[0]).filter((k) => !['id', 'nome', 'css'].includes(k));
