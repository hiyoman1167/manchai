const learningData = window.MANCHAI_DATA;
const readingData = window.MANCHAI_READING;
const el = id => document.getElementById(id);
const PAGE_SIZE = 20;
const fluencyStorageKey = "manchai-fluency-progress-v1";
let fluentDone = new Set();
try {
  const saved = JSON.parse(localStorage.getItem(fluencyStorageKey) || "[]");
  if (Array.isArray(saved)) fluentDone = new Set(saved.filter(value => typeof value === "string"));
} catch (_) { fluentDone = new Set(); }

let fluencyMode = "sentence";
let practiceMode = "native";
let activeId = 0;
let lastVocabId = 0;
let lastSentenceId = 0;
let lastParagraphId = 0;
let selectedVocabStart = 0;
let selectedSentenceGroup = readingData.sentences[0].category;
let selectedParagraphLevel = "起步";
let vocabLoading = false;
const loadedVocabParts = new Set();
const pendingVocabParts = new Map();
let vocabRenderToken = 0;
let activeText = "";
let activePositions = [];
let activeCharacters = [];
let characterIndex = 0;
let hintStage = 0;
let codeEntered = false;
let characterSolved = false;
let choices = [];
let choiceFocus = 0;
let queryResults = [];
let vocabPage = 0;
let nativeComparison = MANCHAI_TYPING.compare("", "");
let nativeFirstAt = 0;
let nativeHintStage = 0;
let nativeGeneration = 0;

const quickCode = full => full.length === 1 ? full : full[0] + full.at(-1);
const currentChar = () => activeCharacters[characterIndex];
const currentFull = () => learningData.codes[currentChar()];
const currentQuick = () => quickCode(currentFull());
const itemIdentity = (mode = fluencyMode, id = activeId) => `${{vocab:"v",sentence:"s",paragraph:"p"}[mode]}${mode === "vocab" && practiceMode === "code" ? "" : "n"}:${id}`;

