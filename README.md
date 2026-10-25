# 2025 桃園市立美術館年報數位雙語對照平臺
### Taoyuan Museum of Fine Arts (TMoFA) Annual Report 2025 — Bilingual Interactive Web Viewer

線上成果網址：[https://tmofa.kkuo.cc.cd/2025/](https://tmofa.kkuo.cc.cd/2025/)

---

## 📖 專案簡介 (Overview)

本專案為**桃園市立美術館（Taoyuan Museum of Fine Arts, TMoFA）2025 年報**之中英雙語對照數位呈現系統。將 63 頁橫向 A4 原版年報完整數位化，提供高解析度印刷級視覺成果，並開創「浮動游標中英隨時切換」互動體驗。

- **出版機關**：桃園市立美術館
- **發行人**：林詠能 (LIN Yung-Neng)
- **英譯審訂**：郭開文 (Kevin KUO)
- **美術設計**：六十度有限公司 (60 Degree Co., Ltd.)
- **全書規格**：63 頁 Landscape A4 (841.89 × 595.28 pt)

---

## ✨ 核心特色與互動功能 (Key Features)

1. **浮動游標分屏對照 (Floating Cursor Split Curtain)**
   - 畫面中央配備互動式分割簾幕，使用者可水平拖曳游標把手 `[ 中 ❙ EN ]`，即時在同一畫面上透視中文原版與英文譯文之排版對應。
   - 支援「**游標動態跟隨 (Follow Cursor)**」功能（快捷鍵 `C`），滑鼠掠過頁面任何段落即可即時滑動簾幕對照。

2. **單頁快速切換 (Instant One-Click / Spacebar Toggle)**
   - 浮動底欄設有玻璃擬態快速切換膠囊，點擊 `繁中` / `EN` 或直接在畫面上點擊、按空白鍵（`Space` / `T`）即可無縫平滑交叉淡入切換中英文版。

3. **雙頁並排檢視 (Side-by-Side Dual Column)**
   - 提供左側繁中、右側英文之寬螢幕雙欄檢視模式，適合桌面大螢幕沉浸式對照審閱。

4. **63 頁完整縮圖導覽抽屜 (Thumbnail Drawer)**
   - 底部可隨時呼出 63 頁橫向高清晰縮圖導覽條，點選任一頁快速跳轉，當前頁面自動高亮置中。

5. **章節快速目錄 (Quick TOC)**
   - 市長序、館長序、桃美館、兒美館 (TCAC)、橫山書藝館 (HCAC)、綜合業務、展覽活動簡表、大事記與版權頁一鍵直達。

6. **全本高解析 PDF 雙語下載**
   - 網站內建直接下載 12MB 高解析英文版與中文版 PDF。

---

## ⌨️ 快捷鍵導覽 (Shortcuts)

| 按鍵 | 功能 |
| :--- | :--- |
| `Space` / `T` | 中文 / 英文 快速切換 |
| `←` / `→` 或 `J` / `K` | 上一頁 / 下一頁 |
| `S` | 切換為「浮動游標對照」模式並居中 (50/50) |
| `C` | 開啟 / 關閉「滑鼠游標自動跟隨對照」 |
| `F` | 全螢幕切換 |
| `Home` / `End` | 跳至封面 (P.1) / 版權頁 (P.63) |
| `Esc` | 關閉縮圖抽屜與說明彈窗 |

---

## 🚀 部署架構 (Deployment)

- **主機平臺**：Cloudflare Pages
- **自訂網域**：`tmofa.kkuo.cc.cd/2025/`
- **原始碼儲存庫**：`github.com/kekukeku/tmofa`
- **架構特點**：純原生 HTML5 / CSS3 / Vanilla JS 實現，零龐大外部套件依賴，全球 Edge CDN 秒速加載。
