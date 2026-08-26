// Script de populare cu candidati fictivi, pentru testare locala a cautarii/matching-ului.
// Rulare: node scripts/seed-demo.cjs

const path = require("node:path");
const Database = require("better-sqlite3");
const crypto = require("crypto");

const db = new Database(path.join(__dirname, "..", "dev.db"));
const now = new Date().toISOString();

function id() {
  return crypto.randomUUID();
}

const candidates = [
  {
    email: "maria.ionescu@example.com",
    numeComplet: "Maria Ionescu",
    locatie: "București",
    remote: 1,
    aniExperienta: 3,
    titluCurent: "Dezvoltator Backend",
    bio: "Specializată pe Node.js și baze de date.",
    salariuMinim: 5000,
    salariuMaxim: 7000,
    disponibilitate: "IMEDIATA",
    skills: ["Node.js", "SQL", "Docker"],
  },
  {
    email: "radu.stanescu@example.com",
    numeComplet: "Radu Stănescu",
    locatie: "Cluj-Napoca",
    remote: 1,
    aniExperienta: 6,
    titluCurent: "Dezvoltator Frontend Senior",
    bio: "React și TypeScript de 6 ani, echipe distribuite.",
    salariuMinim: 9000,
    salariuMaxim: 12000,
    disponibilitate: "SUB_O_LUNA",
    skills: ["React", "TypeScript", "CSS"],
  },
  {
    email: "ioana.popa@example.com",
    numeComplet: "Ioana Popa",
    locatie: "Timișoara",
    remote: 0,
    aniExperienta: 1,
    titluCurent: "Dezvoltator Junior",
    bio: "La început de carieră, entuziastă să învețe.",
    salariuMinim: 3500,
    salariuMaxim: 4500,
    disponibilitate: "IMEDIATA",
    skills: ["JavaScript", "React"],
  },
  {
    email: "george.dumitrescu@example.com",
    numeComplet: "George Dumitrescu",
    locatie: "București",
    remote: 0,
    aniExperienta: 8,
    titluCurent: "Contabil Senior",
    bio: "Experiență în contabilitate financiară și SAP.",
    salariuMinim: 6000,
    salariuMaxim: 8000,
    disponibilitate: "PESTE_O_LUNA",
    skills: ["Contabilitate", "SAP", "Excel"],
  },
  {
    email: "elena.marin@example.com",
    numeComplet: "Elena Marin",
    locatie: "Iași",
    remote: 1,
    aniExperienta: 4,
    titluCurent: "Dezvoltator Fullstack",
    bio: "React pe frontend, Node.js pe backend.",
    salariuMinim: 7000,
    salariuMaxim: 9500,
    disponibilitate: "SUB_O_LUNA",
    skills: ["React", "Node.js", "SQL"],
  },
];

const insertUser = db.prepare(
  `INSERT INTO User (id, email, passwordHash, role, createdAt) VALUES (?, ?, ?, 'CANDIDATE', ?)`
);
const insertCandidate = db.prepare(
  `INSERT INTO CandidateProfile (id, userId, numeComplet, locatie, remote, aniExperienta, titluCurent, bio, salariuMinim, salariuMaxim, disponibilitate, createdAt, updatedAt)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
);
const findSkill = db.prepare(`SELECT id FROM Skill WHERE nume = ?`);
const insertSkill = db.prepare(`INSERT INTO Skill (id, nume) VALUES (?, ?)`);
const insertCandidateSkill = db.prepare(
  `INSERT INTO CandidateSkill (candidateId, skillId) VALUES (?, ?)`
);

const insertAll = db.transaction(() => {
  for (const c of candidates) {
    const userId = id();
    insertUser.run(userId, c.email, "seed-placeholder-hash", now);

    const candidateId = id();
    insertCandidate.run(
      candidateId,
      userId,
      c.numeComplet,
      c.locatie,
      c.remote,
      c.aniExperienta,
      c.titluCurent,
      c.bio,
      c.salariuMinim,
      c.salariuMaxim,
      c.disponibilitate,
      now,
      now
    );

    for (const skillName of c.skills) {
      const row = findSkill.get(skillName);
      const skillId = row ? row.id : id();
      if (!row) insertSkill.run(skillId, skillName);
      insertCandidateSkill.run(candidateId, skillId);
    }
  }
});

insertAll();
console.log(`Seed complete: ${candidates.length} candidați adăugați.`);
