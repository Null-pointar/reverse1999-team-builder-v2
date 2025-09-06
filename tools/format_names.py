import json

# JSONファイルを読み込み
with open("psychubes.json", "r", encoding="utf-8") as f:
    data = json.load(f)

# name を文字列に変換（\n や空白も削除）
for item in data:
    if isinstance(item.get("name"), list) and item["name"]:
        item["name"] = item["name"][0].replace("\n", "").strip()

# 上書き保存
with open("psychubes_v3.json", "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)
