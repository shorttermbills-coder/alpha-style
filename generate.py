import os
import json
from urllib.parse import quote

ROOT = "."

IMAGE_EXTENSIONS = (".jpg", ".jpeg", ".png", ".webp")
COVER_NAMES = ("cover.jpg", "cover.jpeg", "cover.png", "cover.webp")
IGNORE_DIRS = {".git", ".github", "__pycache__", "_watermark_backup"}

def slug(text):
    return text.strip().lower().replace(" ", "-")

def image_path(*parts):
    return "/" + "/".join(quote(part) for part in parts)

def is_image(file):
    return file.lower().endswith(IMAGE_EXTENSIONS)

def is_cover(file):
    return file.lower() in COVER_NAMES

def find_cover(folder_path):
    for file in os.listdir(folder_path):
        if is_cover(file):
            return file
    return None

def get_images(folder_path, *url_parts):
    image_files = []

    for file in os.listdir(folder_path):
        full_path = os.path.join(folder_path, file)

        if os.path.isfile(full_path) and is_image(file) and not is_cover(file):
            image_files.append((os.path.getmtime(full_path), file))

    image_files.sort(reverse=True)

    return [
        image_path(*url_parts, file)
        for _, file in image_files
    ]

data = {}

for brand in os.listdir(ROOT):
    brand_path = os.path.join(ROOT, brand)

    if not os.path.isdir(brand_path):
        continue

    if brand in IGNORE_DIRS or brand.startswith("."):
        continue

    brand_cover_file = find_cover(brand_path)

    brand_data = {
        "slug": slug(brand),
        "cover": "",
        "items": {}
    }

    # صور مباشرة داخل البراند = Mix
    direct_images = get_images(brand_path, brand)

    if direct_images:
        brand_data["items"]["Mix"] = {
            "type": "model",
            "slug": "mix",
            "cover": image_path(brand, brand_cover_file) if brand_cover_file else direct_images[0],
            "images": direct_images
        }

    for folder in os.listdir(brand_path):
        folder_path = os.path.join(brand_path, folder)

        if not os.path.isdir(folder_path):
            continue

        folder_cover_file = find_cover(folder_path)

        # إذا الفولدر فيه صور مباشرة = Model
        folder_images = get_images(folder_path, brand, folder)

        # شوف إذا داخله subfolders فيها صور = Category
        sub_models = {}

        for sub in os.listdir(folder_path):
            sub_path = os.path.join(folder_path, sub)

            if not os.path.isdir(sub_path):
                continue

            sub_cover_file = find_cover(sub_path)
            sub_images = get_images(sub_path, brand, folder, sub)

            if sub_images or sub_cover_file:
                sub_models[sub] = {
                    "type": "model",
                    "slug": slug(sub),
                    "cover": image_path(brand, folder, sub, sub_cover_file) if sub_cover_file else sub_images[0],
                    "images": sub_images
                }

        if sub_models:
            first_model = next(iter(sub_models))
            category_cover = (
                image_path(brand, folder, folder_cover_file)
                if folder_cover_file
                else sub_models[first_model]["cover"]
            )

            brand_data["items"][folder] = {
                "type": "category",
                "slug": slug(folder),
                "cover": category_cover,
                "models": sub_models
            }

        elif folder_images or folder_cover_file:
            brand_data["items"][folder] = {
                "type": "model",
                "slug": slug(folder),
                "cover": image_path(brand, folder, folder_cover_file) if folder_cover_file else folder_images[0],
                "images": folder_images
            }

    if brand_data["items"]:
        if brand_cover_file:
            brand_data["cover"] = image_path(brand, brand_cover_file)
        else:
            first_item = next(iter(brand_data["items"]))
            brand_data["cover"] = brand_data["items"][first_item]["cover"]

        data[brand] = brand_data

with open("brands.json", "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("brands.json generated successfully")