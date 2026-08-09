const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { pool, initDB } = require('./db');
const { runSeed } = require('./seed');

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());

// Restritivo: FK Violation Code in Postgres is '23503'
const FOREIGN_KEY_VIOLATION = '23503';

// Initialize DB and Run Seed on Startup
initDB().then(() => {
  runSeed().catch(err => console.error('Startup seed error:', err));
});

// ==================== GASTOS CRUD ====================

app.get('/api/gastos', async (req, res) => {
  try {
    const query = `
      SELECT 
        g.id,
        g.nome,
        g.valor::float,
        g.data,
        g.criado_em,
        g.notion_id,
        c.nome as tipo,
        c.id as categoria_id,
        cta.nome as conta,
        cta.id as conta_id
      FROM gastos g
      LEFT JOIN categorias c ON g.categoria_id = c.id
      LEFT JOIN contas cta ON g.conta_id = cta.id
      ORDER BY g.data DESC, g.id DESC
    `;
    const { rows } = await pool.query(query);
    const result = rows.map(r => ({
      id: String(r.id),
      nome: r.nome,
      valor: parseFloat(r.valor),
      tipo: r.tipo || '',
      conta: r.conta || '',
      data: r.data ? r.data.toISOString().split('T')[0] : '',
      criado_em: r.criado_em ? r.criado_em.toISOString() : '',
      categoria_id: r.categoria_id,
      conta_id: r.conta_id
    }));
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: `Erro ao buscar gastos: ${err.message}` });
  }
});

