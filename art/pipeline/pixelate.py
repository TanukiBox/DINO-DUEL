"""ドット絵変換：縮小 → 減色 → 輪郭（多幸寿と同じ方式）。

  1. 縮小：4倍で描いた絵を、ニアレストネイバーで縮める（色を混ぜないので、にじまない）
  2. 減色：固定32色パレット（palette.py）の一番近い色に置き換える（人の目に近い OKLab 色空間で比べる）
  3. 輪郭：絵の外側に 1px の暗い線

同じ入力画像からは、毎回まったく同じ PNG ができる（乱数を使わない）。
"""
import numpy as np
from PIL import Image

from .palette import PALETTE, OUTLINE, rgb

ALPHA_THRESHOLD = 128  # これ以上の不透明度なら「塗る」、未満なら「透明」


def _srgb_to_oklab(c):
    c = c / 255.0
    lin = np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)
    m1 = np.array([[0.4122214708, 0.5363325363, 0.0514459929],
                   [0.2119034982, 0.6806995451, 0.1073969566],
                   [0.0883024619, 0.2817188376, 0.6299787005]])
    m2 = np.array([[0.2104542553, 0.7936177850, -0.0040720468],
                   [1.9779984951, -2.4285922050, 0.4505937099],
                   [0.0259040371, 0.7827717662, -0.8086757660]])
    lms = np.cbrt(lin @ m1.T)
    return lms @ m2.T


PALETTE_RGB = np.array([rgb(h) for h in PALETTE], dtype=np.float64)
PALETTE_LAB = _srgb_to_oklab(PALETTE_RGB)
OUTLINE_INDEX = PALETTE.index(OUTLINE)


def downscale(img, size):
    """縮小：ニアレストネイバー（4×4 の中の1点をそのまま使う）。"""
    return img.resize(size, Image.NEAREST)


def quantize(rgba, allow_outline=False):
    """減色：各ピクセルをパレットの一番近い色に。戻り値は (パレット番号の配列, 不透明マスク)。"""
    arr = np.asarray(rgba, dtype=np.float64)
    opaque = arr[..., 3] >= ALPHA_THRESHOLD
    lab = _srgb_to_oklab(arr[..., :3])
    d = ((lab[..., None, :] - PALETTE_LAB[None, None, :, :]) ** 2).sum(-1)
    if not allow_outline:
        d[..., OUTLINE_INDEX] = np.inf  # 輪郭色は輪郭専用（内側の線は別の暗い色になる）
    return d.argmin(-1), opaque


def outline(index, opaque):
    """輪郭：絵のまわり（外側）に 1px の暗い線。上下左右の4方向で判定。"""
    grown = opaque.copy()
    grown[1:, :] |= opaque[:-1, :]
    grown[:-1, :] |= opaque[1:, :]
    grown[:, 1:] |= opaque[:, :-1]
    grown[:, :-1] |= opaque[:, 1:]
    edge = grown & ~opaque
    index = index.copy()
    index[edge] = OUTLINE_INDEX
    return index, grown


def to_image(index, opaque):
    out = np.zeros(index.shape + (4,), dtype=np.uint8)
    out[..., :3] = PALETTE_RGB[index].astype(np.uint8)
    out[..., 3] = np.where(opaque, 255, 0)
    out[~opaque, :3] = 0
    return Image.fromarray(out, "RGBA")


def pixelate(src_path, size, with_outline=True, allow_outline=False):
    """4倍のレンダー1枚 → 完成ドット絵（RGBA の Image）。"""
    src = Image.open(src_path).convert("RGBA")
    small = downscale(src, size)
    index, opaque = quantize(small, allow_outline)
    if with_outline:
        index, opaque = outline(index, opaque)
    return to_image(index, opaque)


def save_png(img, path):
    img.save(path, format="PNG", optimize=True)


def save_gif(frames, path, durations, scale=4, bg=None):
    """確認用GIF（scale 倍に拡大。拡大もニアレストネイバー）。bg を渡すと背景色をしく。"""
    out = []
    for fr in frames:
        im = fr.convert("RGBA")
        if bg:
            base = Image.new("RGBA", im.size, bg)
            base.alpha_composite(im)
            im = base
        if scale != 1:
            im = im.resize((im.width * scale, im.height * scale), Image.NEAREST)
        out.append(im.convert("RGB") if bg else im)
    out[0].save(path, save_all=True, append_images=out[1:], duration=durations, loop=0, disposal=2, optimize=False)
