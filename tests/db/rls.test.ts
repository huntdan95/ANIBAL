/**
 * Row-level security test: signs in as Danny, Aníbal and a customer and
 * checks each one sees only what they should.
 *
 * "Signing in" here means doing exactly what Supabase does after a
 * magic-link login: switch to the `authenticated` database role and set
 * the user's JWT claims. The real migrations from supabase/migrations run
 * on a throwaway database, so these are the real rules being tested.
 *
 * Run:  npm run test:db   (needs a Postgres; see README "Running the tests")
 */
import type { Client } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { as as asIn, createUser, freshDatabase, type Q } from "./helpers";

let db: Client;
const ids = {} as Record<"danny" | "anibal" | "cust1" | "cust2" | "lead1" | "lead2" | "quote1" | "quote2", string>;

const as = <T>(who: string | null, fn: (q: Q) => Promise<T>) => asIn(db, who, fn);

const idsOf = (rows: { id?: string; lead_id?: string }[]) => rows.map((r) => r.id ?? r.lead_id).sort();

beforeAll(async () => {
  db = await freshDatabase("anibal_rls_test");

  // --- Fixtures (created as the database owner, like the server would) ---
  const user = (email: string) => createUser(db, email);
  ids.danny = await user("danny@go-ipt.com");
  ids.anibal = await user("anibalperez1000@gmail.com");
  ids.cust1 = await user("cliente1@example.com");
  ids.cust2 = await user("cliente2@example.com");

  const lead = async (name: string, email: string, source: string, referrer: string | null, customer: string) =>
    (
      await db.query(
        `insert into public.leads (full_name, phone, email, city, state, source, referrer_id, customer_id)
         values ($1, '6155550100', $2, 'Nashville', 'TN', $3, $4, $5) returning id`,
        [name, email, source, referrer, customer],
      )
    ).rows[0].id;
  ids.lead1 = await lead("Juan Pérez", "cliente1@example.com", "anibal", ids.anibal, ids.cust1); // Aníbal's referral
  ids.lead2 = await lead("Ana Gómez", "cliente2@example.com", "radio", null, ids.cust2); // radio lead

  for (const l of [ids.lead1, ids.lead2]) {
    await db.query(
      `insert into public.lead_private (lead_id, coverage_lines, est_premium, commission, notes)
       values ($1, '{wc,gl}', 4200, 420, 'private note')`,
      [l],
    );
    await db.query(
      `insert into public.intake (lead_id, needs, work_type, weekly_payroll, weeks_per_year)
       values ($1, '{business,workers}', 'Framing', 3000, 50)`,
      [l],
    );
    await db.query(`insert into storage.objects (bucket_id, name) values ('quotes', $1)`, [`${l}/quote.pdf`]);
  }
  const quote = async (l: string) =>
    (
      await db.query(
        `insert into public.quotes (lead_id, note, pdf_path) values ($1, 'Opción 1: $350/mes', $2) returning id`,
        [l, `${l}/quote.pdf`],
      )
    ).rows[0].id;
  ids.quote1 = await quote(ids.lead1);
  ids.quote2 = await quote(ids.lead2);
  // Posting those quotes moved both leads to "quote_sent"; start the tests from "New".
  await db.query("update public.leads set stage = 'new', quote_sent_at = null");
});

afterAll(async () => {
  await db?.end();
});

describe("roles come from the staff list", () => {
  it("Danny is admin, Aníbal is referrer, everyone else is a customer", async () => {
    const { rows } = await db.query("select id, role from public.profiles");
    const role = Object.fromEntries(rows.map((r) => [r.id, r.role]));
    expect(role[ids.danny]).toBe("admin");
    expect(role[ids.anibal]).toBe("referrer");
    expect(role[ids.cust1]).toBe("customer");
    expect(role[ids.cust2]).toBe("customer");
  });
});

