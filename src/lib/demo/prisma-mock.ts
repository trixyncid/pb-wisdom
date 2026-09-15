/* eslint-disable @typescript-eslint/no-explicit-any */
import { demoStore, type DemoModel } from "@/lib/demo/data";

type Dict = Record<string, any>;

const RELATIONS: Record<
  DemoModel,
  Record<string, { model: DemoModel; local: string; foreign: string; many: boolean }>
> = {
  user: {
    profile: { model: "memberProfile", local: "id", foreign: "userId", many: false },
  },
  memberProfile: {
    user: { model: "user", local: "userId", foreign: "id", many: false },
  },
  trainingSession: {
    occurrences: {
      model: "trainingOccurrence",
      local: "id",
      foreign: "sessionId",
      many: true,
    },
  },
  trainingOccurrence: {
    session: { model: "trainingSession", local: "sessionId", foreign: "id", many: false },
    attendances: {
      model: "sessionAttendance",
      local: "id",
      foreign: "occurrenceId",
      many: true,
    },
  },
  sessionAttendance: {
    occurrence: {
      model: "trainingOccurrence",
      local: "occurrenceId",
      foreign: "id",
      many: false,
    },
    user: { model: "user", local: "userId", foreign: "id", many: false },
  },
  feePeriod: {
    dues: { model: "feeDue", local: "id", foreign: "periodId", many: true },
  },
  feeDue: {
    period: { model: "feePeriod", local: "periodId", foreign: "id", many: false },
    user: { model: "user", local: "userId", foreign: "id", many: false },
  },
  event: {
    rsvps: { model: "eventRsvp", local: "id", foreign: "eventId", many: true },
    photos: { model: "eventPhoto", local: "id", foreign: "eventId", many: true },
  },
  eventRsvp: {
    event: { model: "event", local: "eventId", foreign: "id", many: false },
    user: { model: "user", local: "userId", foreign: "id", many: false },
  },
  eventPhoto: {
    event: { model: "event", local: "eventId", foreign: "id", many: false },
    uploader: { model: "user", local: "uploaderId", foreign: "id", many: false },
  },
  match: {
    players: { model: "matchPlayer", local: "id", foreign: "matchId", many: true },
  },
  matchPlayer: {
    match: { model: "match", local: "matchId", foreign: "id", many: false },
    user: { model: "user", local: "userId", foreign: "id", many: false },
  },
  announcement: {},
  notification: {},
  invite: {},
};

function getValue(obj: Dict, path: string): unknown {
  return path.split(".").reduce((acc: any, key) => acc?.[key], obj);
}

function matchCondition(value: unknown, condition: unknown): boolean {
  if (condition == null) return value == null;
  if (typeof condition !== "object" || condition instanceof Date) {
    if (condition instanceof Date && value instanceof Date) {
      return value.getTime() === condition.getTime();
    }
    return value === condition;
  }

  const c = condition as Dict;
  if ("equals" in c) return matchCondition(value, c.equals);
  if ("in" in c) return Array.isArray(c.in) && c.in.includes(value);
  if ("notIn" in c) return Array.isArray(c.notIn) && !c.notIn.includes(value);
  if ("gte" in c) return value != null && (value as any) >= c.gte;
  if ("gt" in c) return value != null && (value as any) > c.gt;
  if ("lte" in c) return value != null && (value as any) <= c.lte;
  if ("lt" in c) return value != null && (value as any) < c.lt;
  if ("contains" in c) {
    return String(value ?? "")
      .toLowerCase()
      .includes(String(c.contains).toLowerCase());
  }
  if ("not" in c) return !matchCondition(value, c.not);

  // Nested relation filter e.g. profile: { status: "ACTIVE" }
  if (typeof value === "object" && value != null) {
    return matchesWhere(value as Dict, c);
  }

  return false;
}

