"""リアル寄りの見た目（試作）と、ドット絵を比べる（tools/real.html）。

  python real_preview.py               … Blender で描いて、並べる
  python real_preview.py --skip-render … レンダリングを省略

  D … ドット絵（作り直したティラノ・作り方3）
  R … リアル寄り（Cycles のリアルな光・肌の質感・体を1つに溶け合わせた形。blender/real.py）
できるもの：art/output/real-preview/（<種>_<D|R>.png/.webp と index.js）。ゲームの絵は変えない。
"""
import argparse
import json
import os
import subprocess
import sys

from PIL import Image

import build
from pipeline import pixelate, eyes
from pipeline.blender_path import find_blender

ROOT = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(ROOT, "output", "real-preview")
KEYS = ["tyranno", "triceratops"]
MODES = [("D", ["--skin", "limbs"], "ドット絵"), ("R", ["--skin", "fuse", "--real"], "リアル寄り（試作）")]
RS = 3          # リアル寄りの絵は、1コマ 128×96 の3倍（384×288）で書き出す


def rdir(k):
    return os.path.join(build.BUILD, "rp_" + k)


def render(k, args):
    os.makedirs(rdir(k), exist_ok=True)
    cmd = [find_blender(), "-b", "--factory-startup", "--python-exit-code", "1", "-P", os.path.join(ROOT, "blender", "render_all.py"), "--",
           "--out", rdir(k), "--jobs", "dinos", "--only", ",".join(KEYS), "--no-model"] + args
    p = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, encoding="utf-8", errors="replace")
    if p.returncode != 0:
        print(p.stdout[-3000:])
        sys.exit("Blender でエラー")


def bbox(frames):
    box = None
    for im in frames:
        b = im.getchannel("A").point(lambda a: 255 if a > 40 else 0).getbbox()
        if b:
            box = b if not box else (min(box[0], b[0]), min(box[1], b[1]), max(box[2], b[2]), max(box[3], b[3]))
    return box


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--skip-render", action="store_true")
    p.add_argument("--modes", default="", help="この方式だけ描き直す（例：R）")
    a = p.parse_args()
    if not a.skip_render:
        for k, args, name in MODES:
            if a.modes and k not in a.modes.split(","):
                continue
            print("レンダリング:", name, flush=True)
            render(k, args)
    os.makedirs(OUT, exist_ok=True)
    data = {"options": {k: n for k, _, n in MODES}, "dinos": {}, "hd": {"R": RS}}
    for key in KEYS:
        info = None
        for k, _, _ in MODES:
            d = rdir(k)
            meta = json.load(open(os.path.join(d, "meta_%s.json" % key), encoding="utf-8"))
            size = tuple(meta["frame"])
            frames, anims = [], {}
            for name, an in meta["anims"].items():
                anims[name] = {"s": len(frames), "n": an["n"], "ms": an["ms"], "loop": bool(an.get("loop"))}
                for i in range(an["n"]):
                    path = os.path.join(d, "dino_%s_%s_%d.png" % (key, name, i))
                    pt = an["points"][i]
                    if k == "D":
                        im = pixelate.pixelate(path, size)
                        im = eyes.stamp(im, pt.get("eye"), "A", meta["diet"], meta["skin"], pt.get("eye_closed", False))
                    else:
                        im = Image.open(path).convert("RGBA").resize((size[0] * RS, size[1] * RS), Image.LANCZOS)
                    frames.append(im)
            fw, fh = frames[0].size
            sheet = Image.new("RGBA", (fw * len(frames), fh), (0, 0, 0, 0))
            for i, im in enumerate(frames):
                sheet.alpha_composite(im, (i * fw, 0))
            if k == "D":
                fn = "%s_%s.png" % (key, k)
                pixelate.save_png(sheet, os.path.join(OUT, fn))
            else:
                fn = "%s_%s.webp" % (key, k)
                sheet.save(os.path.join(OUT, fn), "WEBP", quality=88, method=6)
            if info is None:
                p0 = meta["anims"]["idle"]["points"][0]
                info = {"w": size[0], "h": size[1], "n": len(frames), "anims": anims, "sheets": {},
                        "gy": round(size[1] - p0["feet"][1], 1)}
                small = [f if f.size == size else f.resize(size, Image.LANCZOS) for f in frames]
                for an in anims.values():
                    an["box"] = list(bbox(small[an["s"]:an["s"] + an["n"]]))
            info["sheets"][k] = "art/output/real-preview/" + fn
            print("  %s %s: %d コマ  %d KB" % (key, k, len(frames), os.path.getsize(os.path.join(OUT, fn)) // 1024))
        data["dinos"][key] = info
    with open(os.path.join(OUT, "index.js"), "w", encoding="utf-8", newline="\n") as fp:
        fp.write("// art/real_preview.py が自動で書き出すファイル。リアル寄りの試作の比較ページ（tools/real.html）用\n")
        fp.write("window.EYE_OPT = " + json.dumps(data, ensure_ascii=False, separators=(",", ":")) + ";\n")
    print("art/output/real-preview/ に書き出しました。")


if __name__ == "__main__":
    os.chdir(ROOT)
    main()
