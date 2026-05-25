const bcrypt = require("bcrypt");

async function run() {
  const hash = await bcrypt.hash("0000", 10);
  console.log("HASH_RESULT:", hash);
}

run();
