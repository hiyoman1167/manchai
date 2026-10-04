const fs = require('fs');
const vm = require('vm');
const assert = require('assert');
const path = require('path');
const cwd = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(cwd, file), 'utf8');
const pages = ['index.html', 'learn.html', 'practice.html'].map(read);
const rootsPage = read('roots.html');
assert(pages.every(page => !/<select\b/i.test(page)), 'Native select menus must not appear');
assert(!/<select\b/i.test(rootsPage));
assert(rootsPage.includes('data/root-guide-data.js') && rootsPage.includes('roots.js'));
assert(pages[2].includes('data/reading-data.js'));
assert(pages[1].includes('data/lesson-data.js') && !pages[1].includes('data/learning-data.js'));
assert(pages[2].includes('data/code-data.js') && !pages[2].includes('data/vocab-part-0.js'));

class Element {
  constructor(tag = 'div') {
    this.tagName = tag.toUpperCase();
    this.children = []; this.listeners = {}; this.attributes = {}; this.dataset = {};
    this.className = ''; this.style = {}; this.hidden = false; this.disabled = false;
    this.value = ''; this.textContent = ''; this.innerHTML = '';
    this.scrollHeight = 0; this.clientHeight = 0; this.scrollWidth = 0; this.clientWidth = 0;
    this.scrollTop = 0; this.scrollLeft = 0; this.fallback = new Map();
    this.classList = {
      toggle: (name, on) => {
        const names = new Set(this.className.split(' ').filter(Boolean));
        on ? names.add(name) : names.delete(name);
        this.className = [...names].join(' ');
      },
      add: name => { this.className += ` ${name}`; }
    };
  }
  setAttribute(name, value) { this.attributes[name] = String(value); }
  addEventListener(name, handler) { this.listeners[name] = handler; }
  append(...nodes) { this.children.push(...nodes); }
  replaceChildren() { this.children = []; }
  querySelector(selector) {
    if (selector === '.active') return this.children.find(child => child.className.split(' ').includes('active'));
    if (!this.fallback.has(selector)) this.fallback.set(selector, new Element());
    return this.fallback.get(selector);
  }
  getBoundingClientRect() { return {top:0,left:0}; }
  focus() {}
  scrollIntoView() {}
  click() { this.listeners.click?.({preventDefault(){}}); }
}
async function main() {
const elements = new Map([...pages[1].concat(pages[2]).matchAll(/id="([^"]+)"/g)].map(match => [match[1], new Element()]));
const e = id => elements.get(id);
e('chapter-options').hidden = true;
for (const start of [0, 100, 1000, 10000]) {
  const button = new Element('button');
  button.dataset.start = String(start);
  e('vocab-range').append(button);
}
const pendingScripts = [];
const document = {querySelector: selector => e(selector.slice(1)), getElementById:e, createElement:tag => new Element(tag), head:{append:script => pendingScripts.push(script)}};
const localStorage = {saved:new Map(), getItem(key){return this.saved.get(key) || null;}, setItem(key,value){this.saved.set(key,value);}};
const window = {innerWidth:1200};
const pending = [];
const context = vm.createContext({document, localStorage, window, setTimeout:fn => pending.push(fn)});
for (const file of ['data/lesson-data.js','data/diagram-data.js','data/practice-copy.js','data/progress-copy.js','data/code-data.js','data/reading-data.js','shared.js','glyph-diagrams.js','script.js','typing-core.js','extended.js']) {
  const lessonData = file === 'data/code-data.js' ? window.MANCHAI_DATA : null;
  vm.runInContext(read(file), context, {filename:file});
  // This harness runs both pages together; a browser loads only its own page data.
  if (lessonData) Object.assign(window.MANCHAI_DATA, lessonData);
}
const submit = id => e(id).listeners.submit({preventDefault(){}});
const typeNative = text => { e('native-input').value = text; e('native-input').listeners.input({isComposing:false}); };
const normalize = text => text.replace(/[\p{P}\p{Z}\s]/gu, '');
const reading = window.MANCHAI_READING;
assert.equal(window.MANCHAI_DATA.words, undefined);
assert.equal(window.MANCHAI_DATA.wordCount, 410945);
assert.equal(window.MANCHAI_DATA.vocabChunkSize, 10000);
assert.equal(reading.sentences.length, 120);
assert.equal(reading.paragraphs.length, 30);
assert.equal(e('sentence-total').textContent, 120);
assert.equal(e('paragraph-total').textContent, 30);
assert.equal(e('sentence-group').children.length, 9);
assert.equal(e('paragraph-level').children.length, 3);
assert.equal(e('native-exercise').hidden, false);
assert.equal(e('typing-mode-tabs').hidden, true);
assert.equal(context.MANCHAI_TYPING.compare('你，好。', '你好').complete, true);

const sentence = reading.sentences[0].text;
assert.equal(e('native-tutor-body').hidden, true, 'Hints stay hidden until requested');
e('native-hint').click();
assert.equal(e('native-tutor-body').hidden, false);
assert(e('native-hint-text').textContent.includes('首碼「竹」'));
assert(!e('native-hint-text').textContent.includes('HI'), 'First root hint must not reveal the code');
assert.equal(e('native-tutor-keys').hidden, true);
e('native-hint').click();
assert(e('native-hint-text').textContent.includes('尾碼「戈」'));
assert.equal(e('native-tutor-keys').hidden, true);
e('native-hint').click();
assert(e('native-hint-text').textContent.includes('HI'));
assert.equal(e('native-tutor-keyboard').hidden, false);
e('native-hint').click();
assert.equal(e('native-tutor-candidates').hidden, false);
const chooseDemo = e('native-tutor-candidate-list').children;
assert.equal(chooseDemo.length, 3);
chooseDemo.find(button => button.children[1].textContent !== '我').click();
assert(e('native-tutor-candidate-feedback').textContent.includes('目標係「我」'));
chooseDemo.find(button => button.children[1].textContent === '我').click();
assert(e('native-tutor-candidate-feedback').textContent.includes('揀啱'));
assert.equal(e('native-count').textContent, `0 / ${normalize(sentence).length} 字`, 'Tutorial choice must not count as real typing');
e('native-guided').click();
typeNative('我');
assert.equal(e('native-tutor-body').hidden, false);
assert(e('native-tutor-title').textContent.includes('今'));
assert.equal(e('native-tutor-keys').hidden, true, 'Guided next character starts at first root');
e('native-guided').click();
typeNative('我今');
assert.equal(e('native-tutor-body').hidden, true, 'Manual hints reset on next character');
e('native-hint').click();
assert(e('native-hint-text').textContent.includes('單碼字根'));
e('native-hint').click(); e('native-hint').click();
assert.equal(e('native-tutor-keys').children.length, 1, 'Single-code roots require only one key press');
e('native-close').click();
assert.equal(e('native-tutor-body').hidden, true);
assert.equal(e('native-hint').attributes['aria-expanded'], 'false');
typeNative('我');
assert(e('native-tutor-title').textContent.includes('今'), 'Backspace restores the matching target');
e('fluency-repeat').click();
e('native-input').listeners.compositionstart();
e('native-input').value = 'MM';
e('native-input').listeners.input({isComposing:true});
assert.equal(e('native-count').textContent, `0 / ${normalize(sentence).length} 字`);
e('native-input').value = normalize(sentence);
e('native-input').listeners.compositionend();
pending.shift()();
assert.equal(e('fluency-complete').hidden, false);
assert(localStorage.saved.get('manchai-fluency-progress-v1').includes('sn:0'));
e('fluency-repeat').click();
typeNative('錯');
assert.equal(e('native-input').attributes['aria-invalid'], 'true');
typeNative(normalize(sentence));
assert.equal(e('fluency-complete').hidden, false);
let pasteStopped = false;
e('native-input').listeners.paste({preventDefault(){pasteStopped=true;}});
assert(pasteStopped);

e('paragraph-mode').click();
assert.equal(e('fluency-heading').textContent, reading.paragraphs[0].title);
assert.equal(e('native-input').rows, 6);
assert.equal(e('typing-mode-tabs').hidden, true);
typeNative(normalize(reading.paragraphs[0].text));
assert.equal(e('fluency-complete').hidden, false);
assert(localStorage.saved.get('manchai-fluency-progress-v1').includes('pn:0'));
assert(e('fluency-complete-text').textContent.includes(reading.paragraphs[0].title));
e('paragraph-level').children[1].click();
assert.equal(e('paragraph-results').children.length, 10);
assert.equal(e('paragraph-level').children[1].attributes['aria-pressed'], 'true');

e('vocab-mode').click();
assert.equal(e('vocab-loading').hidden, false);
assert.equal(e('fluency-practice').hidden, true);
assert.equal(pendingScripts.length, 1);
assert.equal(pendingScripts[0].src, 'data/vocab-part-0.js');
pendingScripts.shift().onerror();
await new Promise(setImmediate);
assert.equal(e('vocab-retry').hidden, false);
e('vocab-retry').click();
assert.equal(pendingScripts.length, 1);
vm.runInContext(read('data/vocab-part-0.js'), context, {filename:'data/vocab-part-0.js'});
pendingScripts.shift().onload();
await new Promise(setImmediate);
assert.equal(window.MANCHAI_DATA.words.length, 410945);
assert.equal(e('vocab-loading').hidden, true);
assert.equal(e('typing-mode-tabs').hidden, false);
e('vocab-range').children[1].click();
await new Promise(setImmediate);
assert(e('vocab-result-count').textContent.includes('900'));
assert.equal(e('vocab-range').children[1].attributes['aria-pressed'], 'true');
e('vocab-range').children[3].click();
assert.equal(pendingScripts[0].src, 'data/vocab-part-1.js');
vm.runInContext(read('data/vocab-part-1.js'), context, {filename:'data/vocab-part-1.js'});
pendingScripts.shift().onload();
await new Promise(setImmediate);
assert(e('vocab-result-count').textContent.includes('400,945'));
e('vocab-range').children[0].click();
await new Promise(setImmediate);
const finalWindow = {};
vm.runInNewContext(read('data/vocab-part-41.js'), {window:finalWindow});
const rareWord = finalWindow.MANCHAI_VOCAB_PARTS[41].words.at(-1);
e('vocab-search').value = rareWord;
e('vocab-search').listeners.input();
let loadedPartCount = 2;
for (let turn = 0; turn < 100 && loadedPartCount < 42; turn++) {
  await new Promise(setImmediate);
  while (pendingScripts.length) {
    const script = pendingScripts.shift();
    vm.runInContext(read(script.src), context, {filename:script.src});
    script.onload();
    loadedPartCount++;
  }
}
await new Promise(setImmediate);
assert.equal(loadedPartCount, 42);
assert.equal(window.MANCHAI_DATA.words.at(-1), rareWord);
assert(e('vocab-result-count').textContent.includes('搵到'));
e('vocab-search').value = '';
e('vocab-search').listeners.input();
await new Promise(setImmediate);
e('code-mode').click();
assert.equal(e('fluency-exercise').hidden, false);
const glyph = e('fluency-character').textContent;
const full = window.MANCHAI_DATA.codes[glyph];
const quick = full.length === 1 ? full : full[0] + full.at(-1);
e('fluency-input').value = 'ZZ'; submit('fluency-form');
assert.equal(e('fluency-candidates').hidden, true);
e('fluency-input').value = quick; submit('fluency-form');
assert.equal(e('fluency-candidates').hidden, false);
const correct = e('fluency-candidate-list').children.find(button => button.children[1].textContent === glyph);
assert(correct); correct.click();
assert.equal(e('fluency-review').hidden, false);

e('sentence-mode').click();
const withSupplement = reading.sentences.find(sentence => sentence.text.includes('齊'));
assert(withSupplement);
e('sentence-group').children.find(button => button.textContent === withSupplement.category).click();
e('sentence-results').children.find(button => button.textContent.includes(withSupplement.text)).click();
typeNative(normalize(withSupplement.text).split('齊')[0]);
e('native-hint').click(); e('native-hint').click(); e('native-hint').click();
assert(e('native-hint-text').textContent.includes('YX'));

assert.equal(e('chapter-options').children.length, 4);
e('chapter-toggle').click();
assert.equal(e('chapter-options').hidden, false);
e('words-tab').click();
const universe = vm.runInContext('words.find(item => item.character === "宇")', context);
assert.equal(universe.full, 'JMD');
const hiddenDiagram = context.diagramMarkup(universe, 24, 0);
assert(hiddenDiagram.includes('首尾拆碼待探索'));
assert(!hiddenDiagram.includes('<strong>十</strong>') && !hiddenDiagram.includes('<strong>木</strong>'));
assert(context.diagramMarkup(universe, 24, 1).includes('<strong>十</strong>'));
assert(!context.diagramMarkup(universe, 24, 1).includes('<strong>木</strong>'));
assert(context.diagramMarkup(universe, 24, 2).includes('<strong>木</strong>'));
assert(!context.diagramMarkup(universe, 24, 2).includes('<b>J</b>'));
assert(context.diagramMarkup(universe, 24, 3).includes('<b>J</b>'));
const universeSVG = read('assets/glyphs/5b87.svg');
assert.equal((universeSVG.match(/<g id="first"[^>]*>(.*?)<\/g>/)[1].match(/<path /g) || []).length, 3);
assert.equal((universeSVG.match(/<g id="last"[^>]*>(.*?)<\/g>/)[1].match(/<path /g) || []).length, 2);
assert.equal(context.diagramCaption(universe, 2), window.MANCHAI_DIAGRAMS.copy.both);
assert.equal(context.diagramCaption({...universe, full:'ABC'}, 2), window.MANCHAI_DIAGRAMS.copy.unavailable);
assert.equal(window.MANCHAI_GLYPH.markup('宇', 'ABC'), '宇', 'Unverified code variants must never show a guessed colour');
assert.equal(e('chapter-options').children.length, 25);
e('chapter-options').children[24].click();
assert.equal(e('lesson-title').textContent, '文章與故事');
assert.equal(e('chapter-options').hidden, true);
const rootElements = new Map([['root-index', new Element()], ['root-families', new Element()]]);
const rootContext = vm.createContext({window:{}, document:{getElementById:id => rootElements.get(id), createElement:tag => new Element(tag)}});
for (const file of ['data/root-guide-data.js','roots.js']) vm.runInContext(read(file), rootContext, {filename:file});
const allNodes = node => [node, ...node.children.flatMap(allNodes)];
assert.equal(rootContext.window.MANCHAI_ROOT_GUIDE.length, 24);
assert.equal(rootElements.get('root-index').children.length, 24);
assert.equal(rootElements.get('root-families').children.length, 4);
assert.equal(allNodes(rootElements.get('root-families')).filter(node => node.tagName === 'IMG').length, 191);
const practiceWindow = {};
const practiceContext = vm.createContext({window:practiceWindow, document, localStorage:{getItem:()=>null,setItem(){}}, setTimeout:fn=>pending.push(fn)});
for (const file of ['data/code-data.js','data/reading-data.js','data/diagram-data.js','data/practice-copy.js','data/progress-copy.js','shared.js','glyph-diagrams.js','typing-core.js','extended.js']) vm.runInContext(read(file), practiceContext, {filename:file});
e('native-hint').click(); e('native-hint').click(); e('native-hint').click(); e('native-hint').click();
assert.equal(e('native-tutor-candidate-list').children.length, 3, 'Candidate teaching works without loading another page or the vocabulary');

// New documents sharing storage simulate closing a page and returning later.
function reopen(page, storage = localStorage) {
  const nodes = new Map([...pages[1].concat(pages[2]).matchAll(/id="([^"]+)"/g)].map(match => [match[1], new Element()]));
  const get = id => nodes.get(id);
  for (const start of [0, 100, 1000, 10000]) {
    const button = new Element('button'); button.dataset.start = String(start); get('vocab-range').append(button);
  }
  const scripts = [];
  const browser = {innerWidth:1200};
  const doc = {querySelector:selector=>get(selector.slice(1)), getElementById:get, createElement:tag=>new Element(tag), head:{append:script=>scripts.push(script)}};
  const fresh = vm.createContext({window:browser, document:doc, localStorage:storage, setTimeout:fn=>fn()});
  const files = page === 'learn'
    ? ['data/lesson-data.js','data/diagram-data.js','data/progress-copy.js','shared.js','glyph-diagrams.js','script.js']
    : ['data/code-data.js','data/reading-data.js','data/diagram-data.js','data/practice-copy.js','data/progress-copy.js','shared.js','glyph-diagrams.js','typing-core.js','extended.js'];
  for (const file of files) vm.runInContext(read(file), fresh, {filename:file});
  return {get, browser, fresh, scripts, type(text){get('native-input').value=text; get('native-input').listeners.input({isComposing:false});}, async load(){
    while (scripts.length) {
      const script=scripts.shift(); vm.runInContext(read(script.src), fresh, {filename:script.src}); script.onload(); await new Promise(setImmediate);
    }
  }};
}
const practiceKey = 'manchai-practice-position-v1';
localStorage.saved.delete(practiceKey);
let firstVisit = reopen('practice');
firstVisit.get('native-hint').click();
firstVisit.get('native-guided').click();
firstVisit.type('我今錯');
let returning = reopen('practice');
assert.equal(returning.get('native-input').value, '我今', 'Only correctly typed progress is restored, not mistakes');
assert.equal(returning.get('native-count').textContent, '2 / 14 字');
assert.equal(returning.get('native-guided').attributes['aria-checked'], 'true');
assert(returning.get('saved-completions').textContent.includes('1句 · 1篇'), 'Existing completion records survive');
assert(returning.get('fluency-rank').textContent.includes('之前已完成'));
returning.type(normalize(sentence));
returning = reopen('practice');
assert.equal(returning.get('fluency-complete').hidden, false, 'A completed exercise stays completed after reload');
returning.get('paragraph-mode').click();
returning.get('paragraph-level').children[1].click();
returning.get('paragraph-results').children[1].click();
const paragraphPrefix = returning.browser.MANCHAI_READING.paragraphs[11].text.slice(0, 3);
returning.type(paragraphPrefix);
returning = reopen('practice');
assert.equal(returning.get('paragraph-mode').attributes['aria-selected'], 'true');
assert.equal(returning.get('native-input').value, normalize(paragraphPrefix));
assert(returning.get('fluency-rank').textContent.includes('段落 12 / 30'));

returning.get('vocab-mode').click(); await returning.load();
returning.get('vocab-results').children.find(button=>button.children[0].textContent.length > 1).click();
returning.get('code-mode').click();
const codeWord = returning.get('fluency-text').attributes['aria-label'];
const char = returning.get('fluency-character').textContent;
const fullCode = returning.browser.MANCHAI_DATA.codes[char];
returning.get('fluency-input').value = fullCode.length === 1 ? fullCode : fullCode[0] + fullCode.at(-1);
returning.get('fluency-form').listeners.submit({preventDefault(){}});
returning.get('fluency-candidate-list').children.find(button=>button.children[1].textContent===char).click();
returning.get('fluency-continue').click();
const nextCharacter = returning.get('fluency-character').textContent;
returning = reopen('practice'); await returning.load();
assert.equal(returning.get('vocab-mode').attributes['aria-selected'], 'true');
assert.equal(returning.get('code-mode').attributes['aria-pressed'], 'true');
assert.equal(returning.get('fluency-character').textContent, nextCharacter);
assert(returning.get('fluency-step').textContent.startsWith('第 2 /'));
assert.equal(returning.get('fluency-text').attributes['aria-label'], codeWord);

const lessonVisit = reopen('learn');
lessonVisit.get('roots-tab').click();
lessonVisit.get('answer-input').value = vm.runInContext('currentItem().code', lessonVisit.fresh);
lessonVisit.get('answer-form').listeners.submit({preventDefault(){}});
assert(lessonVisit.get('progress-text').textContent.includes('本組 1/6'));
lessonVisit.get('next-button').click();
const rootCharacter = lessonVisit.get('root-character').textContent;
const lessonReturn = reopen('learn');
assert.equal(lessonReturn.get('root-character').textContent, rootCharacter);
assert(lessonReturn.get('progress-text').textContent.includes('本組 1/6'));
lessonReturn.get('words-tab').click(); lessonReturn.get('chapter-options').children[2].click();
assert.equal(reopen('learn').get('study-character').textContent, lessonReturn.get('study-character').textContent);

localStorage.saved.set(practiceKey, '{broken');
assert.equal(reopen('practice').get('native-input').value, '');
localStorage.saved.set(practiceKey, JSON.stringify({mode:'paragraph',lastParagraphId:999999,lastVocabId:-1,typed:'wrong'}));
assert(reopen('practice').get('fluency-rank').textContent.includes('段落 1 /'));
localStorage.saved.set(practiceKey, JSON.stringify({mode:'sentence',id:0,lastSentenceId:0,text:'old content',practiceMode:'native',typed:'我'}));
assert.equal(reopen('practice').get('native-input').value, '', 'Changed exercise content discards stale partial progress');
localStorage.saved.delete(practiceKey);
const blocked = reopen('practice', {getItem(){throw new Error('Blocked');},setItem(){throw new Error('Quota exceeded');}});
blocked.type('我');
assert.equal(blocked.get('native-count').textContent, '1 / 14 字');
assert(blocked.get('local-progress-status').textContent.includes('未能儲存'), 'Unavailable storage does not break typing or falsely promise saving');
localStorage.saved.set('manchai-fluency-progress-v1', JSON.stringify(['sn:0','sn:1','pn:0']));
firstVisit.type(normalize(sentence));
assert(JSON.parse(localStorage.saved.get('manchai-fluency-progress-v1')).includes('sn:1'), 'Saving from another tab preserves its completions');
console.log('Colour hints, native IME, reading, word codes, lesson picker, reload/resume, legacy completions and unavailable storage passed.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
