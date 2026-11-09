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

// Cabeçalhos de descoberta MCP em todas as respostas HTTP
app.use((req, res, next) => {
  const host = req.headers.host || '192.168.15.15:8080';
  const proto = req.headers['x-forwarded-proto'] || 'http';
  const baseUrl = `${proto}://${host}`;
  res.setHeader('X-MCP-Server', `${baseUrl}/mcp`);
  res.setHeader('X-MCP-SSE', `${baseUrl}/sse`);
  res.setHeader('X-MCP-Tools', `${baseUrl}/mcp/tools`);
  res.setHeader('X-API-Tudo', `${baseUrl}/api/tudo`);
  res.setHeader('X-API-Gastos', `${baseUrl}/api/gastos`);
  res.setHeader('X-API-Stage', `${baseUrl}/api/stage`);
  res.setHeader('X-Stage-UI', `${baseUrl}/stage`);
  res.setHeader('X-API-Metadados', `${baseUrl}/api/metadados`);
  res.setHeader('X-API-Backup-CSV', `${baseUrl}/api/exportar`);
  next();
});

// Restritivo: FK Violation Code in Postgres is '23503'
const FOREIGN_KEY_VIOLATION = '23503';

const BACKUP_DIR = path.join(__dirname, 'backups');
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// Gera conteúdo CSV completo do banco
async function gerarCsvString() {
  const query = `
    SELECT 
      g.id, g.nome, g.descricao, g.localizacao, g.valor::float, g.data, g.criado_em,
      g.parcela_grupo_id, g.fixo,
      c.nome as tipo, cta.nome as conta
    FROM gastos g
    LEFT JOIN categorias c ON g.categoria_id = c.id
    LEFT JOIN contas cta ON g.conta_id = cta.id
    ORDER BY g.data DESC, g.id DESC
  `;
  const { rows } = await pool.query(query);
  const csvRows = ['ID;Nome;Descricao;Localizacao;Valor;Tipo;Conta;Data;Fixo;Criado Em'];

  for (const g of rows) {
    const dataStr = g.data ? g.data.toISOString().split('T')[0] : '';
    const criadoEmStr = g.criado_em ? g.criado_em.toISOString() : '';
    const fixoStr = g.fixo ? 'Sim' : 'Nao';
    csvRows.push(
      `${g.id};"${(g.nome || '').replace(/"/g, '""')}";"${(g.descricao || '').replace(/"/g, '""')}";"${(g.localizacao || '').replace(/"/g, '""')}";${g.valor};"${g.tipo || ''}";"${g.conta || ''}";"${dataStr}";"${fixoStr}";"${criadoEmStr}"`
    );
  }
  return '\uFEFF' + csvRows.join('\n');
}

// Safety Net: Salva snapshot CSV automático no servidor antes de modificações (mantém últimos 30)
async function salvarSnapshotPreModificacao(acao = 'mod') {
  try {
    const csvContent = await gerarCsvString();
    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `auto_backup_${ts}_${acao}.csv`;
    fs.writeFileSync(path.join(BACKUP_DIR, filename), csvContent, 'utf8');

    const files = fs.readdirSync(BACKUP_DIR)
      .filter(f => f.endsWith('.csv'))
      .sort()
      .reverse();
    for (const oldFile of files.slice(30)) {
      fs.unlinkSync(path.join(BACKUP_DIR, oldFile));
    }
  } catch (e) {
    console.error('Aviso: falha ao salvar snapshot automático:', e.message);
  }
}

// Initialize DB and Run Seed on Startup
initDB().then(() => {
  runSeed().catch(err => console.error('Startup seed error:', err));
});

// ==================== GASTOS CRUD ====================

app.get('/api/gastos', async (req, res) => {
  try {
    const search = (req.query.search || req.query.q || '').trim();
    const params = [];
    let whereClause = '';

    if (search) {
      params.push(`%${search}%`);
      whereClause = `WHERE (g.nome ILIKE $1 OR COALESCE(g.descricao, '') ILIKE $1 OR COALESCE(g.localizacao, '') ILIKE $1)`;
    }

    const query = `
      SELECT 
        g.id,
        g.nome,
        g.descricao,
        g.localizacao,
        g.valor::float,
        g.data,
        g.criado_em,
        g.notion_id,
        g.parcela_grupo_id,
        g.fixo,
        c.nome as tipo,
        c.id as categoria_id,
        cta.nome as conta,
        cta.id as conta_id
      FROM gastos g
      LEFT JOIN categorias c ON g.categoria_id = c.id
      LEFT JOIN contas cta ON g.conta_id = cta.id
      ${whereClause}
      ORDER BY g.data DESC, g.id DESC
    `;
    const { rows } = await pool.query(query, params);
    const result = rows.map(r => ({
      id: String(r.id),
      nome: r.nome,
      descricao: r.descricao || '',
      localizacao: r.localizacao || '',
      valor: parseFloat(r.valor),
      tipo: r.tipo || '',
      conta: r.conta || '',
      data: r.data ? r.data.toISOString().split('T')[0] : '',
      criado_em: r.criado_em ? r.criado_em.toISOString() : '',
      parcela_grupo_id: r.parcela_grupo_id || null,
      fixo: Boolean(r.fixo),
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
    const { nome, descricao, localizacao, valor, tipo, conta, data, fixo } = req.body;
    if (!nome || valor === undefined || !tipo || !conta || !data) {
      return res.status(400).json({ detail: 'Preencha todos os campos obrigatórios.' });
    }

    await salvarSnapshotPreModificacao('post_gasto');

    const tipoNome = tipo.trim();
    const contaNome = conta.trim();
    const descricaoLimpa = descricao ? descricao.trim() : null;
    const localizacaoLimpa = localizacao ? localizacao.trim() : null;
    const isFixo = Boolean(fixo);

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

    // Auto-parcelamento check: "1/6" ou "(1/6)" no final do nome
    const match = nome.match(/^(.*?)(?:\s*-\s*|\s+)\(?1\/(\d+)\)?$/);
    const grupoId = match ? `grp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}` : null;

    const insertRes = await pool.query(
      `INSERT INTO gastos (nome, descricao, localizacao, valor, data, categoria_id, conta_id, parcela_grupo_id, fixo)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
      [nome, descricaoLimpa, localizacaoLimpa, parseFloat(valor), data, categoriaId, contaId, grupoId, isFixo]
    );

    if (match) {
      const baseName = match[1].trim();
      const totalParcelas = parseInt(match[2], 10);
      let baseDate = new Date(data + 'T12:00:00');
      for (let i = 2; i <= totalParcelas; i++) {
        baseDate.setMonth(baseDate.getMonth() + 1);
        const nextDataStr = baseDate.toISOString().split('T')[0];
        const nextNome = `${baseName} - ${i}/${totalParcelas}`;
        await pool.query(
          `INSERT INTO gastos (nome, descricao, localizacao, valor, data, categoria_id, conta_id, parcela_grupo_id, fixo)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [nextNome, descricaoLimpa, localizacaoLimpa, parseFloat(valor), nextDataStr, categoriaId, contaId, grupoId, isFixo]
        );
      }
    }

    res.json({ status: 'success', id: String(insertRes.rows[0].id), parcela_grupo_id: grupoId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: `Erro ao criar gasto: ${err.message}` });
  }
});

app.patch('/api/gastos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, descricao, localizacao, valor, tipo, conta, data, fixo, atualizar_grupo } = req.body;

    const gastoCheck = await pool.query('SELECT * FROM gastos WHERE id = $1', [id]);
    if (gastoCheck.rows.length === 0) {
      return res.status(404).json({ detail: 'Gasto não encontrado' });
    }

    await salvarSnapshotPreModificacao('patch_gasto');

    const atual = gastoCheck.rows[0];
    let categoriaId = atual.categoria_id;
    let contaId = atual.conta_id;
    let novaDescricao = descricao !== undefined ? (descricao ? descricao.trim() : '') : atual.descricao;
    let novaLocalizacao = localizacao !== undefined ? (localizacao ? localizacao.trim() : '') : atual.localizacao;
    let novoFixo = fixo !== undefined ? Boolean(fixo) : Boolean(atual.fixo);

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
           descricao = $2,
           localizacao = $3,
           valor = COALESCE($4, valor),
           data = COALESCE($5, data),
           categoria_id = $6,
           conta_id = $7,
           fixo = $8
       WHERE id = $9`,
      [
        nome || null,
        novaDescricao,
        novaLocalizacao,
        valor !== undefined ? parseFloat(valor) : null,
        data || null,
        categoriaId,
        contaId,
        novoFixo,
        id
      ]
    );

    if (atualizar_grupo && atual.parcela_grupo_id) {
      await pool.query(
        `UPDATE gastos
         SET descricao = $1,
             localizacao = $2,
             valor = COALESCE($3, valor),
             categoria_id = $4,
             conta_id = $5
         WHERE parcela_grupo_id = $6 AND id != $7`,
        [
          novaDescricao,
          novaLocalizacao,
          valor !== undefined ? parseFloat(valor) : null,
          categoriaId,
          contaId,
          atual.parcela_grupo_id,
          id
        ]
      );
    }

    res.json({ status: 'success', message: 'Gasto atualizado com sucesso' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: `Erro ao atualizar gasto: ${err.message}` });
  }
});

app.delete('/api/gastos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const excluirGrupo = req.query.excluir_grupo === 'true';

    const gastoCheck = await pool.query('SELECT id, parcela_grupo_id FROM gastos WHERE id = $1', [id]);
    if (gastoCheck.rows.length === 0) {
      return res.status(404).json({ detail: 'Gasto não encontrado' });
    }

    await salvarSnapshotPreModificacao('delete_gasto');

    const grupoId = gastoCheck.rows[0].parcela_grupo_id;
    if (excluirGrupo && grupoId) {
      const resDelGrupo = await pool.query('DELETE FROM gastos WHERE parcela_grupo_id = $1 RETURNING id', [grupoId]);
      return res.json({ status: 'success', message: `${resDelGrupo.rowCount} parcelas excluídas com sucesso` });
    }

    await pool.query('DELETE FROM gastos WHERE id = $1', [id]);
    res.json({ status: 'success', message: 'Gasto excluído com sucesso' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: `Erro ao excluir gasto: ${err.message}` });
  }
});

// ==================== CATEGORIAS CRUD (RESTRITIVO + ORÇAMENTO) ====================

app.get('/api/categorias', async (req, res) => {
  try {
    const query = `
      SELECT c.id, c.nome, c.cor, COALESCE(c.orcamento_mensal, 0)::float as orcamento_mensal, COUNT(g.id)::int as gastos_count
      FROM categorias c
      LEFT JOIN gastos g ON g.categoria_id = c.id
      GROUP BY c.id, c.nome, c.cor, c.orcamento_mensal
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
    const { nome, cor, orcamento_mensal } = req.body;
    if (!nome || !nome.trim()) {
      return res.status(400).json({ detail: 'O nome da categoria é obrigatório.' });
    }
    const nomeLimpo = nome.trim();
    const orcamento = orcamento_mensal ? parseFloat(orcamento_mensal) : 0;

    const check = await pool.query('SELECT id FROM categorias WHERE LOWER(nome) = LOWER($1)', [nomeLimpo]);
    if (check.rows.length > 0) {
      return res.status(400).json({ detail: `A categoria '${nomeLimpo}' já existe.` });
    }

    const newCat = await pool.query(
      'INSERT INTO categorias (nome, cor, orcamento_mensal) VALUES ($1, $2, $3) RETURNING id, nome, orcamento_mensal::float',
      [nomeLimpo, cor || null, orcamento]
    );

    res.json({ status: 'success', id: newCat.rows[0].id, nome: newCat.rows[0].nome, orcamento_mensal: newCat.rows[0].orcamento_mensal });
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: `Erro ao criar categoria: ${err.message}` });
  }
});

