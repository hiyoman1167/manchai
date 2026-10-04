# 部署與搜尋設定

[返回專案首頁](../README.md) · [開發指南](development.md)

## 正式網站

[learn.manchai.workers.dev](https://learn.manchai.workers.dev/)

網站使用 **Cloudflare Workers Static Assets**，冇後端 Worker 程式或者資料庫。設定喺 [`wrangler.jsonc`](../wrangler.jsonc)，公開網站輸出到 `dist/`。

## GitHub Actions

[`deploy.yml`](../.github/workflows/deploy.yml) 喺 `main` 分支有新提交時執行：

```text
npm ci → npm test → npm run build → Wrangler deploy
```

測試成功先會部署；亦可以喺 [GitHub Actions](https://github.com/hiyoman1167/manchai/actions/workflows/deploy.yml) 手動執行。部署使用 repository secrets：

| Secret | 用途 |
| :--- | :--- |
| `CLOUDFLARE_API_TOKEN` | 編輯目標 Worker 嘅 Cloudflare API token。 |
| `CLOUDFLARE_ACCOUNT_ID` | 目標 Cloudflare 帳戶 ID。 |

新增環境時請按 [Cloudflare 官方 GitHub Actions 指引](https://developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/) 設定權限，現有部署嘅目標 Worker 係 `learn`。憑證唔可以寫入原始碼或者提交到 Git。

### 本機手動發佈

完成 Cloudflare 授權後：

```bash
npm run build
npx wrangler deploy --dry-run
npm run deploy
```

`--dry-run` 檢查建置同設定，唔會上線。正式部署後，檢查四個頁面、彩色圖解、詞庫載入同進度恢復。瀏覽器紀錄按網址分開儲存；改域名唔會自動搬走原有進度。

收費以 Cloudflare 當時方案為準，參閱 [Static Assets 收費與限制](https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/)及 [Workers 定價](https://developers.cloudflare.com/workers/platform/pricing/)。本專案使用靜態資產；加入動態 Worker 或其他付費服務前，需另行檢查用量同收費。

## Google Search Console

使用網址前置字元資源 `https://learn.manchai.workers.dev/` 管理本站。

- 保留 `index.html` 嘅 Google 驗證標記。
- `robots.txt` 指向 `sitemap.xml` 同純文字備用入口 `sitemap.txt`。
- 建置由 XML 自動產生 `dist/sitemap.txt`，兩份 sitemap 收錄相同四個正式網址。
- 各頁 canonical 指向正式首頁、學習、圖鑑同練習網址。

修改網站域名時，要一併更新 canonical、sitemap、robots 同驗證資源。提交 sitemap 或要求索引唔等於成功擷取或收錄；以 Search Console 詳細狀態為準。
