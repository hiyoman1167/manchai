# 遊戲聊天練習室 · Beta

一人同一位 AI 模擬隊友練廣東話打字，唔係真人聊天室，亦唔會連接遊戲帳戶。LoL、Apex、VALORANT、CS2、Overwatch、PUBG、Monster Hunter 同魔獸世界共 24 個開場情境。友善為預設；互串及粗口由玩家主動選擇。AI 仍可能答錯遊戲內容。

## 使用

1. 去 `/chat`，揀遊戲、情境同隊友語氣。
2. 切換電腦嘅速成輸入法，自己打一句。Enter 傳送，Shift + Enter 換行；組字及選字期間 Enter 唔會送出。
3. 點隊友訊息嘅中文字，按次序揭首碼、尾碼同鍵盤碼。字碼來自本機 Unihan 資料，唔由 LLM 猜。
4. 最近 30 則訊息、草稿、遊戲選擇及聊天成績會存在 `manchai-game-chat-v1`。切換遊戲或情境會開新局，取代當前對話；整站課程完成紀錄唔受影響。

## 免費範圍

2026-10-04 已從帳戶 Workers plans 頁確認目前為 **Free**。此方案 Workers AI 每帳戶每日 10,000 Neurons，超出直接拒絕服務，唔會產生 AI 超額費用。額度由帳戶內所有應用共用，唔等於無限訊息。靜態頁面仍可使用；AI 失敗後，玩家可以主動切換明確標示嘅預設情境練習。

固定模型：`@cf/qwen/qwen3-30b-a3b-fp8`。無付費後備、無第三方 API key、無自動升級、無 AI Gateway 付費 credits。必須保留 Workers Free 方案；**如帳戶將來升級 Paid，先將 `CHAT_AI_ENABLED` 設為 `false` 並部署**。本程式唔能夠阻止帳戶持有人之後改變計費方案。

官方：[Workers AI pricing](https://developers.cloudflare.com/workers-ai/platform/pricing/)、[Qwen3 model](https://developers.cloudflare.com/workers-ai/models/qwen3-30b-a3b-fp8/)、[errors](https://developers.cloudflare.com/workers-ai/platform/errors/)。

## 工程流程

```text
/chat → POST /api/chat → Worker → Workers AI binding → Qwen3
            ↓
  同來源檢查 / 8 KB body / 8 則歷史 / 每則 180 字
            ↓
  每 IP 每 Cloudflare location：6 次／60 秒
```

Rate Limit binding 嘅計數係每個 Cloudflare location，唔係全球精確配額。免費總量由 Cloudflare Free 方案硬上限控制。每次最多 192 output tokens，唔會自動重試；前端單次等候最多 25 秒。停止等候唔保證 Cloudflare 已停止推理，但單次生成上限仍有效。傳送內容以純文字呈現，隱藏思考段落；AI 訊息清楚標示，開場及預設回覆有獨立標籤。

只將最近 8 則玩家／隊友訊息送到 Cloudflare。瀏覽器存當前紀錄，Worker 唔存聊天資料庫、唔記錄訊息內容；錯誤紀錄只有類別。Cloudflare 本身嘅資料處理受其服務條款及 [Workers AI data usage](https://developers.cloudflare.com/workers-ai/platform/data-usage/) 規管。

所有新文案及情境先編輯 `data/chat-*.csv`，執行 `python3 tools/build-chat.py` 生成 `chat.html`、前端資料及 Worker context。頁面結構改 `templates/chat.html`。唔好手動改生成檔案。

## 本機驗證

```bash
npm run build
npm run dev:chat
```

`dev:chat` 預設關閉 AI，避免一般本機預覽消耗免費配額。開啟 `http://127.0.0.1:4173/chat`，可測情境練習、速成提示同本機儲存。真正模型測試要先確認 Free plan，再運行 `npx wrangler dev --ip 127.0.0.1 --port 4173`；AI binding 即使喺本機都會使用 Cloudflare 真實配額。

`npm test` 涵蓋舊站功能、中文組字防誤傳、貼上唔計成績、草稿及對話恢复、儲存失敗、API 輸入限制、同來源、rate limit、免費額度失敗無 fallback、model output 格式。部署仍由既有 GitHub Actions 負責，今次更改需經用戶手動批准 commit/push。
