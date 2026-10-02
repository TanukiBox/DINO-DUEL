"""体の作り方（モデリングの方式）を比べる絵を作る。

  python model_options.py               … 4つの方式でティラノとトリケラトプスを描き、並べて比べる
  python model_options.py --skip-render … レンダリングを省略

方式（blender/common.py の SKIN）：
  1 今の方式     … 胴体は管、脚は管とだ円の筋肉
  2 スキン（全部）… 胴体・脚・腕を全部スキンモディファイアで1つに
  3 スキン（脚と腕）… 胴体は管のまま、脚と腕をスキンモディファイアで
  4 スキン＋溶け合わせ … 3 のあと、胴体・脚・腕をボクセルで1つに溶け合わせて、なめらかに

できるもの（art/output/model-options/）：
  <種>_<方式>.png … その方式の全部のコマ（目は案A）
  compare.png    … 方式を横に並べた比較画像（3倍）
  （art/build/model_profile.png … 真横の影絵を参考画像と重ねたもの。赤＝参考画像だけ・青＝モデルだけ・紫＝重なり。
    参考画像から作った絵なので、公開するリポジトリには入れない。重なりの割合だけ index.js に書く）
  index.js       … 比較ページ（tools/models.html）が読む一覧
参考画像は art/build/refs/ に置く（Wikimedia Commons。Git には入れない）：
  trex.png    … Tyrannosaurus-rex-Profile-steveoc86 (coloured)(mirror)
  tricera.png … Triceratops horridus
ゲームの絵（art/output/dinos/）と 3Dモデル（art/models/）は変えない。
"""
import argparse
import json
import os
import subprocess
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFont

import build
from pipeline import pixelate, eyes
from pipeline.blender_path import find_blender

ROOT = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(ROOT, "output", "model-options")
KEYS = ["tyranno", "triceratops"]
MODES = [("1", "", "1 今の方式"), ("2", "full", "2 スキン（全部）"), ("3", "limbs", "3 スキン（脚と腕）"), ("4", "fuse", "4 スキン＋溶け合わせ"),
         ("5", "limbs+fit", "5 参考画像に合わせた形")]
REFS = {"tyranno": "trex.png", "triceratops": "tricera.png"}
BG = (110, 165, 215, 255)


def renders_dir(mode):
    return os.path.join(build.BUILD, "m_" + (mode or "base")[:2] + ("f" if mode.endswith("+fit") else ""))     # 短い名前（Windows のファイルの場所の長さの上限 260文字 をこえないように）


def render(mode):
    os.makedirs(renders_dir(mode), exist_ok=True)    # 先に作っておく（Blender からは新しいフォルダを作れないことがある）
    cmd = [find_blender(), "-b", "--factory-startup", "--python-exit-code", "1", "-P", os.path.join(ROOT, "blender", "render_all.py"), "--",
           "--out", renders_dir(mode), "--jobs", "dinos", "--only", ",".join(KEYS), "--profile", "--no-model"]
    if mode:
        cmd += ["--skin", mode.split("+")[0]]
    if mode.endswith("+fit"):
        cmd += ["--fit"]
    p = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, encoding="utf-8", errors="replace")
    if p.returncode != 0:
        print(p.stdout[-3000:])
        sys.exit("Blender でエラー")


def frames_of(d, key):
    meta = json.load(open(os.path.join(d, "meta_%s.json" % key), encoding="utf-8"))
    size = tuple(meta["frame"])
    out, anims = [], {}
    for name, a in meta["anims"].items():
        anims[name] = {"s": len(out), "n": a["n"], "ms": a["ms"], "loop": bool(a.get("loop"))}
        for i in range(a["n"]):
            im = pixelate.pixelate(os.path.join(d, "dino_%s_%s_%d.png" % (key, name, i)), size)
            pt = a["points"][i]
            out.append(eyes.stamp(im, pt.get("eye"), "A", meta["diet"], meta["skin"], pt.get("eye_closed", False)))
    return meta, size, out, anims


def bbox(frames):
    box = None
    for im in frames:
        b = im.getbbox()
        if b:
            box = b if not box else (min(box[0], b[0]), min(box[1], b[1]), max(box[2], b[2]), max(box[3], b[3]))
    return box


def mask_of(img, ref=False):
    a = np.array(img.convert("RGBA"))
    if ref:
        rgb = a[..., :3].astype(int)
        m = (a[..., 3] > 128) & (rgb.sum(-1) < 720)     # 白い背景・透明な背景を除く
    else:
        m = a[..., 3] > 128
    ys, xs = np.nonzero(m)
    return m[ys.min():ys.max() + 1, xs.min():xs.max() + 1]


def overlay(model_png, ref_png):
    """参考画像の影絵を、モデルの影絵と同じ長さ（鼻先〜しっぽの先）にそろえ、地面（下のはし）と左はしを合わせて重ねる"""
    mm = mask_of(Image.open(model_png))
    ref = Image.open(ref_png).transpose(Image.FLIP_LEFT_RIGHT)    # 参考画像は左向きなので、右向きにする
    rm = mask_of(ref, ref=True)
    k = mm.shape[1] / rm.shape[1]
    rimg = Image.fromarray((rm * 255).astype(np.uint8)).resize((mm.shape[1], max(1, round(rm.shape[0] * k))), Image.NEAREST)
    rm2 = np.array(rimg) > 127
    H = max(mm.shape[0], rm2.shape[0])
    A = np.zeros((H, mm.shape[1]), bool)
    B = np.zeros((H, mm.shape[1]), bool)
    A[H - mm.shape[0]:] = mm
    B[H - rm2.shape[0]:] = rm2
    iou = (A & B).sum() / max(1, (A | B).sum())
    img = np.full((H, mm.shape[1], 4), 255, np.uint8)
    img[B & ~A] = (230, 70, 60, 255)
    img[A & ~B] = (60, 120, 230, 255)
    img[A & B] = (150, 90, 170, 255)
    return Image.fromarray(img), iou