function saveFluentProgress() {
  try { localStorage.setItem(fluencyStorageKey, JSON.stringify([...fluentDone])); } catch (_) { /* Storage may be unavailable. */ }
}
function fluencyFeedback(message, kind = "") {
  const node = el("fluency-feedback");
  node.textContent = message;
  node.className = `fluency-feedback${kind ? ` ${kind}` : ""}`;
  el("fluency-input").setAttribute("aria-invalid", kind === "error" ? "true" : "false");
}
function codeExplanation(character) {
  const full = learningData.codes[character];
  const code = quickCode(full);
  if (full.length === 1) return `「${character}」係單碼字根，按 ${full} 就得。`;
  const middle = full.length > 2 ? `完整倉頡碼 ${full}，中間部分唔使打。` : `完整倉頡碼 ${full}。`;
  return `${middle}取首碼 ${code[0]}（${rootByCode[code[0]]}）同尾碼 ${code.at(-1)}（${rootByCode[code.at(-1)]}），速成碼係 ${code}。`;
}
function renderActiveText() {
  const container = el("fluency-text");
  container.replaceChildren();
  if (practiceMode === "native") {
    let practicePosition = 0;
    const nativeTarget = MANCHAI_TYPING.characters(activeText);
    [...activeText].forEach(character => {
      const span = document.createElement("span");
      span.textContent = character;
      if (character === nativeTarget[practicePosition]) {
        if (practicePosition < nativeComparison.correct) span.className = "text-char done";
        else if (practicePosition === nativeComparison.correct && !nativeComparison.complete) span.className = `text-char ${nativeComparison.hasError ? "mistake" : "current"}`;
        else span.className = "text-char";
        practicePosition++;
      } else span.className = "text-char punctuation";
      container.append(span);
    });
    return;
  }
  [...activeText].forEach((character, textPosition) => {
    const span = document.createElement("span");
    span.textContent = character;
    const exercisePosition = activePositions.indexOf(textPosition);
    if (exercisePosition === characterIndex && !el("fluency-complete").hidden) span.className = "text-char done";
    else if (exercisePosition === characterIndex) span.className = "text-char current";
    else if (exercisePosition >= 0 && exercisePosition < characterIndex) span.className = "text-char done";
    else span.className = "text-char";
    container.append(span);
  });
}
function renderReveal() {
  const full = currentFull();
  const code = quickCode(full);
  const stage = codeEntered ? 3 : hintStage;
  if (stage === 0) el("fluency-reveal").textContent = "首尾字根暫時收起";
  if (stage === 1) el("fluency-reveal").textContent = `首碼字根：${rootByCode[code[0]]}`;
  if (stage === 2) el("fluency-reveal").textContent = `首碼 ${rootByCode[code[0]]} · 尾碼 ${rootByCode[code.at(-1)]}`;
  if (stage === 3) el("fluency-reveal").textContent = `首碼 ${rootByCode[code[0]]} ${code[0]} · 尾碼 ${rootByCode[code.at(-1)]} ${code.at(-1)}`;
  el("fluency-hint").disabled = codeEntered || stage >= 3;
  el("fluency-show").disabled = codeEntered || stage >= 3;
}
function renderCharacter() {
  hintStage = 0;
  codeEntered = false;
  characterSolved = false;
  choices = [];
  choiceFocus = 0;
  const character = currentChar();
  el("fluency-step").textContent = `第 ${characterIndex + 1} / ${activeCharacters.length} 字 · 完成碼同選字先去下一個`;
  el("fluency-character").textContent = character;
  el("fluency-input").value = "";
  el("fluency-input").maxLength = currentQuick().length;
  el("fluency-input").disabled = false;
  el("fluency-check").disabled = false;
  el("fluency-candidates").hidden = true;
  el("fluency-review").hidden = true;
  fluencyFeedback("先觀察字形，自己試打。卡住可以逐步睇提示。");
  renderReveal();
  renderActiveText();
}
function startExercise(mode, id) {
  fluencyMode = mode;
  activeId = id;
  if (mode === "vocab") lastVocabId = id;
  else if (mode === "sentence") lastSentenceId = id;
  else lastParagraphId = id;
  if (mode !== "vocab") practiceMode = "native";
  el("native-mode").classList.toggle("active", practiceMode === "native");
  el("code-mode").classList.toggle("active", practiceMode === "code");
  el("native-mode").setAttribute("aria-pressed", String(practiceMode === "native"));
  el("code-mode").setAttribute("aria-pressed", String(practiceMode === "code"));
  el("typing-mode-tabs").hidden = mode !== "vocab";
  const lesson = mode === "sentence" ? readingData.sentences[id] : mode === "paragraph" ? readingData.paragraphs[id] : null;
  activeText = mode === "vocab" ? learningData.words[id] : lesson.text;
  activePositions = [];
  activeCharacters = [];
  [...activeText].forEach((character, position) => {
    if (learningData.codes[character]) {
      activePositions.push(position);
      activeCharacters.push(character);
    }
  });
  characterIndex = 0;
  el("fluency-kind").textContent = mode === "vocab" ? "詞語練習" : lesson.category;
  el("fluency-rank").textContent = mode === "vocab"
    ? `常用次序 ${(id + 1).toLocaleString("en-US")} / ${learningData.wordCount.toLocaleString("en-US")}`
    : mode === "sentence" ? `句子 ${id + 1} / ${readingData.sentences.length}` : `${lesson.level} · 段落 ${id + 1} / ${readingData.paragraphs.length}`;
  el("fluency-heading").hidden = mode !== "paragraph";
  el("fluency-heading").textContent = mode === "paragraph" ? lesson.title : "";
  el("fluency-text").classList.toggle("long-text", mode === "paragraph");
  el("native-input").rows = mode === "paragraph" ? 6 : 3;
  el("fluency-prompt").textContent = practiceMode === "native"
    ? mode === "paragraph" ? "先讀一遍，再用速成逐句打。打錯可以退格改；標點可以唔打。" : "睇住目標，用你電腦嘅速成輸入法打出中文字；選字由電腦輸入法提供。"
    : "睇住詞語，逐字拆碼同練選字。";
  el("fluency-exercise").hidden = practiceMode !== "code";
  el("native-exercise").hidden = practiceMode !== "native";
  el("fluency-complete").hidden = true;
  if (practiceMode === "native") resetNativeExercise();
  else renderCharacter();
}
function buildChoices(character, position) {
  const code = quickCode(learningData.codes[character]);
  const others = [...(learningData.candidates[code] || "")]
    .filter(candidate => candidate !== character).slice(0, 2);
  const options = others.slice();
  options.splice(position % (options.length + 1), 0, character);
  return options;
}
function updateChoiceFocus() {
  [...el("fluency-candidate-list").children].forEach((button, index) => {
    button.classList.toggle("focused", index === choiceFocus);
  });
}
function chooseFluencyCandidate(index) {
  if (characterSolved || index < 0 || index >= choices.length) return;
  choiceFocus = index;
  updateChoiceFocus();
  if (choices[index] !== currentChar()) {
    el("fluency-choice-feedback").textContent = `呢個係「${choices[index]}」。目標係「${currentChar()}」，再揀一次。`;
    el("fluency-candidate-list").children[index].classList.add("missed");
    return;
  }
  characterSolved = true;
  el("fluency-candidate-list").children[index].classList.add("correct");
  el("fluency-choice-feedback").textContent = `揀啱「${currentChar()}」！`;
  el("fluency-review-text").textContent = codeExplanation(currentChar());
  el("fluency-continue").textContent = characterIndex === activeCharacters.length - 1 ? "完成呢題 →" : "下一個字 →";
  el("fluency-review").hidden = false;
}
function showFluencyCandidates() {
  choices = buildChoices(currentChar(), characterIndex + activeId);
  choiceFocus = 0;
  const list = el("fluency-candidate-list");
  list.replaceChildren();
  choices.forEach((character, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "candidate-option";
    button.setAttribute("aria-label", `候選 ${index + 1}：${character}`);
    const number = document.createElement("span");
    number.textContent = index + 1;
    const glyph = document.createElement("strong");
    glyph.textContent = character;
    button.append(number, glyph);
    button.addEventListener("click", () => chooseFluencyCandidate(index));
    list.append(button);
  });
  el("fluency-choice-feedback").textContent = "睇清楚目標字，再揀旁邊嘅號碼。";
  el("fluency-candidates").hidden = false;
  updateChoiceFocus();
  el("fluency-candidates").focus();
}
function completeExercise() {
  fluentDone.add(itemIdentity());
  saveFluentProgress();
  el("fluency-exercise").hidden = true;
  el("native-exercise").hidden = true;
  el("fluency-complete").hidden = false;
  const completedTitle = fluencyMode === "paragraph" ? readingData.paragraphs[activeId].title : activeText;
  el("fluency-complete-text").textContent = practiceMode === "native"
    ? `你用中文輸入法完成咗「${completedTitle}」。可以再練一次，或者去下一題。`
    : `你逐字完成咗「${activeText}」。可以再練一次，或者去下一題。`;
  renderActiveText();
  if (fluencyMode === "vocab") renderVocabResults();
  else if (fluencyMode === "sentence") renderSentenceResults();
  else renderParagraphResults();
  el("fluency-repeat").focus();
}

