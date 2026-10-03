/* Codutti AI translation endpoint (Cloudflare Worker).
 *
 * POST /translate  { "language": "Portughes", "texts": ["…", "…"] }
 *  → { "language": { "code": "pt", "name": "Portuguese", "native": "Português" },
 *      "translations": ["…", "…"] }
 *
 * The visitor may type the language any way they like (typos, native or
 * Italian names): Claude identifies it and translates the page strings in
 * the same call. The Anthropic API key stays here as a Worker secret and is
 * never sent to the browser.
 */
import Anthropic from "@anthropic-ai/sdk";

const MAX_TEXTS = 200;
const MAX_CHARS = 60000;

const SYSTEM = `You translate the website of Codutti, an Italian manufacturer of office furniture (founded 1954, Friuli, Italy).
You receive a target language written by a visitor, possibly misspelled or in another language (e.g. "Portughes", "tedesco", "japanise"), and a JSON array of UI strings.
1. Identify the language the visitor means. If it cannot be identified, set language.code to "unknown" and return an empty translations array.
2. Translate every string into that language, keeping the same order and the same number of items.
Rules: keep brand, collection and product names unchanged (Codutti, One, iSixty, Genesis, Alfaomega, Mithos, Attiva, Team, 2BE, Ginza, Cloud, Ciao, seat names), finish codes (e.g. MB29, TS002) and units. Keep punctuation and capitalisation style (an ALL-CAPS label stays all caps when the script allows it). Use the formal register used by premium furniture brands. Never add explanations.`;

const SCHEMA = {
  type: "object",
  properties: {
    language: {
      type: "object",
      properties: {
        code: { type: "string", description: "BCP 47 code, or 'unknown'" },
        name: { type: "string", description: "English name of the language" },
        native: { type: "string", description: "Name of the language in that language" },
        rtl: { type: "boolean" },
      },
      required: ["code", "name", "native", "rtl"],
      additionalProperties: false,
    },
    translations: { type: "array", items: { type: "string" } },
  },
  required: ["language", "translations"],
  additionalProperties: false,
};

function cors(origin, env) {
  const allowed = (env.ALLOWED_ORIGINS || "").split(",").map((s) => s.trim());
  const ok = allowed.includes(origin);
  return {
    "Access-Control-Allow-Origin": ok ? origin : allowed[0] || "",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin",
  };
}

const json = (body, status, headers) =>
  new Response(JSON.stringify(body), { status, headers: { ...headers, "Content-Type": "application/json" } });

async function sha(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const headers = cors(origin, env);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });
    if (request.method !== "POST" || new URL(request.url).pathname !== "/translate") {
      return json({ error: "not_found" }, 404, headers);
    }
    if (!headers["Access-Control-Allow-Origin"] || headers["Access-Control-Allow-Origin"] !== origin) {
      return json({ error: "origin_not_allowed" }, 403, headers);
    }

    let body;
    try { body = await request.json(); } catch { return json({ error: "bad_json" }, 400, headers); }
    const language = String(body.language || "").slice(0, 60).trim();
    const texts = Array.isArray(body.texts) ? body.texts.map((t) => String(t)) : [];
    if (!language || !texts.length || texts.length > MAX_TEXTS || texts.join("").length > MAX_CHARS) {
      return json({ error: "bad_request" }, 400, headers);
    }

    const key = env.TRANSLATIONS ? await sha(language.toLowerCase() + "\u0000" + JSON.stringify(texts)) : null;
    if (key) {
      const hit = await env.TRANSLATIONS.get(key, "json");
      if (hit) return json(hit, 200, headers);
    }

    const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
    let response;
    try {
      response = await client.beta.messages.create({
        model: "claude-opus-5-5",
        max_tokens: 16000,
        betas: ["server-side-fallback-2026-07-01"],
        fallbacks: "default",
        output_config: { effort: "low", format: { type: "json_schema", schema: SCHEMA } },
        system: [{ type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } }],
        messages: [{
          role: "user",
          content: `Target language as typed by the visitor: ${JSON.stringify(language)}\nStrings:\n${JSON.stringify(texts)}`,
        }],
      });
    } catch (err) {
      const status = err instanceof Anthropic.RateLimitError ? 429 : 502;
      return json({ error: "upstream", detail: err.message }, status, headers);
    }

    if (response.stop_reason === "refusal" || response.stop_reason === "max_tokens") {
      return json({ error: response.stop_reason }, 502, headers);
    }
    const text = response.content.filter((b) => b.type === "text").map((b) => b.text).join("");
    let out;
    try { out = JSON.parse(text); } catch { return json({ error: "bad_model_output" }, 502, headers); }
    if (out.language.code !== "unknown" && out.translations.length !== texts.length) {
      return json({ error: "length_mismatch" }, 502, headers);
    }
    if (key && out.language.code !== "unknown") {
      await env.TRANSLATIONS.put(key, JSON.stringify(out), { expirationTtl: 60 * 60 * 24 * 30 });
    }
    return json(out, 200, headers);
  },
};
