"""目のスタンプ：3Dでは目を作らず、ドット絵にしたあとで、決まった形の目を描き足す。

・位置：Blender で、頭の骨の動きから毎コマ計算した「手前の目」の点（meta の points[コマ]["eye"]）。
  頭といっしょに動くので、コマが変わっても目がずれない・消えない。
・見えるのは手前の目1つだけ（横向きなので、奥の目は描かない）。
・光の反射や光沢は付けない。黒目と、白いハイライト1ドットだけ。
・肉食：黄色系の縁取り＋目の上に眉の出っ張りを1列（鋭い顔）。
  草食：縁取りなしの丸く穏やかな目（眉の出っ張りなし）。
・目を閉じたコマ（被弾・たおれる など。eye_closed）は、横1本の線。

形の文字：
  K 黒目  W ハイライト（白・1ドット）  Y 黄色系の縁取り  B 眉の出っ張り（その恐竜の濃い色）  . 何もしない
右が鼻先の向き（右向きの絵）。相手側では絵ごと左右反転するので、目も一緒に反転する。
"""
from PIL import Image

from .palette import OUTLINE, RAMP

K = OUTLINE          # 黒目
W = "#fff8ea"        # ハイライト
Y = "#f2c050"        # 縁取り（肉食）

# ゲームの絵に使う案（A〜D）。None のあいだは、まだ選ばれていない（build.py は目を描かない）
CHOSEN = "A"      # 2026-10-02 に A に決定

# 4つの案。左から「ゲームのような親しみやすい目」→「リアル寄りの鋭い目」
OPTIONS = {
    "A": dict(
        name="A まんまる（ゲームらしい）",
        carnivore=["BBBB.",
                   ".YY..",
                   "YKWY.",
                   "YKKY.",
                   ".YY.."],
        herbivore=[".KK.",
                   "KKWK",
                   "KKKK",
                   ".KK."],
        closed_c=["BBBB.",
                  ".....",
                  "KKKK.",
                  "....."],
        closed_h=["....",
                  "KKKK",
                  "...."],
    ),
    "B": dict(
        name="B 大きめ・たて長",
        carnivore=["BB...",
                   ".BBB.",
                   ".YKW.",
                   ".YKK.",
                   "..Y.."],
        herbivore=[".K.",
                   "KKW",
                   "KKK",
                   ".K."],
        closed_c=["BB...",
                  ".BBB.",
                  ".KKK.",
                  "....."],
        closed_h=["...",
                  "KKK",
                  "..."],
    ),
    "C": dict(
        name="C 細め・するどい",
        carnivore=["BBB..",
                   ".BBBB",
                   "YKWY.",
                   "....."],
        herbivore=["KKW",
                   "KKK"],
        closed_c=["BBB..",
                  ".BBBB",
                  ".KKK.",
                  "....."],
        closed_h=["KKK",
                  "..."],
    ),
    "D": dict(
        name="D 小さめ（リアル寄り）",
        carnivore=["BBB.",
                   ".BBB",
                   ".KW.",
                   "...."],
        herbivore=["KW",
                   "KK"],
        closed_c=["BBB.",
                  ".BBB",
                  ".KK.",
                  "...."],
        closed_h=["KK",
                  ".."],
    ),
}


def _rgb(h):
    return (int(h[1:3], 16), int(h[3:5], 16), int(h[5:7], 16), 255)


def brow_color(skin):
    """眉の出っ張りの色：その恐竜の地の色の「内側の線」の色（いちばん濃い色）"""
    return RAMP.get(skin, (None, None, "#2e1a14"))[2]


def pattern(option, diet, closed=False):
    o = OPTIONS[option]
    if closed:
        return o["closed_c" if diet == "carnivore" else "closed_h"]
    return o[diet]


def center(pat):
    """目そのもの（眉 B を除く）の中心。この点を、3Dで計算した目の点に合わせる。
    閉じた目も、開いた目と同じ所に来るよう、同じ案の開いた目の中心を使う（stamp で指定）"""
    xs, ys = [], []
    for y, row in enumerate(pat):
        for x, c in enumerate(row):
            if c in "KWY":
                xs.append(x)
                ys.append(y)
    return ((min(xs) + max(xs) + 1) / 2, (min(ys) + max(ys) + 1) / 2)


def stamp(img, eye, option, diet, skin, closed=False):
    """img（ドット絵1コマ）の eye=(x, y)（ドット座標）に目を描いた、新しい絵を返す"""
    img = img.copy()
    if not eye:
        return img
    pat = pattern(option, diet, closed)
    cx, cy = center(pattern(option, diet, False))
    x0 = int(round(eye[0] - cx))
    y0 = int(round(eye[1] - cy))
    col = {"K": _rgb(K), "W": _rgb(W), "Y": _rgb(Y), "B": _rgb(brow_color(skin))}
    px = img.load()
    w, h = img.size
    for y, row in enumerate(pat):
        for x, c in enumerate(row):
            if c == ".":
                continue
            X, Y_ = x0 + x, y0 + y
            if 0 <= X < w and 0 <= Y_ < h and px[X, Y_][3] > 0:   # 体の上だけに描く（はみ出さない）
                px[X, Y_] = col[c]
    return img


def preview(option, size=6):
    """案の形だけを大きく描いた見本（肉食・草食・閉じた目）"""
    pats = [pattern(option, "carnivore"), pattern(option, "carnivore", True), pattern(option, "herbivore"), pattern(option, "herbivore", True)]
    cw = max(len(p[0]) for p in pats) + 2
    ch = max(len(p) for p in pats) + 2
    im = Image.new("RGBA", (cw * len(pats), ch), (217, 138, 60, 255))
    for i, p in enumerate(pats):
        for y, row in enumerate(p):
            for x, c in enumerate(row):
                if c != ".":
                    im.putpixel((i * cw + 1 + x, 1 + y), {"K": _rgb(K), "W": _rgb(W), "Y": _rgb(Y), "B": _rgb("#5a2e1c")}[c])
    return im.resize((im.width * size, im.height * size), Image.NEAREST)
