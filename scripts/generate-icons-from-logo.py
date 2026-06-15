from PIL import Image
import os

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
src = os.path.join(BASE, ".hermes", "image_cache", "img_f9c93fe6b81a.jpg")

img = Image.open(src)
print(f"Source: {img.size} {img.mode}")

# Convert to RGBA if needed
if img.mode != "RGBA":
    img = img.convert("RGBA")

sizes = {
    "public/icon-192.png": 192,
    "public/icon-512.png": 512,
    "public/apple-touch-icon.png": 180,
    "public/favicon-32.png": 32,
    "public/favicon-16.png": 16,
}

for path, size in sizes.items():
    resized = img.resize((size, size), Image.LANCZOS)
    filepath = os.path.join(BASE, path)
    resized.save(filepath, "PNG")
    print(f"Generated {path} ({size}x{size})")

# Also save as ICO for favicon
ico_sizes = [16, 32, 48, 64]
ico_images = []
for s in ico_sizes:
    resized = img.resize((s, s), Image.LANCZOS)
    ico_images.append(resized)

ico_path = os.path.join(BASE, "public/favicon.ico")
ico_images[0].save(ico_path, format="ICO", sizes=[(s, s) for s in ico_sizes])
print(f"Generated public/favicon.ico")

print("Done!")
