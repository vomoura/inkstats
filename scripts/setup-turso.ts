import "dotenv/config";
import { createClient } from "@libsql/client";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

const statements = [
  // Migration 1: init
  `CREATE TABLE IF NOT EXISTS "PlayerProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "displayName" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS "PlayerAlias" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "value" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    CONSTRAINT "PlayerAlias_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "PlayerProfile" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "Event" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "storeName" TEXT,
    "city" TEXT,
    "startDate" DATETIME,
    "format" TEXT,
    "category" TEXT,
    "totalPlayers" INTEGER,
    "importedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS "TournamentResult" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventId" TEXT NOT NULL,
    "playerName" TEXT NOT NULL,
    "matchedAlias" TEXT,
    "isUserResult" BOOLEAN NOT NULL DEFAULT false,
    "needsConfirmation" BOOLEAN NOT NULL DEFAULT true,
    "standing" INTEGER,
    "wins" INTEGER NOT NULL DEFAULT 0,
    "losses" INTEGER NOT NULL DEFAULT 0,
    "draws" INTEGER NOT NULL DEFAULT 0,
    "points" INTEGER,
    "deckName" TEXT,
    "inkColors" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TournamentResult_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "Match" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventId" TEXT NOT NULL,
    "roundNumber" INTEGER,
    "playerName" TEXT NOT NULL,
    "opponentName" TEXT,
    "result" TEXT NOT NULL,
    "score" TEXT,
    "isUserMatch" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Match_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "PlayerAlias_value_key" ON "PlayerAlias"("value")`,

  // Migration 2: add playhub credentials
  // SQLite ALTER TABLE ADD COLUMN is idempotent-safe with IF NOT EXISTS not supported,
  // so we use a try approach
  `ALTER TABLE "PlayerProfile" ADD COLUMN "playHubToken" TEXT`,
  `ALTER TABLE "PlayerProfile" ADD COLUMN "playHubUserId" INTEGER`,

  // Migration 3: add deck cards
  `ALTER TABLE "TournamentResult" ADD COLUMN "deckId" TEXT`,
  `CREATE TABLE IF NOT EXISTS "DeckCard" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "resultId" TEXT NOT NULL,
    "cardName" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "type" TEXT,
    "subtype" TEXT,
    "inkColor" TEXT,
    "rarity" TEXT,
    "setName" TEXT,
    "setCode" TEXT,
    "imageUrl" TEXT,
    "rulesText" TEXT,
    CONSTRAINT "DeckCard_resultId_fkey" FOREIGN KEY ("resultId") REFERENCES "TournamentResult" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
  )`,
];

async function main() {
  console.log("Applying schema to Turso...");

  for (const sql of statements) {
    try {
      await client.execute(sql);
      console.log(`  ✓ ${sql.substring(0, 60)}...`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      // Ignore "duplicate column" errors (columns already exist)
      if (msg.includes("duplicate column") || msg.includes("already exists")) {
        console.log(`  ⏭ Skipped (already exists): ${sql.substring(0, 50)}...`);
      } else {
        console.error(`  ✗ Error: ${msg}`);
        console.error(`    SQL: ${sql.substring(0, 80)}`);
      }
    }
  }

  console.log("\nDone! Turso database is ready.");
  client.close();
}

main();