function resetNativeExercise() {
  nativeGeneration++;
  nativeComparison = MANCHAI_TYPING.compare("", activeText);
  nativeFirstAt = 0;
  nativeHintStage = 0;
  el("native-input").value = "";
  el("native-input").disabled = false;
  el("native-input").setAttribute("aria-invalid", "false");
  el("native-count").textContent = `0 / ${nativeComparison.target.length} 字`;
  el("native-speed").textContent = "0 字／分鐘";
  el("native-feedback").textContent = "先試自己打。選字後，中文字會出現喺下面文字框。";
  el("native-feedback").className = "native-feedback";
  el("native-hint-text").hidden = true;
  el("native-hint-text").textContent = "";
  el("native-hint").textContent = "提示而家呢個字嘅字根";
  renderActiveText();
}

function updateNativeExercise() {
  if (practiceMode !== "native" || el("native-exercise").hidden) return;
  const previousCorrect = nativeComparison.correct;
  nativeComparison = MANCHAI_TYPING.compare(el("native-input").value, activeText);
  if (!nativeFirstAt && nativeComparison.typed.length) nativeFirstAt = Date.now();
  if (nativeComparison.correct !== previousCorrect) {
    nativeHintStage = 0;
    el("native-hint-text").hidden = true;
    el("native-hint").textContent = "提示而家呢個字嘅字根";
  }
  el("native-count").textContent = `${nativeComparison.correct} / ${nativeComparison.target.length} 字`;
  const elapsedMinutes = nativeFirstAt ? Math.max((Date.now() - nativeFirstAt) / 60000, 1 / 60) : 0;
  const speed = elapsedMinutes ? Math.round(nativeComparison.correct / elapsedMinutes) : 0;
  el("native-speed").textContent = `${speed} 字／分鐘`;
  el("native-input").setAttribute("aria-invalid", String(nativeComparison.hasError));
  const feedback = el("native-feedback");
  if (nativeComparison.hasError) {
    feedback.textContent = `第 ${nativeComparison.correct + 1} 個字未啱。退格改返，再喺輸入法候選字揀啱字。`;
    feedback.className = "native-feedback error";
  } else if (nativeComparison.correct) {
    feedback.textContent = `啱咗 ${nativeComparison.correct} 個字，繼續打。`;
    feedback.className = "native-feedback success";
  } else {
    feedback.textContent = "先試自己打。選字後，中文字會出現喺下面文字框。";
    feedback.className = "native-feedback";
  }
  renderActiveText();
  if (nativeComparison.complete) completeExercise();
}