app.patch('/api/categorias/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, cor, orcamento_mensal } = req.body;

    if (nome) {
      const nomeLimpo = nome.trim();
      const check = await pool.query('SELECT id FROM categorias WHERE LOWER(nome) = LOWER($1) AND id != $2', [nomeLimpo, id]);
      if (check.rows.length > 0) {
        return res.status(400).json({ detail: `Já existe outra categoria com o nome '${nomeLimpo}'.` });
      }
    }

    await pool.query(
      `UPDATE categorias 
       SET nome = COALESCE($1, nome), 
           cor = COALESCE($2, cor),
           orcamento_mensal = COALESCE($3, orcamento_mensal)
       WHERE id = $4`,
      [
        nome ? nome.trim() : null,
        cor !== undefined ? cor : null,
        orcamento_mensal !== undefined ? parseFloat(orcamento_mensal || 0) : null,
        id
      ]
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

// ==================== METADADOS, EXPORTAR & BACKUPS ====================

app.get('/api/metadados', async (req, res) => {
  try {
    const resCat = await pool.query('SELECT nome, COALESCE(orcamento_mensal, 0)::float as orcamento_mensal FROM categorias ORDER BY nome ASC');
    const resCta = await pool.query('SELECT nome FROM contas ORDER BY nome ASC');
    const resLoc = await pool.query(`
      SELECT DISTINCT localizacao 
      FROM gastos 
      WHERE localizacao IS NOT NULL AND TRIM(localizacao) != '' 
      ORDER BY localizacao ASC
    `);

    const tipos = resCat.rows.map(r => r.nome);
    const orcamentos = {};
    resCat.rows.forEach(r => {
      if (r.orcamento_mensal > 0) {
        orcamentos[r.nome] = r.orcamento_mensal;
      }
    });
    const contas = resCta.rows.map(r => r.nome);
    const locais = resLoc.rows.map(r => r.localizacao);

    res.json({ tipos, contas, locais, orcamentos });
  } catch (err) {
    console.error(err);
    res.json({ tipos: [], contas: [], locais: [], orcamentos: {} });
  }
});

app.get('/api/exportar', async (req, res) => {
  try {
    const csvContent = await gerarCsvString();
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    const agora = new Date();
    const dataExportacao = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(agora);
    const horaExportacao = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }).format(agora).replace(/:/g, '-');
    res.setHeader('Content-Disposition', `attachment; filename="gastos ${dataExportacao} ${horaExportacao}.csv"`);
    res.send(csvContent);
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: `Erro ao exportar CSV: ${err.message}` });
  }
});

