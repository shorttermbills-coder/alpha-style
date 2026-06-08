import os
import json
from urllib.parse import quote

ROOT = "."

IMAGE_EXTENSIONS = (
    ".jpg",
    ".jpeg",
    ".png",
    ".webp"
)

COVER_NAMES = (
    "cover.jpg",
    "cover.jpeg",
    "cover.png",
    "cover.webp"
)

IGNORE_DIRS = {
    ".git",
    ".github",
    "__pycache__",
    "_watermark_backup"
}

def slug(text):
    return text.strip().lower().replace(" ", "-")

def image_path(*parts):
    return "/" + "/".join(quote(part) for part in parts)

def is_image(file):
    return file.lower().endswith(IMAGE_EXTENSIONS)

def is_cover(file):
    return file.lower() in COVER_NAMES

def list_sorted(folder_path):
    return sorted(os.listdir(folder_path), key=lambda x: x.lower())

def find_cover(folder_path):
    for file in list_sorted(folder_path):
        if os.path.isfile(os.path.join(folder_path, file)) and is_cover(file):
            return file
    return None

def get_images(folder_path, *url_parts):
    image_files = []

    for file in list_sorted(folder_path):
        full_path = os.path.join(folder_path, file)

        if os.path.isfile(full_path) and is_image(file) and not is_cover(file):
            image_files.append((os.path.getmtime(full_path), file))

    image_files.sort(reverse=True)

    return [
        image_path(*url_parts, file)
        for _, file in image_files
    ]

def build_model(name, folder_path, *url_parts):
    cover_file = find_cover(folder_path)
    images = get_images(folder_path, *url_parts)

    if not images and not cover_file:
        return None

    if cover_file:
        cover = image_path(*url_parts, cover_file)
    else:
        cover = images[0]

    return {
        "type": "model",
        "slug": slug(name),
        "cover": cover,
        "images": images
    }

data = {}

for brand in list_sorted(ROOT):

    brand_path = os.path.join(ROOT, brand)

    if not os.path.isdir(brand_path):
        continue

    if brand in IGNORE_DIRS or brand.startswith("."):
        continue

    brand_cover_file = find_cover(brand_path)

    models = {}

    # صور مباشرة داخل البراند = Mix
    direct_images = get_images(brand_path, brand)

    if direct_images:
        models["Mix"] = {
            "type": "model",
            "slug": "mix",
            "cover": image_path(brand, brand_cover_file) if brand_cover_file else direct_images[0],
            "images": direct_images
        }

    for folder in list_sorted(brand_path):

        folder_path = os.path.join(brand_path, folder)

        if not os.path.isdir(folder_path):
            continue

        folder_cover_file = find_cover(folder_path)

        # 1) إذا الفولدر نفسه فيه صور مباشرة، نعتبره Model عادي
        folder_model = build_model(folder, folder_path, brand, folder)

        # 2) إذا داخله فولدرات وفيها صور، نعتبره Category
        sub_models = {}

        for sub in list_sorted(folder_path):

            sub_path = os.path.join(folder_path, sub)

            if not os.path.isdir(sub_path):
                continue

            sub_model = build_model(sub, sub_path, brand, folder, sub)

            if sub_model:
                sub_models[sub] = sub_model

        # إذا فيه sub models، يصبح Category
        # وإذا فيه صور مباشرة كمان، نضيفها كموديل اسمه Mix داخل الكاتيجوري
        if sub_models:
            if folder_model:
                sub_models = {"Mix": folder_model, **sub_models}

            first_sub_model = next(iter(sub_models))

            if folder_cover_file:
                category_cover = image_path(brand, folder, folder_cover_file)
            else:
                category_cover = sub_models[first_sub_model]["cover"]

            models[folder] = {
                "type": "category",
                "slug": slug(folder),
                "cover": category_cover,
                "models": sub_models
            }

        elif folder_model:
            models[folder] = folder_model

    if models:

        if brand_cover_file:
            brand_cover = image_path(brand, brand_cover_file)
        else:
            first_model = next(iter(models))
            brand_cover = models[first_model]["cover"]

        data[brand] = {
            "slug": slug(brand),
            "cover": brand_cover,
            "models": models
        }

with open("brands.json", "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("brands.json generated successfully")
