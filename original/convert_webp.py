from PIL import Image
from pathlib import Path

SRC = Path("3drenders")
OUT = SRC / "webp_output"
OUT.mkdir(exist_ok=True)
QUALITY = 85

for png in sorted(SRC.glob("*.png")):
    dest = OUT / (png.stem + ".webp")
    Image.open(png).save(dest, "WEBP", quality=QUALITY)
    print(f"{png.name}  ->  {dest.name}  ({dest.stat().st_size // 1024} KB)")