describe("Danny (admin)", () => {
  it("sees every lead, private detail, intake, quote, PDF and event", async () => {
    await as(ids.danny, async (q) => {
      expect(idsOf((await q("select id from leads")).rows)).toEqual([ids.lead1, ids.lead2].sort());
      expect((await q("select * from lead_private")).rowCount).toBe(2);
      expect((await q("select * from intake")).rowCount).toBe(2);
      expect((await q("select * from quotes")).rowCount).toBe(2);
      expect((await q("select * from storage.objects")).rowCount).toBe(2);
      expect((await q("select distinct lead_id from events")).rowCount).toBe(2);
      expect((await q("select * from profiles")).rowCount).toBe(4);
    });
  });

  it("can move a lead through the stages, and each stage gets a date + event", async () => {
    await as(ids.danny, async (q) => {
      await q("update leads set stage = 'contacted' where id = $1", [ids.lead1]);
      const { rows } = await q("select stage, contacted_at from leads where id = $1", [ids.lead1]);
      expect(rows[0].stage).toBe("contacted");
      expect(rows[0].contacted_at).not.toBeNull();
      const ev = await q("select kind, actor_role from events where lead_id = $1 order by id desc limit 1", [
        ids.lead1,
      ]);
      expect(ev.rows[0]).toEqual({ kind: "contacted", actor_role: "admin" });
    });
  });

  it("closing records the close date; reopening keeps earlier dates and logs it", async () => {
    await as(ids.danny, async (q) => {
      await q("update leads set stage = 'contacted' where id = $1", [ids.lead1]);
      await q("update leads set stage = 'not_bought' where id = $1", [ids.lead1]);
      let { rows } = await q("select stage, contacted_at, closed_at from leads where id = $1", [ids.lead1]);
      expect(rows[0].closed_at).not.toBeNull();
      expect(rows[0].contacted_at).not.toBeNull();

      await q("update leads set stage = 'new' where id = $1", [ids.lead1]);
      ({ rows } = await q("select stage, contacted_at, closed_at from leads where id = $1", [ids.lead1]));
      expect(rows[0]).toMatchObject({ stage: "new", closed_at: null });
      expect(rows[0].contacted_at).not.toBeNull();

      const ev = await q("select kind from events where lead_id = $1 order by id desc limit 3", [ids.lead1]);
      expect(ev.rows.map((r) => r.kind)).toEqual(["reopened", "not_bought", "contacted"]);
    });
  });

  it("saving the same stage again doesn't add a duplicate event", async () => {
    await as(ids.danny, async (q) => {
      await q("update leads set stage = 'contacted' where id = $1", [ids.lead2]);
      const before = (await q("select count(*)::int as n from events where lead_id = $1", [ids.lead2])).rows[0].n;
      await q("update leads set stage = 'contacted' where id = $1", [ids.lead2]);
      const after = (await q("select count(*)::int as n from events where lead_id = $1", [ids.lead2])).rows[0].n;
      expect(after).toBe(before);
    });
  });

  it("the activity feed join shows Aníbal names only for his referrals", async () => {
    await as(ids.anibal, async (q) => {
      const { rows } = await q("select distinct l.full_name from events e join leads l on l.id = e.lead_id");
      expect(rows.map((r) => r.full_name)).toEqual(["Juan Pérez"]);
    });
  });

  it("posting a quote moves the lead to 'quote_sent' automatically", async () => {
    await as(ids.danny, async (q) => {
      await q("update leads set stage = 'contacted' where id = $1", [ids.lead2]);
      await q("insert into quotes (lead_id, note, pdf_path) values ($1, 'Opción 2', 'x.pdf')", [ids.lead2]);
      const { rows } = await q("select stage, quote_sent_at from leads where id = $1", [ids.lead2]);
      expect(rows[0].stage).toBe("quote_sent");
      expect(rows[0].quote_sent_at).not.toBeNull();
    });
  });
});

