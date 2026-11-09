const { pool } = require('./db');
const { balances } = require('./pluggy');
async function context() {
  let saldo = null, erro_saldo = null;
  try { saldo = await balances(); } catch (e) { erro_saldo = e.message; }
  const { rows } = await pool.query('SELECT id, documento, criado_em FROM planos_financeiros ORDER BY id DESC');
  const { rows: dividas } = await pool.query('SELECT id, nome, valor::float, atualizado_em FROM dividas_financeiras ORDER BY id DESC');
  const total_dividas = dividas.reduce((s,d) => s+d.valor,0);
  const patrimonio_bruto = saldo?.investimentos ? saldo.saldo + saldo.investimentos.total : null;
  return { saldo, erro_saldo, planos: rows, dividas, total_dividas, patrimonio_bruto, patrimonio_liquido: patrimonio_bruto === null ? null : patrimonio_bruto-total_dividas };

}
async function save(args) {
  const { nome, valor_meta, data_meta, analise, premissas, projecao } = args;
  if (typeof nome !== 'string' || !nome.trim() || !Number.isFinite(valor_meta) || valor_meta <= 0 ||
      !/^\d{4}-\d{2}-\d{2}$/.test(data_meta || '') || !Number.isFinite(Date.parse(data_meta)) || data_meta < new Date().toISOString().slice(0,10) ||
      typeof analise !== 'string' || !analise.trim() || typeof premissas !== 'string' || !premissas.trim() ||
      !Array.isArray(projecao) || !projecao.length || projecao.length > 600) throw new Error('Informe nome, meta positiva, data futura, análise, premissas e projeção mensal.');
  let anterior = '';
  for (const p of projecao) {
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(p.mes || '') || p.mes <= anterior ||
        !['entradas','saidas','rendimentos','saldo'].every(k => Number.isFinite(p[k])) || p.entradas < 0 || p.saidas < 0) throw new Error('Projeção inválida: meses ordenados e valores numéricos obrigatórios.');
    anterior = p.mes;
  }
  if (anterior !== data_meta.slice(0,7)) throw new Error('A projeção deve terminar no mês da meta.');
  const base = await balances();
  const { rows: debts } = await pool.query('SELECT COALESCE(SUM(valor),0)::float AS total FROM dividas_financeiras');
  base.total_dividas = debts[0].total;
  base.patrimonio_liquido = base.investimentos ? base.saldo + base.investimentos.total-base.total_dividas : null;
  const documento = { nome: nome.trim(), valor_meta, data_meta, analise, premissas, projecao, saldo_base: base, base_calculo: args.base_calculo === 'patrimonio_liquido' ? 'patrimonio_liquido' : 'conta', analisado_em: new Date().toISOString() };
  const { rows } = await pool.query('INSERT INTO planos_financeiros(documento) VALUES($1) RETURNING *', [documento]);
  return rows[0];
}
module.exports = { context, save };
