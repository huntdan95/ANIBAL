/**
 * The EJEMPLO example data (supabase/seed.sql): loads cleanly, can be loaded
 * twice, is clearly marked, respects who-sees-what, and can be removed.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import type { Client } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { as, createUser, freshDatabase, root } from "./helpers";

let db: Client;
let danny: string;
let anibal: string;
const seed = readFileSync(path.join(root, "supabase/seed.sql"), "utf8");

beforeAll(async () => {
  db = await freshDatabase("anibal_seed_test");
  // Danny and Aníbal have each signed in once.
  danny = await createUser(db, "danny@go-ipt.com");
  anibal = await createUser(db, "anibalperez1000@gmail.com");
  await db.query(seed);
  await db.query(seed); // running it twice must not duplicate anything
});

afterAll(async () => {
  await db?.end();
});

describe("EJEMPLO seed data", () => {
  it("adds exactly 3 leads, all clearly marked EJEMPLO", async () => {
    const { rows } = await db.query("select full_name, is_example from public.leads");
    expect(rows).toHaveLength(3);
    for (const r of rows) {
      expect(r.full_name.startsWith("EJEMPLO")).toBe(true);
      expect(r.is_example).toBe(true);
    }
  });

  it("covers New (3 days without contact), Quote sent and Bound", async () => {
    const { rows } = await db.query(
      "select stage, extract(day from now() - new_at)::int as age from public.leads order by new_at desc",
    );
    expect(rows.map((r) => r.stage)).toEqual(["new", "quote_sent", "bound"]);
    expect(rows[0].age).toBe(3);
  });

  it("Danny sees all 3; Aníbal sees only his 2 and none of the money", async () => {
    await as(db, danny, async (q) => {
      expect((await q("select id from leads")).rowCount).toBe(3);
      expect((await q("select * from lead_private")).rowCount).toBe(2);
    });
    await as(db, anibal, async (q) => {
      const { rows } = await q("select full_name from leads order by full_name");
      expect(rows.map((r) => r.full_name)).toEqual(["EJEMPLO – Juan Pérez", "EJEMPLO – María López"]);
      expect((await q("select * from lead_private")).rowCount).toBe(0);
      expect((await q("select * from intake")).rowCount).toBe(0);
      expect((await q("select distinct lead_id from events")).rowCount).toBe(2);
    });
  });

  it("the one-line removal deletes every example and its history", async () => {
    await db.query("begin");
    await db.query("delete from public.leads where is_example");
    for (const table of ["leads", "events", "intake", "lead_private"]) {
      expect((await db.query(`select count(*)::int as n from public.${table}`)).rows[0].n).toBe(0);
    }
    await db.query("rollback");
  });
});