describe("Aníbal (referrer)", () => {
  it("sees only the lead he referred", async () => {
    await as(ids.anibal, async (q) => {
      expect(idsOf((await q("select id from leads")).rows)).toEqual([ids.lead1]);
      const ev = await q("select distinct lead_id from events");
      expect(idsOf(ev.rows)).toEqual([ids.lead1]);
    });
  });

  it("never sees premiums, commission, notes, customer answers, quotes or PDFs", async () => {
    await as(ids.anibal, async (q) => {
      expect((await q("select * from lead_private")).rowCount).toBe(0);
      expect((await q("select * from intake")).rowCount).toBe(0);
      expect((await q("select * from quotes")).rowCount).toBe(0);
      expect((await q("select * from storage.objects")).rowCount).toBe(0);
      expect(idsOf((await q("select id from profiles")).rows)).toEqual([ids.anibal]);
    });
  });

  it("can add a referral, but it always starts as 'New' and is credited to him", async () => {
    await as(ids.anibal, async (q) => {
      const { rows } = await q(
        `insert into leads (full_name, phone, email, stage, referrer_id, contacted_at)
         values ('Pedro Ruiz', '6155550199', 'pedro@example.com', 'bound', $1, now())
         returning stage, referrer_id, contacted_at, bound_at, source`,
        [ids.danny],
      );
      expect(rows[0]).toMatchObject({
        stage: "new",
        referrer_id: ids.anibal,
        contacted_at: null,
        bound_at: null,
        source: "anibal",
      });
    });
  });

  it("cannot change stages or edit leads", async () => {
    await as(ids.anibal, async (q) => {
      const res = await q("update leads set stage = 'bound', full_name = 'X' where id = $1", [ids.lead1]);
      expect(res.rowCount).toBe(0);
    });
    const { rows } = await db.query("select stage from leads where id = $1", [ids.lead1]);
    expect(rows[0].stage).toBe("new");
  });

  it("cannot give himself admin, read the staff list, or fake events", async () => {
    await expect(
      as(ids.anibal, (q) => q("update profiles set role = 'admin' where id = $1", [ids.anibal])),
    ).rejects.toThrow(/permission denied/);
    await expect(as(ids.anibal, (q) => q("select * from staff"))).rejects.toThrow(/permission denied/);
    await expect(as(ids.anibal, (q) => q("select * from invites"))).rejects.toThrow(/permission denied/);
    await expect(
      as(ids.anibal, (q) => q("insert into events (lead_id, kind) values ($1, 'bound')", [ids.lead1])),
    ).rejects.toThrow(/permission denied/);
    await expect(as(ids.anibal, (q) => q("select public.log_event($1, 'bound')", [ids.lead1]))).rejects.toThrow(
      /permission denied/,
    );
  });

  it("cannot submit a customer's info or press their quote button", async () => {
    await expect(as(ids.anibal, (q) => q(submitSql, submitArgs(ids.lead1)))).rejects.toThrow(/not allowed/);
    await expect(as(ids.anibal, (q) => q("select quote_proceed($1)", [ids.quote1]))).rejects.toThrow(/not allowed/);
  });
});

