const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const read=p=>fs.readFileSync(p,'utf8');
class Element {
  constructor(tag='div'){this.tagName=tag;this.children=[];this.listeners={};this.attributes={};this.dataset={};this.style={setProperty(){}};this.className='';this.classList={toggle(){}};this.textContent='';this.value='';this.hidden=false;this.disabled=false;this.scrollTop=0;this.scrollHeight=0;}
  addEventListener(k,f){this.listeners[k]=f;}
  setAttribute(k,v){this.attributes[k]=String(v);}
  append(...n){this.children.push(...n);}
  replaceChildren(...n){this.children=n;}
  querySelectorAll(){return [];}
  focus(){}
  click(){this.listeners.click?.();}
}
const saved=new Map();
let now=1000;
function open(blocked=false){
  const ids=new Map([...read('chat.html').matchAll(/id="([^"]+)"/g)].map(m=>[m[1],new Element()]));
  const $=id=>ids.get(id),window={addEventListener(){}};
  $('chat-form').requestSubmit=()=>$('chat-form').listeners.submit({preventDefault(){}});
  const document={getElementById:$,createElement:t=>new Element(t),createElementNS:(_,t)=>new Element(t),createTextNode:t=>({textContent:t})};
  let calls=[],timers=[];
  const context=vm.createContext({window,document,localStorage:{getItem:k=>saved.get(k)||null,setItem:(k,v)=>{if(blocked)throw Error('blocked');saved.set(k,v);}},performance:{now:()=>now},setTimeout:fn=>{timers.push(fn);return timers.length;},clearTimeout(){},AbortController,fetch:async(url,opts)=>{calls.push([url,opts]);return {ok:true,json:async()=>url.endsWith('status')?{enabled:false}:{reply:'等你，一齊開龍。'}};}});
  for(const p of ['data/chat-data.js','data/code-data.js','shared.js','chat.js'])vm.runInContext(read(p),context,{filename:p});
  return {$,window,calls,flush:()=>timers.splice(0).forEach(fn=>fn()),settle:async()=>{await new Promise(setImmediate);}};
}
(async()=>{
  let app=open();await app.settle();const {$}=app;assert.equal($('game-list').children.length,8);assert.equal($('tone-list').children.length,3);assert.equal($('scenario-list').children.length,3);
  assert.equal($('chat-notice').hidden,false);assert.equal($('local-note').hidden,true);$('local-chat').click();assert.equal($('local-note').hidden,false);
  const input=$('chat-input');input.value='我嚟緊';input.listeners.compositionstart();input.listeners.keydown({key:'Enter',isComposing:true,keyCode:229});assert.equal($('chat-log').children.length,2);
  input.listeners.compositionend({data:'我嚟緊'});input.listeners.input({data:'我嚟緊',isComposing:false,inputType:'insertFromComposition'});assert.equal($('typed-total').textContent,3,'IME input counted once');
  input.listeners.keydown({key:'Enter',isComposing:false,keyCode:13});assert.equal($('chat-log').children.length,2,'composition confirmation must not send');now+=200;
  input.listeners.keydown({key:'Enter',isComposing:false,keyCode:13,preventDefault(){}});assert.equal($('chat-log').children.length,4);assert.equal($('round-total').textContent,1);assert.equal(app.calls.length,1,'local fallback makes no AI request');
  input.value='你好';input.listeners.input({data:'你好',inputType:'insertFromPaste'});assert.equal($('typed-total').textContent,3,'paste is not typing progress');
  app.flush();
  app=open();await app.settle();assert.equal(app.$('chat-input').value,'你好');assert.equal(app.$('round-total').textContent,1);assert.equal(app.$('chat-log').children.length,4,'conversation survives reload');
  app.$('local-chat').click();app.$('chat-input').value='字'.repeat(181);app.$('chat-form').requestSubmit();assert(app.$('chat-error').textContent.includes('180'));assert.equal(app.$('chat-log').children.length,4);
  saved.set('manchai-game-chat-v1','{broken');app=open(true);await app.settle();assert(app.$('chat-storage').textContent.includes('未能儲存'));assert.equal(app.$('game-list').children.length,8);
  assert(!/<select\b/.test(read('chat.html')));assert(!read('chat.js').includes('innerHTML'));
  console.log('Chat IME, explicit local mode, paste scoring, storage recovery and validation passed.');
})().catch(e=>{console.error(e);process.exitCode=1;});
