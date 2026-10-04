# 慢拆

一個唔使帳戶、唔使後端嘅速成學習網站。先學 24 個基本字根，再分 25 組練 1,011 個字；之後練 120 句情境句子、30 篇段落，亦可搜尋 410,945 個詞語及短語。打字練習使用電腦本身嘅速成輸入法。

## 開啟網站

直接用瀏覽器開啟 `index.html`，或者喺專案目錄執行 `npm run dev`，再去 `http://127.0.0.1:4173/`。網站內容唔使後端；完成進度會儲喺同一個瀏覽器嘅本機儲存空間。

網站分成四頁：`index.html` 係首頁路線圖、`learn.html` 係原理同逐字課程、`roots.html` 係 24 鍵輔助字形圖鑑、`practice.html` 係句子、段落同詞語練習。

載入時只讀該頁需要嘅資料：字根頁唔下載詞庫；句子同段落頁先讀字碼同閱讀內容。揀「詞語」先下載第一批 10,000 詞，轉範圍或翻頁先載入其他部分；搜尋完整詞庫時會逐批載入，顯示進度。第一批載入失敗會顯示重試按鈕。

## 學習流程

1. 睇入門示範，了解字根、完整倉頡碼嘅首尾取碼，以及同碼候選字。
2. 字根分四組，每組六個；圖鑑另外展示 191 幅輔助字形示意同例字。學完一部分已經可以轉去拆字練習。
3. 逐字課程前五組係拆碼入門，後面二十組按日常生活主題編排；每次只顯示一組。
4. 題目同字卡預設唔顯示答案。可以逐步睇首字根、尾字根、英文字母，或者主動揭答案；答啱碼之後仲要喺同碼候選字入面揀返目標字，先會計完成。
5. 候選列支援點擊、數字 1–3、方向鍵加 Enter。本站排序只係教學模擬，實際輸入法可能唔同。
6. 句子分九個生活主題；段落分起步、進一步同完整篇章三級。詞語先由本站整理嘅 99 個香港日常詞開始，再按詞庫常用次序瀏覽，亦可搜尋。
7. 句子同段落用「真正打中文字」：先喺系統設定加入速成輸入法，切換去速成，再喺網站文字框輸入。選字由你電腦嘅輸入法處理；網站只會喺中文字真正入咗文字框之後核對。組字期間唔會判錯，打錯可退格修改。標點可略過，貼上文字唔計練習。卡住可以逐步睇字根提示。
8. 詞語可以轉去「拆碼學習」。呢個模式嘅候選字卡係教學模擬，並非你電腦輸入法嘅真實排序。

網站無法讀取你目前啟用邊種輸入法；想練速成，請先自行切換到速成。Mac 同 Windows 嘅官方設定教學已連喺練習頁。

## 檢查

執行 `npm test`，可檢查資料數量、輸入法組字期間嘅處理、中文整詞輸入、錯字修正、句子／段落標點，以及拆碼練習流程。

## Cloudflare Workers 部署

