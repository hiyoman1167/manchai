(() => {
  'use strict';
  const {copy,games,tones} = window.MANCHAI_CHAT;
  const t = (key,params={}) => Object.entries(params).reduce((s,[k,v])=>s.replaceAll(`{${k}}`,v),copy[key] || key);
  const $ = id => document.getElementById(id);
  const storage = window.MANCHAI_STORAGE;
  const key = 'manchai-game-chat-v1';
  const han = /\p{Script=Han}/u;
  const size = text => [...text].length;
  const icons = {
    lol:'M5 20 19 6M14 4l6 6M4 16l4 4M7 13l4 4M16 3l5 5',
    apex:'m4 20 8-16 8 16h-4l-4-8-4 8Z',
    valorant:'m4 6 8 12 8-12v7l-8 7-8-7Z',
    cs2:'M4 12h16M12 4v16M7 7l-2 2M17 7l2 2M7 17l-2-2M17 17l2-2',
    overwatch:'M5 7a9 9 0 1 0 14 0M8 4h8M12 9v8M12 12l-6 5M12 12l6 5',
    pubg:'M5 13a7 7 0 0 1 14 0v4H5ZM3 17h18M8 6V4h8v2',
    monsterhunter:'m4 18 2-9 4 3 2-8 2 8 4-3 2 9-8 3Z',
    wow:'m5 5 3 15 4-9 4 9 3-15M3 5h5M16 5h5'
  };
  const icon = id => {
    const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
    svg.setAttribute('viewBox','0 0 24 24'); svg.setAttribute('aria-hidden','true');
    const path=document.createElementNS(svg.namespaceURI,'path');
    for (const [k,v] of Object.entries({d:icons[id],fill:'none',stroke:'currentColor','stroke-width':'1.5','stroke-linecap':'round','stroke-linejoin':'round'})) path.setAttribute(k,v);
    svg.append(path); return svg;
  };
  const node = (tag,text,className) => { const n=document.createElement(tag); if(text !== undefined)n.textContent=text; if(className)n.className=className; return n; };
  let state = {game:games[0].id,tone:'friendly',scenario:games[0].scenarios[0].id,messages:[],draft:'',stats:{chars:0,ms:0,rounds:0}};
  const saved = storage.read(key,null);
  if (saved && games.some(g=>g.id===saved.game) && tones.some(g=>g.id===saved.tone)) {
    const g=games.find(g=>g.id===saved.game);
    if (g.scenarios.some(s=>s.id===saved.scenario)) {
      state.game=saved.game; state.tone=saved.tone; state.scenario=saved.scenario;
      state.messages=Array.isArray(saved.messages)?saved.messages.filter(m=>m && ['user','assistant','system'].includes(m.role) && typeof m.content==='string' && size(m.content)<=180 && ['ai','local','opening','system'].includes(m.source)).slice(-30).map(m=>({...m,time:Number.isFinite(m.time)&&m.time>=0&&m.time<=Date.now()?m.time:Date.now()})):[];
      state.draft=typeof saved.draft==='string'?[...saved.draft].slice(0,180).join(''):'';
      for(const k of Object.keys(state.stats)) state.stats[k]=Number.isFinite(saved.stats?.[k])?Math.max(0,Math.min(saved.stats[k],1e9)):0;
    }
  }
  let mode='checking',pending=null,failed=false,composing=false,compositionEnd=-1000,compositionData='',inputStamp=0,hint=null,hintStage=0,clearArmed=false,resetArmed=false,saveTimer;
  const game=()=>games.find(g=>g.id===state.game);
  const scenario=()=>game().scenarios.find(s=>s.id===state.scenario);
  const save=()=>{storage.write(key,state); $('chat-storage').textContent=t(storage.failed?'storage.failed':'storage.saved');};
  const debounceSave=()=>{clearTimeout(saveTimer);saveTimer=setTimeout(save,350);};
  const stats=()=>{
    $('typed-total').textContent=state.stats.chars;
    $('typing-speed').textContent=state.stats.ms>0?Math.round(state.stats.chars/(state.stats.ms/60000)):'—';
    $('round-total').textContent=state.stats.rounds;
  };
  function connection(next) {
    mode=next; $('connection-status').textContent=t(next==='ai'?'status.ai':next==='checking'?'status.checking':next==='local'?'status.local':'status.offline');
    $('local-note').hidden=next!=='local'; $('local-chat').hidden=next==='local';
    $('send-chat').disabled=!!pending || next==='checking';
  }
  function notice(code) { $('chat-notice').hidden=false; $('chat-error').textContent=t(`${['empty','long'].includes(code)?'chat':'error'}.${code}`); $('retry-chat').hidden=!failed || mode==='local'; }
  function dismiss(){ $('chat-notice').hidden=true; }
  function addMessage(message,persist=true) {
    if (state.messages.length>=30) { state.messages.shift(); $('chat-log').firstElementChild?.remove(); }
    state.messages.push({...message,time:Date.now()}); renderMessage(state.messages.at(-1));
    $('chat-log').scrollTop=$('chat-log').scrollHeight;
    if(persist)save();
  }
  function renderMessage(message) {
    if(message.role==='system'){ $('chat-log').append(node('p',message.content,'chat-system'));return; }
    const user=message.role==='user', article=node('div',undefined,`chat-message${user?' is-user':''}`);
    article.append(node('span',user?t('you'):game().teammate.slice(-1),'message-avatar'));
    const body=node('div'),meta=node('div',undefined,'message-meta');
    meta.append(node('strong',user?t('you'):game().teammate));
    if(!user){ meta.append(node('span',t('ai'),'ai-tag')); if(message.source!=='ai')meta.append(node('span',t(message.source==='opening'?'room.openinglabel':'local.replylabel'),'message-source')); }
    const time=node('time',new Date(message.time).toLocaleTimeString('zh-HK',{hour:'2-digit',minute:'2-digit',hour12:false}));
    time.dateTime=new Date(message.time).toISOString(); meta.append(time);
    const content=node('p',undefined,'message-content');
    if(user)content.textContent=message.content;
    else hintedText(content,message.content);
    body.append(meta,content);article.append(body);$('chat-log').append(article);
  }
  function hintedText(content,text) {
    let first=true;
    for(const char of text){
      if(!han.test(char)) {content.append(document.createTextNode(char));continue;}
      const button=node('button',char,'message-char');button.type='button';button.dataset.char=char;button.setAttribute('aria-label',t('hint.aria',{char}));
      button.tabIndex=first?0:-1;first=false;
      button.addEventListener('keydown',event=>{
        if(!['ArrowLeft','ArrowRight'].includes(event.key))return;
        event.preventDefault();const buttons=[...content.querySelectorAll('.message-char')],index=buttons.indexOf(button),next=buttons[index+(event.key==='ArrowRight'?1:-1)];
        if(next){button.tabIndex=-1;next.tabIndex=0;next.focus();}
      });
      button.addEventListener('click',()=>showHint(char,button)); content.append(button);
    }
  }
  function showHint(char,button) {
    for(const active of $('chat-room').querySelectorAll('.message-char[aria-pressed=true]'))active.setAttribute('aria-pressed','false');
    button.setAttribute('aria-pressed','true'); hint=char; hintStage=0;renderHint();
  }
  function renderHint() {
    $('hint-empty').hidden=!!hint; $('hint-body').hidden=!hint; $('close-hint').hidden=!hint;
    if(!hint)return;
    $('hint-character').textContent=hint; $('hint-roots').replaceChildren();
    const code=window.MANCHAI_DATA.codes[hint];
    $('next-hint').hidden=!code || hintStage>=3;
    if(!code){$('hint-roots').append(node('span',t('hint.unknown')));return;}
    for(const [position,index,className] of [['hint.firstlabel',0,'first-root'],['hint.lastlabel',code.length-1,'last-root']]) {
      if(hintStage<(index===0 && className==='first-root'?1:2))continue;
      const root=node('span',undefined,className);root.append(node('span',t(position)),node('b',rootByCode[code[index]]||code[index]));
      if(hintStage===3)root.append(node('kbd',code[index])); $('hint-roots').append(root);
    }
    $('next-hint').textContent=t(['hint.first','hint.last','hint.code'][hintStage]||'hint.code');
    if(code.length===1 && hintStage>=2)$('hint-roots').append(node('small',t('hint.one')));
  }
  function options() {
    const focused={game:document.activeElement?.dataset.game,tone:document.activeElement?.dataset.tone,scenario:document.activeElement?.dataset.scenario};
    $('game-list').replaceChildren();
    for(const g of games){const b=node('button',undefined,'game-option');b.type='button';b.dataset.game=g.id;b.setAttribute('aria-pressed',g.id===state.game);b.setAttribute('aria-label',g.name);const mark=node('span',undefined,'game-symbol');mark.append(icon(g.id));const name=node('span');name.append(node('strong',g.short),node('small',g.genre));b.append(mark,name);b.addEventListener('click',()=>{if(g.id===state.game)return;cancel();state.game=g.id;state.scenario=g.scenarios[0].id;newRound();renderRoom();});$('game-list').append(b);}
    $('tone-list').replaceChildren();
    for(const tone of tones){const b=node('button',undefined,'tone-option');b.type='button';b.dataset.tone=tone.id;b.setAttribute('aria-pressed',tone.id===state.tone);b.append(node('strong',tone.name),node('span',tone.description));b.addEventListener('click',()=>{if(tone.id===state.tone)return;cancel();state.tone=tone.id;addMessage({role:'system',source:'system',content:t('room.modechange')});renderRoom();});$('tone-list').append(b);}
    $('scenario-list').replaceChildren();
    for(const s of game().scenarios){const b=node('button',s.name,'scenario-option');b.type='button';b.dataset.scenario=s.id;b.setAttribute('aria-pressed',s.id===state.scenario);b.title=s.description;b.addEventListener('click',()=>{if(s.id===state.scenario)return;cancel();state.scenario=s.id;newRound();renderRoom();});$('scenario-list').append(b);}
    for(const [group,id] of [['game','game-list'],['tone','tone-list'],['scenario','scenario-list']]) {
      if(focused[group]) [...$(id).children].find(b=>b.dataset[group]===focused[group])?.focus({preventScroll:true});
    }
  }
  function renderRoom() {
    $('chat-room').style.setProperty('--game-color',game().color);
    $('game-mark').replaceChildren(icon(state.game));$('room-title').textContent=game().room;
    $('room-subtitle').textContent=`${game().name} · ${t('room.people')}`;
    $('teammate-name').textContent=game().teammate;$('teammate-avatar').textContent=game().teammate.slice(-1);
    $('suggested-reply').replaceChildren();hintedText($('suggested-reply'),scenario().suggestion);options();stats();save();
  }
  function newRound() {
    state.messages=[]; state.draft='';$('chat-input').value='';inputStamp=0;failed=false;hint=null;dismiss();renderHint();$('chat-log').replaceChildren();
    addMessage({role:'system',source:'system',content:t('room.system')},false);
    addMessage({role:'assistant',source:'opening',content:scenario().opener});count();
  }
  function count(){const n=size($('chat-input').value);$('input-count').textContent=t('chat.count',{count:n});$('input-count').classList.toggle('over-limit',n>180);}
  function busy(on){$('typing-status').hidden=!on;$('send-chat').disabled=on || mode==='checking';}
  function cancel() { if(pending){pending.abort();pending=null;busy(false);} }
  async function reply() {
    if(pending)return;dismiss();failed=false;
    if(mode==='local') {
      const replies=game().replies.slice(0,mode==='local'&&state.tone==='friendly'?2:3);
      const tone=tones.find(t=>t.id===state.tone);
      const line=replies[state.stats.rounds%replies.length];
      addMessage({role:'assistant',source:'local',content:`${tone.prefix}${line}`});state.stats.rounds++;stats();save();return;
    }
    const controller=new AbortController();pending=controller;busy(true);
    const timeout=setTimeout(()=>controller.abort(),25000);
    try {
      const messages=state.messages.filter(m=>m.role!=='system').slice(-8).map(({role,content})=>({role,content}));
      const response=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},signal:controller.signal,body:JSON.stringify({game:state.game,tone:state.tone,scenario:state.scenario,messages})});
      const result=await response.json();
      if(!response.ok)throw new Error(['rate','quota','disabled','invalid'].includes(result.error)?result.error:'network');
      if(typeof result.reply!=='string'||!result.reply.trim()||size(result.reply)>180)throw new Error('network');
      if(pending!==controller)return;
      addMessage({role:'assistant',source:'ai',content:result.reply});state.stats.rounds++;stats();save();
    } catch(error){if(pending!==controller)return;failed=true;notice(controller.signal.aborted?'stopped':error.message in {'rate':1,'quota':1,'disabled':1,'invalid':1}?error.message:'network');}
    finally{clearTimeout(timeout);if(pending===controller){pending=null;busy(false);}}
  }
  $('chat-form').addEventListener('submit',event=>{
    event.preventDefault();if(pending||composing||performance.now()-compositionEnd<100||mode==='checking')return;
    const text=$('chat-input').value.trim();if(!text){notice('empty');return;}if(size(text)>180){notice('long');return;}
    addMessage({role:'user',source:'system',content:text});state.draft='';$('chat-input').value='';count();inputStamp=0;save();reply();
  });
  const input=$('chat-input');
  function recordTyping(data) {
    const inserted=data?size(data.replace(/[^\p{Script=Han}]/gu,'')):0;
    const now=performance.now();if(inserted){state.stats.chars+=inserted;state.stats.ms+=inputStamp?Math.min(5000,Math.max(80,now-inputStamp)):1000;inputStamp=now;stats();}
  }
  input.addEventListener('compositionstart',()=>{composing=true;});
  input.addEventListener('compositionend',event=>{composing=false;compositionEnd=performance.now();compositionData=event.data||'';recordTyping(compositionData);debounceSave();});
  input.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.isComposing&&!composing&&e.keyCode!==229&&performance.now()-compositionEnd>=100){e.preventDefault();$('chat-form').requestSubmit();}});
  input.addEventListener('input',event=>{
    if(!event.isComposing && !composing && event.inputType!=='insertFromPaste' && event.inputType!=='insertFromDrop') {
      if(!(performance.now()-compositionEnd<100 && event.data===compositionData))recordTyping(event.data);
    }
    state.draft=[...input.value].slice(0,180).join('');count();debounceSave();
  });
  input.addEventListener('blur',()=>{inputStamp=0;});
  $('stop-chat').addEventListener('click',()=>{cancel();failed=true;notice('stopped');});
  $('retry-chat').addEventListener('click',()=>reply());
  $('local-chat').addEventListener('click',()=>{cancel();connection('local');dismiss();if(failed){failed=false;reply();}});
  $('next-hint').addEventListener('click',()=>{hintStage++;renderHint();});
  $('close-hint').addEventListener('click',()=>{hint=null;renderHint();for(const b of $('chat-room').querySelectorAll('.message-char[aria-pressed=true]'))b.setAttribute('aria-pressed','false');});
  $('reset-room').addEventListener('click',()=>{
    if(!resetArmed){resetArmed=true;$('reset-room').textContent=t('room.reset.confirm');setTimeout(()=>{resetArmed=false;$('reset-room').textContent=t('room.reset');},4000);return;}
    resetArmed=false;$('reset-room').textContent=t('room.reset');cancel();newRound();input.focus();
  });
  $('clear-chat').addEventListener('click',()=>{
    if(!clearArmed){clearArmed=true;$('clear-chat').textContent=t('clear.confirm');setTimeout(()=>{clearArmed=false;$('clear-chat').textContent=t('clear.title');},4000);return;}
    clearArmed=false;cancel();clearTimeout(saveTimer);state.stats={chars:0,ms:0,rounds:0};newRound();stats();
    // Replace with an empty practice state; other lesson completion keys stay intact.
    save();$('clear-chat').textContent=t('clear.title');$('chat-storage').textContent=t(storage.failed?'storage.failed':'clear.done');
  });
  window.addEventListener('pagehide',save);
  if(state.messages.length){for(const m of state.messages)renderMessage(m);$('chat-log').scrollTop=$('chat-log').scrollHeight;}else newRound();
  input.value=state.draft;count();renderRoom();
  failed=state.messages.at(-1)?.role==='user';
  fetch('/api/chat/status').then(r=>r.ok?r.json():Promise.reject()).then(s=>{connection(s.enabled?'ai':'offline');if(!s.enabled)notice('disabled');else if(failed)notice('network');}).catch(()=>{connection('offline');notice('network');});
})();