app.post('/api/gastos', async (req, res) => {
  try {
    const { nome, valor, tipo, conta, data } = req.body;
    if (!nome || valor === undefined || !tipo || !conta || !data) {
      return res.status(400).json({ detail: 'Preencha todos os campos obrigatórios.' });
    }

    const tipoNome = tipo.trim();
    const contaNome = conta.trim();

    // Get or Create Categoria
    let catRes = await pool.query('SELECT id FROM categorias WHERE LOWER(nome) = LOWER($1)', [tipoNome]);
    let categoriaId;
    if (catRes.rows.length === 0) {
      const newCat = await pool.query('INSERT INTO categorias (nome) VALUES ($1) RETURNING id', [tipoNome]);
      categoriaId = newCat.rows[0].id;
    } else {
      categoriaId = catRes.rows[0].id;
    }

    // Get or Create Conta
    let ctaRes = await pool.query('SELECT id FROM contas WHERE LOWER(nome) = LOWER($1)', [contaNome]);
    let contaId;
    if (ctaRes.rows.length === 0) {
      const newCta = await pool.query('INSERT INTO contas (nome) VALUES ($1) RETURNING id', [contaNome]);
      contaId = newCta.rows[0].id;
    } else {
      contaId = ctaRes.rows[0].id;
    }

    const insertRes = await pool.query(
      `INSERT INTO gastos (nome, valor, data, categoria_id, conta_id)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [nome, parseFloat(valor), data, categoriaId, contaId]
    );

    res.json({ status: 'success', id: String(insertRes.rows[0].id) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: `Erro ao criar gasto: ${err.message}` });
  }
});

app.patch('/api/gastos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, valor, tipo, conta, data } = req.body;

    const gastoCheck = await pool.query('SELECT * FROM gastos WHERE id = $1', [id]);
    if (gastoCheck.rows.length === 0) {
      return res.status(404).json({ detail: 'Gasto não encontrado' });
    }

    let categoriaId = gastoCheck.rows[0].categoria_id;
    let contaId = gastoCheck.rows[0].conta_id;

    if (tipo) {
      const tipoNome = tipo.trim();
      let catRes = await pool.query('SELECT id FROM categorias WHERE LOWER(nome) = LOWER($1)', [tipoNome]);
      if (catRes.rows.length === 0) {
        const newCat = await pool.query('INSERT INTO categorias (nome) VALUES ($1) RETURNING id', [tipoNome]);
        categoriaId = newCat.rows[0].id;
      } else {
        categoriaId = catRes.rows[0].id;
      }
    }

    if (conta) {
      const contaNome = conta.trim();
      let ctaRes = await pool.query('SELECT id FROM contas WHERE LOWER(nome) = LOWER($1)', [contaNome]);
      if (ctaRes.rows.length === 0) {
        const newCta = await pool.query('INSERT INTO contas (nome) VALUES ($1) RETURNING id', [contaNome]);
        contaId = newCta.rows[0].id;
      } else {
        contaId = ctaRes.rows[0].id;
      }
    }

    await pool.query(
      `UPDATE gastos 
       SET nome = COALESCE($1, nome),
           valor = COALESCE($2, valor),
           data = COALESCE($3, data),
           categoria_id = $4,
           conta_id = $5
       WHERE id = $6`,
      [nome || null, valor !== undefined ? parseFloat(valor) : null, data || null, categoriaId, contaId, id]
    );

    res.json({ status: 'success', message: 'Gasto atualizado com sucesso' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: `Erro ao atualizar gasto: ${err.message}` });
  }
});

app.delete('/api/gastos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const resDel = await pool.query('DELETE FROM gastos WHERE id = $1 RETURNING id', [id]);
    if (resDel.rows.length === 0) {
      return res.status(404).json({ detail: 'Gasto não encontrado' });
    }
    res.json({ status: 'success', message: 'Gasto excluído com sucesso' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: `Erro ao excluir gasto: ${err.message}` });
  }
});

// ==================== CATEGORIAS CRUD (RESTRITIVO) ====================

app.get('/api/categorias', async (req, res) => {
  try {
    const query = `
      SELECT c.id, c.nome, c.cor, COUNT(g.id)::int as gastos_count
      FROM categorias c
      LEFT JOIN gastos g ON g.categoria_id = c.id
      GROUP BY c.id, c.nome, c.cor
      ORDER BY c.nome ASC
    `;
    const { rows } = await pool.query(query);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: `Erro ao buscar categorias: ${err.message}` });
  }
});

app.post('/api/categorias', async (req, res) => {
  try {
    const { nome, cor } = req.body;
    if (!nome || !nome.trim()) {
      return res.status(400).json({ detail: 'O nome da categoria é obrigatório.' });
    }
    const nomeLimpo = nome.trim();

    const check = await pool.query('SELECT id FROM categorias WHERE LOWER(nome) = LOWER($1)', [nomeLimpo]);
    if (check.rows.length > 0) {
      return res.status(400).json({ detail: `A categoria '${nomeLimpo}' já existe.` });
    }

    const newCat = await pool.query(
      'INSERT INTO categorias (nome, cor) VALUES ($1, $2) RETURNING id, nome',
      [nomeLimpo, cor || null]
    );

    res.json({ status: 'success', id: newCat.rows[0].id, nome: newCat.rows[0].nome });
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: `Erro ao criar categoria: ${err.message}` });
  }
});

app.patch('/api/categorias/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, cor } = req.body;

    if (nome) {
      const nomeLimpo = nome.trim();
      const check = await pool.query('SELECT id FROM categorias WHERE LOWER(nome) = LOWER($1) AND id != $2', [nomeLimpo, id]);
      if (check.rows.length > 0) {
        return res.status(400).json({ detail: `Já existe outra categoria com o nome '${nomeLimpo}'.` });
      }
    }

    await pool.query(
      'UPDATE categorias SET nome = COALESCE($1, nome), cor = COALESCE($2, cor) WHERE id = $3',
      [nome ? nome.trim() : null, cor !== undefined ? cor : null, id]
    );

    res.json({ status: 'success', message: 'Categoria atualizada com sucesso.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: `Erro ao atualizar categoria: ${err.message}` });
  }
});

app.delete('/api/categorias/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const catCheck = await pool.query('SELECT nome FROM categorias WHERE id = $1', [id]);
    if (catCheck.rows.length === 0) {
      return res.status(404).json({ detail: 'Categoria não encontrada.' });
    }
    const catNome = catCheck.rows[0].nome;

    // COMPORTAMENTO RESTRITIVO: Verifica contagem prévia de compras associadas
    const countRes = await pool.query('SELECT COUNT(*)::int as count FROM gastos WHERE categoria_id = $1', [id]);
    const count = countRes.rows[0].count;
    if (count > 0) {
      return res.status(400).json({
        detail: `Não é possível excluir a categoria '${catNome}' pois existem ${count} compra(s) vinculada(s) a ela. Remova ou altere as compras antes de excluir a categoria.`
      });
    }

    await pool.query('DELETE FROM categorias WHERE id = $1', [id]);
    res.json({ status: 'success', message: `Categoria '${catNome}' excluída com sucesso.` });
  } catch (err) {
    if (err.code === FOREIGN_KEY_VIOLATION) {
      return res.status(400).json({
        detail: 'Operação negada pelo banco: Existem registros de compras vinculados a esta categoria.'
      });
    }
    console.error(err);
    res.status(500).json({ detail: `Erro ao excluir categoria: ${err.message}` });
  }
});

// ==================== CONTAS CRUD (RESTRITIVO) ====================

app.get('/api/contas', async (req, res) => {
  try {
    const query = `
      SELECT cta.id, cta.nome, cta.tipo_conta, cta.cor, COUNT(g.id)::int as gastos_count
      FROM contas cta
      LEFT JOIN gastos g ON g.conta_id = cta.id
      GROUP BY cta.id, cta.nome, cta.tipo_conta, cta.cor
      ORDER BY cta.nome ASC
    `;
    const { rows } = await pool.query(query);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: `Erro ao buscar métodos de pagamento: ${err.message}` });
  }
});

app.post('/api/contas', async (req, res) => {
  try {
    const { nome, tipo_conta, cor } = req.body;
    if (!nome || !nome.trim()) {
      return res.status(400).json({ detail: 'O nome do método de pagamento é obrigatório.' });
    }
    const nomeLimpo = nome.trim();

    const check = await pool.query('SELECT id FROM contas WHERE LOWER(nome) = LOWER($1)', [nomeLimpo]);
    if (check.rows.length > 0) {
      return res.status(400).json({ detail: `O método de pagamento '${nomeLimpo}' já existe.` });
    }

    const newCta = await pool.query(
      'INSERT INTO contas (nome, tipo_conta, cor) VALUES ($1, $2, $3) RETURNING id, nome',
      [nomeLimpo, tipo_conta || null, cor || null]
    );

    res.json({ status: 'success', id: newCta.rows[0].id, nome: newCta.rows[0].nome });
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: `Erro ao criar método de pagamento: ${err.message}` });
  }
});

app.patch('/api/contas/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, tipo_conta, cor } = req.body;

    if (nome) {
      const nomeLimpo = nome.trim();
      const check = await pool.query('SELECT id FROM contas WHERE LOWER(nome) = LOWER($1) AND id != $2', [nomeLimpo, id]);
      if (check.rows.length > 0) {
        return res.status(400).json({ detail: `Já existe outro método com o nome '${nomeLimpo}'.` });
      }
    }

    await pool.query(
      'UPDATE contas SET nome = COALESCE($1, nome), tipo_conta = COALESCE($2, tipo_conta), cor = COALESCE($3, cor) WHERE id = $4',
      [nome ? nome.trim() : null, tipo_conta !== undefined ? tipo_conta : null, cor !== undefined ? cor : null, id]
    );

    res.json({ status: 'success', message: 'Método de pagamento atualizado com sucesso.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: `Erro ao atualizar método de pagamento: ${err.message}` });
  }
});

app.delete('/api/contas/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const ctaCheck = await pool.query('SELECT nome FROM contas WHERE id = $1', [id]);
    if (ctaCheck.rows.length === 0) {
      return res.status(404).json({ detail: 'Método de pagamento não encontrado.' });
    }
    const ctaNome = ctaCheck.rows[0].nome;

    // COMPORTAMENTO RESTRITIVO: Verifica contagem prévia de compras associadas
    const countRes = await pool.query('SELECT COUNT(*)::int as count FROM gastos WHERE conta_id = $1', [id]);
    const count = countRes.rows[0].count;
    if (count > 0) {
      return res.status(400).json({
        detail: `Não é possível excluir o método '${ctaNome}' pois existem ${count} compra(s) vinculada(s) a ele. Remova ou altere as compras antes de excluir.`
      });
    }

    await pool.query('DELETE FROM contas WHERE id = $1', [id]);
    res.json({ status: 'success', message: `Método '${ctaNome}' excluído com sucesso.` });
  } catch (err) {
    if (err.code === FOREIGN_KEY_VIOLATION) {
      return res.status(400).json({
        detail: 'Operação negada pelo banco: Existem registros de compras vinculados a este método de pagamento.'
      });
    }
    console.error(err);
    res.status(500).json({ detail: `Erro ao excluir método de pagamento: ${err.message}` });
  }
});

// ==================== METADADOS & EXPORTAR ====================

app.get('/api/metadados', async (req, res) => {
  try {
    const resCat = await pool.query('SELECT nome FROM categorias ORDER BY nome ASC');
    const resCta = await pool.query('SELECT nome FROM contas ORDER BY nome ASC');

    const tipos = resCat.rows.map(r => r.nome);
    const contas = resCta.rows.map(r => r.nome);

    res.json({ tipos, contas });
  } catch (err) {
    console.error(err);
    res.json({ tipos: [], contas: [] });
  }
});

app.get('/api/exportar', async (req, res) => {
  try {
    const query = `
      SELECT 
        g.id, g.nome, g.valor::float, g.data, g.criado_em,
        c.nome as tipo, cta.nome as conta
      FROM gastos g
      LEFT JOIN categorias c ON g.categoria_id = c.id
      LEFT JOIN contas cta ON g.conta_id = cta.id
      ORDER BY g.data DESC
    `;
    const { rows } = await pool.query(query);
    const csvRows = ['ID;Nome;Valor;Tipo;Conta;Data;Criado Em'];

    for (const g of rows) {
      const dataStr = g.data ? g.data.toISOString().split('T')[0] : '';
      const criadoEmStr = g.criado_em ? g.criado_em.toISOString() : '';
      csvRows.push(`${g.id};"${(g.nome || '').replace(/"/g, '""')}";${g.valor};"${g.tipo || ''}";"${g.conta || ''}";"${dataStr}";"${criadoEmStr}"`);
    }

    const csvContent = '\uFEFF' + csvRows.join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="gastos.csv"');
    res.send(csvContent);
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: `Erro ao exportar CSV: ${err.message}` });
  }
});

app.post('/api/seed', async (req, res) => {
  try {
    const result = await runSeed();
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: err.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Node.js Express Server running on port ${PORT}`);
});
