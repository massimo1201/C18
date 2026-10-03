# AI translation (Claude)

The "Don't see your language?" box on the site sends the language the
visitor typed and the page's text to this small Cloudflare Worker, which asks
Claude to recognise the language (typos included) and translate the page.

## Set it up (once)

1. Create an API key at https://console.anthropic.com (Claude API, billed
   per use; separate from a Claude.ai / Claude Code subscription).
2. In this folder:

   ```bash
   npm install
   npx wrangler login
   npx wrangler secret put ANTHROPIC_API_KEY
   npx wrangler deploy
   ```

3. Copy the Worker URL it prints (e.g. `https://codutti-ai-translate.<you>.workers.dev`)
   into `assets/js/ai-config.js`:

   ```js
   window.CODUTTI_AI_ENDPOINT = "https://codutti-ai-translate.<you>.workers.dev/translate";
   ```

4. Add the site's real domain to `ALLOWED_ORIGINS` in `wrangler.toml` and
   deploy again. Optional: enable the KV cache in `wrangler.toml` so each page
   is translated only once per language.

Model: `claude-opus-5-5` at low effort, with server-side refusal fallback
enabled (`fallbacks: "default"`). Visitors' browsers also cache translations
per page and language.
