-- AlterTable
ALTER TABLE "TournamentResult" ADD COLUMN "deckId" TEXT;

-- CreateTable
CREATE TABLE "DeckCard" (
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
);
