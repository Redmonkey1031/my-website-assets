#%%
import os 
import json

# 設定參數
IMG_ROOT = 'img'  # 相對於目前執行目錄
OUTPUT_JSON = 'images.json'
BASE_URL = 'https://redmonkey31.vercel.app/product/img'

# 支援的圖片副檔名
VALID_EXTS = {'.jpg', '.jpeg', '.png', '.webp', '.gif'}

# 儲存圖片資訊
image_entries = []

# 遞迴讀取 img 資料夾內所有圖片
for root, _, files in os.walk(IMG_ROOT):
    for file in files:
        ext = os.path.splitext(file)[1].lower()
        if ext in VALID_EXTS:
            rel_path = os.path.relpath(os.path.join(root, file), IMG_ROOT).replace('\\', '/')
            image_entries.append({
                "src": f"{BASE_URL}/{rel_path}",
                "alt": rel_path
            })

# 顛倒順序
image_entries.reverse()

# 寫入 json（覆寫原有內容）
with open(OUTPUT_JSON, 'w', encoding='utf-8') as f:
    json.dump(image_entries, f, ensure_ascii=False, indent=2)

print(f"✅ 成功重寫 {OUTPUT_JSON}，共寫入 {len(image_entries)} 筆資料。")