let nativeComposing = false;
el("native-input").addEventListener("compositionstart", () => {
  nativeComposing = true;
  if (!nativeFirstAt) nativeFirstAt = Date.now();
});
el("native-input").addEventListener("compositionend", () => {
  nativeComposing = false;
  const generation = nativeGeneration;
  // Some browsers dispatch the final input after compositionend.
  setTimeout(() => { if (generation === nativeGeneration) updateNativeExercise(); }, 0);
});
el("native-input").addEventListener("input", event => {
  if (nativeComposing || event.isComposing) return;
  updateNativeExercise();
});
el("native-input").addEventListener("paste", event => {
  event.preventDefault();
  el("native-feedback").textContent = "呢度要自己打字練習；請用輸入法選字，唔好貼上。";
  el("native-feedback").className = "native-feedback error";
});
el("native-input").addEventListener("drop", event => event.preventDefault());
el("native-hint").addEventListener("click", () => {
  const character = nativeComparison.target[nativeComparison.correct];
  if (!character) return;
  const full = learningData.codes[character];
  const variants = full ? [full] : readingData.codeHints[character];
  const hint = el("native-hint-text");
  if (!variants) {
    hint.textContent = `「${character}」暫時冇拆碼資料，請用輸入法試吓揀字。`;
  } else {
    nativeHintStage = Math.min(3, nativeHintStage + 1);
    const quicks = [...new Set(variants.map(quickCode))];
    const firstRoots = [...new Set(quicks.map(code => `${rootByCode[code[0]]} ${code[0]}`))].join("／");
    const lastRoots = [...new Set(quicks.map(code => `${rootByCode[code.at(-1)]} ${code.at(-1)}`))].join("／");
    hint.textContent = nativeHintStage === 1
      ? `「${character}」先睇開頭：首碼字根係 ${firstRoots}。`
      : nativeHintStage === 2
        ? `「${character}」首碼 ${firstRoots}，尾碼 ${lastRoots}。`
        : full ? codeExplanation(character)
          : `Rime 倉頡五代收錄完整碼 ${variants.join("／")}；速成取首尾碼 ${quicks.join("／")}。實際候選字視乎你用嘅輸入法。`;
    el("native-hint").textContent = nativeHintStage < 3 ? "再睇一個提示" : "已顯示速成碼";
  }
  hint.hidden = false;
  el("native-input").focus();
});
el("native-mode").addEventListener("click", () => switchPracticeMode("native"));
el("code-mode").addEventListener("click", () => switchPracticeMode("code"));
function switchPracticeMode(mode) {
  if (fluencyMode !== "vocab") return;
  if (mode === practiceMode) return;
  practiceMode = mode;
  el("native-mode").classList.toggle("active", mode === "native");
  el("code-mode").classList.toggle("active", mode === "code");
  el("native-mode").setAttribute("aria-pressed", String(mode === "native"));
  el("code-mode").setAttribute("aria-pressed", String(mode === "code"));
  startExercise(fluencyMode, activeId);
  renderVocabResults();
  if (mode === "native") el("native-input").focus();
  else el("fluency-input").focus();
}

