from PIL import Image, ImageDraw, ImageFont
import os

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def create_icon(size, filename):
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Dark bg
    margin = 0
    draw.rounded_rectangle(
        [margin, margin, size - margin, size - margin],
        radius=size // 5,
        fill=(10, 10, 15, 255)
    )

    # Purple inner
    inner_margin = size // 8
    draw.rounded_rectangle(
        [inner_margin, inner_margin, size - inner_margin, size - inner_margin],
        radius=size // 10,
        fill=(99, 102, 241, 255)
    )

    # Letter S
    try:
        font_size = int(size * 0.55)
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", font_size)
    except:
        font = ImageFont.load_default()

    bbox = draw.textbbox((0, 0), "S", font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    x = (size - text_width) // 2 - bbox[0]
    y = (size - text_height) // 2 - bbox[1] - int(size * 0.05)
    draw.text((x, y), "S", fill=(255, 255, 255, 255), font=font)

    filepath = os.path.join(BASE, "public", filename)
    img.save(filepath, "PNG")
    print(f"Generated {filepath} ({size}x{size})")

create_icon(192, "icon-192.png")
create_icon(512, "icon-512.png")
create_icon(180, "apple-touch-icon.png")
print("Done!")
