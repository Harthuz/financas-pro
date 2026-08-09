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
        valor NUMERIC(10, 2) NOT NULL,
        data DATE NOT NULL,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        notion_id VARCHAR(100) UNIQUE,
        categoria_id INTEGER NOT NULL REFERENCES categorias(id) ON DELETE RESTRICT,
        conta_id INTEGER NOT NULL REFERENCES contas(id) ON DELETE RESTRICT
      );
    `);
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