el("fluency-form").addEventListener("submit", event => {
  event.preventDefault();
  if (codeEntered) return;
  const typed = el("fluency-input").value.trim().toUpperCase();
  if (!typed) { fluencyFeedback("先打英文字母，再檢查。", "error"); return; }
  if (typed !== currentQuick()) {
    fluencyFeedback("未啱。試睇字形嘅起點同終點，或者逐步睇提示。", "error");
    return;
  }
  codeEntered = true;
  el("fluency-input").disabled = true;
  el("fluency-check").disabled = true;
  renderReveal();
  fluencyFeedback(`碼打啱：${typed}。而家揀返「${currentChar()}」。`, "success");
  showFluencyCandidates();
});
el("fluency-hint").addEventListener("click", () => { hintStage = Math.min(3, hintStage + 1); renderReveal(); });
el("fluency-show").addEventListener("click", () => { hintStage = 3; renderReveal(); fluencyFeedback(`答案係 ${currentQuick()}。照住打一次，再練選字。`); });
el("fluency-candidates").addEventListener("keydown", event => {
  if (el("fluency-candidates").hidden || characterSolved) return;
  if (/^[1-3]$/.test(event.key)) { event.preventDefault(); chooseFluencyCandidate(Number(event.key) - 1); }
  else if (["ArrowRight","ArrowDown","ArrowLeft","ArrowUp"].includes(event.key)) {
    event.preventDefault();
    choiceFocus = (choiceFocus + (["ArrowRight","ArrowDown"].includes(event.key) ? 1 : -1) + choices.length) % choices.length;
    updateChoiceFocus();
  } else if (event.key === "Enter") { event.preventDefault(); chooseFluencyCandidate(choiceFocus); }
});
el("fluency-continue").addEventListener("click", () => {
  if (!characterSolved) return;
  if (characterIndex === activeCharacters.length - 1) completeExercise();
  else { characterIndex++; renderCharacter(); }
});
el("fluency-repeat").addEventListener("click", () => startExercise(fluencyMode, activeId));
el("fluency-next").addEventListener("click", async () => {
  if (fluencyMode === "vocab") {
    const next = (activeId + 1) % learningData.wordCount;
    try { await loadVocabPart(Math.floor(next / learningData.vocabChunkSize)); }
    catch (_) { showVocabLoadError(); return; }
    if (fluencyMode !== "vocab") return;
    startExercise("vocab", next);
    renderVocabResults();
  } else if (fluencyMode === "sentence") {
    const next = (activeId + 1) % readingData.sentences.length;
    selectedSentenceGroup = readingData.sentences[next].category;
    renderSentenceGroups();
    startExercise("sentence", next);
    renderSentenceResults();
  } else {
    const next = (activeId + 1) % readingData.paragraphs.length;
    selectedParagraphLevel = readingData.paragraphs[next].level;
    renderParagraphLevels();
    startExercise("paragraph", next);
    renderParagraphResults();
  }
});

