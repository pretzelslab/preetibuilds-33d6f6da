export const config = { runtime: "edge" };

// ─── Prompt ───────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are an expert AI analyst that identifies systemic organizational patterns in enterprise sales deal data.

Given a deal record (company, outcome, sector, region, stage, transcript excerpt), you must:
1. Identify the primary blocker category from: pricing | legal | implementation | competitive | champion | product | none
2. Write a 2–3 sentence conclusion that attributes the outcome to ORGANIZATIONAL patterns, process failures, or product gaps — NEVER to individual seller performance
3. Build an evidence chain — every claim must cite a specific phrase from the transcript
4. Distinguish DIRECT statements (buyer said it explicitly) from INFERENCES (you extrapolated it)
5. Flag inference risks when you go beyond what the transcript explicitly states
6. Assign a confidence score based on how well-evidenced the conclusion is

Return ONLY a valid JSON object with NO markdown, no commentary, no code fences. Exact schema:

{
  "primaryBlocker": "pricing|legal|implementation|competitive|champion|product|none",
  "secondaryBlockers": ["..."],
  "conclusion": "...",
  "confidence": 0.85,
  "grounded": true,
  "inferenceRisk": false,
  "evidenceChain": [
    {
      "claim": "...",
      "sourceQuote": "exact phrase from transcript",
      "type": "direct|inferred",
      "claimConfidence": 0.9
    }
  ],
  "inferenceFlags": [
    {
      "signal": "phrase from transcript",
      "inference": "what you extrapolated from it",
      "riskLevel": "low|medium|high"
    }
  ],
  "processingNote": "brief note on confidence level, data quality, or gaps"
}

If the deal was won cleanly with no blockers: set primaryBlocker to "none", secondaryBlockers to [], inferenceRisk to false, and explain what drove the win.`;

function buildUserPrompt(deal: Record<string, unknown>): string {
  return `Analyze this deal:

Company: ${deal.company}
Outcome: ${deal.outcome}
Sector: ${deal.sector}
Region: ${deal.region}
Deal Size: $${deal.dealSizeK}K
Deal Cycle: ${deal.dealCycleDays} days
Stage at outcome: ${deal.stage}
Declared blockers (from CRM tags): ${JSON.stringify(deal.blockers)}

Transcript excerpt:
"${deal.transcriptExcerpt}"

Return only the JSON analysis.`;
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export default async function handler(req: Request): Promise<Response> {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "ANTHROPIC_API_KEY not configured" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }

  let deal: Record<string, unknown>;
  try {
    const body = await req.json() as { deal: Record<string, unknown> };
    deal = body.deal;
    if (!deal) throw new Error("Missing deal field");
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid request body" }),
      { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }

  const startMs = Date.now();

  const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1200,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: buildUserPrompt(deal) }],
    }),
  });

  const elapsed = Date.now() - startMs;

  if (!anthropicRes.ok) {
    const err = await anthropicRes.text();
    return new Response(
      JSON.stringify({ error: "Upstream AI error", detail: err }),
      { status: 502, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }

  const data = await anthropicRes.json() as {
    content: { text: string }[];
    usage: { input_tokens: number; output_tokens: number };
  };

  const rawText = data.content?.[0]?.text ?? "{}";

  let result: Record<string, unknown>;
  try {
    result = JSON.parse(rawText) as Record<string, unknown>;
  } catch {
    return new Response(
      JSON.stringify({ error: "AI returned non-JSON output", raw: rawText }),
      { status: 502, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }

  return new Response(
    JSON.stringify({
      ...result,
      meta: {
        model: "claude-sonnet-4-6",
        promptVersion: "v1.0",
        inputTokens: data.usage?.input_tokens ?? null,
        outputTokens: data.usage?.output_tokens ?? null,
        processingMs: elapsed,
        timestamp: new Date().toISOString(),
        dealId: deal.id,
      },
    }),
    {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    }
  );
}
