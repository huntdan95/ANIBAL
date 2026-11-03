import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { Client } from "pg";

export const root = path.resolve(__dirname, "../..");
const SERVER_URL = process.env.TEST_DATABASE_URL ?? "postgres://postgres@127.0.0.1:54329/postgres";

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- test rows are loosely typed
export type Q = (sql: string, params?: unknown[]) => Promise<{ rows: any[]; rowCount: number | null }>;

/** A brand-new throwaway database with the Supabase stand-in + all real migrations applied. */
export async function freshDatabase(name: string): Promise<Client> {
  const server = new Client({ connectionString: SERVER_URL });
  await server.connect();
  await server.query(`drop database if exists ${name} with (force)`);
  await server.query(`create database ${name}`);
  await server.end();

  const url = new URL(SERVER_URL);
  url.pathname = `/${name}`;
  const db = new Client({ connectionString: url.toString() });
  await db.connect();

  await db.query(readFileSync(path.join(root, "tests/db/supabase-shim.sql"), "utf8"));
  const migDir = path.join(root, "supabase/migrations");
  for (const f of readdirSync(migDir)
    .filter((f) => f.endsWith(".sql"))
    .sort()) {
    await db.query(readFileSync(path.join(migDir, f), "utf8"));
  }
  return db;
}

/**
 * Run `fn` as a signed-in user (or an anonymous visitor when `who` is null),
 * exactly the way Supabase does after a magic-link login, then undo any writes.
 */
export async function as<T>(db: Client, who: string | null, fn: (q: Q) => Promise<T>): Promise<T> {
  await db.query("begin");
  try {
    if (who) {
      await db.query("set local role authenticated");
      await db.query("select set_config('request.jwt.claims', $1, true)", [
        JSON.stringify({ sub: who, role: "authenticated" }),
      ]);
    } else {
      await db.query("set local role anon");
    }
    return await fn((sql, params) => db.query(sql, params));
  } finally {
    await db.query("rollback");
  }
}

export async function createUser(db: Client, email: string): Promise<string> {
  return (await db.query("insert into auth.users (email) values ($1) returning id", [email])).rows[0].id;
}
