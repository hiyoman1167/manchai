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
for (const file of ['data/lesson-data.js','data/code-data.js','data/reading-data.js','shared.js','script.js','typing-core.js','extended.js']) {
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
console.log('Reading data, native IME, sentence and paragraph completion, custom filters, word codes, and lesson picker passed.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