async function loadAllVocabParts(token) {
  const count = Math.ceil(learningData.wordCount / learningData.vocabChunkSize);
  let cursor = 0;
  async function worker() {
    while (cursor < count && token === vocabRenderToken) {
      const index = cursor++;
      await loadVocabPart(index);
      if (token === vocabRenderToken && (loadedVocabParts.size % 5 === 0 || loadedVocabParts.size === count)) {
        el("vocab-result-count").textContent = `正在搜尋詞庫… ${loadedVocabParts.size} / ${count} 部分`;
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(4, count) }, worker));
}
async function renderVocabResults() {
  if (!learningData.words) return;
  const token = ++vocabRenderToken;
  const query = el("vocab-search").value.trim();
  const rangeStart = selectedVocabStart;
  const rangeEnd = rangeStart === 0 ? 100 : rangeStart === 100 ? 1000 : rangeStart === 1000 ? 10000 : learningData.wordCount;
  let resultCount = rangeEnd - rangeStart;
  let pageCount = Math.max(1, Math.ceil(resultCount / PAGE_SIZE));
  vocabPage = Math.min(vocabPage, pageCount - 1);
  el("vocab-search-retry").hidden = true;
  try {
    if (query) {
      el("vocab-result-count").textContent = "正在搜尋完整詞庫…";
      el("vocab-results").replaceChildren();
      el("vocab-prev").disabled = true;
      el("vocab-next").disabled = true;
      await loadAllVocabParts(token);
      if (token !== vocabRenderToken) return;
      queryResults = [];
      learningData.words.forEach((word, index) => { if (word.includes(query)) queryResults.push(index); });
      resultCount = queryResults.length;
      pageCount = Math.max(1, Math.ceil(resultCount / PAGE_SIZE));
      vocabPage = Math.min(vocabPage, pageCount - 1);
    } else {
      const first = rangeStart + vocabPage * PAGE_SIZE;
      await loadVocabPart(Math.floor(first / learningData.vocabChunkSize));
      if (token !== vocabRenderToken) return;
    }
  } catch (_) {
    if (token === vocabRenderToken) {
      el("vocab-result-count").textContent = "詞庫暫時載入唔到，請再試一次。";
      el("vocab-results").replaceChildren();
      el("vocab-prev").disabled = true;
      el("vocab-next").disabled = true;
      el("vocab-search-retry").hidden = false;
    }
    return;
  }
  const offset = vocabPage * PAGE_SIZE;
  const shown = query ? queryResults.slice(offset, offset + PAGE_SIZE)
    : Array.from({ length: Math.min(PAGE_SIZE, resultCount - offset) }, (_, index) => rangeStart + offset + index);
  const list = el("vocab-results");
  list.replaceChildren();
  shown.forEach(index => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `vocab-result${fluencyMode === "vocab" && activeId === index ? " active" : ""}`;
    button.setAttribute("aria-label", `練習詞語「${learningData.words[index]}」，常用次序 ${index + 1}`);
    const word = document.createElement("strong");
    word.textContent = learningData.words[index];
    const meta = document.createElement("span");
    meta.textContent = fluentDone.has(itemIdentity("vocab", index))
      ? (practiceMode === "native" ? "已實打" : "已拆碼")
      : `#${(index + 1).toLocaleString("en-US")}`;
    button.append(word, meta);
    button.addEventListener("click", () => {
      startExercise("vocab", index);
      renderVocabResults();
      if (window.innerWidth <= 850) el("fluency-practice").scrollIntoView({ behavior:"smooth", block:"start" });
    });
    list.append(button);
  });
  el("vocab-result-count").textContent = resultCount
    ? `搵到 ${resultCount.toLocaleString("en-US")} 條 · 顯示 ${offset + 1}–${offset + shown.length}`
    : "搵唔到呢個詞語，試另一個字。";
  el("vocab-page").textContent = `${vocabPage + 1} / ${pageCount}`;
  el("vocab-prev").disabled = vocabPage === 0;
  el("vocab-next").disabled = vocabPage >= pageCount - 1;
}
el("vocab-search").addEventListener("input", () => { vocabPage = 0; renderVocabResults(); });
el("vocab-search-retry").addEventListener("click", renderVocabResults);
function renderVocabRanges() {
  [...el("vocab-range").children].forEach(button => {
    const active = Number(button.dataset.start) === selectedVocabStart;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
}
[...el("vocab-range").children].forEach(button => button.addEventListener("click", () => {
  selectedVocabStart = Number(button.dataset.start);
  el("vocab-search").value = "";
  vocabPage = 0;
  renderVocabRanges();
  renderVocabResults();
}));
el("vocab-prev").addEventListener("click", () => { vocabPage--; renderVocabResults(); });
el("vocab-next").addEventListener("click", () => { vocabPage++; renderVocabResults(); });

const sentenceGroups = [...new Set(readingData.sentences.map(sentence => sentence.category))];
function renderSentenceGroups() {
  const group = el("sentence-group");
  group.replaceChildren();
  sentenceGroups.forEach(category => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = category;
    button.className = category === selectedSentenceGroup ? "active" : "";
    button.setAttribute("aria-pressed", String(category === selectedSentenceGroup));
    button.addEventListener("click", () => { selectedSentenceGroup = category; renderSentenceGroups(); renderSentenceResults(); });
    group.append(button);
  });
}
function renderSentenceResults() {
  const list = el("sentence-results");
  list.replaceChildren();
  readingData.sentences.forEach((sentence, index) => {
    if (sentence.category !== selectedSentenceGroup) return;
    const button = document.createElement("button");
    button.type = "button";
    button.className = `sentence-result${fluencyMode === "sentence" && activeId === index ? " active" : ""}`;
    button.textContent = `${String(index + 1).padStart(2, "0")} · ${sentence.text}${fluentDone.has(itemIdentity("sentence", index)) ? " ✓" : ""}`;
    button.addEventListener("click", () => {
      startExercise("sentence", index);
      renderSentenceResults();
      if (window.innerWidth <= 850) el("fluency-practice").scrollIntoView({ behavior:"smooth", block:"start" });
    });
    list.append(button);
  });
}
const paragraphLevels = ["起步", "進一步", "完整篇章"];
function renderParagraphLevels() {
  const group = el("paragraph-level");
  group.replaceChildren();
  paragraphLevels.forEach(level => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = level;
    button.className = level === selectedParagraphLevel ? "active" : "";
    button.setAttribute("aria-pressed", String(level === selectedParagraphLevel));
    button.addEventListener("click", () => { selectedParagraphLevel = level; renderParagraphLevels(); renderParagraphResults(); });
    group.append(button);
  });
}
function renderParagraphResults() {
  const list = el("paragraph-results");
  list.replaceChildren();
  readingData.paragraphs.forEach((paragraph, index) => {
    if (paragraph.level !== selectedParagraphLevel) return;
    const button = document.createElement("button");
    button.type = "button";
    button.className = `paragraph-result${fluencyMode === "paragraph" && activeId === index ? " active" : ""}`;
    const meta = document.createElement("span");
    meta.textContent = `${String(index + 1).padStart(2, "0")} · ${paragraph.category} · ${MANCHAI_TYPING.characters(paragraph.text).length} 字`;
    const title = document.createElement("strong");
    title.textContent = paragraph.title;
    const preview = document.createElement("small");
    preview.textContent = paragraph.text.slice(0, 40) + "…";
    const status = document.createElement("b");
    status.textContent = fluentDone.has(itemIdentity("paragraph", index)) ? "已完成 ✓" : "開始練習 ↗";
    button.append(meta, title, preview, status);
    button.addEventListener("click", () => {
      startExercise("paragraph", index);
      renderParagraphResults();
      if (window.innerWidth <= 850) el("fluency-practice").scrollIntoView({ behavior:"smooth", block:"start" });
    });
    list.append(button);
  });
}
function switchFluencyMode(mode) {
  fluencyMode = mode;
  for (const name of ["sentence", "paragraph", "vocab"]) {
    el(`${name}-mode`).classList.toggle("active", name === mode);
    el(`${name}-mode`).setAttribute("aria-selected", String(name === mode));
    el(`${name}-browser`).hidden = name !== mode;
  }
  el("fluency-panel").setAttribute("aria-labelledby", `${mode}-mode`);
  if (mode === "vocab") {
    if (loadedVocabParts.has(0) && loadedVocabParts.has(Math.floor(lastVocabId / learningData.vocabChunkSize))) activateVocab();
    else {
      el("fluency-practice").hidden = true;
      el("vocab-loading").hidden = false;
      loadVocabulary();
    }
    return;
  }
  el("vocab-loading").hidden = true;
  el("fluency-practice").hidden = false;
  if (mode === "sentence") {
    selectedSentenceGroup = readingData.sentences[lastSentenceId].category;
    renderSentenceGroups();
    startExercise("sentence", lastSentenceId);
    renderSentenceResults();
  } else if (mode === "paragraph") {
    selectedParagraphLevel = readingData.paragraphs[lastParagraphId].level;
    renderParagraphLevels();
    startExercise("paragraph", lastParagraphId);
    renderParagraphResults();
  }
}
function activateVocab() {
  el("vocab-loading").hidden = true;
  el("fluency-practice").hidden = false;
  startExercise("vocab", lastVocabId);
  renderVocabResults();
}
function loadVocabPart(index) {
  if (loadedVocabParts.has(index)) return Promise.resolve();
  if (pendingVocabParts.has(index)) return pendingVocabParts.get(index);
  const promise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `data/vocab-part-${index}.js`;
    script.async = true;
    script.onload = () => {
      pendingVocabParts.delete(index);
      const part = window.MANCHAI_VOCAB_PARTS?.[index];
      const expected = Math.min(learningData.vocabChunkSize, learningData.wordCount - index * learningData.vocabChunkSize);
      if (!part || part.words.length !== expected) { reject(new Error("Incomplete vocabulary part")); return; }
      if (!learningData.words) learningData.words = new Array(learningData.wordCount);
      part.words.forEach((word, offset) => { learningData.words[index * learningData.vocabChunkSize + offset] = word; });
      if (part.candidates) learningData.candidates = part.candidates;
      loadedVocabParts.add(index);
      delete window.MANCHAI_VOCAB_PARTS[index];
      resolve();
    };
    script.onerror = () => { pendingVocabParts.delete(index); reject(new Error("Vocabulary download failed")); };
    document.head.append(script);
  });
  pendingVocabParts.set(index, promise);
  return promise;
}
async function loadVocabulary() {
  if (vocabLoading) return;
  vocabLoading = true;
  el("vocab-loading-title").textContent = "正在載入詞庫…";
  el("vocab-loading-text").textContent = "先載入需要練嘅詞語；其餘部分用到先下載。";
  el("vocab-retry").hidden = true;
  try {
    await loadVocabPart(0);
    await loadVocabPart(Math.floor(lastVocabId / learningData.vocabChunkSize));
    if (fluencyMode === "vocab") activateVocab();
  } catch (_) { showVocabLoadError(); }
  finally { vocabLoading = false; }
}
function showVocabLoadError() {
  if (fluencyMode !== "vocab") return;
  el("vocab-loading-title").textContent = "詞庫暫時載入唔到";
  el("vocab-loading-text").textContent = "檢查網絡連線，或者再試一次。句子同段落練習仍然可以照常使用。";
  el("vocab-retry").hidden = false;
}
el("vocab-retry").addEventListener("click", loadVocabulary);
el("vocab-mode").addEventListener("click", () => switchFluencyMode("vocab"));
el("sentence-mode").addEventListener("click", () => switchFluencyMode("sentence"));
el("paragraph-mode").addEventListener("click", () => switchFluencyMode("paragraph"));

el("vocab-total").textContent = learningData.wordCount.toLocaleString("en-US");
el("sentence-total").textContent = readingData.sentences.length;
el("paragraph-total").textContent = readingData.paragraphs.length;
renderVocabRanges();
renderSentenceGroups();
renderParagraphLevels();
renderSentenceResults();
renderParagraphResults();
startExercise("sentence", 0);
