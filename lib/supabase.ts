// lib/supabase.ts
//
// Replace Upstash Redis-based cache with a simple Supabase-backed JSON cache.
// This is used by enrichWithPrices to store:
//   - "sheet:hash"             → current token list hash
//   - "sheet:enrichedTokens"   → EnrichedToken[]
//
// Make sure you have a table like:
//
//   create table cache_kv (
//     key text primary key,
//     value jsonb,
//     ttl_seconds integer,
//     created_at timestamptz default now()
//   );
//
// And adjust TABLE_NAME below if you use a different name.

import { createClient, SupabaseClient } from "@supabase/supabase-js";

const TABLE_NAME = "cache_kv";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// Prefer service role on the server, fall back to anon if needed.
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

let supabase: SupabaseClient | null = null;

if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
  });
} else {
  console.warn("[cache] Missing Supabase URL or key – cache will be disabled");
}

type CacheRow = {
  key: string;
  value: unknown;
  ttl_seconds: number | null;
  created_at: string;
};

/**
 * Read a value from cache by key.
 * Returns null if not found, expired, or if Supabase is not configured.
 */
export async function getFromCache<T = any>(key: string): Promise<T | null> {
  if (!supabase) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select<"value,created_at,ttl_seconds", CacheRow>("value,created_at,ttl_seconds")
      .eq("key", key)
      .maybeSingle();

    if (error) {
      console.warn("[cache] get error", error.message);
      return null;
    }
    if (!data) {
      return null;
    }

    const { value, created_at, ttl_seconds } = data;

    // TTL check (if ttl_seconds is set)
    if (ttl_seconds && created_at) {
      const created = new Date(created_at).getTime();
      const ageSec = (Date.now() - created) / 1000;
      if (ageSec > ttl_seconds) {
        // expired
        return null;
      }
    }

    return (value as T) ?? null;
  } catch (e) {
    console.warn("[cache] get exception", (e as Error).message);
    return null;
  }
}

/**
 * Write a value to cache with an optional TTL in seconds.
 * Default TTL is 30 seconds to match previous Upstash behaviour,
 * but callers (like enrichWithPrices) can override (e.g. 86400).
 */
export async function setToCache(
  key: string,
  value: any,
  ttlSeconds: number = 30,
): Promise<void> {
  if (!supabase) {
    return;
  }

  try {
    const row = {
      key,
      value,
      ttl_seconds: ttlSeconds,
      // created_at will default to now() in DB, but we can send it explicitly as well
      created_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from(TABLE_NAME)
      .upsert(row, { onConflict: "key" });

    if (error) {
      console.warn("[cache] set error", error.message);
    }
  } catch (e) {
    console.warn("[cache] set exception", (e as Error).message);
  }
}