describe("Customer", () => {
  it("sees only their own lead, answers, quotes and PDFs", async () => {
    await as(ids.cust1, async (q) => {
      expect(idsOf((await q("select id from leads")).rows)).toEqual([ids.lead1]);
      expect(idsOf((await q("select lead_id from intake")).rows)).toEqual([ids.lead1]);
      expect(idsOf((await q("select id from quotes")).rows)).toEqual([ids.quote1]);
      const files = await q("select name from storage.objects");
      expect(files.rows.map((r) => r.name)).toEqual([`${ids.lead1}/quote.pdf`]);
    });
  });

  it("never sees Danny's private details, the activity feed or other people", async () => {
    await as(ids.cust1, async (q) => {
      expect((await q("select * from lead_private")).rowCount).toBe(0);
      expect((await q("select * from events")).rowCount).toBe(0);
      expect(idsOf((await q("select id from profiles")).rows)).toEqual([ids.cust1]);
    });
  });

  it("cannot edit leads, add leads or post quotes directly", async () => {
    await as(ids.cust1, async (q) => {
      expect((await q("update leads set stage = 'bound' where id = $1", [ids.lead1])).rowCount).toBe(0);
    });
    await expect(
      as(ids.cust1, (q) =>
        q("insert into leads (full_name, phone, email) values ('Yo', '6155550111', 'yo@example.com')"),
      ),
    ).rejects.toThrow(/row-level security/);
    await expect(
      as(ids.cust1, (q) => q("insert into quotes (lead_id, note, pdf_path) values ($1, 'x', 'x')", [ids.lead1])),
    ).rejects.toThrow(/row-level security/);
    await expect(
      as(ids.cust1, (q) => q("update profiles set role = 'admin' where id = $1", [ids.cust1])),
    ).rejects.toThrow(/permission denied/);
  });

  it("'Enviar a Danny' saves their info and moves the lead to 'info_sent'", async () => {
    await as(ids.cust1, async (q) => {
      const { rows } = await q(submitSql, submitArgs(ids.lead1));
      expect(rows[0].stage).toBe("info_sent");
    });
  });

  it("sending the info again updates the answers and logs it, without moving the stage back", async () => {
    await as(ids.cust1, async (q) => {
      await q(submitSql, submitArgs(ids.lead1));
      const before = (await q("select info_sent_at from leads where id = $1", [ids.lead1])).rows[0].info_sent_at;
      await q(
        `select submit_intake($1, 'Juan Pérez', '6155550100', '1 Main St', 'Nashville', 'TN', '37201',
          null, 'en', '{home}', null, null, null, null, 2015, null, null)`,
        [ids.lead1],
      );
      const { rows } = await q("select stage, info_sent_at, language from leads where id = $1", [ids.lead1]);
      expect(rows[0]).toMatchObject({ stage: "info_sent", language: "en" });
      expect(rows[0].info_sent_at).toEqual(before); // the first date is kept
      const intake = (await q("select needs, roof_year, weekly_payroll from intake where lead_id = $1", [ids.lead1]))
        .rows[0];
      expect(intake).toEqual({ needs: ["home"], roof_year: 2015, weekly_payroll: null });
      // Both sends show up in the feed (read as the database owner, since customers can't read events).
      await q("reset role");
      const ev = await q("select count(*)::int as n from events where lead_id = $1 and kind = 'info_sent'", [
        ids.lead1,
      ]);
      expect(ev.rows[0].n).toBe(2);
    });
  });

  it("bad data is refused by the database even if the app's checks are skipped", async () => {
    await expect(
      as(ids.cust1, (q) =>
        q(
          `select submit_intake($1, 'Juan', '555', '1 Main', 'Nashville', 'TN', '37201',
            null, 'es', '{home}', null, null, null, null, null, null, null)`,
          [ids.lead1],
        ),
      ),
    ).rejects.toThrow(/check constraint/);
    await expect(
      as(ids.cust1, (q) =>
        q(
          `select submit_intake($1, 'Juan', '6155550100', '1 Main', 'Nashville', 'TN', '37201',
            null, 'es', '{ssn}', null, null, null, null, null, null, null)`,
          [ids.lead1],
        ),
      ),
    ).rejects.toThrow(/check constraint/);
  });

  it("cannot submit info or press 'Quiero seguir adelante' on someone else's file", async () => {
    await expect(as(ids.cust1, (q) => q(submitSql, submitArgs(ids.lead2)))).rejects.toThrow(/not allowed/);
    await expect(as(ids.cust1, (q) => q("select quote_proceed($1)", [ids.quote2]))).rejects.toThrow(/not allowed/);
  });

  it("'Quiero seguir adelante' records interest once (it does not bind anything)", async () => {
    await as(ids.cust1, async (q) => {
      expect((await q("select quote_proceed($1) as ok", [ids.quote1])).rows[0].ok).toBe(true);
      expect((await q("select quote_proceed($1) as ok", [ids.quote1])).rows[0].ok).toBe(false);
      const { rows } = await q("select stage from leads where id = $1", [ids.lead1]);
      expect(rows[0].stage).not.toBe("bound");
    });
  });
});

