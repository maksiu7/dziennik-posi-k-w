// Serwer pośredniczący dla Planera posiłków (Cloudflare Workers, darmowy plan).
// Ustaw w Cloudflare: sekrety APP_KEY oraz GEMINI_API_KEY (darmowy) albo ANTHROPIC_API_KEY (płatny).
// Opcjonalnie: GEMINI_MODEL, ANTHROPIC_MODEL, ALLOWED_ORIGIN (np. https://twojanazwa.github.io).
export default {
  async fetch(req, env) {
    const cors = {
      'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN || '*',
      'Access-Control-Allow-Headers': 'content-type,x-app-key',
      'Access-Control-Allow-Methods': 'POST,OPTIONS',
    };
    const J = (o, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { ...cors, 'content-type': 'application/json' } });
    if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
    if (req.method !== 'POST') return J({ ok: true });
    if (env.APP_KEY && req.headers.get('x-app-key') !== env.APP_KEY) return J({ error: 'Nieprawidłowe hasło aplikacji' }, 401);
    let b;
    try { b = await req.json(); } catch { return J({ error: 'Zły format zapytania' }, 400); }
    const prompt = String(b.prompt || '').slice(0, 4000);
    if (!prompt) return J({ error: 'Brak treści' }, 400);
    let mime = '', data = '';
    if (b.image) {
      const m = /^data:(image\/[a-z+.-]+);base64,(.+)$/i.exec(String(b.image));
      if (!m) return J({ error: 'Zły format zdjęcia' }, 400);
      if (m[2].length > 4_000_000) return J({ error: 'Zdjęcie jest za duże' }, 413);
      mime = m[1]; data = m[2];
    }
    try {
      let text = '';
      if (env.GEMINI_API_KEY) {
        const model = env.GEMINI_MODEL || 'gemini-flash-latest';
        const parts = [{ text: prompt }];
        if (data) parts.push({ inline_data: { mime_type: mime, data } });
        const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
          method: 'POST',
          headers: { 'content-type': 'application/json', 'x-goog-api-key': env.GEMINI_API_KEY },
          body: JSON.stringify({ contents: [{ parts }], generationConfig: { temperature: 0.2, responseMimeType: 'application/json' } }),
        });
        const j = await r.json();
        if (!r.ok) return J({ error: (j.error && j.error.message) || 'Błąd Gemini' }, 502);
        text = (((j.candidates || [])[0] || {}).content || {}).parts?.map(p => p.text || '').join('') || '';
      } else if (env.ANTHROPIC_API_KEY) {
        const content = [];
        if (data) content.push({ type: 'image', source: { type: 'base64', media_type: mime, data } });
        content.push({ type: 'text', text: prompt });
        const r = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: { 'content-type': 'application/json', 'x-api-key': env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
          body: JSON.stringify({ model: env.ANTHROPIC_MODEL || 'claude-haiku-5-5', max_tokens: 1200, messages: [{ role: 'user', content }] }),
        });
        const j = await r.json();
        if (!r.ok) return J({ error: (j.error && j.error.message) || 'Błąd Claude' }, 502);
        text = (j.content || []).map(c => c.text || '').join('');
      } else {
        return J({ error: 'Na serwerze brak klucza AI' }, 500);
      }
      return J({ text });
    } catch (e) {
      return J({ error: 'Błąd serwera: ' + String(e).slice(0, 100) }, 500);
    }
  },
};
