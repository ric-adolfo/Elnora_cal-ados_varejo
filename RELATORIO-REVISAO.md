# ELNORA — Relatório de organização e revisão

## Entrega
- 17 arquivos recebidos, mantidos com nomes oficiais de publicação (sem sufixos de upload).
- As duas folhas de estilo foram preservadas: `estilo.css` (página inicial) e `style.css` (produto e redefinição de senha).
- Correção pontual: o cabeçalho fixo usava z-index 99999, cobrindo carrinho e outras janelas; ajustado para 995, abaixo dos overlays do carrinho (999/1000) e Minha Conta (1700).
- Demais funções e visual preservados.

## Verificação automática
- JavaScript: 9/9 arquivos passaram `node --check`.
- Sitemap XML: válido.

## Referências locais ausentes **neste pacote**
- `index.html` → `admin/index.html`
- `index.html` → `legal/entrega.html`
- `index.html` → `legal/privacidade.html`
- `index.html` → `legal/termos.html`
- `index.html` → `legal/trocas-devolucoes.html`
- `index.html` → `assets/images/assistente/nora-atendente.jpeg`
- `index.html` → `assets/images/banner/banner-elnora.png`
- `index.html` → `assets/images/logo/logo-elnora-transparente.png`
- `index.html` → `analytics/ga4.js`
- `index.html` → `config/config.js`
- `produto.html` → `legal/entrega.html`
- `produto.html` → `legal/privacidade.html`
- `produto.html` → `legal/termos.html`
- `produto.html` → `legal/trocas-devolucoes.html`
- `produto.html` → `analytics/ga4.js`
- `produto.html` → `config/config.js`
- `reset-password.html` → `config/config.js`

Esses recursos podem existir no repositório original; não foram fornecidos aqui. **Não substitua toda a pasta publicada por este ZIP sem preservar essas subpastas.**

## Pendências funcionais
- O `script.js` ainda tem oito produtos demonstrativos e um cupom de exemplo; conferir integração com estoque real antes de receber pedidos.
- Conferir Supabase (auth, tabelas, RLS, edge functions) e Mercado Pago em ambiente de testes.
- Verificar links de Facebook e TikTok que usam `#`.
- Testar em navegador real: celular/desktop, cadastro, recuperação de senha, frete, carrinho, pedidos e pagamentos.
- Não foram executadas compras nem testes autenticados de serviços externos.
