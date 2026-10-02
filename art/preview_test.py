"""形の確認用：build/renders/test_*.png をドット絵にして、4倍で1枚に並べる（build/test_sheet.png）"""
import glob, os, sys
from PIL import Image
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from pipeline import pixelate
files = sys.argv[1:] or sorted(glob.glob("build/renders/test_*.png"))
W, H, S = 128, 96, 3
cols = 3
rows = (len(files) + cols - 1) // cols
sheet = Image.new("RGBA", (cols * W * S, rows * H * S), (110, 165, 215, 255))
for i, f in enumerate(files):
    im = pixelate.pixelate(f, (W, H)).resize((W * S, H * S), Image.NEAREST)
    sheet.alpha_composite(im, ((i % cols) * W * S, (i // cols) * H * S))
sheet.save("build/test_sheet.png")
print("ok", len(files))