def font(sz):
    for f in ("C:/Windows/Fonts/meiryo.ttc", "C:/Windows/Fonts/YuGothM.ttc", "C:/Windows/Fonts/msgothic.ttc"):
        if os.path.exists(f):
            return ImageFont.truetype(f, sz)
    return ImageFont.load_default()


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--skip-render", action="store_true")
    p.add_argument("--modes", default="", help="この方式だけ描き直す（例：5）")
    a = p.parse_args()
    if not a.skip_render:
        for k, mode, name in MODES:
            if a.modes and k not in a.modes.split(","):
                continue
            print("レンダリング:", name, flush=True)
            render(mode)
    os.makedirs(OUT, exist_ok=True)
    data = {"options": {k: n for k, _, n in MODES}, "dinos": {}, "iou": {}}
    sheets = {}
    for key in KEYS:
        sheets[key] = {}
        info = None
        for k, mode, _ in MODES:
            meta, size, frames, anims = frames_of(renders_dir(mode), key)
            sheets[key][k] = frames
            name = "%s_%s.png" % (key, k)
            pixelate.save_png(build.strip(frames, size), os.path.join(OUT, name))
            if info is None:
                p0 = meta["anims"]["idle"]["points"][0]
                info = {"w": size[0], "h": size[1], "n": len(frames), "anims": anims, "diet": meta["diet"], "sheets": {},
                        "gy": round(size[1] - p0["feet"][1], 1), "eye0": p0["eye"]}
                for an in anims.values():
                    an["box"] = list(bbox(frames[an["s"]:an["s"] + an["n"]]))
            info["sheets"][k] = "art/output/model-options/" + name
        data["dinos"][key] = info

    # 比較画像：行 = 種・コマ、列 = 方式
    rows = [("tyranno", data["dinos"]["tyranno"]["anims"]["idle"]["s"]), ("tyranno", data["dinos"]["tyranno"]["anims"]["bite"]["s"] + 3),
            ("tyranno", data["dinos"]["tyranno"]["anims"]["roar"]["s"] + 2), ("triceratops", 0)]
    S, pad, head = 3, 3, 16
    boxes = {k: bbox(sheets[k]["1"]) for k in KEYS}
    cw = max(b[2] - b[0] for b in boxes.values()) + pad * 2
    rh = [boxes[k][3] - boxes[k][1] + pad * 2 for k, _ in rows]
    sheet = Image.new("RGBA", (cw * len(MODES) * S, (head + sum(rh)) * S), (244, 230, 200, 255))
    d = ImageDraw.Draw(sheet)
    f = font(30)
    for j, (k, _, n) in enumerate(MODES):
        d.text((j * cw * S + 10, 6), n, fill=(43, 27, 18, 255), font=f)
    y = head
    for (key, fi), h in zip(rows, rh):
        b = boxes[key]
        for j, (k, _, _) in enumerate(MODES):
            cell = Image.new("RGBA", (cw, h), BG)
            cell.alpha_composite(sheets[key][k][fi].crop(b), (pad, pad))
            sheet.alpha_composite(cell.resize((cw * S, h * S), Image.NEAREST), (j * cw * S, y * S))
            d.rectangle((j * cw * S, y * S, (j + 1) * cw * S - 1, (y + h) * S - 1), outline=(43, 27, 18, 255), width=2)
        y += h
    pixelate.save_png(sheet, os.path.join(OUT, "compare.png"))

    # 真横の影絵と参考画像の重なり
    refs = os.path.join(build.BUILD, "refs")
    tiles = []
    for key in KEYS:
        rp = os.path.join(refs, REFS[key])
        if not os.path.exists(rp):
            continue
        row = []
        for k, mode, n in MODES:
            img, iou = overlay(os.path.join(renders_dir(mode), "profile_%s.png" % key), rp)
            data["iou"].setdefault(key, {})[k] = round(float(iou), 3)
            row.append((img, n, iou))
        tiles.append(row)
    if tiles:
        tw = max(t[0].width for r in tiles for t in r)
        th = max(t[0].height for r in tiles for t in r) + 44
        pr = Image.new("RGBA", (tw * len(MODES), th * len(tiles) + 40), (255, 255, 255, 255))
        d = ImageDraw.Draw(pr)
        d.text((8, 6), "赤＝参考画像だけ　青＝モデルだけ　紫＝重なり（重なりの割合が大きいほど、参考画像の形に近い）", fill=(43, 27, 18, 255), font=font(22))
        for i, r in enumerate(tiles):
            for j, (img, n, iou) in enumerate(r):
                x, y = j * tw, 40 + i * th
                d.text((x + 8, y + 4), "%s　重なり %d%%" % (n, round(iou * 100)), fill=(43, 27, 18, 255), font=font(24))
                pr.paste(img, (x, y + 40))
        pixelate.save_png(pr, os.path.join(build.BUILD, "model_profile.png"))
    with open(os.path.join(OUT, "index.js"), "w", encoding="utf-8", newline="\n") as fp:
        fp.write("// art/model_options.py が自動で書き出すファイル。体の作り方の比較ページ（tools/models.html）用\n")
        fp.write("window.EYE_OPT = " + json.dumps(data, ensure_ascii=False, separators=(",", ":")) + ";\n")
    print("比較を art/output/model-options/ に書き出しました。", json.dumps(data["iou"], ensure_ascii=False))


if __name__ == "__main__":
    os.chdir(ROOT)
    main()
