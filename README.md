# João Victor Diamantino Cardoso

**Auxiliar Administrativo** na CV ADM, desenvolvendo os sistemas internos da [1001 Negócios Imobiliários](https://1001imoveis.com) · Estudante de **Análise e Desenvolvimento de Sistemas** na PUC Goiás · Goiânia, GO — Brasil

Construo o software que roda a operação de uma imobiliária de loteamentos: cobrança, integração com o ERP, atendimento por WhatsApp, financeiro e documentos. Trabalho perto do problema real: o sistema é usado todo dia por quem cobra, atende e assina.

## O que estou construindo

### Na 1001 / CV ADM

**INAD** *(privado)*: painel de cobrança de inadimplência imobiliária, alimentado pela API do ERP ProUAU. Sincroniza a carteira, monta a mensagem de cobrança sob a régua do CDC, atende o cliente pelo WhatsApp Cloud API, gera carnê e remessa bancária, desenha o mapa do loteamento e mede a recuperação por venda.
`Rails 8` · `PostgreSQL` · `Minitest` · front em HTML/CSS/JS **sem build** · deploy por Docker Compose

> Começou em julho de 2026 como um leitor de relatórios de inadimplência em PDF que virava banco SQL. Passou por Python + SQLite, trocou o PDF pela API do ERP e chegou ao Rails.

**Financeiro** *(privado)*: o livro de dinheiro da casa, com partidas dobradas, multiempresa e valores em centavos inteiros.
`Rails 8` · `PostgreSQL`

**casa-1001** *(privado)*: o monorepo da empresa. Reúne os sistemas, o proxy de borda (Caddy), o design system **1001 Órbita** e um plugin com conector MCP que dá aos colaboradores leitura da produção pelo Claude.
`Ruby` · `Node.js` · `Caddy` · `MCP`

**SoftEvo** *(privado)*: projeto e instalador para levar o INAD a outras incorporadoras.

**trena** *(privado)*: consultas prontas e seguras para o ERP UAU, pela API oficial e só de leitura.
`Python`

### Público

| Projeto | O que é | Stack |
|---|---|---|
| **[gerenciador-tarefas-cv-adm](https://github.com/Dimasaas/gerenciador-tarefas-cv-adm)** | Sistema web de gestão de tarefas com Kanban e calendário, feito como Projeto Integrador (PUC Goiás) para a CV ADM · [**abrir**](https://dimasaas.github.io/gerenciador-tarefas-cv-adm/) | `HTML` `CSS` `JavaScript` |
| **[dias-uteis-br](https://github.com/Dimasaas/dias-uteis-br)** | Dias úteis, feriados nacionais e horário de funcionamento no Brasil. É Ruby sem Rails, com um espelho em JavaScript que um teste obriga a concordar com o Ruby | `Ruby` `JavaScript` |
| **[RendeChapa](https://github.com/Dimasaas/RendeChapa)** | Plano técnico de corte de chapas para marcenaria: otimizador de cortes guilhotinados com compensação da serra, painel do cliente e pagamento via Mercado Pago | `Node.js` `TypeScript` `PostgreSQL` |
| **[DiscordNodeStereo](https://github.com/Dimasaas/DiscordNodeStereo)** | Mantém o microfone estéreo a 512 kbps no Discord (PTB e Canary) depois de cada atualização. É portátil, um `.exe` só | `C#` |

## Como eu trabalho

- **Medir antes de afirmar.** Número que o código pode mudar não vai escrito na documentação; a documentação manda conferir.
- **Documentação que mente é pior que documentação nenhuma.** Cada regra carrega o porquê e a data em que foi decidida.
- **Dinheiro em centavos inteiros**, nunca em float.
- **O ERP é produção real de outra empresa.** Ler é livre; escrever pede confirmação, sempre.
- **Front sem build quando dá.** Menos peças para quebrar às 3 da manhã.

## Stack

![Ruby](https://img.shields.io/badge/Ruby-CC342D?style=flat-square&logo=ruby&logoColor=white)
![Rails](https://img.shields.io/badge/Rails%208-D30001?style=flat-square&logo=rubyonrails&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=nodedotjs&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat-square&logo=nextdotjs&logoColor=white)
![Python](https://img.shields.io/badge/Python-3776AB?style=flat-square&logo=python&logoColor=white)
![C#](https://img.shields.io/badge/C%23-512BD4?style=flat-square&logo=dotnet&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white)
![Caddy](https://img.shields.io/badge/Caddy-1F88C0?style=flat-square&logo=caddy&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-003B57?style=flat-square&logo=sqlite&logoColor=white)

## Formação

**Análise e Desenvolvimento de Sistemas** — Pontifícia Universidade Católica de Goiás (PUC Goiás), CEAD

---

<sub>Para falar sobre cobrança imobiliária, integração com ERP ou WhatsApp Business API, use os canais no site da 1001: <a href="https://1001imoveis.com">1001imoveis.com</a></sub>
