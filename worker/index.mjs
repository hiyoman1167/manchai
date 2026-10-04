import {MODEL, validateChat, modelMessages, cleanReply, ready, json} from './chat.mjs';
const MAX_BYTES = 8192;
async function readBody(request) {
  if (!request.body || Number(request.headers.get('content-length')) > MAX_BYTES) throw new Error('body');
  const reader = request.body.getReader();
  const chunks = []; let bytes = 0;
  try {
    while (true) {
      const {done,value} = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > MAX_BYTES) { await reader.cancel(); throw new Error('body'); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const data = new Uint8Array(bytes); let offset = 0;
  for (const chunk of chunks) { data.set(chunk,offset); offset += chunk.byteLength; }
  return JSON.parse(new TextDecoder().decode(data));
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (!url.pathname.startsWith('/api/')) return env.ASSETS.fetch(request);
    if (url.pathname === '/api/chat/status' && request.method === 'GET') {
      return json({enabled:!!ready(env), model:'Qwen3', freeQuota:true});
    }
    if (url.pathname !== '/api/chat') return json({error:'not_found'},404);
    if (request.method !== 'POST') return json({error:'method'},405,{'Allow':'POST'});
    if (request.headers.get('origin') !== url.origin) return json({error:'origin'},403);
    if (!request.headers.get('content-type')?.startsWith('application/json')) return json({error:'invalid'},415);
    if (!ready(env)) return json({error:'disabled'},503);
    let chat;
    try { chat = validateChat(await readBody(request)); } catch (_) { return json({error:'invalid'},400); }
    if (!chat) return json({error:'invalid'},400);
    try {
      // Cloudflare supplies this header. Limit is per IP per Cloudflare location.
      const key = request.headers.get('CF-Connecting-IP') || 'local-preview';
      if (!(await env.CHAT_RATE_LIMITER.limit({key})).success) return json({error:'rate'},429,{'Retry-After':'60'});
      const result = await env.AI.run(MODEL, {
        messages:modelMessages(chat), max_tokens:192, temperature:0.8, top_p:0.8
      });
      const reply = cleanReply(result);
      if (!reply) return json({error:'network'},502);
      return json({reply, model:'Qwen3'});
    } catch (error) {
      const detail = String(error?.message || '');
      // 3036 = free daily allocation exhausted; 5035 = paid plan required.
      const quota = /3036|5035|quota|daily limit|neurons|allocation/i.test(detail);
      console.warn(JSON.stringify({event:'chat_inference_failed', category:quota?'quota':'provider'}));
      return json({error:quota?'quota':'network'},503);
    }
  }
};