app.get('/api/backups', (req, res) => {
  try {
    if (!fs.existsSync(BACKUP_DIR)) return res.json([]);
    const files = fs.readdirSync(BACKUP_DIR)
      .filter(f => f.endsWith('.csv'))
      .sort()
      .reverse()
      .map(f => {
        const stat = fs.statSync(path.join(BACKUP_DIR, f));
        return { arquivo: f, tamanho: stat.size, data: stat.mtime };
      });
    res.json(files);
  } catch (err) {
    res.status(500).json({ detail: err.message });
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

// ==================== STAGE / ZONA DE TRANSIÇÃO (PLAYGROUND) ====================

function formatarItemStage(r) {
  const nome = (r.nome || '').trim();
  const tipo = (r.tipo || '').trim();
  const conta = (r.conta || '').trim();
  const data = (r.data || '').trim();
  const valorNum = r.valor !== null && r.valor !== undefined && r.valor !== '' ? parseFloat(r.valor) : null;
  const valorValido = valorNum !== null && !Number.isNaN(valorNum) && valorNum > 0;

  const camposFaltantes = [];
  if (!nome) camposFaltantes.push('nome');
  if (!valorValido) camposFaltantes.push('valor');
  if (!tipo) camposFaltantes.push('tipo');
  if (!conta) camposFaltantes.push('conta');
  if (!data) camposFaltantes.push('data');

  return {
    id: String(r.id),
    nome: r.nome || '',
    descricao: r.descricao || '',
    localizacao: r.localizacao || '',
    valor: valorNum !== null && !Number.isNaN(valorNum) ? valorNum : '',
    tipo: r.tipo || '',
    conta: r.conta || '',
    data: r.data || '',
    fixo: Boolean(r.fixo),
    texto_extrato: r.texto_extrato || '',
    observacao_agente: r.observacao_agente || '',
    selecionado: r.selecionado !== undefined ? Boolean(r.selecionado) : true,
    criado_em: r.criado_em ? r.criado_em.toISOString() : '',
    completo: camposFaltantes.length === 0,
    campos_faltantes: camposFaltantes
  };
}

async function obterResumoStage() {
  const { rows } = await pool.query('SELECT * FROM gastos_stage ORDER BY data DESC, id ASC');
  const itens = rows.map(formatarItemStage);
  const prontos = itens.filter(i => i.completo).length;
  const incompletos = itens.length - prontos;
  const valorTotal = itens.reduce((acc, i) => acc + (typeof i.valor === 'number' ? i.valor : 0), 0);
  return {
    total: itens.length,
    prontos_para_commit: prontos,
    incompletos,
    valor_total: Number(valorTotal.toFixed(2)),
    itens
  };
}

async function inserirItensStage(rawInput, limparAnterior = false) {
  let lista = [];
  if (Array.isArray(rawInput)) {
    lista = rawInput;
  } else if (rawInput && Array.isArray(rawInput.itens)) {
    lista = rawInput.itens;
  } else if (rawInput && Array.isArray(rawInput.items)) {
    lista = rawInput.items;
  } else if (rawInput && Array.isArray(rawInput.gastos)) {
    lista = rawInput.gastos;
  } else if (rawInput && typeof rawInput === 'object') {
    lista = [rawInput];
  }

  if (limparAnterior || (rawInput && rawInput.limpar_anterior)) {
    await pool.query('DELETE FROM gastos_stage');
  }

  const inseridos = [];
  for (const item of lista) {
    if (!item || typeof item !== 'object') continue;
    const nome = item.nome !== undefined && item.nome !== null ? String(item.nome).trim() : '';
    const descricao = item.descricao !== undefined && item.descricao !== null ? String(item.descricao).trim() : '';
    const localizacao = item.localizacao !== undefined && item.localizacao !== null ? String(item.localizacao).trim() : '';
    const valor = item.valor !== undefined && item.valor !== null && item.valor !== '' ? parseFloat(item.valor) : null;
    const tipo = (item.tipo || item.categoria || '').toString().trim();
    const conta = (item.conta || item.metodo_pagamento || '').toString().trim();
    const data = item.data !== undefined && item.data !== null ? String(item.data).trim() : '';
    const fixo = Boolean(item.fixo);
    const textoExtrato = (item.texto_extrato || item.extrato || item.linha_extrato || item.raw || '').toString().trim();
    const observacaoAgente = (item.observacao_agente || item.observacao || item.duvida || item.nota || '').toString().trim();
    const selecionado = item.selecionado !== undefined ? Boolean(item.selecionado) : true;

    const { rows } = await pool.query(
      `INSERT INTO gastos_stage
       (nome, descricao, localizacao, valor, tipo, conta, data, fixo, texto_extrato, observacao_agente, selecionado)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [nome, descricao, localizacao, Number.isNaN(valor) ? null : valor, tipo, conta, data, fixo, textoExtrato, observacaoAgente, selecionado]
    );
    inseridos.push(formatarItemStage(rows[0]));
  }
  return inseridos;
}

async function comitarItensStage(opcoes = {}) {
  const { ids, apenas_completos = false, apenas_selecionados = true } = opcoes;

  let query = 'SELECT * FROM gastos_stage';
  const params = [];
  if (Array.isArray(ids) && ids.length > 0) {
    params.push(ids.map(id => Number(id)));
    query += ' WHERE id = ANY($1::int[])';
  } else if (apenas_selecionados) {
    query += ' WHERE selecionado = TRUE';
  }
  query += ' ORDER BY data ASC, id ASC';

  const { rows } = await pool.query(query, params);
  if (rows.length === 0) {
    throw new Error('Nenhum item encontrado no stage para dar baixa.');
  }

  const formatados = rows.map(formatarItemStage);
  const incompletos = formatados.filter(i => !i.completo);

  if (incompletos.length > 0 && !apenas_completos) {
    const detalhes = incompletos
      .slice(0, 5)
      .map(i => `#${i.id} (${i.nome || i.texto_extrato || 'Sem nome'}: faltam [${i.campos_faltantes.join(', ')}])`)
      .join('; ');
    throw new Error(`Existem ${incompletos.length} item(ns) selecionado(s) ainda incompletos no stage. Preencha os campos obrigatórios antes de dar baixa: ${detalhes}`);
  }

  const paraComitar = apenas_completos ? formatados.filter(i => i.completo) : formatados;
  if (paraComitar.length === 0) {
    throw new Error('Nenhum item completo pronto para dar baixa no stage.');
  }

  await salvarSnapshotPreModificacao('commit_stage');

  const idsComitados = [];
  const gastosCriadosIds = [];

  for (const item of paraComitar) {
    const tipoNome = item.tipo.trim();
    const contaNome = item.conta.trim();
    const nomeLimpo = item.nome.trim();
    const descricaoLimpa = item.descricao ? item.descricao.trim() : null;
    const localizacaoLimpa = item.localizacao ? item.localizacao.trim() : null;
    const isFixo = Boolean(item.fixo);
    const valorNum = parseFloat(item.valor);
    const dataLimpa = item.data.trim();

    let catRes = await pool.query('SELECT id FROM categorias WHERE LOWER(nome) = LOWER($1)', [tipoNome]);
    let categoriaId = catRes.rows.length
      ? catRes.rows[0].id
      : (await pool.query('INSERT INTO categorias (nome) VALUES ($1) RETURNING id', [tipoNome])).rows[0].id;

    let ctaRes = await pool.query('SELECT id FROM contas WHERE LOWER(nome) = LOWER($1)', [contaNome]);
    let contaId = ctaRes.rows.length
      ? ctaRes.rows[0].id
      : (await pool.query('INSERT INTO contas (nome) VALUES ($1) RETURNING id', [contaNome])).rows[0].id;

    const match = nomeLimpo.match(/^(.*?)(?:\s*-\s*|\s+)\(?1\/(\d+)\)?$/);
    const grupoId = match ? `grp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}` : null;

    const insertRes = await pool.query(
      `INSERT INTO gastos (nome, descricao, localizacao, valor, data, categoria_id, conta_id, parcela_grupo_id, fixo)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
      [nomeLimpo, descricaoLimpa, localizacaoLimpa, valorNum, dataLimpa, categoriaId, contaId, grupoId, isFixo]
    );
    gastosCriadosIds.push(String(insertRes.rows[0].id));

    if (match) {
      const baseName = match[1].trim();
      const totalParcelas = parseInt(match[2], 10);
      let baseDate = new Date(dataLimpa + 'T12:00:00');
      for (let i = 2; i <= totalParcelas; i++) {
        baseDate.setMonth(baseDate.getMonth() + 1);
        const nextDataStr = baseDate.toISOString().split('T')[0];
        const nextNome = `${baseName} - ${i}/${totalParcelas}`;
        await pool.query(
          `INSERT INTO gastos (nome, descricao, localizacao, valor, data, categoria_id, conta_id, parcela_grupo_id, fixo)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [nextNome, descricaoLimpa, localizacaoLimpa, valorNum, nextDataStr, categoriaId, contaId, grupoId, isFixo]
        );
      }
    }

    idsComitados.push(Number(item.id));
  }

  await pool.query('DELETE FROM gastos_stage WHERE id = ANY($1::int[])', [idsComitados]);

  return {
    status: 'success',
    message: `${idsComitados.length} compra(s) do stage foram confirmadas e lançadas com sucesso!`,
    comitados_count: idsComitados.length,
    stage_ids_removidos: idsComitados,
    gastos_criados_ids: gastosCriadosIds
  };
}

// O registro persistente impede reimportações mesmo depois da baixa ou descarte.
app.post('/api/pluggy/sync', async (req, res) => {
  let client;
  try {
    const items = await require('./pluggy').transactions();
    client = await pool.connect();
    await client.query('BEGIN');
    let inserted = 0;
    for (const item of items) {
      const registered = await client.query('INSERT INTO pluggy_importacoes (transaction_id) VALUES ($1) ON CONFLICT DO NOTHING RETURNING transaction_id', [item.id]);
      if (!registered.rowCount) continue;
      await client.query(`INSERT INTO gastos_stage (nome, valor, data, conta, tipo, texto_extrato, observacao_agente, selecionado)
        VALUES ($1, $2, $3, $4, '', $5, $6, false)`,
        [item.nome, item.valor, item.data, item.conta, item.texto_extrato, item.observacao_agente]);
      inserted++;
    }
    await client.query('COMMIT');
    res.json({ inseridos_count: inserted, ignorados_count: items.length - inserted });
  } catch (err) {
    if (client) await client.query('ROLLBACK');
    res.status(502).json({ detail: err.message });
  } finally { if (client) client.release(); }
});

app.get('/api/stage/pagina', async (req, res) => {
  try {
    const tamanho = Math.min(100, Math.max(1, parseInt(req.query.tamanho, 10) || 25));
    const paginaPedida = Math.max(0, parseInt(req.query.pagina, 10) || 0);
    const completo = `(trim(coalesce(nome,'')) <> '' AND valor > 0 AND trim(coalesce(tipo,'')) <> '' AND trim(coalesce(conta,'')) <> '' AND trim(coalesce(data,'')) <> '')`;
    const params = [];
    const filtros = [];
    if (req.query.status === 'prontos') filtros.push(`coalesce(${completo}, false)`);
    if (req.query.status === 'incompletos') filtros.push(`NOT coalesce(${completo}, false)`);
    if (req.query.busca) {
      params.push('%' + String(req.query.busca).trim().replace(/[\\%_]/g, '\\$&') + '%');
      filtros.push(`concat_ws(' ', nome, texto_extrato, observacao_agente, tipo, conta, descricao, localizacao) ILIKE $${params.length}`);
    }
    const where = filtros.length ? 'WHERE ' + filtros.join(' AND ') : '';
    const globais = await pool.query(`SELECT count(*)::int total, count(*) FILTER (WHERE ${completo})::int prontos, coalesce(sum(valor),0) valor_total FROM gastos_stage`);
    const contagem = await pool.query(`SELECT count(*)::int total FROM gastos_stage ${where}`, params);
    const totalFiltrado = contagem.rows[0].total;
    const pagina = Math.min(paginaPedida, Math.max(0, Math.ceil(totalFiltrado / tamanho) - 1));
    const colunas = ['nome','valor','tipo','conta','data','descricao','localizacao','fixo','observacao_agente','texto_extrato'];
    const ordem = ({ extrato: 'texto_extrato', observacao: 'observacao_agente' })[req.query.ordem] || req.query.ordem;
    const coluna = colunas.includes(ordem) ? ordem : 'data';
    const direcao = req.query.ordem ? (req.query.direcao === 'desc' ? 'DESC' : 'ASC') : 'DESC';
    const result = await pool.query(`SELECT * FROM gastos_stage ${where} ORDER BY ${coluna} ${direcao} NULLS LAST, id ASC LIMIT $${params.length+1} OFFSET $${params.length+2}`, [...params, tamanho, pagina*tamanho]);
    const global = globais.rows[0];
    res.json({ total: global.total, prontos_para_commit: global.prontos, incompletos: global.total-global.prontos,
      valor_total: Number(global.valor_total), total_filtrado: totalFiltrado, pagina, tamanho, itens: result.rows.map(formatarItemStage) });
  } catch (err) { console.error(err); res.status(500).json({ detail: 'Erro ao carregar página do Stage.' }); }
});

app.get(['/api/stage', '/mcp/stage'], async (req, res) => {
  try {
    const resumo = await obterResumoStage();
    res.json(resumo);
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: `Erro ao buscar stage: ${err.message}` });
  }
});

