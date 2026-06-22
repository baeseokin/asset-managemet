const pool = require("./config/db");

async function run() {
  try {
    await pool.query("ALTER TABLE assets ADD COLUMN manufacturer VARCHAR(100) DEFAULT NULL;");
    console.log("Successfully added manufacturer column");
  } catch(e) {
    if (e.code === 'ER_DUP_FIELDNAME') {
      console.log("Column manufacturer already exists");
    } else {
      console.error(e);
    }
  } finally {
    process.exit(0);
  }
}

run();