網站使用 Workers Static Assets，冇後端 Worker 程式。`npm run build` 只會將公開網頁、字碼資料同授權檔案放入 `dist/`；`npx wrangler deploy --dry-run` 可以先檢查設定。登入 Cloudflare 後執行 `npm run deploy`，會發佈到 [learn.manchai.workers.dev](https://learn.manchai.workers.dev/)。Wrangler 設定喺 `wrangler.jsonc`。

`.github/workflows/deploy.yml` 會喺 `main` 分支有新提交時，先執行 `npm ci`、`npm test` 同 `npm run build`，成功先部署；亦可以喺 GitHub Actions 手動執行。第一次使用前，按 [Cloudflare 官方 GitHub Actions 指引](https://developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/) 建立只限 `learn` Worker 嘅編輯權限 API token，再喺 GitHub repository secrets 加入 `CLOUDFLARE_API_TOKEN` 同 `CLOUDFLARE_ACCOUNT_ID`。唔好將 token 寫入原始碼或者提交到 Git。

Cloudflare 官方說明：純靜態資產請求免費且不限量；如果日後加入真正 Worker 程式，免費方案有額外用量限制。詳見 [Static Assets 收費說明](https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/) 同 [Workers 定價](https://developers.cloudflare.com/workers/platform/pricing/)。

## Google Search Console

用網址前置字元資源 `https://learn.manchai.workers.dev/` 管理本站。`index.html` 內嘅 Google 驗證標記要保留；`robots.txt` 會指向 `sitemap.xml`。Sitemap 收錄首頁、學習、字根圖鑑同練習四個正式網址；各頁 canonical 亦指向相同網址。修改網站網址時，記得一併更新呢幾處。

## 內容來源

- 拆碼圖解由本站以文字及版面重新繪製，沒有轉載參考網站的圖片。
- 字形圖鑑嘅 191 幅圖來自 [Wikimedia Commons 倉頡字形圖](https://commons.wikimedia.org/wiki/Category:Cangjie_input_method)，逐檔核對為 CC0 後以本機縮圖提供；分組同例字參考[倉頡輔助字形列表](https://zh.wikibooks.org/zh-hant/%E5%80%89%E9%A0%A1%E8%BC%B8%E5%85%A5%E6%B3%95/%E8%BC%94%E5%8A%A9%E5%AD%97%E5%BD%A2)，例字完整碼按本站資料核對。用戶提供嘅參考截圖冇放入網站。
- 速成取碼原則：參考 [Rime 速成輸入方案](https://github.com/rime/rime-quick)，取倉頡碼首尾二碼。
- 入門教學次序、字根及輔助字形、單碼字、候選字說明：參考 [HKCards 學速成](https://www.hkcards.com/b1/qk-menu) 同其[字根教學](https://www.hkcards.com/b1/qk-radical0)。網站文字已重新撰寫。
- 40 個例字嘅完整碼，同候選列各字嘅同碼關係，按 [Rime 倉頡五代碼表](https://github.com/rime/rime-cangjie/blob/master/cangjie5.base.dict.yaml)核對。
- 擴充課程同詞語使用 [Unicode Unihan kCangjie](https://www.unicode.org/reports/tr38/) 字碼；生成時同 Rime 倉頡五代碼表核對首尾碼。句子／段落新用字嘅補充提示取自 [Rime 倉頡五代碼表](https://github.com/rime/rime-cangjie/blob/master/cangjie5.base.dict.yaml)，多碼字會顯示其變體。字碼資料依 [Unicode License v3](licenses/Unicode-LICENSE.txt) 使用。
- 410,945 個詞語及短語包括本站整理嘅 99 個香港日常詞，餘下按 [Rime 八股文詞庫](https://github.com/rime/rime-essay)權重排序，收錄所有至少兩字、每字都有可核對字碼嘅條目，包括較長短語。Rime 原始詞庫仲有單字及無法可靠核對字碼嘅條目；本站唔會將佢哋當成可拆碼練習。Rime 資料依 [LGPL-3.0](licenses/rime-essay-LGPL-3.0.txt) 使用，[原作者名單](licenses/rime-essay-AUTHORS.txt)一併保留。句子同段落由本站自行撰寫。
- 實際輸入法嘅候選字操作參考 [Microsoft 繁體中文輸入法說明](https://learn.microsoft.com/zh-cn/globalization/input/traditional-chinese-ime)。

## 更新練習資料

`data/root-guide.csv` 係 191 幅字形與例字對照，`tools/build-root-guide.py` 會檢查例字碼同圖檔，再產生輕量嘅 `data/root-guide-data.js`。`assets/root-shapes/` 收錄已核對 CC0 嘅本機縮圖；網站開啟時毋須連 Wikimedia Commons。

`data/lesson-seeds.tsv` 係課程字選集；`data/hk-words.txt` 係香港日常詞；`data/sentences.tsv` 同 `data/paragraphs.tsv` 係原創句子與段落，`data/code-hints.tsv` 係 Rime 核對過嘅補充字碼。執行 `npm run build` 會由已生成嘅 `data/learning-data.js` 製作頁面資料同 42 個詞庫分段。下載 [Unihan.zip](https://www.unicode.org/Public/UCD/latest/ucd/Unihan.zip)、[essay.txt](https://github.com/rime/rime-essay/blob/master/essay.txt) 同 [Rime 倉頡五代碼表](https://github.com/rime/rime-cangjie/blob/master/cangjie5.base.dict.yaml) 後，可用 `python3 tools/build-data.py --unihan Unihan.zip --essay essay.txt --rime cangjie5.base.dict.yaml` 重新生成完整字碼同詞庫，再執行 `npm run build`。網站直接使用已生成檔案，平時開啟毋須下載或者執行 Python。

詞庫係練習資料，當中包括常用詞同短語；佢唔係完整語文詞典。複雜字形可能涉及額外倉頡拆碼規則；本課先教穩首尾兩碼，再慢慢深入。