app.post(['/api/stage', '/mcp/stage'], async (req, res) => {
  try {
    const limparAnterior = req.query.limpar === 'true' || Boolean(req.body && req.body.limpar_anterior);
    const inseridos = await inserirItensStage(req.body, limparAnterior);
    const resumo = await obterResumoStage();
    res.json({
      status: 'success',
      message: `${inseridos.length} item(ns) adicionado(s) ao stage com sucesso.`,
      inseridos_count: inseridos.length,
      inseridos,
      stage: resumo
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: `Erro ao adicionar ao stage: ${err.message}` });
  }
});

app.patch(['/api/stage/:id', '/mcp/stage/:id'], async (req, res) => {
  try {
    const { id } = req.params;
    const check = await pool.query('SELECT * FROM gastos_stage WHERE id = $1', [id]);
    if (check.rows.length === 0) {
      return res.status(404).json({ detail: 'Item não encontrado no stage.' });
    }
    const atual = check.rows[0];
    const b = req.body || {};

    const nome = b.nome !== undefined ? String(b.nome).trim() : atual.nome;
    const descricao = b.descricao !== undefined ? String(b.descricao).trim() : atual.descricao;
    const localizacao = b.localizacao !== undefined ? String(b.localizacao).trim() : atual.localizacao;
    const valor = b.valor !== undefined
      ? (b.valor === '' || b.valor === null ? null : parseFloat(b.valor))
      : atual.valor;
    const tipo = b.tipo !== undefined ? String(b.tipo).trim() : atual.tipo;
    const conta = b.conta !== undefined ? String(b.conta).trim() : atual.conta;
    const data = b.data !== undefined ? String(b.data).trim() : atual.data;
    const fixo = b.fixo !== undefined ? Boolean(b.fixo) : Boolean(atual.fixo);
    const textoExtrato = b.texto_extrato !== undefined ? String(b.texto_extrato).trim() : atual.texto_extrato;
    const observacaoAgente = b.observacao_agente !== undefined ? String(b.observacao_agente).trim() : atual.observacao_agente;
    const selecionado = b.selecionado !== undefined ? Boolean(b.selecionado) : Boolean(atual.selecionado);

    const { rows } = await pool.query(
      `UPDATE gastos_stage
       SET nome = $1, descricao = $2, localizacao = $3, valor = $4, tipo = $5, conta = $6,
           data = $7, fixo = $8, texto_extrato = $9, observacao_agente = $10, selecionado = $11
       WHERE id = $12
       RETURNING *`,
      [nome, descricao, localizacao, Number.isNaN(valor) ? null : valor, tipo, conta, data, fixo, textoExtrato, observacaoAgente, selecionado, id]
    );

    res.json({ status: 'success', item: formatarItemStage(rows[0]) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: `Erro ao atualizar item do stage: ${err.message}` });
  }
});

// Atualização em lote no Stage (ex: aplicar conta ou categoria para vários itens selecionados)
app.patch(['/api/stage', '/mcp/stage'], async (req, res) => {
  try {
    const { ids, campos } = req.body || {};
    if (!campos || typeof campos !== 'object') {
      return res.status(400).json({ detail: 'Informe o objeto "campos" para atualização em lote.' });
    }
    const sets = [];
    const vals = [];
    let idx = 1;

    for (const campo of ['nome', 'descricao', 'localizacao', 'tipo', 'conta', 'data', 'texto_extrato', 'observacao_agente']) {
      if (campos[campo] !== undefined) {
        sets.push(`${campo} = $${idx++}`);
        vals.push(String(campos[campo]).trim());
      }
    }
    if (campos.valor !== undefined) {
      sets.push(`valor = $${idx++}`);
      vals.push(campos.valor === '' || campos.valor === null ? null : parseFloat(campos.valor));
    }
    if (campos.fixo !== undefined) {
      sets.push(`fixo = $${idx++}`);
      vals.push(Boolean(campos.fixo));
    }
    if (campos.selecionado !== undefined) {
      sets.push(`selecionado = $${idx++}`);
      vals.push(Boolean(campos.selecionado));
    }

    if (sets.length === 0) {
      return res.status(400).json({ detail: 'Nenhum campo válido informado.' });
    }

    let where = '';
    if (Array.isArray(ids) && ids.length > 0) {
      vals.push(ids.map(Number));
      where = `WHERE id = ANY($${idx}::int[])`;
    }

    await pool.query(`UPDATE gastos_stage SET ${sets.join(', ')} ${where}`, vals);
    const resumo = await obterResumoStage();
    res.json({ status: 'success', stage: resumo });
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: `Erro ao atualizar stage em lote: ${err.message}` });
  }
});

app.delete(['/api/stage/:id', '/mcp/stage/:id'], async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM gastos_stage WHERE id = $1', [id]);
    res.json({ status: 'success', message: `Item #${id} removido do stage.` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: `Erro ao remover item do stage: ${err.message}` });
  }
});

app.delete(['/api/stage', '/mcp/stage'], async (req, res) => {
  try {
    const ids = req.body && Array.isArray(req.body.ids) ? req.body.ids.map(Number) : null;
    if (ids && ids.length > 0) {
      await pool.query('DELETE FROM gastos_stage WHERE id = ANY($1::int[])', [ids]);
      return res.json({ status: 'success', message: `${ids.length} item(ns) removido(s) do stage.` });
    }
    const delRes = await pool.query('DELETE FROM gastos_stage');
    res.json({ status: 'success', message: `Stage limpo (${delRes.rowCount} itens removidos).` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: `Erro ao limpar stage: ${err.message}` });
  }
});

app.post(['/api/stage/commit', '/mcp/stage/commit'], async (req, res) => {
  try {
    const resultado = await comitarItensStage(req.body || {});
    res.json(resultado);
  } catch (err) {
    console.error(err);
    res.status(400).json({ detail: err.message });
  }
});

// ==================== ENDPOINT CONSOLIDADO (GET EM TUDO) ====================

async function obterTudoConsolidado(search = '') {
  const resCat = await pool.query(`
    SELECT c.id, c.nome, c.cor, COALESCE(c.orcamento_mensal, 0)::float as orcamento_mensal, COUNT(g.id)::int as gastos_count
    FROM categorias c
    LEFT JOIN gastos g ON g.categoria_id = c.id
    GROUP BY c.id, c.nome, c.cor, c.orcamento_mensal
    ORDER BY c.nome ASC
  `);
  const resCta = await pool.query(`
    SELECT cta.id, cta.nome, cta.tipo_conta, cta.cor, COUNT(g.id)::int as gastos_count
    FROM contas cta
    LEFT JOIN gastos g ON g.conta_id = cta.id
    GROUP BY cta.id, cta.nome, cta.tipo_conta, cta.cor
    ORDER BY cta.nome ASC
  `);
  const resLoc = await pool.query(`
    SELECT DISTINCT localizacao 
    FROM gastos 
    WHERE localizacao IS NOT NULL AND TRIM(localizacao) != '' 
    ORDER BY localizacao ASC
  `);

  const params = [];
  let whereClause = '';
  if (search && search.trim()) {
    params.push(`%${search.trim()}%`);
    whereClause = `WHERE (g.nome ILIKE $1 OR COALESCE(g.descricao, '') ILIKE $1 OR COALESCE(g.localizacao, '') ILIKE $1)`;
  }

  const resGastos = await pool.query(`
    SELECT 
      g.id, g.nome, g.descricao, g.localizacao, g.valor::float, g.data, g.criado_em,
      g.notion_id, g.parcela_grupo_id, g.fixo,
      c.nome as tipo, c.id as categoria_id,
      cta.nome as conta, cta.id as conta_id
    FROM gastos g
    LEFT JOIN categorias c ON g.categoria_id = c.id
    LEFT JOIN contas cta ON g.conta_id = cta.id
    ${whereClause}
    ORDER BY g.data DESC, g.id DESC
  `, params);

  const orcamentos = {};
  resCat.rows.forEach(r => {
    if (r.orcamento_mensal > 0) orcamentos[r.nome] = r.orcamento_mensal;
  });

  const gastos = resGastos.rows.map(r => ({
    id: String(r.id),
    nome: r.nome,
    descricao: r.descricao || '',
    localizacao: r.localizacao || '',
    valor: parseFloat(r.valor),
    tipo: r.tipo || '',
    conta: r.conta || '',
    data: r.data ? r.data.toISOString().split('T')[0] : '',
    criado_em: r.criado_em ? r.criado_em.toISOString() : '',
    parcela_grupo_id: r.parcela_grupo_id || null,
    fixo: Boolean(r.fixo),
    categoria_id: r.categoria_id,
    conta_id: r.conta_id
  }));

  const stage = await obterResumoStage();

  return {
    metadados: {
      tipos: resCat.rows.map(r => r.nome),
      contas: resCta.rows.map(r => r.nome),
      locais: resLoc.rows.map(r => r.localizacao),
      orcamentos
    },
    categorias: resCat.rows,
    contas: resCta.rows,
    stage,
    total_gastos: gastos.length,
    gastos
  };
}

