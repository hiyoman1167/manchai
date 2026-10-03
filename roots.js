const rootGuide = window.MANCHAI_ROOT_GUIDE;
const rootIndex = document.getElementById("root-index");
const rootFamilies = document.getElementById("root-families");
const groupKeys = [
  ["哲理類", "日月金木水火土"],
  ["筆劃類", "竹戈十大中一弓"],
  ["人身類", "人心手口"],
  ["字形類", "尸廿山女田卜"],
];

function codedLetters(code, key) {
  const span = document.createElement("span");
  span.className = "shape-code";
  [...code].forEach(letter => {
    const kbd = document.createElement("kbd");
    kbd.textContent = letter;
    if (letter === key) kbd.className = "used-key";
    span.append(kbd);
  });
  return span;
}

function makeShape(item, root) {
  const figure = document.createElement("figure");
  figure.className = "shape-sample";
  const picture = document.createElement("div");
  picture.className = "shape-picture";
  const image = document.createElement("img");
  image.src = `assets/root-shapes/${item.id}.png`;
  image.alt = `${root.root}（${root.key}）嘅輔助字形`;
  image.loading = "lazy";
  image.decoding = "async";
  image.width = 120;
  image.height = 120;
  picture.append(image);
  const caption = document.createElement("figcaption");
  const example = document.createElement("strong");
  example.textContent = item.example;
  const relation = document.createElement("small");
  relation.textContent = item.direct ? "對應例字" : "同組例字";
  const full = document.createElement("span");
  full.textContent = "完整碼 ";
  full.append(codedLetters(item.full, root.key));
  const quick = document.createElement("span");
  quick.textContent = "速成碼 ";
  quick.append(codedLetters(item.quick, root.key));
  caption.append(relation, example, full, quick);
  figure.append(picture, caption);
  return figure;
}

rootGuide.forEach(root => {
  const jump = document.createElement("a");
  jump.href = `#root-${root.key}`;
  jump.setAttribute("aria-label", `${root.key}，${root.root}，${root.shapes.length} 個輔助形`);
  jump.innerHTML = `<kbd>${root.key}</kbd><span>${root.root}</span>`;
  rootIndex.append(jump);
});

groupKeys.forEach(([group, label], groupIndex) => {
  const section = document.createElement("section");
  section.className = "root-family";
  section.id = `family-${groupIndex + 1}`;
  const heading = document.createElement("div");
  heading.className = "root-family-head";
  heading.innerHTML = `<span>${String(groupIndex + 1).padStart(2, "0")} / ${group}</span><h2>${label}</h2>`;
  const cards = document.createElement("div");
  cards.className = "root-family-grid";
  rootGuide.filter(root => root.group === group).forEach(root => {
    const article = document.createElement("article");
    article.id = `root-${root.key}`;
    article.className = "root-card";
    const head = document.createElement("header");
    head.className = "root-card-head";
    const title = document.createElement("h3");
    title.innerHTML = `<kbd>${root.key}</kbd><span>${root.root}</span>`;
    const count = document.createElement("span");
    count.textContent = root.shapes.length ? `${root.shapes.length} 個輔助形` : "只用基本字根";
    head.append(title, count);
    const samples = document.createElement("div");
    samples.className = "shape-samples";
    if (root.shapes.length) root.shapes.forEach(item => samples.append(makeShape(item, root)));
    else {
      const note = document.createElement("p");
      note.className = "root-no-variants";
      note.textContent = "「口」本身就係呢個鍵嘅方框形；例如「品」完整碼 RRR，速成碼 RR。";
      samples.append(note);
    }
    article.append(head, samples);
    cards.append(article);
  });
  section.append(heading, cards);
  rootFamilies.append(section);
});
