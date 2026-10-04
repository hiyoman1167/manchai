# 開發指南

[返回專案首頁](../README.md) · [部署設定](operations.md) · [資料與授權](sources.md)

## 本機開發

需要 Node.js 22（同 CI 一致）同 Python 3。

```bash
npm ci
npm run dev
```

開啟 [localhost:4173](http://localhost:4173/)。請經 HTTP 伺服器使用網站；直接用 `file://` 開啟 HTML 可能令彩色 SVG 或詞庫分段無法正常載入。

網站有四個獨立頁面：

| 頁面 | 功能 |
| :--- | :--- |
| `index.html` | 入門學習路線。 |
| `learn.html` | 速成原理、字根同逐字課程。 |
| `roots.html` | 24 鍵、191 幅輔助字形及例字。 |
| `practice.html` | 句子、段落及詞語練習。 |

## 檢查與建置

```bash
npm test
npm run build
```

測試包括資料數量、IME 組字、中文整詞輸入、錯字修正、標點處理、拆碼及選字流程。進度測試會模擬重開頁面，檢查部分輸入、完成紀錄、引導設定、損壞資料及儲存不可用時嘅行為。

建置使用 Python 生成閱讀內容、頁面資料、輔助字形圖鑑、彩色筆畫同提示翻譯，再將公開檔案複製到 `dist/`。已保留必要來源資料，正常建置毋須重新下載上游詞庫。

`dist/`、`node_modules/` 同 `.wrangler/` 係本機輸出，唔會提交到 Git。`docs/` 同 README 素材唔會打包到正式網站。

## 修改來源資料

請改來源檔案再重建；唔好直接修改生成嘅 JS 或 JSON。

| 來源 | 內容 | 生成工具 |
| :--- | :--- | :--- |
| `data/practice-copy.csv` | 四步新手提示翻譯。 | `tools/build-practice-copy.py` |
| `data/progress-copy.csv` | 本機進度提示翻譯。 | `tools/build-practice-copy.py` |
| `data/diagram-copy.csv` | 彩色圖解提示文字。 | `tools/build-glyph-diagrams.py` |
| `data/glyph-components.csv` | 首尾碼同筆畫對應規則。 | `tools/build-glyph-diagrams.py` |
| `data/root-guide.csv` | 191 幅字形、輔助形狀及例字。 | `tools/build-root-guide.py` |
| `data/sentences.tsv` / `data/paragraphs.tsv` | 本站原創句子同段落。 | `tools/build-reading.py` |
| `data/code-hints.tsv` | 經 Rime 核對嘅補充字碼。 | `tools/build-reading.py` |
| `data/lesson-seeds.tsv` / `data/hk-words.txt` | 課程字選集同香港日常詞。 | `tools/build-data.py` |

改提示翻譯後：

```bash
python3 tools/build-practice-copy.py
```

其他一般更新可執行 `npm run build`，再以 `npm test` 檢查。修改課程字選集或香港詞語，需要下面嘅完整詞庫重建步驟。

### 重建完整字碼與詞庫

準備 [Unihan.zip](https://www.unicode.org/Public/UCD/latest/ucd/Unihan.zip)、[Rime essay.txt](https://github.com/rime/rime-essay/blob/master/essay.txt) 同 [倉頡五代碼表](https://github.com/rime/rime-cangjie/blob/master/cangjie5.base.dict.yaml)，然後執行：

```bash
python3 tools/build-data.py \
  --unihan /path/to/Unihan.zip \
  --essay /path/to/essay.txt \
  --rime /path/to/cangjie5.base.dict.yaml
npm run build
npm test
```

`tools/build-runtime-data.py` 會由 `data/learning-data.js` 製作頁面需要嘅資料同詞庫分段。目前有 42 個分段，每批最多 10,000 詞。搜尋全詞庫會按批載入；瀏覽範圍或翻頁只載入需要嘅部分。

### 擴充彩色字形

圖解來源固定為 Make Me a Hanzi 版本 `bddc96d41bef78427ed0e034e9f7e31d71fd1b92`，詳見[來源聲明](../licenses/glyph-diagrams-NOTICE.txt)。

新增課程或閱讀用字後，提供該版本嘅 `dictionary.txt` 同 `graphics.txt`：

```bash
python3 tools/import-glyph-source.py /path/to/dictionary.txt /path/to/graphics.txt
npm run build
npm test
```

`data/glyph-source/` 保留相關原始部件同筆畫。生成工具輸出 `data/diagram-data.js` 同 `assets/glyphs/`；瀏覽器只下載當前題目需要嘅圖檔。未可靠對應嘅部件保留原色並顯示說明，唔會估一個彩色範圍當答案。

## 本機進度

`shared.js` 統一處理 localStorage；`script.js` 管理字根同逐字課程，`extended.js` 管理句子、段落及詞語。

儲存內容包括完成紀錄、目前題目、已打啱嘅文字部分、拆碼位置同「自動帶練」設定。只適用同一瀏覽器及網址；內容改變時唔會套用過期嘅部分輸入。儲存失敗會顯示提示，練習仍然可用。