app.get(['/api/tudo', '/mcp/tudo'], async (req, res) => {
  try {
    const search = req.query.search || req.query.q || '';
    const data = await obterTudoConsolidado(search);
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: `Erro ao obter todos os dados: ${err.message}` });
  }
});

// ==================== MCP SERVER OVER HTTP (STREAMABLE-HTTP, SSE & REST) ====================

app.post('/api/dividas', async (req, res) => {
  const { nome, valor } = req.body;
  if (typeof nome !== 'string' || !nome.trim() || nome.length > 200 || !Number.isFinite(valor) || valor <= 0 || valor > 999999999999.99) return res.status(400).json({detail:'Informe nome e valor positivo para a dívida.'});
  try { const { rows } = await pool.query('INSERT INTO dividas_financeiras(nome,valor) VALUES($1,$2) RETURNING *',[nome.trim(),valor]); res.status(201).json(rows[0]); }
  catch(e) { res.status(500).json({detail:'Não foi possível salvar a dívida.'}); }
});
app.delete('/api/dividas/:id', async (req,res) => {
  if (!/^\d+$/.test(req.params.id)) return res.status(400).json({detail:'ID inválido.'});
  try { const result = await pool.query('DELETE FROM dividas_financeiras WHERE id=$1',[req.params.id]); res.status(result.rowCount ? 200 : 404).json({status:result.rowCount ? 'success' : 'not_found'}); }
  catch(e) { res.status(500).json({detail:'Não foi possível remover a dívida.'}); }
});
app.get('/api/planejamento', async (req, res) => {
  try { res.json(await require('./plans').context()); }
  catch (e) { res.status(500).json({ detail: e.message }); }
});
const MCP_TOOLS = [
  { name: 'obter_planejamento', description: 'Consulta saldo bancário BRL do Pluggy e análises financeiras registradas. Use com obter_tudo para analisar entradas e despesas antes de elaborar projeções. Investimentos com saldo zerado são omitidos e não devem ser listados ao usuário.', inputSchema: { type: 'object', properties: {} } },
  { name: 'registrar_previsao_financeira', description: 'Registra uma análise elaborada pelo agente MCP. Consulte obter_planejamento e os gastos antes. Explicite premissas, entradas líquidas, despesas, rendimentos e incertezas. Saldo inicial vem exclusivamente do Pluggy. Não invente receitas ou rendimentos. Cada chamada cria uma versão; não soma nem reserva saldos entre metas.', inputSchema: { type: 'object', required: ['nome','valor_meta','data_meta','analise','premissas','projecao'], properties: { base_calculo: {type:'string',enum:['conta','patrimonio_liquido']}, nome: {type:'string'}, valor_meta:{type:'number'}, data_meta:{type:'string'}, analise:{type:'string'}, premissas:{type:'string'}, projecao:{type:'array',items:{type:'object',required:['mes','entradas','saidas','rendimentos','saldo'],properties:{mes:{type:'string'},entradas:{type:'number'},saidas:{type:'number'},rendimentos:{type:'number'},saldo:{type:'number'}}}} } } },
  {
    name: 'fazer_backup_csv',
    description: 'DIRETRIZ OBRIGATÓRIA: Sempre execute esta ferramenta ANTES de iniciar qualquer lote de modificação (adição, atualização ou exclusão de gastos, categorias ou contas). Gera e retorna/salva o backup CSV completo dos gastos.',
    inputSchema: {
      type: 'object',
      properties: {
        nome_arquivo: { type: 'string', description: 'Nome opcional para o arquivo CSV de backup' }
      }
    }
  },
  {
    name: 'obter_metadados',
    description: 'Retorna a lista simplificada de todas as categorias (tipos), contas (métodos de pagamento), locais e orçamentos disponíveis para preenchimento rápido.',
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'listar_gastos',
    description: 'Lista todos os gastos cadastrados no sistema de controle financeiro (com filtro opcional por nome, descrição ou localização).',
    inputSchema: {
      type: 'object',
      properties: {
        busca: { type: 'string', description: 'Termo opcional para filtrar gastos' }
      }
    }
  },
  {
    name: 'buscar_gastos',
    description: 'Pesquisa gastos pelo nome do gasto, descrição detalhada ou localização (case-insensitive).',
    inputSchema: {
      type: 'object',
      properties: {
        termo: { type: 'string', description: 'Termo de busca' }
      },
      required: ['termo']
    }
  },
  {
    name: 'adicionar_gasto',
    description: 'Cadastra um novo gasto/compra no sistema de finanças. IMPORTANTE: Antes de qualquer lote de modificação, faça backup CSV e verifique categorias/contas existentes com obter_metadados(). Se o nome terminar em 1/N (ex: Compra - 1/6), cria automaticamente as parcelas 2/N até N/N.',
    inputSchema: {
      type: 'object',
      properties: {
        nome: { type: 'string', description: 'Nome do gasto / item (ex: Mercado, Pizza, Almoço)' },
        valor: { type: 'number', description: 'Valor numérico em R$ (ex: 34.15)' },
        tipo: { type: 'string', description: 'Nome da Categoria existente (ex: Mercado, Lanche, Alimentação)' },
        conta: { type: 'string', description: 'Nome do Método de Pagamento / Conta existente (ex: Crédito Nubank, Pix)' },
        data: { type: 'string', description: 'Data no formato YYYY-MM-DD (ex: 2026-11-02)' },
        descricao: { type: 'string', description: '(Opcional) Descrição detalhada ou observações do gasto' },
        localizacao: { type: 'string', description: '(Opcional) Estabelecimento ou endereço onde a compra foi feita' },
        fixo: { type: 'boolean', description: '(Opcional) Indica se é um gasto fixo recorrente' }
      },
      required: ['nome', 'valor', 'tipo', 'conta', 'data']
    }
  },
  {
    name: 'atualizar_gasto',
    description: 'Atualiza as informações de um gasto existente pelo seu ID.',
    inputSchema: {
      type: 'object',
      properties: {
        gasto_id: { type: 'string', description: 'ID do gasto a ser atualizado' },
        nome: { type: 'string' },
        descricao: { type: 'string' },
        localizacao: { type: 'string' },
        valor: { type: 'number' },
        tipo: { type: 'string' },
        conta: { type: 'string' },
        data: { type: 'string' },
        fixo: { type: 'boolean' }
      },
      required: ['gasto_id']
    }
  },
  {
    name: 'excluir_gasto',
    description: 'Exclui um gasto do sistema pelo seu ID.',
    inputSchema: {
      type: 'object',
      properties: {
        gasto_id: { type: 'string', description: 'ID do gasto a ser excluído' },
        excluir_grupo: { type: 'boolean', description: 'Se true, exclui todas as parcelas do mesmo grupo' }
      },
      required: ['gasto_id']
    }
  },
  {
    name: 'listar_categorias',
    description: 'Lista todas as categorias cadastradas, orçamento mensal e quantidade de compras associadas.',
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'adicionar_categoria',
    description: 'Cadastra uma nova categoria no sistema (apenas com permissão expressa do usuário).',
    inputSchema: {
      type: 'object',
      properties: {
        nome: { type: 'string', description: 'Nome da nova categoria' },
        cor: { type: 'string', description: 'Cor opcional (hex)' },
        orcamento_mensal: { type: 'number', description: 'Orçamento mensal opcional em R$' }
      },
      required: ['nome']
    }
  },
  {
    name: 'listar_contas',
    description: 'Lista todos os métodos de pagamento / contas cadastrados no sistema.',
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'adicionar_conta',
    description: 'Cadastra um novo método de pagamento ou conta no sistema (apenas com permissão expressa do usuário).',
    inputSchema: {
      type: 'object',
      properties: {
        nome: { type: 'string', description: 'Nome da conta / método de pagamento' },
        tipo_conta: { type: 'string', description: 'Tipo opcional (Crédito, Débito, Vale, Pix, etc.)' },
        cor: { type: 'string', description: 'Cor opcional (hex)' }
      },
      required: ['nome']
    }
  },
  {
    name: 'listar_stage',
    description: 'Lista todos os itens que estão na Zona de Stage (Playground de transição de extratos) aguardando revisão/preenchimento ou confirmação de baixa pelo usuário na página /stage.',
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'adicionar_stage',
    description: 'Envia 1 compra ou um LOTE de compras extraídas de extratos bancários para a Zona de Stage (/stage). Os campos (nome, valor, tipo/categoria, conta, data, descricao, localizacao) podem ser enviados parcialmente ou em branco quando o agente não conseguir inferir com certeza, para que o usuário complete na página web /stage antes de dar baixa.',
    inputSchema: {
      type: 'object',
      properties: {
        itens: {
          type: 'array',
          description: 'Lista de itens para enviar em lote ao Stage (opcional se enviar um único item nos campos raiz)',
          items: {
            type: 'object',
            properties: {
              nome: { type: 'string', description: 'Nome inferido da compra (ou vazio para o usuário preencher)' },
              valor: { type: 'number', description: 'Valor em R$ extraído do banco' },
              tipo: { type: 'string', description: 'Categoria inferida (ou vazio se o agente tiver dúvida)' },
              conta: { type: 'string', description: 'Conta/Método de pagamento inferido (ex: Crédito Nubank)' },
              data: { type: 'string', description: 'Data YYYY-MM-DD do extrato' },
              descricao: { type: 'string', description: 'Descrição ou detalhes adicionais' },
              localizacao: { type: 'string', description: 'Estabelecimento ou endereço inferido' },
              fixo: { type: 'boolean', description: 'Se é gasto fixo' },
              texto_extrato: { type: 'string', description: 'Linha original do extrato bancário (ex: "PAG*JoseSilva 12/10 R$ 45,00") para referência do usuário' },
              observacao_agente: { type: 'string', description: 'Dúvida ou nota do agente para o usuário (ex: "Não identifiquei a categoria")' }
            }
          }
        },
        limpar_anterior: { type: 'boolean', description: 'Se true, limpa o stage antes de inserir os novos itens' },
        nome: { type: 'string' },
        valor: { type: 'number' },
        tipo: { type: 'string' },
        conta: { type: 'string' },
        data: { type: 'string' },
        descricao: { type: 'string' },
        localizacao: { type: 'string' },
        fixo: { type: 'boolean' },
        texto_extrato: { type: 'string' },
        observacao_agente: { type: 'string' }
      }
    }
  },
  {
    name: 'atualizar_stage',
    description: 'Atualiza campos de um item que está no Stage pelo seu ID.',
    inputSchema: {
      type: 'object',
      properties: {
        stage_id: { type: 'string', description: 'ID do item no stage' },
        nome: { type: 'string' },
        valor: { type: 'number' },
        tipo: { type: 'string' },
        conta: { type: 'string' },
        data: { type: 'string' },
        descricao: { type: 'string' },
        localizacao: { type: 'string' },
        fixo: { type: 'boolean' },
        texto_extrato: { type: 'string' },
        observacao_agente: { type: 'string' },
        selecionado: { type: 'boolean' }
      },
      required: ['stage_id']
    }
  },
  {
    name: 'excluir_stage',
    description: 'Remove um item específico do Stage (stage_id) ou limpa todo o Stage (limpar_tudo: true).',
    inputSchema: {
      type: 'object',
      properties: {
        stage_id: { type: 'string', description: 'ID do item no stage para remover' },
        limpar_tudo: { type: 'boolean', description: 'Se true, remove todos os itens do stage' }
      }
    }
  },
  {
    name: 'comitar_stage',
    description: 'Dá baixa (commit) nos itens completos que estão no Stage, gravando-os definitivamente na tabela principal de gastos e removendo-os do Stage.',
    inputSchema: {
      type: 'object',
      properties: {
        ids: { type: 'array', items: { type: 'number' }, description: 'IDs específicos do stage para dar baixa (opcional)' },
        apenas_completos: { type: 'boolean', description: 'Se true, dá baixa apenas nos itens que já estão com todos os campos preenchidos' }
      }
    }
  }
];

