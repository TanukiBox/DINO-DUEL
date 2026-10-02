"""恐竜とエフェクトのドット絵を作り直すコマンド。

  python build.py                    … Blender でレンダリング → ドット絵にする → まとめる（全部）
  python build.py --skip-render      … レンダリングを省略（パレットの色だけ変えたときに速い）
  python build.py --only tyranno     … その恐竜だけレンダリング（カンマ区切り）
  python build.py --jobs fx          … エフェクトだけ（dinos / fx）

できるもの（art/output/）：
  dinos/<種>.png       … 1種の全部のコマを横に並べた1枚（1コマ 128×96）
  dinos/<種>_face.png  … 行動順などの丸いアイコン用の顔（40×40）
  fx/<名前>.png        … エフェクトのコマを横に並べた1枚
  pix.js               … ゲームが読む一覧（どのコマが何の動きか・当たる瞬間のコマ・口の位置など）
  preview/*.gif        … 確認用の動き（4倍）
"""
import argparse
import glob
import hashlib
import json
import os
import subprocess
import sys
import time

from PIL import Image

from pipeline.blender_path import find_blender
from pipeline import pixelate, fx2d, eyes

ROOT = os.path.dirname(os.path.abspath(__file__))
BUILD = os.path.join(ROOT, "build")          # 途中のファイル（Git には入れない）
RENDERS = os.path.join(BUILD, "renders")
OUT = os.path.join(ROOT, "output")
URL = "art/output/"                          # ゲームから見た置き場所

FX3D = {"chomp": ((64, 64), 6, 3), "wave": ((48, 64), 5, 0), "burst": ((80, 80), 6, 0)}   # 名前: (大きさ, コマ数, 当たる瞬間のコマ)
GIF_BG = (110, 165, 215, 255)


def render(jobs, only):
    blender = find_blender()
    if not blender:
        sys.exit("Blender が見つかりません。README の「困ったとき」を見てください。")
    cmd = [blender, "-b", "--factory-startup", "--python-exit-code", "1",
           "-P", os.path.join(ROOT, "blender", "render_all.py"), "--", "--out", RENDERS, "--jobs", jobs]
    if only:
        cmd += ["--only", only]
    print("Blender を起動します:", blender, flush=True)
    t0 = time.time()
    proc = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, encoding="utf-8", errors="replace")
    for line in proc.stdout.splitlines():
        if line.startswith(("==", "Traceback", "  File")) or ("Error" in line and "strokes set empty" not in line):
            print(line)
    if proc.returncode != 0:
        print(proc.stdout[-4000:])
        sys.exit("Blender でエラーが起きました（上のメッセージを見てください）。")
    print("レンダリング完了（%.0f 秒）" % (time.time() - t0))


def ver(url):
    """絵が変わったらブラウザが新しい絵を読むよう、中身の指紋を URL のうしろに付ける"""
    path = os.path.join(OUT, url[len(URL):])
    return url + "?v=" + hashlib.sha256(open(path, "rb").read()).hexdigest()[:8]


def strip(frames, size):
    sheet = Image.new("RGBA", (size[0] * len(frames), size[1]), (0, 0, 0, 0))
    for i, fr in enumerate(frames):
        sheet.alpha_composite(fr, (i * size[0], 0))
    return sheet


