import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const today = new Date().toISOString().split("T")[0];
  const { members, menu } = req.body; // fresh default members passed from frontend

  const { error } = await supabase
    .from("sessions")
    .upsert(
      { date: today, members, menu, updated_at: new Date().toISOString() },
      { onConflict: "date" }
    );

  if (error) return res.status(500).json({ error: error.message });

  return res.status(200).json({ ok: true, message: "New day started!" });
}