async function executarFerramentaMcp(name, args = {}) {
  switch (name) {
    case 'obter_planejamento': return JSON.stringify(await require('./plans').context());
    case 'registrar_previsao_financeira': return JSON.stringify(await require('./plans').save(args));
    case 'fazer_backup_csv': {
      await salvarSnapshotPreModificacao('mcp_backup');
      const csv = await gerarCsvString();
      const lines = csv.split('\n').length - 1;
      return `Backup CSV gerado e salvo com sucesso no servidor (${lines} registros). Para salvar no dispositivo cliente, faça GET /api/exportar e salve em ~/Downloads/gastos_backup_YYYYMMDD_HHMMSS.csv.`;
    }
    case 'obter_metadados': {
      const tudo = await obterTudoConsolidado();
      return JSON.stringify(tudo.metadados, null, 2);
    }
    case 'listar_gastos': {
      const busca = args.busca || args.search || '';
      const tudo = await obterTudoConsolidado(busca);
      if (!tudo.gastos.length) return 'Nenhum gasto encontrado.';
      return JSON.stringify(tudo.gastos, null, 2);
    }
    case 'buscar_gastos': {
      const termo = args.termo || args.busca || args.search || '';
      const tudo = await obterTudoConsolidado(termo);
      if (!tudo.gastos.length) return `Nenhum gasto encontrado para o termo '${termo}'.`;
      return JSON.stringify(tudo.gastos, null, 2);
    }
    case 'adicionar_gasto': {
      const { nome, descricao, localizacao, valor, tipo, conta, data, fixo } = args;
      if (!nome || valor === undefined || !tipo || !conta || !data) {
        throw new Error('Campos obrigatórios: nome, valor, tipo, conta, data (YYYY-MM-DD).');
      }
      await salvarSnapshotPreModificacao('mcp_add_gasto');
      const tipoNome = String(tipo).trim();
      const contaNome = String(conta).trim();
      const descricaoLimpa = descricao ? String(descricao).trim() : null;
      const localizacaoLimpa = localizacao ? String(localizacao).trim() : null;
      const isFixo = Boolean(fixo);

      let catRes = await pool.query('SELECT id FROM categorias WHERE LOWER(nome) = LOWER($1)', [tipoNome]);
      let categoriaId = catRes.rows.length
        ? catRes.rows[0].id
        : (await pool.query('INSERT INTO categorias (nome) VALUES ($1) RETURNING id', [tipoNome])).rows[0].id;

      let ctaRes = await pool.query('SELECT id FROM contas WHERE LOWER(nome) = LOWER($1)', [contaNome]);
      let contaId = ctaRes.rows.length
        ? ctaRes.rows[0].id
        : (await pool.query('INSERT INTO contas (nome) VALUES ($1) RETURNING id', [contaNome])).rows[0].id;

      const match = String(nome).match(/^(.*?)(?:\s*-\s*|\s+)\(?1\/(\d+)\)?$/);
      const grupoId = match ? `grp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}` : null;

      const insertRes = await pool.query(
        `INSERT INTO gastos (nome, descricao, localizacao, valor, data, categoria_id, conta_id, parcela_grupo_id, fixo)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
        [String(nome).trim(), descricaoLimpa, localizacaoLimpa, parseFloat(valor), String(data).trim(), categoriaId, contaId, grupoId, isFixo]
      );

      if (match) {
        const baseName = match[1].trim();
        const totalParcelas = parseInt(match[2], 10);
        let baseDate = new Date(String(data).trim() + 'T12:00:00');
        for (let i = 2; i <= totalParcelas; i++) {
          baseDate.setMonth(baseDate.getMonth() + 1);
          const nextDataStr = baseDate.toISOString().split('T')[0];
          const nextNome = `${baseName} - ${i}/${totalParcelas}`;
          await pool.query(
            `INSERT INTO gastos (nome, descricao, localizacao, valor, data, categoria_id, conta_id, parcela_grupo_id, fixo)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [nextNome, descricaoLimpa, localizacaoLimpa, parseFloat(valor), nextDataStr, categoriaId, contaId, grupoId, isFixo]
          );
        }
      }
      return `Gasto criado com sucesso! ID: ${insertRes.rows[0].id}`;
    }
    case 'atualizar_gasto': {
      const id = args.gasto_id || args.id;
      if (!id) throw new Error('Parâmetro gasto_id é obrigatório.');
      const gastoCheck = await pool.query('SELECT * FROM gastos WHERE id = $1', [id]);
      if (gastoCheck.rows.length === 0) throw new Error(`Gasto #${id} não encontrado.`);
      await salvarSnapshotPreModificacao('mcp_update_gasto');
      const atual = gastoCheck.rows[0];
      let categoriaId = atual.categoria_id;
      let contaId = atual.conta_id;
      if (args.tipo) {
        const tipoNome = String(args.tipo).trim();
        const catRes = await pool.query('SELECT id FROM categorias WHERE LOWER(nome) = LOWER($1)', [tipoNome]);
        categoriaId = catRes.rows.length
          ? catRes.rows[0].id
          : (await pool.query('INSERT INTO categorias (nome) VALUES ($1) RETURNING id', [tipoNome])).rows[0].id;
      }
      if (args.conta) {
        const contaNome = String(args.conta).trim();
        const ctaRes = await pool.query('SELECT id FROM contas WHERE LOWER(nome) = LOWER($1)', [contaNome]);
        contaId = ctaRes.rows.length
          ? ctaRes.rows[0].id
          : (await pool.query('INSERT INTO contas (nome) VALUES ($1) RETURNING id', [contaNome])).rows[0].id;
      }
      const novaDescricao = args.descricao !== undefined ? (args.descricao ? String(args.descricao).trim() : '') : atual.descricao;
      const novaLocalizacao = args.localizacao !== undefined ? (args.localizacao ? String(args.localizacao).trim() : '') : atual.localizacao;
      const novoFixo = args.fixo !== undefined ? Boolean(args.fixo) : Boolean(atual.fixo);

      await pool.query(
        `UPDATE gastos 
         SET nome = COALESCE($1, nome),
             descricao = $2,
             localizacao = $3,
             valor = COALESCE($4, valor),
             data = COALESCE($5, data),
             categoria_id = $6,
             conta_id = $7,
             fixo = $8
         WHERE id = $9`,
        [
          args.nome ? String(args.nome).trim() : null,
          novaDescricao,
          novaLocalizacao,
          args.valor !== undefined ? parseFloat(args.valor) : null,
          args.data ? String(args.data).trim() : null,
          categoriaId,
          contaId,
          novoFixo,
          id
        ]
      );
      return `Gasto #${id} atualizado com sucesso.`;
    }
    case 'excluir_gasto': {
      const id = args.gasto_id || args.id;
      if (!id) throw new Error('Parâmetro gasto_id é obrigatório.');
      const gastoCheck = await pool.query('SELECT id, parcela_grupo_id FROM gastos WHERE id = $1', [id]);
      if (gastoCheck.rows.length === 0) throw new Error(`Gasto #${id} não encontrado.`);
      await salvarSnapshotPreModificacao('mcp_delete_gasto');
      if (args.excluir_grupo && gastoCheck.rows[0].parcela_grupo_id) {
        const resDel = await pool.query('DELETE FROM gastos WHERE parcela_grupo_id = $1 RETURNING id', [gastoCheck.rows[0].parcela_grupo_id]);
        return `${resDel.rowCount} parcelas excluídas com sucesso.`;
      }
      await pool.query('DELETE FROM gastos WHERE id = $1', [id]);
      return `Gasto #${id} excluído com sucesso.`;
    }
    case 'listar_categorias': {
      const tudo = await obterTudoConsolidado();
      return JSON.stringify(tudo.categorias, null, 2);
    }
    case 'adicionar_categoria': {
      if (!args.nome) throw new Error('O nome da categoria é obrigatório.');
      const nomeLimpo = String(args.nome).trim();
      const check = await pool.query('SELECT id FROM categorias WHERE LOWER(nome) = LOWER($1)', [nomeLimpo]);
      if (check.rows.length > 0) throw new Error(`A categoria '${nomeLimpo}' já existe.`);
      const newCat = await pool.query(
        'INSERT INTO categorias (nome, cor, orcamento_mensal) VALUES ($1, $2, $3) RETURNING id, nome',
        [nomeLimpo, args.cor || null, args.orcamento_mensal ? parseFloat(args.orcamento_mensal) : 0]
      );
      return `Categoria criada com sucesso: ${newCat.rows[0].nome} (ID: ${newCat.rows[0].id})`;
    }
    case 'listar_contas': {
      const tudo = await obterTudoConsolidado();
      return JSON.stringify(tudo.contas, null, 2);
    }
    case 'adicionar_conta': {
      if (!args.nome) throw new Error('O nome da conta é obrigatório.');
      const nomeLimpo = String(args.nome).trim();
      const check = await pool.query('SELECT id FROM contas WHERE LOWER(nome) = LOWER($1)', [nomeLimpo]);
      if (check.rows.length > 0) throw new Error(`O método de pagamento '${nomeLimpo}' já existe.`);
      const newCta = await pool.query(
        'INSERT INTO contas (nome, tipo_conta, cor) VALUES ($1, $2, $3) RETURNING id, nome',
        [nomeLimpo, args.tipo_conta || null, args.cor || null]
      );
      return `Método de pagamento criado com sucesso: ${newCta.rows[0].nome} (ID: ${newCta.rows[0].id})`;
    }
    case 'listar_stage': {
      const resumo = await obterResumoStage();
      return JSON.stringify(resumo, null, 2);
    }
    case 'adicionar_stage':
    case 'enviar_lote_stage': {
      const limpar = Boolean(args.limpar_anterior);
      const inseridos = await inserirItensStage(args, limpar);
      const resumo = await obterResumoStage();
      return JSON.stringify({
        status: 'success',
        message: `${inseridos.length} item(ns) enviado(s) para o Stage (/stage).`,
        inseridos_count: inseridos.length,
        inseridos,
        resumo_stage: {
          total: resumo.total,
          prontos_para_commit: resumo.prontos_para_commit,
          incompletos: resumo.incompletos,
          valor_total: resumo.valor_total
        }
      }, null, 2);
    }
    case 'atualizar_stage': {
      const id = args.stage_id || args.id;
      if (!id) throw new Error('Parâmetro stage_id é obrigatório.');
      const check = await pool.query('SELECT * FROM gastos_stage WHERE id = $1', [id]);
      if (check.rows.length === 0) throw new Error(`Item #${id} não encontrado no stage.`);
      const atual = check.rows[0];
      const nome = args.nome !== undefined ? String(args.nome).trim() : atual.nome;
      const descricao = args.descricao !== undefined ? String(args.descricao).trim() : atual.descricao;
      const localizacao = args.localizacao !== undefined ? String(args.localizacao).trim() : atual.localizacao;
      const valor = args.valor !== undefined
        ? (args.valor === '' || args.valor === null ? null : parseFloat(args.valor))
        : atual.valor;
      const tipo = args.tipo !== undefined ? String(args.tipo).trim() : atual.tipo;
      const conta = args.conta !== undefined ? String(args.conta).trim() : atual.conta;
      const data = args.data !== undefined ? String(args.data).trim() : atual.data;
      const fixo = args.fixo !== undefined ? Boolean(args.fixo) : Boolean(atual.fixo);
      const textoExtrato = args.texto_extrato !== undefined ? String(args.texto_extrato).trim() : atual.texto_extrato;
      const observacaoAgente = args.observacao_agente !== undefined ? String(args.observacao_agente).trim() : atual.observacao_agente;
      const selecionado = args.selecionado !== undefined ? Boolean(args.selecionado) : Boolean(atual.selecionado);

      const { rows } = await pool.query(
        `UPDATE gastos_stage
         SET nome = $1, descricao = $2, localizacao = $3, valor = $4, tipo = $5, conta = $6,
             data = $7, fixo = $8, texto_extrato = $9, observacao_agente = $10, selecionado = $11
         WHERE id = $12 RETURNING *`,
        [nome, descricao, localizacao, Number.isNaN(valor) ? null : valor, tipo, conta, data, fixo, textoExtrato, observacaoAgente, selecionado, id]
      );
      return JSON.stringify({ status: 'success', item: formatarItemStage(rows[0]) }, null, 2);
    }
    case 'excluir_stage':
    case 'limpar_stage': {
      if (args.limpar_tudo || name === 'limpar_stage') {
        const delRes = await pool.query('DELETE FROM gastos_stage');
        return `Stage limpo com sucesso (${delRes.rowCount} itens removidos).`;
      }
      const id = args.stage_id || args.id;
      if (!id) throw new Error('Informe stage_id ou limpar_tudo: true.');
      await pool.query('DELETE FROM gastos_stage WHERE id = $1', [id]);
      return `Item #${id} removido do stage.`;
    }
    case 'comitar_stage':
    case 'confirmar_stage': {
      const resCommit = await comitarItensStage(args);
      return JSON.stringify(resCommit, null, 2);
    }
    default:
      throw new Error(`Ferramenta MCP desconhecida: ${name}`);
  }
}

