/**
 * Generate src/integrations/supabase/types.ts from local SQL migrations.
 * Usage: node scripts/gen-supabase-types-from-migrations.mjs
 *
 * Prefer `npx supabase gen types typescript --project-id <ref>` when you have
 * org access; this is the offline fallback.
 */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const migrationsDir = resolve("supabase/migrations");
const files = readdirSync(migrationsDir)
  .filter((f) => f.endsWith(".sql"))
  .sort();

/** @type {Map<string, Map<string, { type: string, nullable: boolean, hasDefault?: boolean }>>} */
const tables = new Map();
/** @type {Map<string, string[]>} */
const enums = new Map();
/**
 * @typedef {{ foreignKeyName: string, columns: string[], isOneToOne: boolean, referencedRelation: string, referencedColumns: string[] }} Rel
 * @type {Map<string, Rel[]>}
 */
const relationships = new Map();

function ensureRels(table) {
  if (!relationships.has(table)) relationships.set(table, []);
  return relationships.get(table);
}

/** @param {string} table @param {Omit<Rel, 'foreignKeyName'> & { foreignKeyName?: string }} rel */
function addRelationship(table, rel) {
  const foreignKeyName = rel.foreignKeyName || `${table}_${rel.columns[0]}_fkey`;
  const list = ensureRels(table);
  if (list.some((r) => r.foreignKeyName === foreignKeyName)) return;
  list.push({
    foreignKeyName,
    columns: rel.columns,
    isOneToOne: !!rel.isOneToOne,
    referencedRelation: rel.referencedRelation,
    referencedColumns: rel.referencedColumns,
  });
}

/** Map REFERENCES target to public table name used in Database types. */
function referencedRelationName(schema, table) {
  if (!schema || schema === "public") return table;
  // auth.users etc. — keep bare table name (matches supabase CLI output shape)
  return table;
}

