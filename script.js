const rootChapters = [
  { title:"先認常見形狀", codes:"MDROAB" },
  { title:"再認筆畫同方向", codes:"NUHGCE" },
  { title:"偏旁同外框", codes:"FJKVWY" },
  { title:"補齊其餘字根", codes:"ILPQST" }
];
const roots = rootChapters.flatMap((chapter, group) => [...chapter.codes].map(code => ({
  character:rootByCode[code], code, group,
  clue:`先睇清楚「${rootByCode[code]}」嘅外形，再喺下方鍵位表搵佢屬於邊個英文字母。`
})));

// Full Cangjie 5 codes checked against Rime's cangjie5.base.dict.yaml.
const wordChapters = [
  { title:"重複字根", description:"先睇結構重複嘅字，練習只取開頭同結尾。", entries:[
    ["二","MM","兩條橫畫上下排，留意第一筆同最後一筆。"],
    ["三","MMM","三條橫畫；速成唔使逐筆打晒。"],
    ["五","MDM","參照上面已拆嘅示範，再自己試一次。"],
    ["林","DD","兩棵樹並排，由左邊睇到右邊。"],
    ["森","DDD","三個相同部件，試吓搵最初同最後嗰個。"],
    ["昌","AA","上下一樣嘅部件，兩端都要留意。"],
    ["晶","AAA","三個相同部件，取頭同尾就夠。"],
    ["品","RRR","三個方框排成品字形，中間嗰個可以略過。"]
  ]},
  { title:"左右與上下", description:"分辨字嘅起點同終點，開始接觸唔同字根。", entries:[
    ["朋","BB","左右兩邊都係月形，試睇左右次序。"],
    ["明","AB","左邊光亮，右邊似月形。"],
    ["本","DM","樹木下面加一橫，起點同尾端唔一樣。"],
    ["休","OD","左邊係站立嘅人形，右邊係樹木。","左邊「亻」係「人」嘅輔助字形。"],
    ["仁","OMM","左邊係人形，右邊係兩橫。","「亻」歸入「人」字根。"],
    ["全","OMG","由上方人形睇到下方，唔好將中間碼當尾碼。"],
    ["合","OMR","先睇頂部，再睇最底嘅方框。"],
    ["江","EM","左邊三點水，右邊字形有橫畫。","「氵」係「水」嘅輔助字形。"]
  ]},
  { title:"由圖拆字", description:"練字形變化，唔好只憑讀音猜碼。", entries:[
    ["倉","OIAR","由頂部人形開始，最後睇最下方嘅框。"],
    ["色","NAU","上方彎形同下方收尾形狀唔同。"],
    ["學","HBND","筆畫多都只取首碼同尾碼，唔使一次記晒中間。"],
    ["頡","GRMBC","先拆左半邊嘅起點，再睇右半邊嘅終點。","左邊嘅「士」歸入「土」字根。"],
    ["出","UU","上下都見到山形，留意取碼次序。"],
    ["上","YM","睇最先一筆同下方嘅橫畫。"],
    ["下","MY","由上面嘅橫畫，睇到下面嘅收尾。"],
    ["字","JND","屋頂包住下面嘅字，試搵整個字嘅起點同終點。"]
  ]},
  { title:"生活常用字", description:"同一個碼可能有好多字，記得練埋選字。", entries:[
    ["宇","JMD","屋頂底下有另一部分；取整個字最前同最後。"],
    ["好","VND","左右兩部分，由女字旁開始睇。"],
    ["他","OPD","左邊人形開始，再睇右邊最後嘅形狀。","「亻」歸入「人」字根。"],
    ["今","OIN","上方人形包住下半部分，試由上到下拆。"],
    ["們","OAN","左邊人形，右邊有門形；搵最尾一碼。","「亻」歸入「人」字根。"],
    ["你","ONF","左邊人形，右邊下面有小點。","「亻」歸入「人」字根。"],
    ["和","HDR","左邊禾形開始，右邊方框作結。"],
    ["看","HQBU","上面似手形，下面有目形；記得只留兩端。"]
  ]},
  { title:"進階形狀", description:"練習輔助字形同較長嘅完整倉頡碼。", entries:[
    ["家","JMSO","屋頂下面有好多筆，只需要頭尾。"],
    ["炎","FF","上下兩個火形，試睇重複字根。"],
    ["圭","GG","兩個土形上下疊住。"],
    ["右","KR","上方同下方形狀唔同。"],
    ["狗","KHPR","左邊係犬形偏旁，右邊有框。"],
    ["貓","BHTW","部件多，先找最左上嘅起點，再睇最右下。"],
    ["腦","BVVW","左邊月形開始，右邊嘅最後一碼較遠。"],
    ["樂","VID","由上到下有多個部分，試分清最後落喺邊。"]
  ]}
];
wordChapters.push(...window.MANCHAI_DATA.chapters.map(chapter => ({
  title: chapter.title,
  description: chapter.description,
  entries: chapter.entries
})));
const words = wordChapters.flatMap((chapter, group) => chapter.entries.map(([character, full, clue, aux]) => ({
  character, full, code:full.length === 1 ? full : full[0] + full.at(-1),
  clue: clue || "先觀察呢個字嘅起點同終點；唔識就逐步揭開字根，再喺鍵位表搵英文字母。", aux, group,
  first:rootByCode[full[0]], last:rootByCode[full.at(-1)]
})));
// Every character in a pool shares its Quick code. The order here is a teaching simulation.
const candidatePools = {
  MM:"二三五工", DD:"林森李", AA:"昌晶暗", RR:"品呂唔", BB:"朋骨肺",
  AB:"明晴閒", DM:"本查杠", OD:"休他余", OM:"仁伍但", OG:"全坐任",
  OR:"合倉估", EM:"江洹溺", NU:"色免危", HD:"學禾季", GC:"頡赤填",
  UU:"出艷崛", YM:"上止試", MY:"下雨霉", JD:"字宇宋", VD:"好她樂",
  ON:"今們倒", OF:"你焦伙", HR:"和向告", HU:"看自先", JO:"家定蹇",
  FF:"炎燃煉", GG:"圭埋堆", KR:"右狗奇", BW:"貓腦瞄"
};
Object.assign(candidatePools, window.MANCHAI_DATA.candidates);

