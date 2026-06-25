import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Allow CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const today = new Date().toISOString().split("T")[0]; // "2025-01-15"

  // ── GET: load today's session ──────────────────────────────────────────────
  if (req.method === "GET") {
    const { data, error } = await supabase
      .from("sessions")
      .select("*")
      .eq("date", today)
      .single();

    if (error && error.code !== "PGRST116") {
      return res.status(500).json({ error: error.message });
    }

    if (!data) {
      // No session yet today — return empty
      return res.status(200).json({ members: [], menu: [], date: today });
    }

    return res.status(200).json(data);
  }

  // ── POST: save full session ────────────────────────────────────────────────
  if (req.method === "POST") {
    const { members, menu } = req.body;

    const { error } = await supabase
      .from("sessions")
      .upsert({ date: today, members, menu, updated_at: new Date().toISOString() }, { onConflict: "date" });

    if (error) return res.status(500).json({ error: error.message });

    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