function pgToTs(pgType, nullable) {
  const t = pgType.toLowerCase().replace(/"/g, "").trim();
  let base = "unknown";
  if (t === "uuid" || t === "text" || t.startsWith("character") || t === "varchar" || t === "citext" || t === "name") {
    base = "string";
  } else if (t === "bool" || t === "boolean") {
    base = "boolean";
  } else if (
    t === "int2" || t === "int4" || t === "int8" || t === "integer" || t === "bigint" ||
    t === "smallint" || t === "numeric" || t === "decimal" || t === "real" || t === "double precision" ||
    t === "float4" || t === "float8" || t.startsWith("numeric")
  ) {
    base = "number";
  } else if (t === "json" || t === "jsonb") {
    base = "Json";
  } else if (t.startsWith("timestamp") || t === "date" || t === "time" || t.startsWith("timestamptz")) {
    base = "string";
  } else if (t.endsWith("[]")) {
    const inner = pgToTs(t.slice(0, -2), false).replace(/ \| null$/, "");
    base = `${inner}[]`;
  } else if (enums.has(t) || enums.has(pgType)) {
    const name = enums.has(t) ? t : pgType;
    base = `Database["public"]["Enums"]["${name}"]`;
  } else {
    // user enums often unquoted
    const bare = t.split(".").pop();
    if (enums.has(bare)) base = `Database["public"]["Enums"]["${bare}"]`;
    else base = "string";
  }
  return nullable ? `${base} | null` : base;
}

function ensureTable(name) {
  if (!tables.has(name)) tables.set(name, new Map());
  return tables.get(name);
}

function addColumn(table, col, type, nullable, hasDefault = false) {
  const cols = ensureTable(table);
  const prev = cols.get(col);
  if (prev) {
    cols.set(col, {
      type: type || prev.type,
      nullable: prev.nullable || nullable,
      hasDefault: prev.hasDefault || hasDefault,
    });
  } else {
    cols.set(col, { type, nullable, hasDefault });
  }
}

for (const file of files) {
  const sql = readFileSync(join(migrationsDir, file), "utf8");

  // CREATE TYPE ... AS ENUM (...)
  for (const m of sql.matchAll(
    /CREATE\s+TYPE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:public\.)?(\w+)\s+AS\s+ENUM\s*\(([^)]+)\)/gi,
  )) {
    const name = m[1];
    const values = m[2]
      .split(",")
      .map((s) => s.trim().replace(/^'|'$/g, ""))
      .filter(Boolean);
    enums.set(name, values);
  }

  // CREATE TABLE
  for (const m of sql.matchAll(
    /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:public\.)?(\w+)\s*\(([\s\S]*?)\);/gi,
  )) {
    const table = m[1];
    const body = m[2];
    for (const line of body.split(",")) {
      const cleaned = line
        .replace(/--.*$/gm, "")
        .replace(/\n/g, " ")
        .trim();
      if (!cleaned) continue;

      // Table-level: CONSTRAINT name FOREIGN KEY (cols) REFERENCES ...
      const tableFk = cleaned.match(
        /^(?:CONSTRAINT\s+(\w+)\s+)?FOREIGN\s+KEY\s*\(([^)]+)\)\s+REFERENCES\s+(?:(\w+)\.)?(\w+)\s*\(([^)]+)\)/i,
      );
      if (tableFk) {
        const cols = tableFk[2].split(",").map((c) => c.trim().replace(/"/g, ""));
        const refCols = tableFk[5].split(",").map((c) => c.trim().replace(/"/g, ""));
        addRelationship(table, {
          foreignKeyName: tableFk[1] || `${table}_${cols[0]}_fkey`,
          columns: cols,
          isOneToOne: /\bUNIQUE\b/i.test(cleaned),
          referencedRelation: referencedRelationName(tableFk[3], tableFk[4]),
          referencedColumns: refCols,
        });
        continue;
      }

      if (/^(CONSTRAINT|PRIMARY|UNIQUE|FOREIGN|CHECK|EXCLUDE)/i.test(cleaned)) continue;
      const colMatch = cleaned.match(/^"?(\w+)"?\s+([\w\[\]\s().]+)(.*)$/i);
      if (!colMatch) continue;
      const col = colMatch[1];
      let type = colMatch[2].trim().replace(/\s+/g, " ");
      // strip constraints from type tail
      type = type.split(/\s+(?:DEFAULT|NOT|NULL|REFERENCES|UNIQUE|CHECK|PRIMARY|COLLATE)\b/i)[0].trim();
      const rest = `${colMatch[3] || ""} ${cleaned}`;
      const nullable = !/\bNOT\s+NULL\b/i.test(cleaned) && !/\bPRIMARY\s+KEY\b/i.test(cleaned);
      const hasDefault = /\bDEFAULT\b/i.test(cleaned);
      if (col === "id" && /PRIMARY\s+KEY/i.test(body) && cleaned.includes(col)) {
        addColumn(table, col, type || "uuid", false, hasDefault || true);
      } else {
        addColumn(table, col, type, nullable, hasDefault);
      }

      const inlineRef = cleaned.match(
        /REFERENCES\s+(?:(\w+)\.)?(\w+)\s*\(([^)]+)\)/i,
      );
      if (inlineRef) {
        const refCols = inlineRef[3].split(",").map((c) => c.trim().replace(/"/g, ""));
        const isOneToOne =
          /\bPRIMARY\s+KEY\b/i.test(cleaned) ||
          (/\bUNIQUE\b/i.test(cleaned) && !/\bUNIQUE\s*\(/i.test(cleaned));
        addRelationship(table, {
          columns: [col],
          isOneToOne,
          referencedRelation: referencedRelationName(inlineRef[1], inlineRef[2]),
          referencedColumns: refCols,
        });
      }
      void rest;
    }
  }

  // ALTER TABLE ... ADD COLUMN (supports multi-column ALTER blocks)
  for (const m of sql.matchAll(
    /ALTER\s+TABLE\s+(?:IF\s+EXISTS\s+)?(?:public\.)?(\w+)\s+([\s\S]*?);/gi,
  )) {
    const table = m[1];
    const body = m[2];
    for (const colMatch of body.matchAll(
      /ADD\s+COLUMN\s+(?:IF\s+NOT\s+EXISTS\s+)?"?(\w+)"?\s+([\w\[\]\s().]+?)(?=\s*(?:DEFAULT|NOT\s+NULL|NULL|REFERENCES|UNIQUE|CHECK|PRIMARY|COLLATE|,|$))/gi,
    )) {
      const col = colMatch[1];
      let type = colMatch[2].trim().replace(/\s+/g, " ");
      type = type.split(/\s+(?:DEFAULT|NOT|NULL|REFERENCES|UNIQUE|CHECK|PRIMARY|COLLATE)\b/i)[0].trim();
      // Slice from this ADD COLUMN to next ADD / CONSTRAINT / end for nullability + refs
      const start = colMatch.index ?? 0;
      const next = body.slice(start + 1).search(/\bADD\s+COLUMN\b|\bADD\s+CONSTRAINT\b/i);
      const clause = next >= 0 ? body.slice(start, start + 1 + next) : body.slice(start);
      const nullable = !/\bNOT\s+NULL\b/i.test(clause);
      const hasDefault = /\bDEFAULT\b/i.test(clause);
      addColumn(table, col, type, nullable, hasDefault);
      const inlineRef = clause.match(/REFERENCES\s+(?:(\w+)\.)?(\w+)\s*\(([^)]+)\)/i);
      if (inlineRef) {
        addRelationship(table, {
          columns: [col],
          isOneToOne: /\bUNIQUE\b/i.test(clause),
          referencedRelation: referencedRelationName(inlineRef[1], inlineRef[2]),
          referencedColumns: inlineRef[3].split(",").map((c) => c.trim().replace(/"/g, "")),
        });
      }
    }
  }

  // ALTER TABLE ... ADD CONSTRAINT ... FOREIGN KEY
  for (const m of sql.matchAll(
    /ALTER\s+TABLE\s+(?:ONLY\s+)?(?:IF\s+EXISTS\s+)?(?:public\.)?(\w+)\s+ADD\s+CONSTRAINT\s+(\w+)\s+FOREIGN\s+KEY\s*\(([^)]+)\)\s+REFERENCES\s+(?:(\w+)\.)?(\w+)\s*\(([^)]+)\)/gi,
  )) {
    addRelationship(m[1], {
      foreignKeyName: m[2],
      columns: m[3].split(",").map((c) => c.trim().replace(/"/g, "")),
      isOneToOne: false,
      referencedRelation: referencedRelationName(m[4], m[5]),
      referencedColumns: m[6].split(",").map((c) => c.trim().replace(/"/g, "")),
    });
  }
}

// Always useful system-ish tables if referenced but missing
const sortedTables = [...tables.keys()].sort();
const sortedEnums = [...enums.keys()].sort();

function emitRelationships(name) {
  const rels = relationships.get(name) ?? [];
  if (!rels.length) return "        Relationships: []";
  const body = rels
    .map(
      (r) => `          {
            foreignKeyName: "${r.foreignKeyName}"
            columns: [${r.columns.map((c) => `"${c}"`).join(", ")}]
            isOneToOne: ${r.isOneToOne}
            referencedRelation: "${r.referencedRelation}"
            referencedColumns: [${r.referencedColumns.map((c) => `"${c}"`).join(", ")}]
          }`,
    )
    .join(",\n");
  return `        Relationships: [
${body}
        ]`;
}

function emitTable(name) {
  const cols = tables.get(name);
  const rows = [];
  const inserts = [];
  const updates = [];
  for (const [col, meta] of [...cols.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    const t = pgToTs(meta.type, meta.nullable);
    rows.push(`          ${col}: ${t}`);
    const insertOptional =
      meta.nullable || meta.hasDefault || col === "id" || col.endsWith("_at");
    inserts.push(`          ${col}${insertOptional ? "?" : ""}: ${t}`);
    updates.push(`          ${col}?: ${t}`);
  }
  return `      ${name}: {
        Row: {
${rows.join("\n")}
        }
        Insert: {
${inserts.join("\n")}
        }
        Update: {
${updates.join("\n")}
        }
${emitRelationships(name)}
      }`;
}

function emitEnum(name) {
  const values = enums.get(name).map((v) => JSON.stringify(v)).join(" | ");
  return `      ${name}: ${values}`;
}

const out = `export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Generated from supabase/migrations on ${new Date().toISOString().slice(0, 10)}
  // Offline fallback — prefer \`npm run db:types\` with org access when available.
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
${sortedTables.map(emitTable).join("\n")}
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
${sortedEnums.length ? sortedEnums.map(emitEnum).join("\n") : "      [_ in never]: never"}
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
${sortedEnums
  .map((name) => `      ${name}: [${enums.get(name).map((v) => JSON.stringify(v)).join(", ")}] as const`)
  .join(",\n")}
    },
  },
} as const
`;

const dest = resolve("src/integrations/supabase/types.ts");
writeFileSync(dest, out);
const relCount = [...relationships.values()].reduce((n, r) => n + r.length, 0);
console.log(
  `Wrote ${dest}\n  tables (${sortedTables.length}): ${sortedTables.join(", ")}\n  enums (${sortedEnums.length}): ${sortedEnums.join(", ") || "(none)"}\n  relationships: ${relCount}`,
);