const $ = selector => document.querySelector(selector);
const storageKey = "sucheng-studio-progress-v1";
let completed = new Set();
try {
  const saved = JSON.parse(localStorage.getItem(storageKey) || "[]");
  if (Array.isArray(saved)) completed = new Set(saved.filter(value => typeof value === "string"));
} catch (_) { completed = new Set(); }
let lesson = "roots", index = 0, hintLevel = 0, codeAccepted = false, solvedThisVisit = false;
const lessonPositionKey = "manchai-lesson-position-v1";
const savedLessonPosition = window.MANCHAI_STORAGE.read(lessonPositionKey, null);
if (savedLessonPosition && ["roots", "words"].includes(savedLessonPosition.lesson)) {
  const savedIndex = (savedLessonPosition.lesson === "roots" ? roots : words).findIndex(item => item.character === savedLessonPosition.character);
  if (savedIndex >= 0) { lesson = savedLessonPosition.lesson; index = savedIndex; }
}
let candidateChoices = [], candidateFocus = 0, candidateMisses = new Set();
const dataFor = () => lesson === "roots" ? roots : words;
const itemKey = (type, item) => `${type}:${item.character}`;
const currentItem = () => dataFor()[index];
const pad = number => String(number).padStart(2, "0");
const chapterStart = [];
wordChapters.reduce((offset, chapter, group) => {
  chapterStart[group] = offset;
  return offset + chapter.entries.length;
}, 0);