describe("quote PDFs in storage", () => {
  const upload = (leadId: string) =>
    `insert into storage.objects (bucket_id, name) values ('quotes', '${leadId}/new-quote.pdf') returning name`;

  it("only Danny can upload a quote PDF", async () => {
    await expect(as(ids.danny, (q) => q(upload(ids.lead1)))).resolves.toBeDefined();
    await expect(as(ids.anibal, (q) => q(upload(ids.lead1)))).rejects.toThrow(/row-level security/);
    await expect(as(ids.cust1, (q) => q(upload(ids.lead1)))).rejects.toThrow(/row-level security/);
  });

  it("only Danny can delete one", async () => {
    await as(ids.cust1, async (q) => {
      const res = await q("delete from storage.objects where bucket_id = 'quotes'");
      expect(res.rowCount).toBe(0);
    });
    const left = await db.query("select count(*)::int as n from storage.objects");
    expect(left.rows[0].n).toBe(2);
  });

  it("a customer can't open another customer's PDF even by guessing its path", async () => {
    await as(ids.cust1, async (q) => {
      const { rows } = await q("select name from storage.objects where name = $1", [`${ids.lead2}/quote.pdf`]);
      expect(rows).toHaveLength(0);
    });
  });
});

describe("Not signed in", () => {
  it("can't create a lead directly (the sign-up page goes through the server with its checks)", async () => {
    await expect(
      as(null, (q) => q("insert into leads (full_name, phone, email) values ('Bot', '6155550000', 'bot@example.com')")),
    ).rejects.toThrow(/permission denied/);
  });

  it("a public sign-up (made by the server) shows in the feed as 'se inscribió' with no actor", async () => {
    await db.query("begin");
    const { rows } = await db.query(
      "insert into public.leads (full_name, phone, email, source) values ('Rosa', '6155550177', 'rosa@example.com', 'radio') returning id, stage, referrer_id",
    );
    expect(rows[0]).toMatchObject({ stage: "new", referrer_id: null });
    const ev = await db.query("select kind, actor_role from public.events where lead_id = $1", [rows[0].id]);
    expect(ev.rows).toEqual([{ kind: "created", actor_role: null }]);
    await db.query("rollback");
  });

  it("someone who signs up through Aníbal's link shows up on Aníbal's list; other sign-ups don't", async () => {
    await db.query("begin");
    const mine = await db.query(
      "insert into public.leads (full_name, phone, email, source, referrer_id) values ('Rosa', '6155550177', 'rosa@example.com', 'anibal', $1) returning id",
      [ids.anibal],
    );
    await db.query(
      "insert into public.leads (full_name, phone, email, source) values ('Luis', '6155550178', 'luis@example.com', 'radio')",
    );
    await db.query("set local role authenticated");
    await db.query("select set_config('request.jwt.claims', $1, true)", [
      JSON.stringify({ sub: ids.anibal, role: "authenticated" }),
    ]);
    const { rows } = await db.query("select id, full_name from leads where full_name in ('Rosa', 'Luis')");
    expect(rows).toEqual([{ id: mine.rows[0].id, full_name: "Rosa" }]);
    await db.query("rollback");
  });

  it("sees nothing", async () => {
    for (const table of ["leads", "lead_private", "intake", "quotes", "events", "profiles"]) {
      await expect(as(null, (q) => q(`select * from ${table}`))).rejects.toThrow(/permission denied/);
    }
    await expect(as(null, (q) => q("select * from storage.objects"))).resolves.toBeDefined();
    expect(await as(null, async (q) => (await q("select * from storage.objects")).rowCount)).toBe(0);
  });
});

const submitSql = `select submit_intake($1, 'Juan Pérez', '6155550100', '1 Main St', 'Nashville', 'TN', '37201',
  'Pérez Framing', 'es', '{business,workers}', null, 'Framing', 3000, 50, null, null, null) as stage`;
const submitArgs = (lead: string) => [lead];
