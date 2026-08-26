// Marchează un utilizator existent ca admin. Rulare: node scripts/make-admin.cjs email@exemplu.com
const path = require("node:path");
const Database = require("better-sqlite3");

const email = process.argv[2];
if (!email) {
  console.error("Folosire: node scripts/make-admin.cjs email@exemplu.com");
  process.exit(1);
}

const db = new Database(path.join(__dirname, "..", "dev.db"));
const user = db.prepare("SELECT id, email, isAdmin FROM User WHERE email = ?").get(email);

if (!user) {
  console.error(`Nu există niciun cont cu email-ul ${email}. Creează-l mai întâi din aplicație.`);
  process.exit(1);
}

db.prepare("UPDATE User SET isAdmin = 1 WHERE id = ?").run(user.id);
console.log(`Contul ${email} este acum admin.`);