function matchesWhere(row: Dict, where?: Dict): boolean {
  if (!where) return true;

  if (where.AND) {
    const parts = Array.isArray(where.AND) ? where.AND : [where.AND];
    return parts.every((p: Dict) => matchesWhere(row, p));
  }
  if (where.OR) {
    const parts = Array.isArray(where.OR) ? where.OR : [where.OR];
    return parts.some((p: Dict) => matchesWhere(row, p));
  }
  if (where.NOT) {
    const parts = Array.isArray(where.NOT) ? where.NOT : [where.NOT];
    return parts.every((p: Dict) => !matchesWhere(row, p));
  }

  for (const [key, condition] of Object.entries(where)) {
    if (key === "AND" || key === "OR" || key === "NOT") continue;

    const rel = Object.values(RELATIONS).find(() => false);
    void rel;

    // Relation filter on parent model (e.g. user where profile: { status })
    const modelRels = Object.entries(RELATIONS).flatMap(([, r]) =>
      Object.entries(r),
    );
    // Look up relation from current row's model — handled via attach for nested
    if (condition && typeof condition === "object" && !(condition instanceof Date) && !("equals" in (condition as Dict) || "in" in (condition as Dict) || "gte" in (condition as Dict) || "gt" in (condition as Dict) || "lte" in (condition as Dict) || "lt" in (condition as Dict) || "contains" in (condition as Dict) || "not" in (condition as Dict) || "notIn" in (condition as Dict))) {
      // Might be nested field object on same row OR relation — try row field first
      if (key in row && typeof row[key] === "object" && row[key] != null) {
        if (!matchesWhere(row[key], condition as Dict)) return false;
        continue;
      }
    }

    if (!matchCondition(row[key], condition)) return false;
  }
  return true;
}

function matchesWhereWithRelations(
  model: DemoModel,
  row: Dict,
  where?: Dict,
): boolean {
  if (!where) return true;

  if (where.AND) {
    const parts = Array.isArray(where.AND) ? where.AND : [where.AND];
    return parts.every((p: Dict) => matchesWhereWithRelations(model, row, p));
  }
  if (where.OR) {
    const parts = Array.isArray(where.OR) ? where.OR : [where.OR];
    return parts.some((p: Dict) => matchesWhereWithRelations(model, row, p));
  }

  for (const [key, condition] of Object.entries(where)) {
    if (key === "AND" || key === "OR" || key === "NOT") continue;

    const rel = RELATIONS[model]?.[key];
    if (rel && condition && typeof condition === "object") {
      const related = (demoStore[rel.model] as Dict[]).filter(
        (r) => r[rel.foreign] === row[rel.local],
      );
      if (rel.many) {
        // e.g. match: { status: "PENDING" } on matchPlayer — some related match
        const ok = related.some((r) =>
          matchesWhereWithRelations(rel.model, r, condition as Dict),
        );
        if (!ok) return false;
      } else {
        const r = related[0];
        if (!r || !matchesWhereWithRelations(rel.model, r, condition as Dict)) {
          return false;
        }
      }
      continue;
    }

    if (!matchCondition(row[key], condition)) return false;
  }
  return true;
}

function sortRows(rows: Dict[], orderBy?: Dict | Dict[]): Dict[] {
  if (!orderBy) return rows;
  const orders = Array.isArray(orderBy) ? orderBy : [orderBy];
  return [...rows].sort((a, b) => {
    for (const order of orders) {
      const [field, dir] = Object.entries(order)[0] ?? [];
      if (!field) continue;
      let av: any;
      let bv: any;
      if (dir && typeof dir === "object") {
        // orderBy: { period: { dueDate: "desc" } }
        const [nested, nestedDir] = Object.entries(dir)[0] ?? [];
        av = getValue(a, `${field}.${nested}`);
        bv = getValue(b, `${field}.${nested}`);
        const mul = nestedDir === "desc" ? -1 : 1;
        if (av == null && bv == null) continue;
        if (av == null) return 1;
        if (bv == null) return -1;
        if (av < bv) return -1 * mul;
        if (av > bv) return 1 * mul;
      } else {
        av = a[field];
        bv = b[field];
        const mul = dir === "desc" ? -1 : 1;
        if (av == null && bv == null) continue;
        if (av == null) return 1;
        if (bv == null) return -1;
        if (av < bv) return -1 * mul;
        if (av > bv) return 1 * mul;
      }
    }
    return 0;
  });
}

