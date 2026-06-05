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
    "__pycache__"
}

def slug(text):
    return text.strip().lower().replace(" ", "-")

def image_path(*parts):
    return "/" + "/".join(quote(part) for part in parts)

def is_image(file):
    return file.lower().endswith(IMAGE_EXTENSIONS)

def find_cover(folder_path):
    for file in os.listdir(folder_path):
        if file.lower() in COVER_NAMES:
            return file
    return None

data = {}

for brand in os.listdir(ROOT):

    brand_path = os.path.join(ROOT, brand)

    if not os.path.isdir(brand_path):
        continue

    if brand in IGNORE_DIRS or brand.startswith("."):
        continue

    models = {}

    brand_cover_file = find_cover(brand_path)

    direct_images = []

    for file in os.listdir(brand_path):
        full_path = os.path.join(brand_path, file)

        if os.path.isfile(full_path) and is_image(file):
            if file.lower() not in COVER_NAMES:
                direct_images.append((os.path.getmtime(full_path), file))

    if direct_images:
        direct_images.sort(reverse=True)

        mix_images = [
            image_path(brand, file)
            for _, file in direct_images
        ]

        mix_cover_file = brand_cover_file if brand_cover_file else direct_images[0][1]

        models["Mix"] = {
            "slug": slug("Mix"),
            "cover": image_path(brand, mix_cover_file),
            "images": mix_images
        }

    for model in os.listdir(brand_path):

        model_path = os.path.join(brand_path, model)

        if not os.path.isdir(model_path):
            continue

        model_cover_file = find_cover(model_path)

        image_files = []

        for file in os.listdir(model_path):

            full_path = os.path.join(model_path, file)

            if os.path.isfile(full_path) and is_image(file):
                if file.lower() not in COVER_NAMES:
                    image_files.append((os.path.getmtime(full_path), file))

        image_files.sort(reverse=True)

        images = [
            image_path(brand, model, file)
            for _, file in image_files
        ]

        if images or model_cover_file:

            if model_cover_file:
                model_cover = image_path(brand, model, model_cover_file)
            else:
                model_cover = images[0]

            models[model] = {
                "slug": slug(model),
                "cover": model_cover,
                "images": images
            }

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