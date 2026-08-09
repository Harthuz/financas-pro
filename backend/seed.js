const fs = require('fs');
const path = require('path');
const { pool } = require('./db');

async function runSeed() {
  const client = await pool.connect();
  try {
    let jsonPath = path.join(__dirname, 'notion_export.json');
    if (!fs.existsSync(jsonPath)) {
      jsonPath = path.join(__dirname, '..', 'notion_export.json');
    }

    if (!fs.existsSync(jsonPath)) {
      console.log('notion_export.json not found. Skipping seed.');
      return { status: 'warning', message: 'Arquivo notion_export.json não encontrado.' };
    }

    const records = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
    console.log(`Carregando ${records.length} registros para o seed em Node.js...`);

    const defaultTipos = [
      "Academia", "Alimentação", "Apresentação", "Cuidados Pessoais", 
      "Entretenimento e Lazer", "Esporte", "Internet", "Lanche/Doces", 
      "Livro", "Mercado", "Moradia", "Parcelas de Compras", "Profissional", 
      "Seguro", "Tarefa", "Transporte"
    ];
    const defaultContas = [
      "Cartão Alimentação iFood", "Cartão Mobilidade iFood", 
      "Conta Nubank", "Crédito Nubank"
    ];

    const tiposSet = new Set(defaultTipos);
    const contasSet = new Set(defaultContas);

    for (const r of records) {
      if (r.tipo) tiposSet.add(r.tipo.trim());
      if (r.conta) contasSet.add(r.conta.trim());
    }

    // Insert Categorias
    const catMap = {};
    for (const catNome of Array.from(tiposSet).sort()) {
      if (!catNome) continue;
      const res = await client.query(
        `INSERT INTO categorias (nome) VALUES ($1) ON CONFLICT (nome) DO UPDATE SET nome=EXCLUDED.nome RETURNING id, nome`,
        [catNome]
      );
      catMap[catNome.toLowerCase()] = res.rows[0].id;
    }

    // Insert Contas
    const ctaMap = {};
    for (const contaNome of Array.from(contasSet).sort()) {
      if (!contaNome) continue;
      const res = await client.query(
        `INSERT INTO contas (nome) VALUES ($1) ON CONFLICT (nome) DO UPDATE SET nome=EXCLUDED.nome RETURNING id, nome`,
        [contaNome]
      );
      ctaMap[contaNome.toLowerCase()] = res.rows[0].id;
    }

    const defaultCatId = catMap['alimentação'] || Object.values(catMap)[0];
    const defaultCtaId = ctaMap['conta nubank'] || Object.values(ctaMap)[0];

    let gastosInseridos = 0;
    await client.query('BEGIN');

    for (const r of records) {
      const notionId = r.id || null;
      let nome = (r.nome || '').trim();
      let valor = 0;

      if (typeof r.valor === 'number') valor = r.valor;
      else if (typeof r.valor === 'string') valor = parseFloat(r.valor) || 0;

      if (!nome && valor === 0) continue;
      if (!nome) nome = 'Gasto sem nome';
      nome = nome.substring(0, 900);

      let dataStr = r.data;
      if (!dataStr || typeof dataStr !== 'string') {
        dataStr = new Date().toISOString().split('T')[0];
      } else {
        dataStr = dataStr.split('T')[0];
      }

      const catId = catMap[(r.tipo || '').trim().toLowerCase()] || defaultCatId;
      const ctaId = ctaMap[(r.conta || '').trim().toLowerCase()] || defaultCtaId;

      if (notionId) {
        const check = await client.query(`SELECT id FROM gastos WHERE notion_id = $1`, [notionId]);
        if (check.rows.length > 0) continue;
      }

      await client.query(
        `INSERT INTO gastos (nome, valor, data, notion_id, categoria_id, conta_id)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [nome, valor, dataStr, notionId, catId, ctaId]
      );
      gastosInseridos++;
    }

    await client.query('COMMIT');
    console.log(`Seed Node.js executado com sucesso: ${gastosInseridos} novos gastos inseridos.`);
    return {
      status: 'success',
      gastos_inseridos: gastosInseridos,
      total_categorias: Object.keys(catMap).length,
      total_contas: Object.keys(ctaMap).length
    };
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Erro no seed Node.js:', err);
    return { status: 'error', detail: err.message };
  } finally {
    client.release();
  }
}

module.exports = { runSeed };
