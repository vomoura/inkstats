import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaLibSql({
  url: process.env.TURSO_DATABASE_URL ?? "file:./prisma/dev.db",
  authToken: process.env.TURSO_AUTH_TOKEN,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  // Clear existing data
  await prisma.match.deleteMany();
  await prisma.tournamentResult.deleteMany();
  await prisma.event.deleteMany();
  await prisma.playerAlias.deleteMany();
  await prisma.playerProfile.deleteMany();

  // Create sample profile with aliases
  const profile = await prisma.playerProfile.create({
    data: {
      displayName: "Victor",
      aliases: {
        create: [
          { value: "Victor Moura" },
          { value: "VictorM" },
        ],
      },
    },
    include: { aliases: true },
  });

  console.log(`Created profile: ${profile.displayName} with ${profile.aliases.length} aliases`);

  // Create sample event 1
  const event1 = await prisma.event.create({
    data: {
      id: "event-sample-001",
      name: "Lorcana Set Championship - June 2025",
      storeName: "Dragon's Lair",
      city: "São Paulo",
      startDate: new Date("2025-06-15"),
      format: "Constructed",
      category: "Set Championship",
      totalPlayers: 32,
      results: {
        create: [
          {
            playerName: "Victor Moura",
            matchedAlias: "Victor Moura",
            isUserResult: true,
            needsConfirmation: false,
            standing: 3,
            wins: 4,
            losses: 1,
            draws: 0,
            points: 12,
            deckName: "Amethyst/Steel Control",
            inkColors: "Amethyst,Steel",
          },
          {
            playerName: "João Silva",
            standing: 1,
            wins: 5,
            losses: 0,
            draws: 0,
            points: 15,
          },
          {
            playerName: "Maria Santos",
            standing: 2,
            wins: 4,
            losses: 1,
            draws: 0,
            points: 12,
          },
        ],
      },
      matches: {
        create: [
          {
            roundNumber: 1,
            playerName: "Victor Moura",
            opponentName: "Carlos Lima",
            result: "WIN",
            score: "2-0",
            isUserMatch: true,
          },
          {
            roundNumber: 2,
            playerName: "Victor Moura",
            opponentName: "Ana Costa",
            result: "WIN",
            score: "2-1",
            isUserMatch: true,
          },
          {
            roundNumber: 3,
            playerName: "Victor Moura",
            opponentName: "João Silva",
            result: "LOSS",
            score: "0-2",
            isUserMatch: true,
          },
          {
            roundNumber: 4,
            playerName: "Victor Moura",
            opponentName: "Pedro Alves",
            result: "WIN",
            score: "2-0",
            isUserMatch: true,
          },
          {
            roundNumber: 5,
            playerName: "Victor Moura",
            opponentName: "Maria Santos",
            result: "WIN",
            score: "2-1",
            isUserMatch: true,
          },
        ],
      },
    },
  });

  console.log(`Created event: ${event1.name}`);

  // Create sample event 2
  const event2 = await prisma.event.create({
    data: {
      id: "event-sample-002",
      name: "Lorcana League Night #12",
      storeName: "Mtg Brasil",
      city: "São Paulo",
      startDate: new Date("2025-07-02"),
      format: "Constructed",
      category: "League",
      totalPlayers: 16,
      results: {
        create: [
          {
            playerName: "VictorM",
            matchedAlias: "VictorM",
            isUserResult: true,
            needsConfirmation: false,
            standing: 1,
            wins: 3,
            losses: 0,
            draws: 1,
            points: 10,
            deckName: "Ruby/Sapphire Aggro",
            inkColors: "Ruby,Sapphire",
          },
          {
            playerName: "Lucas Ferreira",
            standing: 2,
            wins: 3,
            losses: 1,
            draws: 0,
            points: 9,
          },
        ],
      },
      matches: {
        create: [
          {
            roundNumber: 1,
            playerName: "VictorM",
            opponentName: "Lucas Ferreira",
            result: "WIN",
            score: "2-0",
            isUserMatch: true,
          },
          {
            roundNumber: 2,
            playerName: "VictorM",
            opponentName: "Thiago Rocha",
            result: "WIN",
            score: "2-1",
            isUserMatch: true,
          },
          {
            roundNumber: 3,
            playerName: "VictorM",
            opponentName: "Rafael Souza",
            result: "DRAW",
            score: "1-1",
            isUserMatch: true,
          },
          {
            roundNumber: 4,
            playerName: "VictorM",
            opponentName: "Bruno Costa",
            result: "WIN",
            score: "2-0",
            isUserMatch: true,
          },
        ],
      },
    },
  });

  console.log(`Created event: ${event2.name}`);

  console.log("\nSeed complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
