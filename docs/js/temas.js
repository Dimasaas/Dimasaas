// Temas de cor. O primeiro é o padrão (roxo e azul); o código Konami passa para o próximo.
// Cada cor vira uniform nos shaders e variável no CSS; a troca é interpolada.

export const TEMAS = [
  {
    id: 'diamantino', nome: 'DIAMANTINO',
    fundo: ['#03030b', '#0b0724'],
    nebulosa: ['#2a1052', '#1b3a8a', '#7C4DFF'],
    chuvaCabeca: '#d9f4ff', chuvaA: '#8f6bff', chuvaB: '#2364ff',
    cascaA: '#7C4DFF', cascaB: '#2979FF', cascaBrilho: '#00E5FF',
    particulaA: '#B388FF', particulaB: '#2979FF', particulaC: '#00E5FF', particulaAcento: '#FF4FD8',
    gemaA: '#b9a4ff', gemaB: '#7fb6ff',
    css: { c1: '#7C4DFF', c2: '#2979FF', c3: '#00E5FF', c4: '#B388FF', fundo: '#05060f' },
  },
  {
    id: 'matrix', nome: 'MATRIX CLÁSSICO',
    fundo: ['#010603', '#03140b'],
    nebulosa: ['#05301a', '#0b4d2a', '#13ff8a'],
    chuvaCabeca: '#e6ffef', chuvaA: '#22ff88', chuvaB: '#00a347',
    cascaA: '#00e676', cascaB: '#00b248', cascaBrilho: '#b9ffd6',
    particulaA: '#69f0ae', particulaB: '#00c853', particulaC: '#ccff90', particulaAcento: '#00e5ff',
    gemaA: '#a8ffcf', gemaB: '#59ff9d',
    css: { c1: '#00E676', c2: '#00C853', c3: '#B9FFD6', c4: '#69F0AE', fundo: '#020805' },
  },
  {
    id: 'synthwave', nome: 'SYNTHWAVE',
    fundo: ['#07020f', '#1a0633'],
    nebulosa: ['#4a0b5e', '#1b1f8a', '#ff2bd6'],
    chuvaCabeca: '#ffe6fb', chuvaA: '#ff4fd8', chuvaB: '#7C4DFF',
    cascaA: '#ff2bd6', cascaB: '#7C4DFF', cascaBrilho: '#ffc24b',
    particulaA: '#ff6ec7', particulaB: '#7C4DFF', particulaC: '#ffc24b', particulaAcento: '#00E5FF',
    gemaA: '#ffb3ee', gemaB: '#ffd27a',
    css: { c1: '#FF2BD6', c2: '#7C4DFF', c3: '#FFC24B', c4: '#FF6EC7', fundo: '#0a0314' },
  },
  {
    id: 'aurora', nome: 'AURORA',
    fundo: ['#02070a', '#061a22'],
    nebulosa: ['#0b3b46', '#2a1052', '#1de9b6'],
    chuvaCabeca: '#e0fff7', chuvaA: '#1de9b6', chuvaB: '#2979FF',
    cascaA: '#1de9b6', cascaB: '#B388FF', cascaBrilho: '#e0fff7',
    particulaA: '#64ffda', particulaB: '#B388FF', particulaC: '#00E5FF', particulaAcento: '#FFC24B',
    gemaA: '#a7fff0', gemaB: '#c9b6ff',
    css: { c1: '#1DE9B6', c2: '#B388FF', c3: '#00E5FF', c4: '#64FFDA', fundo: '#03090c' },
  },
];
