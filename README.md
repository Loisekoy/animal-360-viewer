# WILD 360 — 動物 3D 互動展示

一個可拖曳旋轉、縮放與自動旋轉的 3D 動物展示頁。內含赤狐、蝴蝶、
企鵝、鯨魚、蝙蝠、獅子、犀牛、蝸牛、青蛙與鳥，並透過 OpenAI
Responses API 提供會跟著目前物種切換的繁體中文導覽與提問功能。

## 啟動

```bash
PATH=/opt/homebrew/opt/node@24/bin:$PATH npm install
PATH=/opt/homebrew/opt/node@24/bin:$PATH npm run dev
```

瀏覽器開啟 `http://localhost:5173`。

這台電腦目前的系統預設 Node 22 缺少動態函式庫，因此上面直接指定已安裝且可用的 Node 24。

## 加入 OpenAI API 金鑰

1. 將 `.env.example` 複製成 `.env.local`。
2. 在 `.env.local` 的 `OPENAI_API_KEY=` 後填入自己的金鑰。
3. 重新執行 `PATH=/opt/homebrew/opt/node@24/bin:$PATH npm run dev`。

金鑰只由 `server.mjs` 讀取，不會送到瀏覽器。若沒有設定金鑰，3D
觀看功能仍可正常使用，AI 面板會顯示尚未設定的提示。

可用 `OPENAI_MODEL` 更換模型；預設依照 OpenAI 官方 Responses API
設定使用 `gpt-5.6`。

## 主要操作

- 「選擇動物」：開啟 10 種動物的圖鑑面板
- 滑鼠或手指拖曳：360° 旋轉
- 滾輪或雙指：縮放
- 雙擊模型區：重設視角
- 鍵盤方向鍵：旋轉視角
- Home：重設視角

模型會在選取時才載入，避免一進站就同時下載所有資源。各模型與授權
來源列在 `ATTRIBUTION.md`。

## WildlifeDatasets 參考

[WildlifeDatasets](https://github.com/wildlifedatasets/wildlife-datasets) 是野生動物個體
再辨識（Re-ID）的資料集與訓練工具，不是 3D 模型庫。本專案目前沒有直接依賴
它；若未來加入「上傳照片辨識個體」或真實影像教學功能，可再評估整合。其程式碼
採 AGPL-3.0，而每個資料集另有各自授權，整合前必須逐一確認。
