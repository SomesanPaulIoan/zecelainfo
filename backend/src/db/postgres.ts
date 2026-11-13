import { Pool } from "pg";

const connectionString =
  process.env.DATABASE_URL ?? "postgresql://postgres:password@localhost:5432/zecelainfo";

export const pgPool = new Pool({
  connectionString,
});
