# Créditos da versão 3D

A página em `docs/` (DIAMANTINO.OS) usa os assets e o código abaixo. Todos têm licença que permite uso público; o que pede atribuição está atribuído aqui.

## Assets em `docs/assets/`

| Asset | Arquivo | Autor | Fonte | Licença |
|---|---|---|---|---|
| HDRI **Ferndale Studio 12** (1k, HDR). Dá a estrutura das luzes nos reflexos do diamante e dos cristais; a cor vem da paleta | `hdri/ferndale_studio_12_1k.hdr` | Dimitrios Savva (foto) e Greg Zaal (processamento), Poly Haven | https://polyhaven.com/a/ferndale_studio_12 | CC0 1.0 |
| Fonte **Space Grotesk** (variável) | `fontes/SpaceGrotesk-wght.woff2` | The Space Grotesk Project Authors (Florian Karsten) | https://github.com/floriankarsten/space-grotesk | SIL OFL 1.1 (`fontes/OFL-SpaceGrotesk.txt`) |
| Fonte **JetBrains Mono** (variável) | `fontes/JetBrainsMono-wght.woff2` | The JetBrains Mono Project Authors | https://github.com/JetBrains/JetBrainsMono | SIL OFL 1.1 (`fontes/OFL-JetBrainsMono.txt`) |
| Fonte **Noto Sans JP**, recorte só com os 56 katakana de meia largura (U+FF66 a U+FF9D) usados na chuva | `fontes/NotoSansJP-katakana.woff2` | Google e Adobe | https://fonts.google.com/noto/specimen/Noto+Sans+JP | SIL OFL 1.1 (`fontes/OFL-NotoSansJP.txt`) |
| Textura de **blue noise** 128×128 (RGBA, `LDR_RGBA_0`), usada no grão do pós-processamento | `texturas/blue-noise-128.png` | Christoph Peters | https://momentsingraphics.de/BlueNoise.html | CC0 1.0 |

## Código de terceiros

| O quê | Autor | Fonte | Licença |
|---|---|---|---|
| **three.js r182** (núcleo, `OrbitControls`, `HDRLoader`, `EffectComposer`, `RenderPass`, `UnrealBloomPass`, `ShaderPass`), carregado do jsDelivr direto da tag `r182` do repositório oficial | three.js authors | https://github.com/mrdoob/three.js | MIT |
| Ruído simplex 3D em GLSL (`js/glsl.js`) | Ian McEwan e Stefan Gustavson, Ashima Arts | https://github.com/ashima/webgl-noise | MIT |
| Hash sem seno em GLSL (`js/glsl.js`) | Dave Hoskins | https://www.shadertoy.com/view/4djSRW | MIT |
| Curva de tone mapping filmica (ajuste de Krzysztof Narkowicz para o ACES) | Krzysztof Narkowicz | https://knarkowicz.wordpress.com/2016/01/06/aces-filmic-tone-mapping-curve/ | fórmula publicada |

## Feito aqui

O diamante (lapidação brilhante com 112 facetas, gerada no código), a malha geodésica, as partículas, a chuva de caracteres, o céu com o sol listrado, a grade, as montanhas em wireframe, os painéis da vitrine, a tela de boot, o terminal e o favicon foram feitos para esta página, com a paleta Synthwave do perfil.

## Pesquisados e não usados

- **Matcaps da coleção nidorx/matcaps**: o próprio repositório diz que as texturas vieram de vários sites e que não dá para saber o autor de cada uma. Sem licença clara, ficaram de fora; o reflexo vem do HDRI.
- **Modelos do Sketchfab**: o download pede conta, então não foram usados.
- **Kits low-poly da Kenney e da Quaternius (CC0)**: a licença serve, mas o estilo de desenho animado não combinava com a cena neon; o núcleo ficou procedural.