def convert_dinos(made, manifest):
    os.makedirs(os.path.join(OUT, "dinos"), exist_ok=True)
    os.makedirs(os.path.join(OUT, "preview"), exist_ok=True)
    for meta_path in sorted(glob.glob(os.path.join(RENDERS, "meta_*.json"))):
        key = os.path.basename(meta_path)[5:-5]
        meta = json.load(open(meta_path, encoding="utf-8"))
        if not meta.get("ready", True):
            continue          # まだゲームに出さない恐竜（dinos.py の ready=False）
        size = tuple(meta["frame"])
        frames, anims = [], {}
        for name, a in meta["anims"].items():
            start = len(frames)
            got = [pixelate.pixelate(os.path.join(RENDERS, "dino_%s_%s_%d.png" % (key, name, i)), size) for i in range(a["n"])]
            # 目：ドット絵にしたあとで、頭の骨から計算した目の位置に、決まった形の目を描き足す（pipeline/eyes.py）
            if eyes.CHOSEN:
                got = [eyes.stamp(im, pt.get("eye"), eyes.CHOSEN, meta.get("diet", "carnivore"), meta.get("skin"), pt.get("eye_closed", False))
                       for im, pt in zip(got, a["points"])]
            frames += got
            info = {"s": start, "n": a["n"], "ms": a["ms"], "pts": a["points"]}
            for k in ("loop", "impact", "windup", "strike", "after", "recover"):
                if k in a:
                    info[k] = a[k]
            anims[name] = info
            seq = got if not a.get("loop") else got * 2
            ms = a["ms"] if not a.get("loop") else a["ms"] * 2
            pixelate.save_gif(seq, os.path.join(OUT, "preview", "%s_%s.gif" % (key, name)), ms, 4, GIF_BG)
            made.append("preview/%s_%s.gif" % (key, name))
        pixelate.save_png(strip(frames, size), os.path.join(OUT, "dinos", key + ".png"))
        made.append("dinos/%s.png" % key)
        face = pixelate.pixelate(os.path.join(RENDERS, "face_%s.png" % key), (40, 40))
        if eyes.CHOSEN:
            face = eyes.stamp(face, meta.get("face_eye"), eyes.CHOSEN, meta.get("diet", "carnivore"), meta.get("skin"))
        pixelate.save_png(face, os.path.join(OUT, "dinos", key + "_face.png"))
        made.append("dinos/%s_face.png" % key)
        manifest["dinos"][key] = {"sheet": ver(URL + "dinos/%s.png" % key), "face": ver(URL + "dinos/%s_face.png" % key),
                                  "w": size[0], "h": size[1], "n": len(frames), "anims": anims, "moves": meta.get("moves", {})}
        print("  恐竜", key, len(frames), "コマ")


def convert_fx(made, manifest):
    os.makedirs(os.path.join(OUT, "fx"), exist_ok=True)
    for name, (size, n, impact) in FX3D.items():
        paths = [os.path.join(RENDERS, "fx_%s_%d.png" % (name, i)) for i in range(n)]
        if not all(os.path.exists(p) for p in paths):
            continue
        frames = [pixelate.pixelate(p, size) for p in paths]
        pixelate.save_png(strip(frames, size), os.path.join(OUT, "fx", name + ".png"))
        made.append("fx/%s.png" % name)
        manifest["fx"][name] = {"sheet": ver(URL + "fx/%s.png" % name), "w": size[0], "h": size[1], "n": n, "impact": impact}
    for name, fn in fx2d.ALL.items():
        frames, size = fn()
        pixelate.save_png(strip(frames, size), os.path.join(OUT, "fx", name + ".png"))
        made.append("fx/%s.png" % name)
        manifest["fx"][name] = {"sheet": ver(URL + "fx/%s.png" % name), "w": size[0], "h": size[1], "n": len(frames), "impact": 0}
    print("  エフェクト", len(manifest["fx"]), "種類")


def main():
    p = argparse.ArgumentParser(description="DINO DUEL の恐竜とエフェクトのドット絵を作り直す")
    p.add_argument("--skip-render", action="store_true")
    p.add_argument("--only", default="")
    p.add_argument("--jobs", default="dinos,fx")
    a = p.parse_args()
    if not eyes.CHOSEN:
        print("※ 目の案がまだ選ばれていません（pipeline/eyes.py の CHOSEN）。目なしで書き出します。")
    else:
        print("目の案:", eyes.OPTIONS[eyes.CHOSEN]["name"])
    if not a.skip_render:
        render(a.jobs, a.only)
    made = []
    manifest = {"v": 1, "dinos": {}, "fx": {}}
    convert_dinos(made, manifest)
    convert_fx(made, manifest)
    with open(os.path.join(OUT, "pix.js"), "w", encoding="utf-8", newline="\n") as f:
        f.write("// art/build.py が自動で書き出すファイル（手で書きかえない）。恐竜とエフェクトのドット絵の一覧\n")
        f.write("window.DN_PIX = " + json.dumps(manifest, ensure_ascii=False, separators=(",", ":")) + ";\n")
    made.append("pix.js")
    # 同じ入力から同じ画像ができているかの指紋（SHA-256）
    with open(os.path.join(OUT, "checksums.txt"), "w", encoding="utf-8", newline="\n") as f:
        for rel in made:
            f.write("%s  %s\n" % (hashlib.sha256(open(os.path.join(OUT, rel), "rb").read()).hexdigest(), rel))
    print("ドット絵 %d 個を art/output/ に書き出しました。" % len(made))


if __name__ == "__main__":
    os.chdir(ROOT)
    main()
