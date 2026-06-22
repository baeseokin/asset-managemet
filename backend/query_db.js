const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'assetuser',
  password: process.env.DB_PASSWORD || 'assetpass',
  database: process.env.DB_NAME || 'assetdb',
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 32006
};

async function run() {
  try {
    const conn = await mysql.createConnection(dbConfig);
    const [rows] = await conn.query("SELECT id, asset_name, status FROM assets WHERE id = 11");
    console.log('Row 11:', rows);
    const [all] = await conn.query("SELECT id, asset_name, status FROM assets WHERE status = 'under_maintenance'");
    console.log('Under Maintenance:', all);
    conn.end();
  } catch(e) {
    console.error(e);
  }
}
run();