async function processarJsonRpcMcp(rpcReq) {
  const { jsonrpc, id, method, params } = rpcReq;

  if (!method && (rpcReq.tool || rpcReq.name)) {
    const toolName = rpcReq.tool || rpcReq.name;
    const toolArgs = rpcReq.arguments || rpcReq.args || rpcReq.params || {};
    const textResult = await executarFerramentaMcp(toolName, toolArgs);
    return {
      status: 'success',
      tool: toolName,
      result: textResult,
      content: [{ type: 'text', text: textResult }]
    };
  }

  if (method === 'notifications/initialized' || method === 'notifications/cancelled') {
    return null;
  }

  try {
    if (method === 'initialize') {
      return {
        jsonrpc: '2.0',
        id,
        result: {
          protocolVersion: (params && params.protocolVersion) || '2024-11-05',
          capabilities: {
            tools: { listChanged: false },
            resources: { subscribe: false, listChanged: false },
            prompts: { listChanged: false }
          },
          serverInfo: {
            name: 'Financas',
            version: '1.2.0'
          },
          instructions: 'Servidor MCP de Controle de Finanças. REGRA #1: Sempre faça backup CSV (fazer_backup_csv ou GET /api/exportar) antes de modificar dados. REGRA #2: Sempre consulte obter_metadados antes de adicionar gastos e reutilize os nomes exatos de categorias (tipo) e contas.'
        }
      };
    }

    if (method === 'ping') {
      return { jsonrpc: '2.0', id, result: {} };
    }

    if (method === 'tools/list') {
      return {
        jsonrpc: '2.0',
        id,
        result: {
          tools: MCP_TOOLS
        }
      };
    }

    if (method === 'tools/call') {
      const toolName = params && params.name;
      const toolArgs = (params && params.arguments) || {};
      try {
        const textResult = await executarFerramentaMcp(toolName, toolArgs);
        return {
          jsonrpc: '2.0',
          id,
          result: {
            content: [{ type: 'text', text: textResult }],
            isError: false
          }
        };
      } catch (toolErr) {
        return {
          jsonrpc: '2.0',
          id,
          result: {
            content: [{ type: 'text', text: `Erro: ${toolErr.message}` }],
            isError: true
          }
        };
      }
    }

    if (method === 'resources/list') {
      return {
        jsonrpc: '2.0',
        id,
        result: {
          resources: [
            { uri: 'financas://tudo', name: 'Todos os Dados (Metadados, Categorias, Contas e Gastos)', mimeType: 'application/json' },
            { uri: 'financas://metadados', name: 'Metadados (Categorias, Contas, Locais e Orçamentos)', mimeType: 'application/json' },
            { uri: 'financas://gastos', name: 'Lista Completa de Gastos', mimeType: 'application/json' }
          ]
        }
      };
    }

    if (method === 'resources/read') {
      const uri = params && params.uri;
      const tudo = await obterTudoConsolidado();
      let payload = tudo;
      if (uri === 'financas://metadados') payload = tudo.metadados;
      else if (uri === 'financas://gastos') payload = tudo.gastos;
      return {
        jsonrpc: '2.0',
        id,
        result: {
          contents: [
            {
              uri: uri || 'financas://tudo',
              mimeType: 'application/json',
              text: JSON.stringify(payload, null, 2)
            }
          ]
        }
      };
    }

    if (method === 'prompts/list') {
      return { jsonrpc: '2.0', id, result: { prompts: [] } };
    }

    return {
      jsonrpc: '2.0',
      id,
      error: { code: -32601, message: `Method not found: ${method}` }
    };
  } catch (err) {
    return {
      jsonrpc: '2.0',
      id: id ?? null,
      error: { code: -32603, message: err.message }
    };
  }
}

