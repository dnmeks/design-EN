"""Fit full Kovrov skyline into header banner without losing landmarks."""
from __future__ import annotations

from pathlib import Path

from PIL import Image

SRC = Path(__file__).with_name("kovrov-header-banner-native.png")
FALLBACK_SRC = Path(__file__).with_name("kovrov-header-bg.png")
BG = (10, 20, 10, 255)  # #0a140a
THRESHOLD = 42  # green line detection on dark bg


def content_bbox(img: Image.Image) -> tuple[int, int, int, int]:
    rgb = img.convert("RGB")
    w, h = rgb.size
    px = rgb.load()
    min_x, min_y, max_x, max_y = w, h, 0, 0
    found = False
    for y in range(h):
        for x in range(w):
            r, g, b = px[x, y]
            if g > THRESHOLD and g > r + 8 and g > b + 4:
                found = True
                min_x = min(min_x, x)
                min_y = min(min_y, y)
                max_x = max(max_x, x)
                max_y = max(max_y, y)
    if not found:
        return 0, 0, w, h
    pad_x = int((max_x - min_x) * 0.02) + 8
    pad_y = int((max_y - min_y) * 0.04) + 6
    return (
        max(0, min_x - pad_x),
        max(0, min_y - pad_y),
        min(w, max_x + pad_x),
        min(h, max_y + pad_y),
    )


def build_banner(
    src: Image.Image,
    out_w: int,
    out_h: int,
    logo_reserve: int,
    valign: float = 0.5,
    *,
    fill_width: bool = False,
    max_squash: float = 0.72,
) -> Image.Image:
    """Scale skyline to use banner area; optional mild vertical squash for line art."""
    cropped = src.crop(content_bbox(src)).convert("RGBA")
    usable_w = out_w - logo_reserve - 12
    usable_h = out_h - 6
    cw, ch = cropped.size
    scale_w = usable_w / cw
    scale_h = usable_h / ch
    if fill_width:
        nw = usable_w
        nh = max(1, int(ch * scale_w))
        if nh > usable_h:
            nh = usable_h
        scaled = cropped.resize((nw, nh), Image.Resampling.LANCZOS)
    else:
        scale = min(scale_w, scale_h)
        nw, nh = max(1, int(cw * scale)), max(1, int(ch * scale))
        scaled = cropped.resize((nw, nh), Image.Resampling.LANCZOS)

    canvas = Image.new("RGBA", (out_w, out_h), BG)
    x = logo_reserve + 10
    y = 3 + int((usable_h - scaled.size[1]) * valign)
    canvas.paste(scaled, (x, y), scaled)
    return canvas.convert("RGB")


def main() -> None:
    src_path = SRC if SRC.exists() else FALLBACK_SRC
    src = Image.open(src_path)
    print(f"Source: {src_path.name} {src.size}")
    variants = [
        ("kovrov_fon_top.png", 1920, 160, 280, 0.55),
        ("kovrov_fon_top_1765x152.png", 1765, 152, 260, 0.55),
    ]
    for name, w, h, reserve, valign in variants:
        banner = build_banner(src, w, h, reserve, valign, fill_width=True)
        out = Path(__file__).with_name(name)
        banner.save(out, "PNG", optimize=True)
        print(f"Saved {out.name}: {w}x{h}")


if __name__ == "__main__":
    main()
