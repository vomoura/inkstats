import "dotenv/config";
import { createClient } from "@libsql/client";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

async function main() {
  // Get the user alias
  const aliases = await client.execute("SELECT value FROM PlayerAlias");
  const aliasValues = aliases.rows.map((r) => (r.value as string).toLowerCase().trim());
  console.log("Aliases:", aliasValues);

  // Fix tournament results - mark exact matches as confirmed
  for (const alias of aliasValues) {
    const result = await client.execute({
      sql: `UPDATE TournamentResult 
            SET isUserResult = 1, needsConfirmation = 0, matchedAlias = ?
            WHERE LOWER(TRIM(playerName)) = ?`,
      args: [alias, alias],
    });
    console.log(`Marked ${result.rowsAffected} results for alias "${alias}"`);
  }

  // Set non-matching results to needsConfirmation = false (they're just other players)
  const result2 = await client.execute(
    `UPDATE TournamentResult SET needsConfirmation = 0 WHERE isUserResult = 0 AND needsConfirmation = 1`
  );
  console.log(`Cleared ${result2.rowsAffected} unnecessary pending confirmations`);

  // Fix matches - mark user matches
  for (const alias of aliasValues) {
    const result = await client.execute({
      sql: `UPDATE Match SET isUserMatch = 1 WHERE LOWER(TRIM(playerName)) = ?`,
      args: [alias],
    });
    console.log(`Marked ${result.rowsAffected} matches for alias "${alias}"`);
  }

  // Verify
  const userResults = await client.execute("SELECT playerName, standing, wins, losses, draws FROM TournamentResult WHERE isUserResult = 1");
  console.log("\n=== Confirmed User Results ===");
  console.log(userResults.rows);

  client.close();
}

main();
