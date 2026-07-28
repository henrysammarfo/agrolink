/**
 * Generate src/integrations/supabase/types.ts from live PostgREST OpenAPI.
 * Usage: node scripts/gen-supabase-types.mjs [.env.file]
 * Reads SUPABASE_URL + service/publishable keys from the env file.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const envFile = resolve(process.argv[2] ?? ".env.vercel.tmp");

function loadEnv(path) {
  const out = {};
  let raw = readFileSync(path, "utf8");
  if (raw.charCodeAt(0) === 0xfeff) raw = raw.slice(1);
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const cleaned = trimmed.startsWith("export ") ? trimmed.slice(7).trim() : trimmed;
    const i = cleaned.indexOf("=");
    if (i < 0) continue;
    const k = cleaned.slice(0, i).trim();
    let v = cleaned.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    if (!v || v.startsWith("@")) continue;
    out[k] = v;
  }
  return out;
}

function tsType(schema, schemas) {
  if (!schema) return "unknown";
  if (schema.$ref) {
    const name = schema.$ref.split("/").pop();
    return name ? `Database["public"]["Tables"][never]` : "unknown";
  }
  if (schema.anyOf || schema.oneOf) {
    const parts = (schema.anyOf ?? schema.oneOf).map((s) => tsType(s, schemas));
    const uniq = [...new Set(parts)];
    return uniq.join(" | ") || "unknown";
  }
  if (schema.type === "array") {
    return `Array<${tsType(schema.items, schemas)}>`;
  }
  if (Array.isArray(schema.type)) {
    const nonNull = schema.type.filter((t) => t !== "null");
    const base = nonNull.length === 1 ? mapPrimitive(nonNull[0], schema) : nonNull.map((t) => mapPrimitive(t, schema)).join(" | ");
    return schema.type.includes("null") ? `${base} | null` : base;
  }
  if (schema.type === "object" && schema.properties) {
    return "Json";
  }
  if (schema.enum) {
    return schema.enum.map((v) => JSON.stringify(v)).join(" | ");
  }
  return mapPrimitive(schema.type, schema);
}

function mapPrimitive(type, schema) {
  switch (type) {
    case "string":
      return "string";
    case "integer":
    case "number":
      return "number";
    case "boolean":
      return "boolean";
    case "object":
      return "Json";
    default:
      if (schema?.format === "json") return "Json";
      return "unknown";
  }
}

function tableFromSchema(name, schema, schemas) {
  const props = schema.properties ?? {};
  const required = new Set(schema.required ?? []);
  const rows = [];
  const inserts = [];
  const updates = [];

  for (const [col, colSchema] of Object.entries(props)) {
    const nullable = !required.has(col) || colSchema.nullable === true ||
      (Array.isArray(colSchema.type) && colSchema.type.includes("null"));
    let t = tsType(colSchema, schemas);
    if (nullable && !t.includes("null")) t = `${t} | null`;
    // Row: required fields without optional marker if in required and not null-only
    if (required.has(col) && !nullable) {
      rows.push(`          ${col}: ${t}`);
    } else {
      rows.push(`          ${col}: ${t}`);
    }
    inserts.push(`          ${col}?: ${t}`);
    updates.push(`          ${col}?: ${t}`);
  }

  return `      ${JSON.stringify(name)}: {
        Row: {
${rows.join("\n")}
        }
        Insert: {
${inserts.join("\n")}
        }
        Update: {
${updates.join("\n")}
        }
        Relationships: []
      }`;
}

const env = loadEnv(envFile);
const url = (env.SUPABASE_URL || env.VITE_SUPABASE_URL || "").replace(/\/$/, "");
const key =
  env.SUPABASE_SERVICE_ROLE_KEY ||
  env.SUPABASE_PUBLISHABLE_KEY ||
  env.VITE_SUPABASE_PUBLISHABLE_KEY;

const supabaseKeys = Object.keys(env).filter((k) => /SUPABASE/i.test(k));
console.log(
  `Loaded ${Object.keys(env).length} env vars; supabase keys: ${supabaseKeys.join(", ") || "(none)"}; url=${Boolean(url)} key=${Boolean(key)}`,
);

if (!url || !key) {
  console.error("Missing SUPABASE_URL / key in", envFile);
  process.exit(1);
}

const res = await fetch(`${url}/rest/v1/`, {
  headers: {
    apikey: key,
    Authorization: `Bearer ${key}`,
    Accept: "application/openapi+json",
  },
});

if (!res.ok) {
  console.error("OpenAPI fetch failed:", res.status, await res.text());
  process.exit(1);
}

const openapi = await res.json();
const schemas =
  openapi.components?.schemas ??
  openapi.definitions ??
  {};

// Prefer table schemas: exclude request bodies like listings_insert if both exist;
// PostgREST often exposes `tablename` for row and sometimes `tablename_insert`.
const tableNames = Object.keys(schemas)
  .filter((n) => !n.includes(" ") && !/[A-Z]/.test(n[0] ?? ""))
  .filter((n) => !n.endsWith("_insert") && !n.endsWith("_update"))
  .filter((n) => schemas[n]?.type === "object" || schemas[n]?.properties)
  .sort();

if (!tableNames.length) {
  console.error("No table schemas found in OpenAPI. Keys:", Object.keys(schemas).slice(0, 20));
  process.exit(1);
}

const tables = tableNames.map((n) => tableFromSchema(n, schemas[n], schemas)).join("\n");

const out = `export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Generated from live PostgREST OpenAPI — ${new Date().toISOString().slice(0, 10)}
  // Source: ${url.replace(/https:\/\//, "").split(".")[0]} (ref only)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
${tables}
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
`;

const dest = resolve("src/integrations/supabase/types.ts");
writeFileSync(dest, out);
console.log(`Wrote ${dest} with ${tableNames.length} tables: ${tableNames.join(", ")}`);
