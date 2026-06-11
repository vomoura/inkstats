import "dotenv/config";
import { createClient } from "@libsql/client";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

async function main() {
  console.log("=== Profile ===");
  const profile = await client.execute("SELECT * FROM PlayerProfile");
  console.log(profile.rows);

  console.log("\n=== Aliases ===");
  const aliases = await client.execute("SELECT * FROM PlayerAlias");
  console.log(aliases.rows);

  console.log("\n=== Events ===");
  const events = await client.execute("SELECT id, name FROM Event");
  console.log(events.rows);

  console.log("\n=== User Results (isUserResult=true) ===");
  const userResults = await client.execute("SELECT id, eventId, playerName, matchedAlias, isUserResult, needsConfirmation, standing, wins, losses, draws FROM TournamentResult WHERE isUserResult = 1");
  console.log(userResults.rows);

  console.log("\n=== Pending Confirmations ===");
  const pending = await client.execute("SELECT id, eventId, playerName, matchedAlias, needsConfirmation FROM TournamentResult WHERE needsConfirmation = 1");
  console.log(`Count: ${pending.rows.length}`);
  if (pending.rows.length > 0) console.log(pending.rows.slice(0, 5));

  console.log("\n=== All Results sample (first 5) ===");
  const allResults = await client.execute("SELECT playerName, isUserResult, needsConfirmation, matchedAlias FROM TournamentResult LIMIT 5");
  console.log(allResults.rows);

  console.log("\n=== Matches (isUserMatch=true) ===");
  const matches = await client.execute("SELECT * FROM Match WHERE isUserMatch = 1 LIMIT 5");
  console.log(`Count: ${matches.rows.length}`);

  client.close();
}

main();
