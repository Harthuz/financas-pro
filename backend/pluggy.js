const BASE = 'https://api.pluggy.ai';
let cachedKey;
let expires = 0;
async function request(route, key, body) {
  const response = await fetch(BASE + route, {
    method: body ? 'POST' : 'GET',
    headers: { 'Content-Type': 'application/json', ...(key ? { 'X-API-KEY': key } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
    signal: AbortSignal.timeout(30000)
  });
  if (!response.ok) throw new Error(`Pluggy retornou HTTP ${response.status}. Verifique as credenciais e o acesso ao Item.`);
  return response.json();
}
async function transactions() {
  const { PLUGGY_CLIENT_ID, PLUGGY_CLIENT_SECRET, PLUGGY_ITEM_ID } = process.env;
  if (!PLUGGY_CLIENT_ID || !PLUGGY_CLIENT_SECRET || !PLUGGY_ITEM_ID) {
    throw new Error('Configure PLUGGY_CLIENT_ID, PLUGGY_CLIENT_SECRET e PLUGGY_ITEM_ID no .env do servidor.');
  }
  if (!cachedKey || Date.now() >= expires) {
    cachedKey = (await request('/auth', null, { clientId: PLUGGY_CLIENT_ID, clientSecret: PLUGGY_CLIENT_SECRET })).apiKey;
    if (!cachedKey) throw new Error('Pluggy não retornou uma chave de API.');
    expires = Date.now() + 110 * 60000;
  }
  const accounts = await request('/accounts?itemId=' + encodeURIComponent(PLUGGY_ITEM_ID), cachedKey);
  const items = [];
  for (const account of accounts.results || []) {
    let route = '/v2/transactions?accountId=' + encodeURIComponent(account.id);
    const seen = new Set();
    while (route) {
      if (seen.has(route)) throw new Error('Pluggy retornou um cursor repetido.');
      seen.add(route);
      const page = await request(route, cachedKey);
      for (const tx of page.results || []) {
        if (tx.type !== 'DEBIT' || tx.status !== 'POSTED') continue;
        const amount = tx.amountInAccountCurrency ?? tx.amount;
        if (!tx.id || !Number.isFinite(amount) || !tx.date || (account.currencyCode || tx.currencyCode) !== 'BRL') continue;
        items.push({ id: tx.id, nome: tx.description || tx.descriptionRaw || 'Transação Pluggy',
          valor: Math.abs(amount), data: tx.date.slice(0, 10), conta: account.name || '',
          texto_extrato: tx.descriptionRaw || tx.description || '',
          observacao_agente: `Pluggy: ${account.name || account.id}. Categoria sugerida: ${tx.category || 'não informada'}. Revisar conta e categoria.` });
      }
      if (page.next) {
        const next = new URL(page.next, BASE + '/v2/transactions');
        if (next.origin !== BASE || next.pathname !== '/v2/transactions') throw new Error('Cursor Pluggy inválido.');
        route = next.pathname + next.search;
      } else route = null;
    }
  }
  return items;
}
module.exports = { transactions };

async function balances() {
  const { PLUGGY_CLIENT_ID, PLUGGY_CLIENT_SECRET, PLUGGY_ITEM_ID } = process.env;
  if (!PLUGGY_CLIENT_ID || !PLUGGY_CLIENT_SECRET || !PLUGGY_ITEM_ID) throw new Error('Configure as credenciais e o Item do Pluggy.');
  if (!cachedKey || Date.now() >= expires) {
    cachedKey = (await request('/auth', null, { clientId: PLUGGY_CLIENT_ID, clientSecret: PLUGGY_CLIENT_SECRET })).apiKey;
    if (!cachedKey) throw new Error('Pluggy não retornou uma chave.');
    expires = Date.now() + 110 * 60000;
  }
  const data = await request('/accounts?itemId=' + encodeURIComponent(PLUGGY_ITEM_ID), cachedKey);
  const accounts = (data.results || []).filter(a => a.type === 'BANK' && a.currencyCode === 'BRL');
  if (!accounts.length || accounts.some(a => !Number.isFinite(a.balance))) throw new Error('Saldo bancário BRL indisponível no Pluggy.');
  let investimentos = null, erro_investimentos = null;
  try {
    const ativos = [];
    for (let page = 1; ; page++) {
      if (page > 100) throw new Error('Limite de paginação de investimentos excedido.');
      const result = await request('/investments?itemId=' + encodeURIComponent(PLUGGY_ITEM_ID) + '&pageSize=100&page=' + page, cachedKey);
      ativos.push(...(result.results || []).filter(a => a.currencyCode === 'BRL'));
      if (page >= (result.totalPages || 1)) break;
    }
    if (ativos.some(a => !Number.isFinite(a.balance))) throw new Error('Há investimentos sem saldo líquido disponível.');
    investimentos = { total: ativos.reduce((sum,a) => sum + a.balance, 0), ativos: ativos.filter(a => Math.abs(a.balance) >= 0.005).map(a => ({ id:a.id, nome:a.name, saldo:a.balance, data:a.date, taxa_mes:a.lastMonthRate ?? null })) };
  } catch(e) { erro_investimentos = e.message; }
  const poupanca = accounts.filter(a => /SAVINGS/i.test(a.subtype || ''));
  const corrente = accounts.filter(a => !/SAVINGS/i.test(a.subtype || ''));
  return { saldo_conta: corrente.reduce((s,a) => s+a.balance,0), saldo_poupanca: poupanca.reduce((s,a) => s+a.balance,0), investimentos, erro_investimentos, saldo: accounts.reduce((sum, a) => sum + a.balance, 0), contas: accounts.map(a => ({ id: a.id, nome: a.name, saldo: a.balance })), consultado_em: new Date().toISOString() };
}
module.exports.balances = balances;