function diagramMarkup(item, position, level = 0) {
  const first = level >= 1 ? item.first : "？";
  const last = level >= 2 ? item.last : "？";
  const firstCode = level >= 3 ? item.code[0] : "?";
  const lastCode = level >= 3 ? item.code.at(-1) : "?";
  const label = level >= 3 ? `首碼 ${first} ${firstCode}，尾碼 ${last} ${lastCode}`
    : level === 2 ? `首碼字根 ${first}，尾碼字根 ${last}；鍵位待探索`
    : level === 1 ? `首碼字根 ${first}；尾碼待探索` : "首尾拆碼待探索";
  const matched = window.MANCHAI_GLYPH.info(item.character, item.full);
  const glyph = window.MANCHAI_GLYPH.markup(item.character, item.full);
  return `<div class="glyph-diagram" data-hint-level="${level}" role="img" aria-label="${item.character}：${label}">
    <div class="diagram-topline"><span>首尾圖解</span><span>${pad(position + 1)} / ${pad(words.length)}</span></div>
    <div class="diagram-body">
      <span class="diagram-annotation first"><small>首碼</small><strong>${first}</strong><b>${firstCode}</b></span>
      <span class="diagram-glyph${matched ? " has-strokes" : ""}" aria-hidden="true">${glyph}</span>
      <span class="diagram-annotation last"><small>尾碼</small><strong>${last}</strong><b>${lastCode}</b></span>
    </div><div class="diagram-bars" aria-hidden="true"><span></span><span></span></div>
  </div>`;
}
function diagramCaption(item, level) {
  const copy = window.MANCHAI_DIAGRAMS?.copy;
  if (!copy) return "首尾答案會跟住提示逐步顯示";
  if (!level) return copy.hidden;
  const drawing = window.MANCHAI_DIAGRAMS.glyphs[item.character];
  if (!drawing || drawing[0] !== item.full || !drawing[1] && !drawing[2]) return copy.unavailable;
  if (drawing[3]) return copy.single;
  if (!drawing[1] || level >= 2 && !drawing[2]) return copy.partial;
  return level >= 2 ? copy.both : copy.first;
}
function saveProgress() {
  completed = new Set(window.MANCHAI_STORAGE.mergeCompleted(storageKey, completed));
}
function renderProgress() {
  const items = dataFor();
  const count = items.filter(item => completed.has(itemKey(lesson, item))).length;
  const group = currentItem().group;
  const chapterItems = items.filter(item => item.group === group);
  const chapterCount = chapterItems.filter(item => completed.has(itemKey(lesson, item))).length;
  $("#progress-text").textContent = `本組 ${chapterCount}/${chapterItems.length} · 全部 ${count}/${items.length}`;
  $("#progress-fill").style.transform = `scaleX(${chapterCount / chapterItems.length})`;
}
function renderList() {
  const list = $("#lesson-list");
  list.replaceChildren();
  const currentGroup = currentItem().group;
  const start = lesson === "roots" ? currentGroup * 6 : chapterStart[currentGroup];
  const chapterItems = dataFor().filter(item => item.group === currentGroup);
  chapterItems.forEach((item, localIndex) => {
    const itemIndex = start + localIndex;
    const done = completed.has(itemKey(lesson, item));
    const button = document.createElement("button");
    button.type = "button";
    button.className = `lesson-item${itemIndex === index ? " active" : ""}${done ? " done" : ""}`;
    button.setAttribute("aria-current", itemIndex === index ? "step" : "false");
    button.setAttribute("aria-label", `${pad(localIndex + 1)}，${item.character}，${done ? "已完成" : "未完成"}`);
    button.innerHTML = `<span class="lesson-index">${pad(localIndex + 1)}</span><span class="lesson-symbol">${item.character}</span><span class="lesson-code">${done ? "已學" : "未練"}</span>`;
    button.addEventListener("click", () => { index = itemIndex; resetQuestion(); render(); });
    list.append(button);
  });
  const active = list.querySelector(".active");
  if (active) {
    const itemRect = active.getBoundingClientRect();
    const listRect = list.getBoundingClientRect();
    if (list.scrollHeight > list.clientHeight) list.scrollTop += itemRect.top - listRect.top - 48;
    if (list.scrollWidth > list.clientWidth) list.scrollLeft += itemRect.left - listRect.left - 16;
  }
}
function setFeedback(message, kind = "") {
  const feedback = $("#answer-feedback");
  feedback.textContent = message;
  feedback.className = `answer-feedback${kind ? ` ${kind}` : ""}`;
  $("#answer-input").setAttribute("aria-invalid", kind === "error" ? "true" : "false");
}
function setCandidateFeedback(message, kind = "") {
  const feedback = $("#candidate-feedback");
  feedback.textContent = message;
  feedback.className = `candidate-feedback${kind ? ` ${kind}` : ""}`;
}
function renderHints() {
  const item = currentItem(), isRoot = lesson === "roots";
  const level = codeAccepted ? 3 : hintLevel;
  $("#study-diagram").innerHTML = isRoot ? "" : diagramMarkup(item, index, level);
  $("#root-visual").setAttribute("data-hint-level", level);
  $("#study-diagram").parentElement?.querySelector(".visual-caption")?.replaceChildren(document.createTextNode(diagramCaption(item, level)));
  $("#first-root").textContent = isRoot ? item.character : level >= 1 ? item.first : "？";
  $("#first-code").textContent = level >= (isRoot ? 1 : 3) ? item.code[0] : "?";
  $("#last-root").textContent = !isRoot && level >= 2 ? item.last : "？";
  $("#last-code").textContent = !isRoot && level >= 3 ? item.code.at(-1) : "?";
  $("#hint-button").disabled = codeAccepted || level >= (isRoot ? 1 : 3);
  $("#reveal-button").disabled = codeAccepted || level >= (isRoot ? 1 : 3);
  if (codeAccepted) return;
  $("#study-overline").textContent = level ? `提示 ${level} · 可以再自己試打` : "先觀察，答案暫時收起";
  if (isRoot && level) setFeedback(`「${item.character}」係 ${item.code} 鍵。試自己打一次。`);
  if (!isRoot && level === 1) setFeedback(`首碼字根係「${item.first}」。試搵佢嘅鍵位；需要時可以再按提示。`);
  if (!isRoot && level === 2) setFeedback(`尾碼字根係「${item.last}」。而家試打兩個英文字母。`);
  if (!isRoot && level === 3) setFeedback(`完整答案係 ${item.code}。跟住自己打一次，再練選字。`);
}
function resetQuestion() {
  hintLevel = 0; codeAccepted = false; solvedThisVisit = false;
  candidateChoices = []; candidateFocus = 0; candidateMisses = new Set();
}
function render() {
  const isRoot = lesson === "roots", item = currentItem();
  const chapters = isRoot ? rootChapters : wordChapters;
  const chapterOptions = $("#chapter-options");
  chapterOptions.replaceChildren();
  chapters.forEach((chapter, group) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `chapter-option${group === item.group ? " active" : ""}`;
    button.textContent = `${pad(group + 1)} · ${chapter.title}（${isRoot ? 6 : chapter.entries.length} 字）`;
    button.setAttribute("aria-pressed", String(group === item.group));
    button.addEventListener("click", () => {
      index = isRoot ? group * 6 : chapterStart[group];
      chapterOptions.hidden = true;
      $("#chapter-toggle").setAttribute("aria-expanded", "false");
      resetQuestion();
      render();
    });
    chapterOptions.append(button);
  });
  $("#chapter-current").textContent = `${pad(item.group + 1)} · ${chapters[item.group].title}`;
  const localIndex = isRoot ? index % 6 : index - chapterStart[item.group];
  const chapterSize = isRoot ? 6 : wordChapters[item.group].entries.length;
  $("#roots-tab").classList.toggle("active", isRoot);
  $("#roots-tab").setAttribute("aria-selected", String(isRoot));
  $("#words-tab").classList.toggle("active", !isRoot);
  $("#words-tab").setAttribute("aria-selected", String(!isRoot));
  $("#lesson-panel").setAttribute("aria-labelledby", isRoot ? "roots-tab" : "words-tab");
  $("#lesson-number").textContent = `第 ${item.group + 1} 組 · ${pad(localIndex + 1)} / ${pad(chapterSize)}`;
  $("#lesson-title").textContent = isRoot ? rootChapters[item.group].title : wordChapters[item.group].title;
  $("#lesson-description").textContent = isRoot ? "認得頭幾個就可以轉去拆字；唔使一口氣背晒。" : wordChapters[item.group].description;
  $("#study-type").textContent = isRoot ? "字根練習" : `拆字練習 · 第${item.group + 1}組`;
  $("#item-position").textContent = `${pad(index + 1)} / ${pad(dataFor().length)}`;
  $("#root-visual").hidden = !isRoot;
  $("#word-visual").hidden = isRoot;
  $("#root-character").textContent = item.character;
  $("#study-character").textContent = item.character;
  $("#study-hint").textContent = item.clue;
  $("#code-breakdown").setAttribute("aria-label", isRoot ? "字根鍵位提示" : "首尾字根提示");
  $("#last-part").hidden = isRoot;
  $("#answer-label").textContent = isRoot ? "試吓打出呢個字根嘅英文字母" : "試吓打出首碼同尾碼（兩個英文字母）";
  $("#answer-input").maxLength = isRoot ? 1 : 2;
  $("#answer-input").value = "";
  $("#answer-input").disabled = false;
  $("#check-button").disabled = false;
  $("#candidate-panel").hidden = true;
  $("#review-panel").hidden = true;
  $("#next-button").textContent = index === dataFor().length - 1 ? "跳過，返第一題 →" : "跳過，下一題 →";
  $("#previous-button").disabled = index === 0;
  setFeedback("答案已收起。可以先試，唔識再睇提示。");
  renderHints();
  renderList();
  renderProgress();
  window.MANCHAI_STORAGE.write(lessonPositionKey, {lesson, character:item.character});
}
function explanation(item) {
  if (lesson === "roots") return `「${item.character}」係基本字根，對應 ${item.code} 鍵。見到佢做字根或者相關輔助字形，可以由呢個鍵開始諗。`;
  const full = item.full.length > 2 ? `完整倉頡碼係 ${item.full}；中間碼唔使打。` : `完整倉頡碼係 ${item.full}。`;
  return `${full}速成取第一碼 ${item.code[0]}（${item.first}）同最後一碼 ${item.code.at(-1)}（${item.last}），所以打 ${item.code}。${item.aux || ""}`;
}
function markComplete() {
  const item = currentItem();
  solvedThisVisit = true;
  completed.add(itemKey(lesson, item));
  saveProgress();
  $("#review-explanation").textContent = explanation(item);
  $("#review-panel").hidden = false;
  $("#study-overline").textContent = "完成 · 睇返點樣拆";
  $("#next-button").textContent = index === dataFor().length - 1 ? "返第一題 →" : "下一題 →";
  renderList();
  renderProgress();
  updateGalleryStatus();
}
function choicesFor(item, position) {
  const choices = [...(candidatePools[item.code] || "")].filter(character => character !== item.character).slice(0, 2);
  choices.splice(position % (choices.length + 1), 0, item.character);
  return choices;
}
function updateCandidateFocus() {
  [...$("#candidate-list").children].forEach((button, optionIndex) => {
    button.classList.toggle("focused", optionIndex === candidateFocus);
    button.classList.toggle("missed", candidateMisses.has(optionIndex));
  });
}
function chooseCandidate(choiceIndex) {
  if (solvedThisVisit || choiceIndex < 0 || choiceIndex >= candidateChoices.length) return;
  const item = currentItem();
  candidateFocus = choiceIndex;
  if (candidateChoices[choiceIndex] !== item.character) {
    candidateMisses.add(choiceIndex);
    setCandidateFeedback(`呢個係「${candidateChoices[choiceIndex]}」。再睇清楚目標字「${item.character}」。`, "error");
    updateCandidateFocus();
    return;
  }
  setCandidateFeedback(`揀啱「${item.character}」！你已完成打碼同選字。`, "success");
  updateCandidateFocus();
  $("#candidate-list").children[choiceIndex].classList.add("correct");
  markComplete();
}
function showCandidates() {
  const item = currentItem();
  candidateChoices = choicesFor(item, index);
  candidateFocus = 0;
  $("#candidate-target").textContent = item.character;
  const list = $("#candidate-list");
  list.replaceChildren();
  candidateChoices.forEach((character, choiceIndex) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "candidate-option";
    button.setAttribute("aria-label", `候選 ${choiceIndex + 1}：${character}`);
    button.innerHTML = `<span>${choiceIndex + 1}</span><strong>${character}</strong>`;
    button.addEventListener("click", () => chooseCandidate(choiceIndex));
    list.append(button);
  });
  $("#candidate-panel").hidden = false;
  setCandidateFeedback("先睇清楚，唔使急住揀。");
  updateCandidateFocus();
  $("#candidate-panel").focus();
}
$("#answer-form").addEventListener("submit", event => {
  event.preventDefault();
  if (codeAccepted) return;
  const answer = $("#answer-input").value.trim().toUpperCase(), item = currentItem();
  if (!answer) { setFeedback("先輸入英文字母，再檢查。", "error"); return; }
  if (answer !== item.code) { setFeedback("未啱。先睇字形，或者按「逐步提示」再試。", "error"); return; }
  codeAccepted = true;
  $("#answer-input").disabled = true;
  $("#check-button").disabled = true;
  renderHints();
  if (lesson === "roots") {
    setFeedback(`答啱！「${item.character}」對應 ${item.code}。`, "success");
    markComplete();
  } else {
    setFeedback(`打啱 ${item.code}。而家要喺同碼候選字入面揀「${item.character}」。`, "success");
    $("#study-overline").textContent = "第一步完成 · 練習選字";
    showCandidates();
  }
});
$("#hint-button").addEventListener("click", () => { hintLevel = Math.min(lesson === "roots" ? 1 : 3, hintLevel + 1); renderHints(); });
$("#reveal-button").addEventListener("click", () => {
  hintLevel = 3; renderHints();
  setFeedback(`答案係 ${currentItem().code}。照住打一次，先算完成練習。`);
});
$("#candidate-panel").addEventListener("keydown", event => {
  if ($("#candidate-panel").hidden || solvedThisVisit) return;
  if (/^[1-3]$/.test(event.key)) { event.preventDefault(); chooseCandidate(Number(event.key) - 1); }
  else if (["ArrowRight","ArrowDown","ArrowLeft","ArrowUp"].includes(event.key)) {
    event.preventDefault();
    candidateFocus = (candidateFocus + (["ArrowRight","ArrowDown"].includes(event.key) ? 1 : -1) + candidateChoices.length) % candidateChoices.length;
    updateCandidateFocus();
  } else if (event.key === "Enter") { event.preventDefault(); chooseCandidate(candidateFocus); }
});
function switchLesson(type) { lesson = type; index = 0; resetQuestion(); render(); }
$("#roots-tab").addEventListener("click", () => switchLesson("roots"));
$("#words-tab").addEventListener("click", () => switchLesson("words"));
$("#chapter-toggle").addEventListener("click", () => {
  const options = $("#chapter-options");
  options.hidden = !options.hidden;
  $("#chapter-toggle").setAttribute("aria-expanded", String(!options.hidden));
});
$("#chapter-options").addEventListener("keydown", event => {
  if (event.key === "Escape") {
    $("#chapter-options").hidden = true;
    $("#chapter-toggle").setAttribute("aria-expanded", "false");
    $("#chapter-toggle").focus();
  }
});
$("#previous-button").addEventListener("click", () => { if (index > 0) { index--; resetQuestion(); render(); } });
$("#next-button").addEventListener("click", () => { index = (index + 1) % dataFor().length; resetQuestion(); render(); });

