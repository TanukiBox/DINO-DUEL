"""目の案（A〜D）を比べる絵を作る（修正「恐竜の目の描き方を変える」WBS 1.1）。

  python eye_options.py               … Blender でティラノとトリケラトプスを描き、4案の目を描き足して並べる
  python eye_options.py --skip-render … レンダリングを省略（目の形だけ変えたとき）

できるもの（art/output/eye-options/）：
  <種>_<案>.png  … その案の目を描き足した全部のコマ（横に並べた1枚）
  compare.png    … 4案を横に並べた比較画像（3倍）
  index.js       … 比較ページ（tools/eyes.html）が読む一覧
ゲームの絵（art/output/dinos/）は変えない。
"""
import argparse
import glob
import json
import os

from PIL import Image

import build
from pipeline import pixelate, eyes

ROOT = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(ROOT, "output", "eye-options")
KEYS = ["tyranno", "triceratops"]
BG = (110, 165, 215, 255)


def frames_of(key):
    meta = json.load(open(os.path.join(build.RENDERS, "meta_%s.json" % key), encoding="utf-8"))
    size = tuple(meta["frame"])
    out = []          # [(絵, 目の点, 目を閉じるか)]
    anims = {}
    for name, a in meta["anims"].items():
        anims[name] = {"s": len(out), "n": a["n"], "ms": a["ms"], "loop": bool(a.get("loop"))}
        for i in range(a["n"]):
            im = pixelate.pixelate(os.path.join(build.RENDERS, "dino_%s_%s_%d.png" % (key, name, i)), size)
            pt = a["points"][i]
            out.append((im, pt.get("eye"), pt.get("eye_closed", False)))
    return meta, size, out, anims


def bbox(frames):
    """全部のコマで絵が入っている範囲（比較画像の切り抜き用）"""
    box = None
    for im, _, _ in frames:
        b = im.getbbox()
        if b:
            box = b if not box else (min(box[0], b[0]), min(box[1], b[1]), max(box[2], b[2]), max(box[3], b[3]))
    return box


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--skip-render", action="store_true")
    a = p.parse_args()
    if not a.skip_render:
        build.render("dinos", ",".join(KEYS))
    os.makedirs(OUT, exist_ok=True)
    data = {"options": {k: o["name"] for k, o in eyes.OPTIONS.items()}, "dinos": {}}
    rows = []     # 比較画像の行： (種, 動き, コマ)
    sheets = {}
    for key in KEYS:
        meta, size, frames, anims = frames_of(key)
        p0 = meta["anims"]["idle"]["points"][0]
        info = {"w": size[0], "h": size[1], "n": len(frames), "anims": anims, "diet": meta["diet"], "sheets": {},
                "gy": round(size[1] - p0["feet"][1], 1), "eye0": p0["eye"], "box": list(bbox(frames))}
        sheets[key] = {}
        for opt in eyes.OPTIONS:
            done = []
            for im, pt, closed in frames:
                done.append(eyes.stamp(im, pt, opt, meta["diet"], meta["skin"], closed))
            sheets[key][opt] = done
            name = "%s_%s.png" % (key, opt)
            pixelate.save_png(build.strip(done, size), os.path.join(OUT, name))
            info["sheets"][opt] = "art/output/eye-options/" + name
        for name, an in anims.items():
            an["box"] = list(bbox(frames[an["s"]:an["s"] + an["n"]]))
        data["dinos"][key] = info
        rows.append((key, anims["idle"]["s"]))
        if "bite" in anims:
            rows.append((key, anims["bite"]["s"] + 3))     # 噛みつく瞬間
            rows.append((key, anims["roar"]["s"] + 2))     # ほえる瞬間
            rows.append((key, anims["hit"]["s"]))          # 被弾（目を閉じる）

    # 比較画像：行 = 種・コマ、列 = 案 A〜D（3倍）
    S, pad = 3, 4
    boxes = {k: bbox([(f, None, None) for f in sheets[k]["A"]]) for k in KEYS}
    cw = max(b[2] - b[0] for b in boxes.values()) + pad * 2
    rh = [boxes[k][3] - boxes[k][1] + pad * 2 for k, _ in rows]
    head = 14
    sheet = Image.new("RGBA", (cw * 4 * S, (head + sum(rh)) * S), (244, 230, 200, 255))
    from PIL import ImageDraw
    d = ImageDraw.Draw(sheet)
    for j, opt in enumerate(eyes.OPTIONS):
        d.text((j * cw * S + 8, 8), opt, fill=(43, 27, 18, 255), font_size=28)
    y = head
    for (key, f), h in zip(rows, rh):
        b = boxes[key]
        for j, opt in enumerate(eyes.OPTIONS):
            cell = Image.new("RGBA", (cw, h), BG)
            cell.alpha_composite(sheets[key][opt][f].crop(b), (pad, pad))
            sheet.alpha_composite(cell.resize((cw * S, h * S), Image.NEAREST), (j * cw * S, y * S))
            d.rectangle((j * cw * S, y * S, (j + 1) * cw * S - 1, (y + h) * S - 1), outline=(43, 27, 18, 255), width=2)
        y += h
    pixelate.save_png(sheet, os.path.join(OUT, "compare.png"))
    with open(os.path.join(OUT, "index.js"), "w", encoding="utf-8", newline="\n") as fp:
        fp.write("// art/eye_options.py が自動で書き出すファイル。目の案の比較ページ（tools/eyes.html）用\n")
        fp.write("window.EYE_OPT = " + json.dumps(data, ensure_ascii=False, separators=(",", ":")) + ";\n")
    print("目の案を art/output/eye-options/ に書き出しました。")


if __name__ == "__main__":
    os.chdir(ROOT)
    main()
