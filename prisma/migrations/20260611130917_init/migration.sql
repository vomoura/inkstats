-- CreateTable
CREATE TABLE "PlayerProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "displayName" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "PlayerAlias" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "value" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    CONSTRAINT "PlayerAlias_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "PlayerProfile" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "storeName" TEXT,
    "city" TEXT,
    "startDate" DATETIME,
    "format" TEXT,
    "category" TEXT,
    "totalPlayers" INTEGER,
    "importedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "TournamentResult" (
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
);

-- CreateTable
CREATE TABLE "Match" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventId" TEXT NOT NULL,
    "roundNumber" INTEGER,
    "playerName" TEXT NOT NULL,
    "opponentName" TEXT,
    "result" TEXT NOT NULL,
    "score" TEXT,
    "isUserMatch" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Match_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "PlayerAlias_value_key" ON "PlayerAlias"("value");
