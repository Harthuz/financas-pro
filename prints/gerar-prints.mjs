// Gera os prints do README com dados 100% fictícios (toda a API é interceptada).
import { chromium } from 'playwright';
import { mkdirSync } from 'fs';

const OUT = process.argv[2] || new URL('.', import.meta.url).pathname;
const BASE = process.env.BASE_URL || 'http://localhost:8080';
mkdirSync(OUT, { recursive: true });

// RNG determinístico para os prints saírem iguais a cada execução
let seed = 42;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);
const pick = arr => arr[Math.floor(rnd() * arr.length)];
const pad = n => String(n).padStart(2, '0');

const tipos = ['Mercado', 'Restaurantes', 'Transporte', 'Moradia', 'Saúde', 'Lazer', 'Assinaturas', 'Educação', 'Pets', 'Vestuário'];
const contas = ['Cartão de Crédito A', 'Cartão de Crédito B', 'Conta Corrente', 'Vale Refeição', 'Pix'];
const locais = ['Supermercado Central', 'Shopping Norte', 'Centro', 'Em casa', 'Padaria da Esquina', 'Farmácia Popular'];
const catalogo = {
  Mercado: [['Supermercado Central', 80, 420], ['Hortifruti Bairro', 25, 90], ['Atacadão Sul', 150, 600]],
  Restaurantes: [['Pizzaria Bella', 45, 140], ['Almoço Executivo', 28, 55], ['Hamburgueria 22', 40, 95], ['Café Grão', 12, 35]],
  Transporte: [['Corrida App', 14, 48], ['Combustível', 120, 260], ['Bilhete Metrô', 5, 10]],
  Moradia: [['Aluguel', 1850, 1850], ['Conta de Luz', 140, 260], ['Internet Fibra', 109.9, 109.9], ['Condomínio', 480, 480]],
  Saúde: [['Farmácia Popular', 18, 160], ['Academia Fit', 119.9, 119.9], ['Consulta Clínica', 180, 320]],
  Lazer: [['Cinema', 36, 80], ['Show Ao Vivo', 120, 280], ['Livraria Página', 45, 130]],
  Assinaturas: [['Streaming Filmes', 39.9, 39.9], ['Streaming Música', 21.9, 21.9], ['Nuvem 200GB', 10.9, 10.9]],
  Educação: [['Curso Online React', 79.9, 79.9], ['Livro Técnico', 89, 140]],
  Pets: [['Ração Premium', 140, 210], ['Pet Shop Banho', 60, 90]],
  Vestuário: [['Loja de Tênis - Parcela 1/4', 129.9, 129.9], ['Camisetas Básicas', 59, 160]]
};
const fixos = new Set(['Aluguel', 'Internet Fibra', 'Condomínio', 'Academia Fit', 'Streaming Filmes', 'Streaming Música', 'Nuvem 200GB']);

const gastos = [];
let id = 1;
for (let m = 5; m <= 11; m++) {
  const dias = m === 11 ? 2 : 28;
  for (const [tipo, itens] of Object.entries(catalogo)) {
    for (const [nome, min, max] of itens) {
      const vezes = fixos.has(nome) ? 1 : Math.max(1, Math.round(rnd() * (tipo === 'Restaurantes' || tipo === 'Transporte' ? 4 : 2)));
      for (let k = 0; k < vezes; k++) {
        if (m === 11 && !fixos.has(nome) && rnd() > 0.25) continue;
        const valor = Number((min + rnd() * (max - min)).toFixed(2));
        gastos.push({
          id: String(id++),
          nome,
          descricao: '',
          localizacao: ['Mercado', 'Restaurantes', 'Lazer', 'Saúde'].includes(tipo) && rnd() > 0.35 ? nome : '',
          valor,
          tipo,
          conta: tipo === 'Moradia' ? 'Conta Corrente' : tipo === 'Restaurantes' && rnd() > 0.5 ? 'Vale Refeição' : pick(contas),
          data: `2026-${pad(m)}-${pad(1 + Math.floor(rnd() * dias))}`,
          criado_em: `2026-${pad(m)}-01T10:00:00.000Z`,
          parcela_grupo_id: null,
          fixo: fixos.has(nome)
        });
      }
    }
  }
}

