# Roast Log 首版檢查記錄

## 已完成的自動檢查

- `node --check app.js db.js archive.js`：通過（JavaScript 語法）。
- ZIP 壓縮與解壓往返：通過（包含批次、原料、事件、測試、回饋與 Blob 附件）。
- ZIP CRC 完整性驗證與格式錯誤拒絕：通過。
- 封存與目前選定批次的資料比較：通過。
- Manifest 與 Service Worker 所需的本機資源路徑存在性：通過。

## 尚未完成的裝置驗收

此執行環境的 Chromium 導覽受到管理限制，無法完成視覺與瀏覽器整合操作測試。下列功能仍需在實際 iPhone Safari 驗收後才算正式通過：

- IndexedDB 即時儲存及強制關閉後恢復。
- iPhone 鎖定及切換 App 後，經過時間正確持續。
- 主畫面安裝與 Service Worker 離線快取。
- iOS 分享 ZIP 到 iCloud Drive 的實際行為。
- 從 iCloud ZIP 還原、檔案唯讀查詢。
- 長時間烘焙中途斷電、背景清理或儲存額度不足時的錯誤處理。

不要用真實且唯一的烘焙紀錄驗證第一版；請先用數筆測試批次完成以上步驟，並驗證第一份 iCloud 備份可以實際匯入。

## v1.1 UI 更新檢查

- 首頁移除原本大區塊與三段宣傳／離線說明，僅保留「＋開始新的一鍋」按鈕。
- CSS 色碼已檢查為黑白灰階；PWA manifest、SVG 和 PNG icon 已改為灰階。
- JS 語法檢查通過，原有 IndexedDB 名稱與 schema 未變更。
- Service Worker 快取版本已提升，避免已安裝裝置一直載入舊介面。
- 真實 iPhone Safari 的快取更新、離線啟動與畫面呈現仍待使用者實機驗收。
