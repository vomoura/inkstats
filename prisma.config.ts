import "dotenv/config";
import { defineConfig } from "prisma/config";

// For Prisma CLI (migrate, db push), use the HTTPS URL variant of Turso
// The libsql:// protocol is for the client adapter only
function getDatasourceUrl(): string {
  const tursoUrl = process.env["TURSO_DATABASE_URL"];
  if (tursoUrl) {
    // Convert libsql://host to https://host for Prisma CLI compatibility
    return tursoUrl.replace("libsql://", "https://");
  }
  return process.env["DATABASE_URL"] ?? "file:./prisma/dev.db";
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: getDatasourceUrl(),
  },
});
