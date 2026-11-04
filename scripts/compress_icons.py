from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets" / "images"
SOURCE = ASSETS / "icon.png"
TARGETS = [
    ASSETS / "icon.png",
    ASSETS / "splash-icon.png",
    ASSETS / "favicon.png",
    ASSETS / "android-icon-foreground.png",
]


def optimize_icon() -> None:
    with Image.open(SOURCE) as image:
        rgba = image.convert("RGBA")
        rgba.thumbnail((512, 512), Image.Resampling.LANCZOS)
        canvas = Image.new("RGBA", (512, 512), (255, 255, 255, 0))
        offset = ((512 - rgba.width) // 2, (512 - rgba.height) // 2)
        canvas.alpha_composite(rgba, offset)
        for target in TARGETS:
            canvas.save(target, format="PNG", optimize=True, compress_level=9)


if __name__ == "__main__":
    optimize_icon()