// Armazena conexões SSE ativas para clientes MCP via SSE
const mcpSseClients = new Map();

function iniciarConexaoSse(req, res, messagesPath = '/mcp/messages') {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  const sessionId = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  mcpSseClients.set(sessionId, res);

  res.write(`event: endpoint\ndata: ${messagesPath}?sessionId=${sessionId}\n\n`);

  const keepAlive = setInterval(() => {
    res.write(': keepalive\n\n');
  }, 15000);

  req.on('close', () => {
    clearInterval(keepAlive);
    mcpSseClients.delete(sessionId);
  });
}

function gerarManifestoMcp(req) {
  const host = req.headers.host || '192.168.15.15:8080';
  const proto = req.headers['x-forwarded-proto'] || 'http';
  const baseUrl = `${proto}://${host}`;
  return {
    mcp: {
      name: 'Financas',
      version: '1.2.0',
      protocolVersion: '2024-11-05',
      description: 'Servidor MCP e API HTTP de Controle de Finanças acessível na rede pela porta 8080 e 8000.',
      transports: {
        streamable_http: `${baseUrl}/mcp`,
        sse: `${baseUrl}/sse`,
        sse_messages: `${baseUrl}/messages`,
        rest_tools: `${baseUrl}/mcp/tools`,
        stdio_script: `${baseUrl}/mcp_server.py`
      }
    },
    regras_obrigatorias: [
      '1. BACKUP CSV OBRIGATÓRIO: Antes de qualquer adição, edição ou exclusão, baixe o backup CSV em GET /api/exportar (ou ferramenta MCP fazer_backup_csv) e salve na pasta ~/Downloads do dispositivo cliente.',
      '2. VERIFIQUE METADADOS PRIMEIRO: Consulte GET /api/metadados (ou GET /api/tudo ou ferramenta obter_metadados) antes de inserir gastos.',
      '3. REUTILIZE PADRÕES: Use exatamente os mesmos nomes de categorias (tipo) e contas já cadastrados.',
      '4. NÃO CRIE CATEGORIA/CONTA SEM PERMISSÃO: Se não houver categoria ou conta adequada, pergunte ao usuário antes de criar.',
      '5. NÃO EXIBA INVESTIMENTOS ZERADOS: Ao consultar o planejamento, não liste investimentos com saldo R$ 0,00. A API já os omite da lista de ativos.'
    ],
    como_dar_get_em_tudo_porta_8080: {
      tudo_consolidado: `GET ${baseUrl}/api/tudo`,
      listar_gastos: `GET ${baseUrl}/api/gastos`,
      buscar_gastos: `GET ${baseUrl}/api/gastos?search=TERMO`,
      listar_stage: `GET ${baseUrl}/api/stage`,
      metadados_categorias_contas: `GET ${baseUrl}/api/metadados`,
      listar_categorias: `GET ${baseUrl}/api/categorias`,
      listar_contas: `GET ${baseUrl}/api/contas`,
      backup_csv: `GET ${baseUrl}/api/exportar`,
      via_mcp_rest: `GET ${baseUrl}/mcp/tools/listar_gastos`
    },
    zona_de_stage_transicao_extratos: {
      pagina_web_stage: `${baseUrl}/stage`,
      descricao: 'Zona de transição (Playground) para onde o agente envia compras novas encontradas nos extratos bancários que ainda precisam de validação/preenchimento pelo usuário antes da baixa definitiva.',
      listar_stage: `GET ${baseUrl}/api/stage`,
      enviar_para_stage_unitario_ou_lote: `POST ${baseUrl}/api/stage`,
      atualizar_item_stage: `PATCH ${baseUrl}/api/stage/:id`,
      atualizar_lote_stage: `PATCH ${baseUrl}/api/stage`,
      remover_item_stage: `DELETE ${baseUrl}/api/stage/:id`,
      limpar_stage: `DELETE ${baseUrl}/api/stage`,
      dar_baixa_comitar_stage: `POST ${baseUrl}/api/stage/commit`,
      exemplo_post_stage_lote: {
        limpar_anterior: false,
        itens: [
          {
            data: '2026-11-01',
            nome: 'Mercado Livre',
            valor: 89.90,
            tipo: '',
            conta: 'Crédito Nubank',
            descricao: '',
            localizacao: '',
            texto_extrato: '01/11 MERCADOLIVRE*COMPRA R$ 89,90',
            observacao_agente: 'Não consegui inferir a categoria (tipo) nem o que foi comprado.'
          }
        ]
      }
    },
    como_dar_entrada_de_novas_compras_porta_8080: {
      endpoint_rest: `POST ${baseUrl}/api/gastos`,
      endpoint_mcp_rest: `POST ${baseUrl}/mcp/tools/adicionar_gasto`,
      endpoint_mcp_jsonrpc: `POST ${baseUrl}/mcp`,
      headers: { 'Content-Type': 'application/json' },
      payload_exemplo: {
        nome: 'Mercado Semanal',
        valor: 125.90,
        tipo: 'Mercado',
        conta: 'Cartão Alimentação iFood',
        data: '2026-11-02',
        descricao: 'Compras do mês',
        localizacao: 'Supermercado'
      },
      dica_parcelamento: 'Se o campo "nome" terminar com "1/N" ou "(1/N)" (ex: "Tênis - 1/6"), o sistema gera automaticamente as parcelas 2/N até N/N nos meses seguintes.'
    },
    tools: MCP_TOOLS
  };
}

app.get('/mcp', (req, res) => {
  const accept = req.headers.accept || '';
  if (accept.includes('text/event-stream')) {
    return iniciarConexaoSse(req, res, '/mcp/messages');
  }
  res.json(gerarManifestoMcp(req));
});

app.get('/sse', (req, res) => {
  return iniciarConexaoSse(req, res, '/messages');
});

app.post(['/mcp', '/mcp/messages', '/messages'], async (req, res) => {
  try {
    const sessionId = req.query.sessionId;
    const body = req.body;

    if (Array.isArray(body)) {
      const responses = (await Promise.all(body.map(item => processarJsonRpcMcp(item)))).filter(Boolean);
      if (sessionId && mcpSseClients.has(sessionId)) {
        const sseRes = mcpSseClients.get(sessionId);
        responses.forEach(r => sseRes.write(`event: message\ndata: ${JSON.stringify(r)}\n\n`));
        return res.status(202).send('Accepted');
      }
      return res.json(responses);
    }

    const rpcResponse = await processarJsonRpcMcp(body || {});
    if (sessionId && mcpSseClients.has(sessionId)) {
      const sseRes = mcpSseClients.get(sessionId);
      if (rpcResponse) {
        sseRes.write(`event: message\ndata: ${JSON.stringify(rpcResponse)}\n\n`);
      }
      return res.status(202).send('Accepted');
    }

    if (!rpcResponse) {
      return res.status(202).send();
    }
    res.json(rpcResponse);
  } catch (err) {
    console.error('Erro no endpoint MCP:', err);
    res.status(500).json({
      jsonrpc: '2.0',
      id: (req.body && req.body.id) || null,
      error: { code: -32603, message: err.message }
    });
  }
});

app.get('/mcp/tools', (req, res) => {
  res.json({ tools: MCP_TOOLS });
});

app.all('/mcp/tools/:toolName', async (req, res) => {
  try {
    const { toolName } = req.params;
    const args = req.method === 'GET' ? { ...req.query } : { ...req.query, ...(req.body || {}) };
    const resultText = await executarFerramentaMcp(toolName, args);
    let parsed = resultText;
    try {
      parsed = JSON.parse(resultText);
    } catch (_) {}
    res.json({ status: 'success', tool: toolName, result: parsed });
  } catch (err) {
    res.status(400).json({ status: 'error', tool: req.params.toolName, detail: err.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Node.js Express Server running on port ${PORT}`);
});