const metadados = {
  tipos,
  contas,
  locais,
  orcamentos: { Mercado: 1200, Restaurantes: 600, Transporte: 400, Lazer: 350, Assinaturas: 120 }
};

// Stage: lançamentos "vindos do extrato", parte completos e parte faltando campos
const brutos = [
  ['2026-11-01', 'Supermercado Central', 236.4, 'Mercado', 'Cartão de Crédito A', 'Categoria sugerida pelo agente'],
  ['2026-11-01', '', 54.9, '', 'Cartão de Crédito A', 'Não identifiquei o estabelecimento'],
  ['2026-10-31', 'Corrida App', 23.7, 'Transporte', 'Cartão de Crédito B', 'Categoria sugerida pelo agente'],
  ['2026-10-31', 'Pizzaria Bella', 98.5, '', 'Cartão de Crédito A', 'Restaurantes ou Lazer?'],
  ['2026-10-30', 'Farmácia Popular', 42.3, 'Saúde', 'Pix', 'Categoria sugerida pelo agente'],
  ['2026-10-30', 'Loja de Tênis - Parcela 1/4', 129.9, 'Vestuário', 'Cartão de Crédito B', 'Compra parcelada detectada'],
  ['2026-10-29', 'Transferência Pix', 150, '', 'Pix', 'Destinatário desconhecido; preencher categoria'],
  ['2026-10-29', 'Streaming Filmes', 39.9, 'Assinaturas', 'Cartão de Crédito A', 'Recorrente; marcar como fixo?'],
  ['2026-10-28', 'Padaria da Esquina', 18.6, 'Mercado', 'Vale Refeição', 'Categoria sugerida pelo agente'],
  ['2026-10-28', 'Posto Avenida', 0, 'Transporte', 'Cartão de Crédito B', 'Valor ilegível no extrato'],
  ['2026-10-27', 'Cinema', 72, 'Lazer', '', 'Conta não identificada'],
  ['2026-10-26', 'Hortifruti Bairro', 47.85, 'Mercado', 'Cartão de Crédito A', 'Categoria sugerida pelo agente'],
  ['2026-10-25', 'Pet Shop Banho', 75, '', 'Pix', 'Pets?'],
  ['2026-10-24', 'Livraria Página', 89.9, 'Educação', 'Cartão de Crédito B', 'Categoria sugerida pelo agente']
];
const stageItens = brutos.map(([data, nome, valor, tipo, conta, obs], i) => {
  const faltantes = [];
  if (!nome) faltantes.push('nome');
  if (!(valor > 0)) faltantes.push('valor');
  if (!tipo) faltantes.push('tipo');
  if (!conta) faltantes.push('conta');
  const [a, mo, d] = data.split('-');
  return {
    id: String(1000 + i),
    data,
    nome,
    valor: valor || '',
    tipo,
    conta,
    descricao: '',
    localizacao: '',
    fixo: nome === 'Streaming Filmes',
    texto_extrato: `${d}/${mo}/${a} COMPRA ${(nome || 'PAG*ESTABELEC').toUpperCase()} R$ ${valor ? valor.toFixed(2).replace('.', ',') : '??'}`,
    observacao_agente: obs,
    selecionado: faltantes.length === 0,
    completo: faltantes.length === 0,
    campos_faltantes: faltantes
  };
});
const stage = {
  total: stageItens.length,
  prontos_para_commit: stageItens.filter(i => i.completo).length,
  incompletos: stageItens.filter(i => !i.completo).length,
  valor_total: stageItens.reduce((a, i) => a + (Number(i.valor) || 0), 0),
  itens: stageItens
};

const respostas = {
  '/api/gastos': gastos,
  '/api/metadados': metadados,
  '/api/stage': stage,
  '/api/categorias': tipos.map((nome, i) => ({ id: i + 1, nome, orcamento_mensal: metadados.orcamentos[nome] || 0 })),
  '/api/contas': contas.map((nome, i) => ({ id: i + 1, nome }))
};

