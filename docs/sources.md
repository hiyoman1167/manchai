# 內容來源與授權

[返回專案首頁](../README.md) · [更新資料](development.md)

## 字碼與詞庫

| 資料 | 來源 | 本站使用方式 |
| :--- | :--- | :--- |
| 倉頡字碼 | [Unicode Unihan kCangjie](https://www.unicode.org/reports/tr38/) | 擴充課程同詞庫字碼，生成時同 Rime 核對首尾碼。 |
| 完整碼及補充提示 | [Rime 倉頡五代碼表](https://github.com/rime/rime-cangjie/blob/master/cangjie5.base.dict.yaml) | 入門 40 個例字、同碼候選字關係、閱讀用字變體。 |
| 詞語及短語 | [Rime 八股文](https://github.com/rime/rime-essay) | 按權重排序，保留至少兩字、每字都有可核對字碼嘅條目。 |
| 香港日常詞 | `data/hk-words.txt` | 本站整理 99 個詞，放喺詞庫開頭。 |
| 句子與段落 | `data/sentences.tsv` / `data/paragraphs.tsv` | 本站原創 120 句生活情境、30 篇段落。 |

目前有 **410,945 個詞語及短語**。Rime 原始詞庫包含單字同無法可靠核對字碼嘅條目；本站唔會將呢啲當成可拆碼練習。詞庫係練習材料，唔係完整語文詞典，亦唔代表收錄所有中文字或詞。

字碼資料依 [Unicode License v3](../licenses/Unicode-LICENSE.txt) 使用。Rime 詞庫依 [LGPL-3.0](../licenses/rime-essay-LGPL-3.0.txt) 使用，並保留[原作者名單](../licenses/rime-essay-AUTHORS.txt)。

## 彩色筆畫

課程同閱讀練習有 **1,146 個字形圖**：847 個可以標出全部首尾部件，274 個只標出一端，其餘會保留原色並說明。單碼字根有相應提示。

字形來自 [Make Me a Hanzi](https://github.com/skishore/makemeahanzi)，固定版本 `bddc96d41bef78427ed0e034e9f7e31d71fd1b92`。

- 筆畫路徑源自 Arphic 字體，依 [Arphic Public License](../licenses/Arphic-Public-License.txt) 使用。
- 部件資料依 [LGPL-3.0-or-later](../licenses/makemeahanzi-LGPL-3.0.txt) 使用。
- 本站保留相關原始資料，再將已核對嘅筆畫分組為首碼、尾碼同其餘部分。
- README 封面使用相同來源嘅「我」字筆畫；網站截圖展示本站介面。

完整作者、來源同修改聲明見 [`glyph-diagrams-NOTICE.txt`](../licenses/glyph-diagrams-NOTICE.txt)。用戶提供嘅參考網站截圖冇放入網站或 README。

## 輔助字形圖鑑

191 幅圖來自 [Wikimedia Commons 倉頡字形圖](https://commons.wikimedia.org/wiki/Category:Cangjie_input_method)，逐檔核對為 **CC0**，以本機縮圖提供。分組與例字參考[倉頡輔助字形列表](https://zh.wikibooks.org/zh-hant/%E5%80%89%E9%A0%A1%E8%BC%B8%E5%85%A5%E6%B3%95/%E8%BC%94%E5%8A%A9%E5%AD%97%E5%BD%A2)，例字完整碼按本站資料核對。

來源對照保留喺 `data/root-guide.csv`；縮圖喺 `assets/root-shapes/`。使用網站時毋須再連線到 Wikimedia Commons。

## 教學參考

- [Rime 速成方案](https://github.com/rime/rime-quick)：取完整倉頡碼嘅首尾兩碼。
- [HKCards 學速成](https://www.hkcards.com/b1/qk-menu)及[字根教學](https://www.hkcards.com/b1/qk-radical0)：入門次序、基本字根、輔助字形、單碼字同選字；本站說明已重新撰寫。
- [Microsoft 繁體中文輸入法](https://learn.microsoft.com/zh-cn/globalization/input/traditional-chinese-ime)：真實系統輸入法嘅候選字操作。

教學候選列嘅排序係模擬，唔代表系統輸入法嘅實際排序。複雜字形可能涉及額外倉頡規則；本站先教首尾取碼，再提供深入練習。

## 授權範圍

第三方素材按各自授權使用，請保留 `licenses/` 內嘅聲明。專案目前冇一份涵蓋所有本站原創程式及內容嘅統一 LICENSE；公開 repository 唔等於所有檔案都有相同授權，唔應自行標成 MIT 或其他未授予嘅授權。
