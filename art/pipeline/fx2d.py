"""平面で描くエフェクト（光の粒・炎など、3Dにしなくてよいもの）。

恐竜や3Dのエフェクトと同じく、4倍の大きさで描いて pixelate（縮小 → 32色に減色 → 1px の輪郭）を通す。
乱数は名前から作った固定の種なので、毎回同じ絵になる。

  spark … 当たった瞬間の光（星形の光の筋が広がって、粒になって消える）48×48・5コマ
  aura  … 攻撃アップ：体のまわりから赤い炎が立ちのぼり、上向きの矢印が上がる 80×96・8コマ
"""
import math
import os
import random
import zlib

from PIL import Image, ImageDraw

from . import pixelate
from .palette import rgb

S = 4   # 4倍で描く


def _rng(name):
    return random.Random(zlib.crc32(name.encode("utf-8")))


def _canvas(size):
    return Image.new("RGBA", (size[0] * S, size[1] * S), (0, 0, 0, 0))


def _finish(img, size, outline=True):
    small = pixelate.downscale(img, size)
    idx, op = pixelate.quantize(small)
    if outline:
        idx, op = pixelate.outline(idx, op)
    return pixelate.to_image(idx, op)


def _star(d, cx, cy, n, r_in, r_out, color, rot=0.0):
    pts = []
    for i in range(n * 2):
        r = r_out if i % 2 == 0 else r_in
        a = rot + math.pi * i / n
        pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    d.polygon(pts, fill=rgb(color) + (255,))


def spark():
    size = (48, 48)
    cx, cy = size[0] * S / 2, size[1] * S / 2
    frames = []
    for f in range(5):
        img = _canvas(size)
        d = ImageDraw.Draw(img)
        if f == 0:
            _star(d, cx, cy, 4, 8, 40, "#fff8ea", math.pi / 4)
            d.ellipse((cx - 14, cy - 14, cx + 14, cy + 14), fill=rgb("#fff8ea") + (255,))
        elif f == 1:
            _star(d, cx, cy, 8, 16, 84, "#f2c050", 0.2)
            _star(d, cx, cy, 8, 12, 64, "#fff8ea", 0.2)
            d.ellipse((cx - 22, cy - 22, cx + 22, cy + 22), fill=rgb("#fff8ea") + (255,))
        elif f == 2:
            # 光の筋がのびて、まん中がぬける
            for i in range(8):
                a = 0.2 + math.pi * i / 4
                for r0, r1, w, col in ((40, 92, 10, "#f2c050"), (52, 84, 5, "#fff8ea")):
                    d.line((cx + r0 * math.cos(a), cy + r0 * math.sin(a), cx + r1 * math.cos(a), cy + r1 * math.sin(a)), fill=rgb(col) + (255,), width=w)
        else:
            # 粒になって散る
            rng = _rng("spark%d" % f)
            for i in range(10 if f == 3 else 6):
                a = 0.2 + math.pi * i / (5 if f == 3 else 3) + rng.uniform(-0.2, 0.2)
                r = (78 if f == 3 else 88) + rng.uniform(-6, 6)
                x, y = cx + r * math.cos(a), cy + r * math.sin(a)
                s = 7 if f == 3 else 5
                d.rectangle((x - s, y - s, x + s, y + s), fill=rgb("#f2c050" if i % 2 else "#fff8ea") + (255,))
        frames.append(_finish(img, size))
    return frames, size


def _flame(d, x, y, w, h, cols):
    """しずく形の炎（下が丸く、上がとがる）。cols = (外, 中, 芯)"""
    for k, (col, sc) in enumerate(zip(cols, (1.0, 0.66, 0.36))):
        ww, hh = w * sc, h * sc
        yy = y - (h - hh) * 0.15
        pts = []
        for i in range(24):
            t = i / 23
            a = math.pi * 2 * t
            # 上下にのびた形：上半分は細く とがらせる
            px = math.sin(a) * ww * (0.5 if math.cos(a) > 0 else 0.5 * (1 - math.cos(a)) ** 0.2)
            py = -math.cos(a)
            py = py * hh * (0.75 if py > 0 else 0.35)
            if py > 0:
                px *= (1 - py / (hh * 0.75)) ** 1.2 + 0.05
            pts.append((x + px, yy - py))
        d.polygon(pts, fill=rgb(col) + (255,))


def _arrow(d, x, y, s, col, col2):
    """上向きの矢印（攻撃アップ）"""
    head = [(x, y - s), (x + s * 0.8, y), (x + s * 0.32, y), (x + s * 0.32, y + s * 0.9),
            (x - s * 0.32, y + s * 0.9), (x - s * 0.32, y), (x - s * 0.8, y)]
    d.polygon(head, fill=rgb(col) + (255,))
    inner = [(x, y - s * 0.6), (x + s * 0.42, y - s * 0.12), (x - s * 0.42, y - s * 0.12)]
    d.polygon(inner, fill=rgb(col2) + (255,))


def aura():
    size = (80, 96)
    W, H = size[0] * S, size[1] * S
    rng = _rng("aura")
    # 炎の場所（下の方に横に並ぶ）と、のぼる速さ
    seeds = [(rng.uniform(0.12, 0.88), rng.uniform(0, 1), rng.uniform(0.8, 1.2)) for _ in range(9)]
    frames = []
    n = 8
    for f in range(n):
        img = _canvas(size)
        d = ImageDraw.Draw(img)
        for (fx, ph, sp) in seeds:
            t = (ph + f / n * sp) % 1.0
            x = fx * W + math.sin((t + fx) * 6.28) * 10
            y = H * (0.95 - 0.7 * t)
            s = (1 - t) * 1.0 + 0.25
            _flame(d, x, y, 30 * s, 80 * s, ("#c0322a", "#f05a3a", "#f2c050"))
        # 上向きの矢印が2つ、交互にのぼる
        for k in range(2):
            t = (f / n + k * 0.5) % 1.0
            x = W * (0.3 if k == 0 else 0.72)
            y = H * (0.75 - 0.6 * t)
            _arrow(d, x, y, 40 * (1.1 - 0.4 * t), "#f05a3a", "#ff9a3a")
        frames.append(_finish(img, size))
    return frames, size


ALL = {"spark": spark, "aura": aura}