const b = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {});
const novaPagina = async (viewport, extra = {}) => {
  const ctx = await b.newContext({ viewport, serviceWorkers: 'block', colorScheme: 'dark', ...extra });
  await ctx.route('**/api/**', route => {
    const path = new URL(route.request().url()).pathname;
    const body = respostas[path];
    if (route.request().method() !== 'GET' || body === undefined) return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
  });
  // garante que nada passa para o backend real
  await ctx.route(/:8000\//, route => route.abort());
  return ctx.newPage();
};
const esperar = ms => new Promise(r => setTimeout(r, ms));

// 1) Dashboard desktop
let p = await novaPagina({ width: 1440, height: 900 }, { deviceScaleFactor: 1.5 });
await p.goto(BASE + '/', { waitUntil: 'networkidle' });
await esperar(1200);
await p.screenshot({ path: `${OUT}/01-dashboard.png` });

// 2) Gráfico de barras com orçamento
await p.getByRole('button', { name: /Barras/ }).first().click().catch(() => {});
await esperar(900);
const card = p.locator('text=Ranking por Categoria').first();
await card.scrollIntoViewIfNeeded().catch(() => {});
await p.evaluate(() => window.scrollBy(0, -120));
await esperar(600);
await p.screenshot({ path: `${OUT}/02-graficos.png` });

// 3) Filtro de categorias (chips) com seleção parcial
const chips = p.locator('.MuiChip-root[aria-pressed]');
await chips.nth(0).click();
await chips.nth(2).click();
await esperar(700);
await chips.nth(0).evaluate(el => el.scrollIntoView({ block: 'end' }));
await p.evaluate(() => window.scrollBy(0, 140));
await esperar(500);
await p.screenshot({ path: `${OUT}/03-filtro-categorias.png` });
await p.context().close();

// 4) Lançamentos (tabela)
p = await novaPagina({ width: 1440, height: 900 }, { deviceScaleFactor: 1.5 });
await p.goto(BASE + '/', { waitUntil: 'networkidle' });
await esperar(1000);
await p.locator('text=/^Lançamentos \\(/').first().scrollIntoViewIfNeeded();
await p.evaluate(() => window.scrollBy(0, 330));
await esperar(500);
await p.screenshot({ path: `${OUT}/04-lancamentos.png` });
await p.context().close();

// 5) Stage em planilha + 6) navegação/ordenação
p = await novaPagina({ width: 1600, height: 820 }, { deviceScaleFactor: 1.5 });
await p.goto(BASE + '/stage', { waitUntil: 'networkidle' });
await p.waitForSelector('tbody tr');
await esperar(600);
await p.screenshot({ path: `${OUT}/05-stage-planilha.png` });
await p.click('th:nth-child(6) .MuiTableSortLabel-root');
await p.click('th:nth-child(6) .MuiTableSortLabel-root');
await p.click('td[data-cell="3:2"]');
await p.keyboard.press('ArrowRight', { delay: 80 });
await p.keyboard.press('ArrowRight', { delay: 80 });
await p.keyboard.press('ArrowRight', { delay: 80 });
await p.keyboard.press('ArrowRight', { delay: 80 });
await esperar(200);
await p.keyboard.type('Rest', { delay: 60 });
await esperar(700);
await p.screenshot({ path: `${OUT}/06-stage-edicao.png` });
await p.context().close();

// 7) Mobile
for (const [rota, nome] of [['/', '07-mobile-dashboard.png'], ['/stage', '08-mobile-stage.png']]) {
  p = await novaPagina({ width: 390, height: 844 }, { deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await p.goto(BASE + rota, { waitUntil: 'networkidle' });
  await esperar(1000);
  await p.screenshot({ path: `${OUT}/${nome}` });
  await p.context().close();
}

await b.close();
console.log(`gastos fictícios: ${gastos.length} | stage: ${stageItens.length}`);
