import json
from pathlib import Path

def save_to_json(data, file_path="psychubes.json"):
    Path(file_path).parent.mkdir(exist_ok=True)
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f'✅ JSON saved to {file_path}')


name_list = []

with open('names.txt') as f:
    for line in f:
        name_list.append(line)


data = [
    {"ID": 0, "name": name, "rarity": 6, "effect": "None", "version": 0}
    for name in zip(name_list)
]

save_to_json(data)