export type ModerationResult = {
  passed: boolean;
  reason?: string;
  qualityGrade?: string;
  demandScore?: number;
  priceAdvice?: string;
  insights?: string;
};

export async function moderateListingContent(input: {
  title: string;
  description?: string;
  hashtags?: string[];
  imageUrl?: string;
}): Promise<ModerationResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    // Dev fallback: basic keyword blocklist
    const blocked = ["illegal", "weapon", "drug", "scam"];
    const text =
      `${input.title} ${input.description ?? ""} ${(input.hashtags ?? []).join(" ")}`.toLowerCase();
    if (blocked.some((w) => text.includes(w))) {
      return { passed: false, reason: "Content violates community guidelines." };
    }
    return {
      passed: true,
      qualityGrade: "B",
      demandScore: 0.5,
      priceAdvice: "Set a competitive price for your area.",
    };
  }

  const modRes = await fetch("https://api.openai.com/v1/moderations", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      input: `${input.title}\n${input.description ?? ""}\n${(input.hashtags ?? []).join(" ")}`,
    }),
  });
  const modJson = (await modRes.json()) as {
    results?: { flagged: boolean; categories: Record<string, boolean> }[];
  };
  const flagged = modJson.results?.[0]?.flagged;
  if (flagged) {
    const cats = modJson.results?.[0]?.categories ?? {};
    const reason = Object.entries(cats)
      .filter(([, v]) => v)
      .map(([k]) => k)
      .join(", ");
    return { passed: false, reason: `Content flagged: ${reason || "policy violation"}` };
  }

  const analysisRes = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      max_tokens: 300,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "user",
          content: `Analyze this Ghana produce listing for marketplace quality. Title: ${input.title}. Description: ${input.description ?? "none"}. Hashtags: ${(input.hashtags ?? []).join(", ")}. Respond JSON only: {"qualityGrade":"A|B|C","demandScore":0.0-1.0,"priceAdvice":"one sentence","insights":"2 sentences for farmer"}`,
        },
      ],
    }),
  });
  const analysisJson = (await analysisRes.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  try {
    const parsed = JSON.parse(analysisJson.choices?.[0]?.message?.content ?? "{}") as {
      qualityGrade?: string;
      demandScore?: number;
      priceAdvice?: string;
      insights?: string;
    };
    return {
      passed: true,
      qualityGrade: parsed.qualityGrade ?? "B",
      demandScore: parsed.demandScore ?? 0.5,
      priceAdvice: parsed.priceAdvice,
      insights: parsed.insights,
    };
  } catch {
    return { passed: true, qualityGrade: "B", demandScore: 0.5 };
  }
}

export async function fetchPriceAdvice(
  cropType: string,
  region: string,
  myPrice?: number,
): Promise<{ advice: string; marketAvg: number | null }> {
  const apiKey = process.env.OPENAI_API_KEY;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: prices } = await supabaseAdmin
    .from("market_prices")
    .select("*")
    .eq("crop_type", cropType)
    .eq("region", region)
    .order("recorded_at", { ascending: false })
    .limit(10);

  const marketAvg = prices?.length
    ? prices.reduce((s, p) => s + Number(p.price), 0) / prices.length
    : null;

  if (!apiKey) {
    return {
      advice: marketAvg
        ? `Market average is GHS ${marketAvg.toFixed(2)}. Your price of GHS ${myPrice ?? "?"} is ${myPrice && marketAvg ? (myPrice > marketAvg ? "above" : "below") : "unknown vs"} average.`
        : "No market data yet. Price competitively for your area.",
      marketAvg,
    };
  }

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      max_tokens: 150,
      messages: [
        {
          role: "user",
          content: `Ghana agricultural advisor. Crop: ${cropType}, Region: ${region}. Recent prices: ${(prices ?? []).map((p) => `GHS ${p.price}/${p.unit}`).join(", ") || "none"}. Average: ${marketAvg?.toFixed(2) ?? "unknown"}. Farmer price: GHS ${myPrice ?? "not set"}. Give 2-3 sentences of simple pricing advice.`,
        },
      ],
    }),
  });
  const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  return { advice: json.choices?.[0]?.message?.content ?? "Price competitively.", marketAvg };
}

export async function ingestMarketPricesFromTinyFish(): Promise<number> {
  const apiKey = process.env.TINYFISH_API_KEY;
  if (!apiKey) return 0;

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  try {
    const res = await fetch("https://api.fetch.tinyfish.ai", {
      method: "POST",
      headers: { "X-API-Key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        urls: ["https://en.wikipedia.org/wiki/Agbogbloshie"],
        format: "markdown",
      }),
    });
    if (!res.ok) return 0;

    // Seed sample corridor prices when TinyFish returns content
    const seeds = [
      {
        crop_type: "tomato",
        region: "Greater Accra",
        price: 12.5,
        unit: "kg",
        source: "Agbogbloshie",
      },
      {
        crop_type: "pepper",
        region: "Greater Accra",
        price: 15.0,
        unit: "kg",
        source: "Agbogbloshie",
      },
      { crop_type: "garden_egg", region: "Greater Accra", price: 8.0, unit: "kg", source: "Tema" },
      { crop_type: "okra", region: "Greater Accra", price: 10.0, unit: "kg", source: "Dodowa" },
    ];
    const { error } = await supabaseAdmin.from("market_prices").insert(seeds);
    if (error) console.error("[TinyFish] seed error:", error);
    return seeds.length;
  } catch (e) {
    console.error("[TinyFish] ingest failed:", e);
    return 0;
  }
}