function applyInclude(model: DemoModel, row: Dict, include?: Dict): Dict {
  if (!include) return { ...row };
  const out: Dict = { ...row };

  for (const [key, spec] of Object.entries(include)) {
    if (key === "_count") {
      const select = (spec as Dict)?.select ?? {};
      const counts: Dict = {};
      for (const countKey of Object.keys(select)) {
        const rel = RELATIONS[model]?.[countKey];
        if (!rel) {
          counts[countKey] = 0;
          continue;
        }
        counts[countKey] = (demoStore[rel.model] as Dict[]).filter(
          (r) => r[rel.foreign] === row[rel.local],
        ).length;
      }
      out._count = counts;
      continue;
    }

    const rel = RELATIONS[model]?.[key];
    if (!rel) continue;

    let related = (demoStore[rel.model] as Dict[]).filter(
      (r) => r[rel.foreign] === row[rel.local],
    );

    const nested =
      spec === true
        ? undefined
        : (spec as Dict);

    if (nested?.where) {
      related = related.filter((r) =>
        matchesWhereWithRelations(rel.model, r, nested.where),
      );
    }
    if (nested?.orderBy) {
      related = sortRows(related, nested.orderBy);
    }
    if (typeof nested?.take === "number") {
      related = related.slice(0, nested.take);
    }

    if (rel.many) {
      out[key] = related.map((r) =>
        applyInclude(rel.model, r, nested?.include),
      );
    } else {
      const one = related[0];
      out[key] = one
        ? applyInclude(rel.model, one, nested?.include)
        : null;
    }
  }

  return out;
}

function delegate(model: DemoModel) {
  const table = () => demoStore[model] as Dict[];

  return {
    async findMany(args: Dict = {}) {
      let rows = table().filter((r) =>
        matchesWhereWithRelations(model, r, args.where),
      );
      // Attach includes before relation orderBy like profile.nickname
      rows = rows.map((r) => applyInclude(model, r, args.include));
      rows = sortRows(rows, args.orderBy);
      if (typeof args.skip === "number") rows = rows.slice(args.skip);
      if (typeof args.take === "number") rows = rows.slice(0, args.take);
      return rows;
    },

    async findFirst(args: Dict = {}) {
      const rows = await this.findMany({ ...args, take: 1 });
      return rows[0] ?? null;
    },

    async findUnique(args: Dict = {}) {
      const where = args.where ?? {};
      const row = table().find((r) =>
        Object.entries(where).every(([k, v]) => r[k] === v),
      );
      if (!row) return null;
      return applyInclude(model, row, args.include);
    },

    async count(args: Dict = {}) {
      return table().filter((r) =>
        matchesWhereWithRelations(model, r, args.where),
      ).length;
    },

    async create() {
      throw new Error("Demo mode is read-only");
    },
    async createMany() {
      return { count: 0 };
    },
    async update() {
      throw new Error("Demo mode is read-only");
    },
    async updateMany() {
      return { count: 0 };
    },
    async upsert() {
      throw new Error("Demo mode is read-only");
    },
    async delete() {
      throw new Error("Demo mode is read-only");
    },
    async deleteMany() {
      return { count: 0 };
    },
  };
}

export function createDemoPrisma() {
  return {
    user: delegate("user"),
    memberProfile: delegate("memberProfile"),
    trainingSession: delegate("trainingSession"),
    trainingOccurrence: delegate("trainingOccurrence"),
    sessionAttendance: delegate("sessionAttendance"),
    feePeriod: delegate("feePeriod"),
    feeDue: delegate("feeDue"),
    event: delegate("event"),
    eventRsvp: delegate("eventRsvp"),
    eventPhoto: delegate("eventPhoto"),
    match: delegate("match"),
    matchPlayer: delegate("matchPlayer"),
    announcement: delegate("announcement"),
    notification: delegate("notification"),
    invite: delegate("invite"),
    $connect: async () => {},
    $disconnect: async () => {},
    $transaction: async (fn: any) =>
      typeof fn === "function" ? fn(createDemoPrisma()) : fn,
  } as any;
}
