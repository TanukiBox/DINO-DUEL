"""Blender の中で、恐竜とエフェクトを全部レンダリングする（build.py から呼ばれる）。

  blender -b --factory-startup -P render_all.py -- --out build/renders --jobs dinos,fx [--only tyranno] [--test]

できるもの（build/renders/ に 4倍サイズ）：
  dino_<種>_<動き>_<コマ>.png … 恐竜の各コマ
  face_<種>.png               … 行動順などの丸いアイコン用の顔
  meta_<種>.json              … コマごとの口・頭・体の位置（ドット座標。エフェクトを置く場所）
  fx_<名前>_<コマ>.png        … 3Dで作るエフェクト（fx3d.py）
"""
import argparse
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

import common as C      # noqa: E402
import dinos            # noqa: E402
import theropod         # noqa: E402
import quadruped        # noqa: E402

TYPES = {"theropod": theropod.Theropod, "quadruped": quadruped.Quadruped}
FACE = (40, 40)


def render_species(key, out, test=None):
    """test = [(動き, コマ), ...] のときは、そのコマだけ描く（形を確かめる用。meta は書かない）"""
    spec = dinos.SPECIES[key]
    C.reset_scene(C.FRAME)
    cam = C.dino_camera()
    body = TYPES[spec["type"]](spec)
    meta = {"frame": list(C.FRAME), "anims": {}, "moves": dinos.MOVES.get(key, {}), "diet": spec.get("diet", "carnivore"),
            "ready": spec.get("ready", True), "skin": spec["colors"]["base"]}
    anims = dinos.ANIMS[key]
    if test:
        for name, i in test:
            body.build(anims[name]["frames"][i])
            C.render_to(os.path.join(out, "test_%s_%s_%d.png" % (key, name, i)))
        return
    for name, a in anims.items():
        pts = []
        for i, pose in enumerate(a["frames"]):
            an = body.build(pose)
            C.render_to(os.path.join(out, "dino_%s_%s_%d.png" % (key, name, i)))
            pts.append({k: (C.to_pixel(cam, v) if hasattr(v, "x") else v) for k, v in an.items()})
        info = {k: v for k, v in a.items() if k != "frames"}
        info["n"] = len(a["frames"])
        info["points"] = pts
        meta["anims"][name] = info
    # 顔（アイコン用）：待機の1コマ目を、頭に寄って撮る
    an = body.build(anims["idle"]["frames"][0])
    # 3Dモデル（待機の1コマ目の形）を .blend で残す：Blender で開いて形や色を確かめられる
    models = os.path.join(HERE, "..", "models")
    os.makedirs(models, exist_ok=True)
    C.bpy.ops.wm.save_as_mainfile(filepath=os.path.abspath(os.path.join(models, key + ".blend")), copy=True, compress=True)
    C.set_size(FACE)
    hc = an["head"]
    face_cam = C.dino_camera(target=(hc.x - 0.04, hc.y, hc.z - 0.03), ortho=1.05, name="CamFace")
    C.render_to(os.path.join(out, "face_%s.png" % key))
    with open(os.path.join(out, "meta_%s.json" % key), "w", encoding="utf-8") as f:
        json.dump(meta, f, ensure_ascii=False)


def main():
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    p = argparse.ArgumentParser()
    p.add_argument("--out", required=True)
    p.add_argument("--jobs", default="dinos,fx")
    p.add_argument("--only", default="")
    p.add_argument("--test", default="", help="形の確認：idle:0,bite:1 のように描くコマ")
    a = p.parse_args(argv)
    os.makedirs(a.out, exist_ok=True)
    jobs = a.jobs.split(",")
    if "dinos" in jobs:
        keys = [k for k in dinos.SPECIES if not a.only or k in a.only.split(",")]
        for k in keys:
            print("== 恐竜", k, flush=True)
            test = [(t.split(":")[0], int(t.split(":")[1])) for t in a.test.split(",")] if a.test else None
            render_species(k, a.out, test)
    if "fx" in jobs:
        import fx3d
        print("== エフェクト", flush=True)
        fx3d.render_all(a.out)


main()
