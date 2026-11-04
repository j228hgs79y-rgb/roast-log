# Roast Log v1.3 測試報告

## 通過的檢查

- JavaScript 語法：`app.js`、`db.js`、`archive.js`、`sw.js`。
- `node tests/smoke.mjs`：建立新鍋時不啟動計時、九個固定節點順序、入豆啟動、下豆完成、燃料事件可以重複。
- 入豆彈窗具「初始風溫」「初始爐溫」「初始火力」三欄，其他固定節點具「火力調整後設定值」欄。
- 一爆開始及一爆結束為不同事件，原有 `crack` 繼續代表一爆開始。
- 舊原料輸入批次可建立生豆主檔並連結；相同批號不會在再次遷移時重複建立；可反查相關烘焙。
- 在新批次中可選擇已存在的生豆批次，或在建批次流程新增生豆主檔。
- `node tests/archive.mjs`：新格式 ZIP 建立與還原資料一致、封存包含被引用的生豆主檔、舊版 schemaVersion 1 完整備份可讀取、缺漏生豆關聯會拒絕還原。
- 續用同一 IndexedDB 資料庫名稱；將版本 1 升為 2 只新增 `greenLots` store。

## 尚未驗收

- Chromium/Playwright 在此容器無法連接本機測試網址：`ERR_BLOCKED_BY_ADMINISTRATOR`。因此未完成實際 DOM 互動、背景恢復及 Service Worker 換版測試。
- 尚未在 iPhone Safari/PWA 進行：真實 IndexedDB v1→v2 遷移、入豆初始欄位持久化、關閉重啟、iCloud ZIP 分享、離線重開。

## 上線前

1. 先在舊版 App 匯出完整備份到 iCloud Drive。
2. 更新同一 GitHub Pages 儲存庫的原始檔，保留原本網址及 iPhone 主畫面 App。
3. 用一筆測試批次確認入豆三欄、節點火力、一爆分段及生豆反查，並關閉重啟確認資料仍在。
4. 再匯出新版 ZIP，測試能正常讀取，最後才正式使用。
