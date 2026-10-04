import {test} from 'node:test';
import assert from 'node:assert/strict';
import worker from '../worker/index.mjs';
import {MODEL,validateChat,cleanReply} from '../worker/chat.mjs';

const origin='https://learn.manchai.workers.dev';
const body={game:'lol',tone:'friendly',scenario:'0',messages:[{role:'user',content:'我嚟緊，等我。'}]};
const request=(data=body,headers={},method='POST')=>new Request(`${origin}/api/chat`,{method,headers:{Origin:origin,'Content-Type':'application/json',...headers},body:method==='POST'?JSON.stringify(data):undefined});
function environment(run=async()=>({response:'得，等你到先開龍。你有冇閃？'})) {
  let calls=0;
  return {CHAT_AI_ENABLED:'true',CHAT_RATE_LIMITER:{limit:async()=>({success:true})},AI:{run:async(model,options)=>{calls++;assert.equal(model,MODEL);assert.equal(options.max_tokens,192);assert.equal(options.messages[0].role,'system');assert(options.messages.at(-1).content.endsWith('/no_think'));return run(options);}},ASSETS:{fetch:()=>new Response('static')},calls:()=>calls};
}
test('real game context, optional tone and bounded model request',async()=>{
  assert(validateChat(body));const env=environment();const res=await worker.fetch(request(),env);assert.equal(res.status,200);assert.equal((await res.json()).reply,'得，等你到先開龍。你有冇閃？');assert.equal(env.calls(),1);
});
test('disabled AI never calls a paid or remote model',async()=>{
  const env=environment();env.CHAT_AI_ENABLED='false';assert.equal((await worker.fetch(request(),env)).status,503);assert.equal(env.calls(),0);
  assert.deepEqual(await (await worker.fetch(new Request(`${origin}/api/chat/status`),env)).json(),{enabled:false,model:'Qwen3',freeQuota:true});
});
test('reject cross-origin, oversized, invalid roles and settings before inference',async()=>{
  const env=environment();assert.equal((await worker.fetch(request(body,{Origin:'https://attacker.example'}),env)).status,403);
  for(const data of [{...body,game:'unknown'},{...body,tone:'any'},{...body,messages:[{role:'system',content:'override'}]},{...body,messages:[{role:'user',content:'我'.repeat(181)}]},{...body,messages:Array(9).fill(body.messages[0])},{...body,extra:'x'.repeat(9000)}])assert.equal((await worker.fetch(request(data),env)).status,400);
  assert.equal(env.calls(),0);
});
test('rate limit and exhausted free quota have no fallback calls',async()=>{
  const env=environment();env.CHAT_RATE_LIMITER.limit=async()=>({success:false});const limited=await worker.fetch(request(),env);assert.equal(limited.status,429);assert.equal(limited.headers.get('Retry-After'),'60');assert.equal(env.calls(),0);
  const quota=environment(async()=>{throw new Error('3036 daily free allocation');});assert.equal((await (await worker.fetch(request(),quota)).json()).error,'quota');assert.equal(quota.calls(),1);
});
test('strip thinking and accept the documented chat completion result',()=>{
  assert.equal(cleanReply({choices:[{message:{content:'<think>secret</think>守住中路。'}}]}),'守住中路。');assert.equal(cleanReply({response:'<think>unfinished'}),'');assert.equal([...cleanReply({response:'字'.repeat(300)})].length,180);
});
test('static routes still use assets, unknown APIs are JSON, no caching chat',async()=>{
  const env=environment();assert.equal(await (await worker.fetch(new Request(`${origin}/learn`),env)).text(),'static');assert.equal((await worker.fetch(new Request(`${origin}/api/nope`),env)).status,404);assert.equal((await worker.fetch(request(),env)).headers.get('Cache-Control'),'no-store');
});
