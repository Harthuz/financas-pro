const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@db:5432/gastos_db';

const pool = new Pool({
  connectionString,
});

async function initDB() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS categorias (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(100) UNIQUE NOT NULL,
        cor VARCHAR(30),
        orcamento_mensal NUMERIC(10, 2) DEFAULT 0,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS contas (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(100) UNIQUE NOT NULL,
        tipo_conta VARCHAR(50),
        cor VARCHAR(30),
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS gastos (
        id SERIAL PRIMARY KEY,
        nome TEXT NOT NULL,
        descricao TEXT,
        localizacao TEXT,
        valor NUMERIC(10, 2) NOT NULL,
        data DATE NOT NULL,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        notion_id VARCHAR(100) UNIQUE,
        parcela_grupo_id VARCHAR(64),
        fixo BOOLEAN DEFAULT FALSE,
        categoria_id INTEGER NOT NULL REFERENCES categorias(id) ON DELETE RESTRICT,
        conta_id INTEGER NOT NULL REFERENCES contas(id) ON DELETE RESTRICT
      );

      ALTER TABLE gastos ADD COLUMN IF NOT EXISTS descricao TEXT;
      ALTER TABLE gastos ADD COLUMN IF NOT EXISTS localizacao TEXT;
      ALTER TABLE gastos ADD COLUMN IF NOT EXISTS parcela_grupo_id VARCHAR(64);
      ALTER TABLE gastos ADD COLUMN IF NOT EXISTS fixo BOOLEAN DEFAULT FALSE;
      ALTER TABLE categorias ADD COLUMN IF NOT EXISTS orcamento_mensal NUMERIC(10, 2) DEFAULT 0;

      CREATE TABLE IF NOT EXISTS gastos_stage (
        id SERIAL PRIMARY KEY,
        nome TEXT DEFAULT '',
        descricao TEXT DEFAULT '',
        localizacao TEXT DEFAULT '',
        valor NUMERIC(10, 2),
        tipo TEXT DEFAULT '',
        conta TEXT DEFAULT '',
        data VARCHAR(20) DEFAULT '',
        fixo BOOLEAN DEFAULT FALSE,
        texto_extrato TEXT DEFAULT '',
        observacao_agente TEXT DEFAULT '',
        selecionado BOOLEAN DEFAULT TRUE,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await client.query(`CREATE TABLE IF NOT EXISTS pluggy_importacoes (transaction_id TEXT PRIMARY KEY, importado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
    await client.query(`CREATE TABLE IF NOT EXISTS dividas_financeiras (id SERIAL PRIMARY KEY, nome TEXT NOT NULL, valor NUMERIC(14,2) NOT NULL CHECK(valor >= 0), atualizado_em TIMESTAMPTZ DEFAULT NOW());
      CREATE TABLE IF NOT EXISTS planos_financeiros (
      id SERIAL PRIMARY KEY, documento JSONB NOT NULL, criado_em TIMESTAMPTZ DEFAULT NOW()
    )`);
    console.log('PostgreSQL Database tables initialized cleanly.');
  } catch (err) {
    console.error('Error initializing database tables:', err);
  } finally {
    client.release();
  }
}

module.exports = {
  pool,
  query: (text, params) => pool.query(text, params),
  initDB
};
