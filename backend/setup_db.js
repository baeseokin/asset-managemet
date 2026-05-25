const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");
const { envPick, envNumber } = require("./env");

async function setup() {
  const host = envPick("DB_HOST", "localhost");
  const port = envNumber("DB_PORT", 32006);
  const user = envPick("DB_USER", "roomuser");
  const password = envPick("DB_PASSWORD", "roompass");

  console.log(`🔌 Connecting to MySQL server at ${host}:${port} as ${user}...`);
  
  // Establish connection with multipleStatements enabled to run whole files
  const connection = await mysql.createConnection({
    host,
    port,
    user,
    password,
    multipleStatements: true
  });

  try {
    console.log("📖 Reading DDL.sql...");
    const ddlPath = path.join(__dirname, "DDL.sql");
    const ddlSql = fs.readFileSync(ddlPath, "utf8");
    
    console.log("🚀 Executing DDL.sql (Creating database and tables)...");
    await connection.query(ddlSql);
    console.log("✅ DDL queries completed successfully.");

    console.log("📖 Reading init.sql...");
    const initPath = path.join(__dirname, "init.sql");
    const initSql = fs.readFileSync(initPath, "utf8");
    
    console.log("🚀 Executing init.sql (Inserting initial data)...");
    await connection.query(initSql);
    console.log("✅ Seed data inserted successfully.");

    console.log("🎉 Database initialization completed successfully! 🎉");
    process.exit(0);
  } catch (err) {
    console.error("❌ Database initialization failed:", err);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

setup();
