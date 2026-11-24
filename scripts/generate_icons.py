import os
from PIL import Image, ImageDraw

def create_taktil_icon():
    size = 512
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # 1. Background Squircle (Terracotta gradient simulated)
    # Radius 112 for 512x512
    margin = 32
    rect_box = [margin, margin, size - margin, size - margin]
    radius = 100

    # Draw rounded background
    draw.rounded_rectangle(rect_box, radius=radius, fill=(217, 93, 57, 255))
    
    # Inner border
    draw.rounded_rectangle(
        [margin + 2, margin + 2, size - margin - 2, size - margin - 2],
        radius=radius - 2,
        outline=(255, 255, 255, 60),
        width=3
    )

    # 2. Back Paper Sheet (Rotated slightly, shadow simulated)
    # We can draw layered paper sheets
    # Layer 2 (Middle paper sheet)
    draw.rounded_rectangle([130, 95, 390, 425], radius=24, fill=(226, 221, 213, 220))
    draw.rounded_rectangle([130, 95, 390, 425], radius=24, outline=(210, 204, 195, 255), width=2)

    # Layer 1 (Front paper sheet - Warm Alabaster #F8F6F1)
    paper_box = [116, 110, 396, 420]
    draw.rounded_rectangle(paper_box, radius=24, fill=(248, 246, 241, 255))
    draw.rounded_rectangle(paper_box, radius=24, outline=(226, 221, 213, 255), width=2)

    # Nib / Pen Emblem at Top
    nib_color = (217, 93, 57, 255) # Terracotta
    # Nib polygon: tip at (256, 135), expands to (276, 165), body to (264, 195), base at (248, 195), (236, 165)
    nib_poly = [
        (256, 135),
        (280, 175),
        (268, 175),
        (268, 205),
        (244, 205),
        (244, 175),
        (232, 175)
    ]
    draw.polygon(nib_poly, fill=nib_color)
    # Nib center breather hole and slit
    draw.ellipse([253, 166, 259, 172], fill=(248, 246, 241, 255))
    draw.line([256, 172, 256, 200], fill=(248, 246, 241, 255), width=2)

    # Editorial Prose Lines
    ink_primary = (28, 27, 24, 210)
    ink_secondary = (110, 106, 99, 160)
    
    # Title line
    draw.rounded_rectangle([150, 225, 340, 235], radius=4, fill=ink_primary)
    
    # Body lines
    draw.rounded_rectangle([150, 248, 360, 255], radius=3, fill=ink_secondary)
    draw.rounded_rectangle([150, 268, 330, 275], radius=3, fill=ink_secondary)
    draw.rounded_rectangle([150, 288, 350, 295], radius=3, fill=ink_secondary)

    # Living Checklist item
    # Checkbox
    draw.rounded_rectangle([150, 318, 170, 338], radius=5, fill=nib_color)
    # Check mark in white
    draw.line([155, 328, 159, 333], fill=(255, 255, 255, 255), width=2)
    draw.line([159, 333, 166, 323], fill=(255, 255, 255, 255), width=2)

    # Checklist text (with strikethrough)
    draw.rounded_rectangle([180, 325, 320, 331], radius=3, fill=(158, 153, 143, 160))
    draw.line([180, 328, 325, 328], fill=(158, 153, 143, 200), width=2)

    # Bottom accent mark
    draw.rounded_rectangle([150, 360, 200, 367], radius=3, fill=nib_color)

    os.makedirs('resources', exist_ok=True)

    # Save PNG (512x512)
    png_path = os.path.join('resources', 'icon.png')
    img.save(png_path, format='PNG')
    print(f'Saved PNG: {png_path}')

    # Save ICO with multiple standard dimensions (16, 32, 48, 64, 128, 256)
    ico_path = os.path.join('resources', 'icon.ico')
    icon_sizes = [(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]
    img.save(ico_path, format='ICO', sizes=icon_sizes)
    print(f'Saved ICO: {ico_path}')

if __name__ == '__main__':
    create_taktil_icon()