const keyboardGrid = $("#keyboard-grid");
keyboard.forEach(([code, character]) => {
  const key = document.createElement("div");
  key.className = `keyboard-key${"MDROAB".includes(code) ? " featured" : ""}`;
  key.innerHTML = `<span class="keyboard-letter">${code}</span><span class="keyboard-root">${character}</span>`;
  keyboardGrid.append(key);
});
$("#learn-diagram").innerHTML = diagramMarkup(words.find(item => item.character === "五"), 2, 3);
$("#diagram-credit").textContent = window.MANCHAI_DIAGRAMS?.copy.credit || "";
const gallery = $("#diagram-grid");
function updateGalleryStatus() {
  [...gallery.children].forEach((button, group) => {
    const count = words.filter(item => item.group === group && completed.has(itemKey("words", item))).length;
    button.querySelector(".diagram-choice-status").textContent = `${count} / ${wordChapters[group].entries.length} 已學`;
  });
}
wordChapters.forEach((chapter, group) => {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "diagram-choice course-card";
  button.setAttribute("aria-label", `開始第${group + 1}組：${chapter.title}`);
  button.innerHTML = `<span class="diagram-choice-number">${pad(group + 1)} / ${group < 5 ? "入門" : "常用字"}</span><strong>${chapter.title}</strong><span class="course-preview">${chapter.entries.slice(0, 8).map(entry => entry[0]).join(" ")}</span><span class="diagram-choice-status">0 / ${chapter.entries.length} 已學</span>`;
  button.addEventListener("click", () => {
    lesson = "words"; index = chapterStart[group]; resetQuestion(); render();
    $("#practice").scrollIntoView({ behavior:"smooth", block:"start" });
  });
  gallery.append(button);
});
$("#reference-count").textContent = `${wordChapters.length} 組課程 · ${words.length.toLocaleString("en-US")} 個練習字`;
updateGalleryStatus();
render();
