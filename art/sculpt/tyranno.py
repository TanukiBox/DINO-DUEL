"""ティラノサウルスの「彫刻」モデルの設計図（hifipushie の spec）を作る。

hifipushie（関節と粘土のかたまりで形を作り、線で筋肉やしわを彫る道具）で読む JSON を書き出す：
  python art/sculpt/tyranno.py   → art/sculpt/tyranno.json

座標：hifipushie は Blender と同じ Z が上で、恐竜は -Y を向き、左側が +X。
このファイルでは、ゲームの絵と同じ「前 = x・上 = z・横 = y」で数字を書き、P() で hifipushie の座標に直す。
大きさ：鼻先〜しっぽの先 = 3.8（ゲームの絵の形の数字と同じ。恐竜図鑑の横からの図を測った値）。
".L" の付いた部品は、左右対称に右側（.R）も作られる。
"""
import json
import math
import os

HERE = os.path.dirname(os.path.abspath(__file__))


def P(x, z, y=0.0):
    """ゲームの座標（前 x・上 z・横 y）→ hifipushie の座標（横 X・後ろ Y・上 Z）"""
    return [round(y, 4), round(-x, 4), round(z, 4)]


def build():
    J, B, O, S = {}, {}, {}, {}

    def joint(name, x, z, r, y=0.0):
        J[name] = {"pos": P(x, z, y), "r": r}

    def bone(name, a, b, **kw):
        B[name] = dict(a=a, b=b, **kw)

    def blob(name, x, z, size, y=0.0, **kw):
        """size = (横, 前後, 上下) の半径"""
        O[name] = dict(at=P(x, z, y), size=list(size), **kw)

    # ---------------- 胴体としっぽ（体の中心線）----------------
    for name, x, z, r in (("tail5", -1.97, 1.09, 0.006), ("tail4", -1.85, 1.09, 0.022), ("tail3", -1.60, 1.09, 0.042),
                          ("tail2", -1.25, 1.095, 0.068), ("tail1", -0.85, 1.10, 0.112), ("tail0", -0.45, 1.10, 0.165),
                          ("pelvis", -0.10, 1.05, 0.25), ("belly", 0.28, 1.02, 0.34), ("chest", 0.55, 1.07, 0.33),
                          ("shoulder", 0.80, 1.12, 0.30), ("neck0", 0.98, 1.14, 0.26), ("neck1", 1.10, 1.21, 0.22)):
        joint(name, x, z, r)
    for a, b in (("tail5", "tail4"), ("tail4", "tail3"), ("tail3", "tail2"), ("tail2", "tail1"), ("tail1", "tail0"), ("tail0", "pelvis")):
        bone("tail_" + a, a, b, group="tail", join=0.04, flat=[0.85, 1.0])
    for a, b in (("pelvis", "belly"), ("belly", "chest"), ("chest", "shoulder")):
        bone("spine_" + a, a, b, flat=[1.0, 1.05])
    bone("neck_a", "shoulder", "neck0", flat=[1.0, 1.05])
    bone("neck_b", "neck0", "neck1", flat=[1.0, 1.05])
    # おなかの深さ（下へ張り出す）・胸・首の太い筋肉
    blob("belly_mass", 0.36, 0.84, (0.29, 0.38, 0.22))
    blob("chest_mass", 0.66, 0.95, (0.23, 0.2, 0.16))
    blob("neck_muscle.L", 1.02, 1.20, (0.11, 0.2, 0.17), y=0.11, rot=[0, 0, 0])

    # ---------------- 頭（上の頭の骨）----------------
    joint("head", 1.21, 1.40, 0.17)
    joint("face", 1.45, 1.40, 0.145)
    joint("snout", 1.70, 1.385, 0.11)
    joint("nose", 1.82, 1.37, 0.075)
    bone("cranium", "neck1", "head", flat=[1.2, 1.0])
    bone("skull", "head", "face", flat=[1.3, 1.0])
    bone("muzzle", "face", "snout", flat=[1.05, 1.0])
    bone("muzzle_tip", "snout", "nose", flat=[1.0, 1.0])
    # ほお（あごの筋肉で頭のうしろが横に張る）・まゆの骨と小さな角（目の上と前）
    blob("cheek.L", 1.18, 1.30, (0.08, 0.13, 0.11), y=0.15)
    blob("brow.L", 1.28, 1.535, (0.065, 0.11, 0.04), y=0.145, rot=[0, 0, 8])
    blob("lacrimal.L", 1.37, 1.56, (0.04, 0.055, 0.035), y=0.115)
    # 鼻の穴（へこみ）
    blob("nostril.L", 1.80, 1.40, (0.018, 0.026, 0.016), y=0.055, op="subtract", blend=0.008)

    # ---------------- 下あご（別の部品。口を開ける動きのため）----------------
    joint("jaw_back", 1.11, 1.15, 0.10)
    joint("jaw_mid", 1.42, 1.19, 0.066)
    joint("chin", 1.79, 1.265, 0.036)
    bone("jaw_a", "jaw_back", "jaw_mid", flat=[1.55, 1.0], part="jaw")
    bone("jaw_b", "jaw_mid", "chin", flat=[1.5, 1.0], part="jaw")

    # ---------------- 歯（別の部品）：上は頭の下のふちから下へ、下はあごの上のふちから上へ ----------------
    def tooth_row(prefix, x0, x1, n, z_of, y_of, down, length, part):
        for i in range(n):
            t = i / (n - 1)
            x = x0 + (x1 - x0) * t
            L = length * (0.65 + 0.35 * math.sin(math.pi * (0.25 + 0.6 * t)))
            z = z_of(x)
            y = y_of(x)
            joint("%s%d.L" % (prefix, i), x, z, 0.014, y=y)
            joint("%s%d_tip.L" % (prefix, i), x + 0.006, z - L if down else z + L, 0.002, y=y * 0.98)
            bone("%s%d.L" % (prefix, i), "%s%d.L" % (prefix, i), "%s%d_tip.L" % (prefix, i), part=part, blend=0.003)

    mouth = lambda x: 1.22 + (x - 1.2) * 0.123          # 口の線（閉じたときの上下の歯の合わせ目）
    tooth_row("ut", 1.30, 1.80, 8, lambda x: mouth(x) + 0.012, lambda x: 0.135 - (x - 1.30) * 0.17, True, 0.055, "teeth")
    tooth_row("lt", 1.32, 1.76, 7, lambda x: mouth(x) - 0.012, lambda x: 0.12 - (x - 1.32) * 0.16, False, 0.04, "lteeth")

    # ---------------- 脚（待機の形。足の裏は地面）----------------
    joint("hip.L", -0.04, 1.00, 0.17, y=0.24)
    joint("knee.L", 0.173, 0.615, 0.105, y=0.25)
    joint("ankle.L", -0.04, 0.253, 0.07, y=0.25)
    joint("toe.L", 0.08, 0.045, 0.06, y=0.26)
    bone("thigh.L", "hip.L", "knee.L", r_a=0.27, r_b=0.115)
    bone("shin.L", "knee.L", "ankle.L", r_a=0.115, r_b=0.075, blend=0.02)
    bone("meta.L", "ankle.L", "toe.L", r_a=0.075, r_b=0.06, blend=0.015)        # 足の甲（長い）
    blob("haunch.L", 0.0, 0.92, (0.15, 0.24, 0.24), y=0.25)           # 太もものとても大きな筋肉
    blob("calf.L", 0.06, 0.48, (0.08, 0.11, 0.17), y=0.25)

    # ---------------- 腕（短く、指は2本）----------------
    joint("shoulder.L", 0.90, 0.93, 0.07, y=0.22)
    joint("elbow.L", 0.95, 0.73, 0.052, y=0.25)
    joint("wrist.L", 1.10, 0.68, 0.042, y=0.24)
    joint("f1.L", 1.17, 0.61, 0.022, y=0.26)
    joint("f1_tip.L", 1.19, 0.56, 0.004, y=0.265)
    joint("f2.L", 1.16, 0.63, 0.02, y=0.215)
    joint("f2_tip.L", 1.18, 0.58, 0.004, y=0.21)
    bone("upperarm.L", "shoulder.L", "elbow.L", blend=0.015)
    bone("forearm.L", "elbow.L", "wrist.L", blend=0.012)
    bone("finger1.L", "wrist.L", "f1.L", blend=0.008)
    bone("finger2.L", "wrist.L", "f2.L", blend=0.008)
    bone("claw1.L", "f1.L", "f1_tip.L", part="claws", blend=0.004)
    bone("claw2.L", "f2.L", "f2_tip.L", part="claws", blend=0.004)

    # ---------------- 筋肉・しわ（表面を盛る clay・へこませる crease）----------------
    L, U, F, BK, D = [1, 0, 0], [0, 0, 1], [0, -1, 0], [0, 1, 0], [0, 0, -1]     # 左・上・前・うしろ・下
    S["jaw_muscle.L"] = {"op": "clay", "path": [{"bone": "skull", "t": 0.0, "side": [1, 0, 0.35]}, {"t": 0.28}],
                         "width": [0.075, 0.05], "depth": [0.02, 0.0]}
    S["cheekbone.L"] = {"op": "clay", "path": [{"bone": "skull", "t": 0.1, "side": [1, 0, -0.25]}, {"t": 0.45}, {"t": 0.8}],
                        "width": 0.032, "depth": [0.0, 0.012, 0.0]}
    S["snout_bumps"] = {"op": "clay", "path": [{"bone": "muzzle", "t": 0.5, "side": U}], "width": 0.022, "depth": 0.006, "profile": "round",
                        "scatter": {"count": 12, "seed": 3, "t": [0.0, 1.0], "around": [-35, 35], "scale": [0.7, 1.2], "spacing": 0.045}}
    S["neck_folds.L"] = {"op": "crease", "path": [{"bone": "neck_a", "t": 0.3, "side": [1, 0, -0.7]}, {"side": [1, 0, 0]}, {"side": [1, 0, 0.6]}],
                         "width": 0.022, "depth": [0.003, 0.009, 0.003], "repeat": {"count": 4, "shift": {"t": 0.22}, "scale": 0.9}}
    S["throat_folds.L"] = {"op": "crease", "path": [{"bone": "neck_b", "t": 0.0, "side": [0.1, 0, -1]}, {"side": [0.8, 0, -0.6]}],
                           "width": 0.018, "depth": [0.007, 0.002], "repeat": {"count": 3, "shift": {"t": 0.3}}}
    S["pectoral.L"] = {"op": "clay", "path": [{"bone": "spine_chest", "t": 0.3, "side": [1, -0.3, -0.7]}, {"t": 0.7}, {"t": 1.0}],
                       "width": [0.09, 0.12, 0.08], "depth": [0.0, 0.028, 0.0]}
    S["ribs.L"] = {"op": "clay", "path": [{"bone": "spine_belly", "t": 0.05, "side": [1, 0, 0.35]}, {"side": [1, 0, -0.45]}],
                   "width": 0.035, "depth": [0.007, 0.0], "repeat": {"count": 6, "shift": {"t": 0.14}}}
    S["thigh_front.L"] = {"op": "clay", "path": [{"bone": "thigh.L", "t": 0.15, "side": F}, {"t": 0.5}, {"t": 0.85}],
                          "width": [0.06, 0.09, 0.05], "depth": [0.0, 0.03, 0.0]}
    S["thigh_back.L"] = {"op": "clay", "path": [{"bone": "thigh.L", "t": 0.1, "side": [0.3, 1, 0]}, {"t": 0.5}, {"t": 0.8}],
                         "width": [0.08, 0.08, 0.05], "depth": [0.0, 0.025, 0.0]}
    S["tail_muscle.L"] = {"op": "clay", "path": [{"bone": "tail_tail1", "t": 0.4, "side": [0.7, 0, -0.7]}, {"t": 1.0}, {"bone": "tail_tail0", "t": 0.6}],
                          "width": [0.04, 0.07, 0.06], "depth": [0.0, 0.02, 0.0]}
    S["calf_back.L"] = {"op": "clay", "path": [{"bone": "shin.L", "t": 0.1, "side": BK}, {"t": 0.5}], "width": [0.05, 0.035], "depth": [0.016, 0.0]}
    S["knee_crease.L"] = {"op": "crease", "path": [{"bone": "shin.L", "t": 0.06, "side": BK, "around": -45}, {"around": 0}, {"around": 45}],
                          "width": 0.016, "depth": [0.002, 0.007, 0.002]}
    S["ankle_folds.L"] = {"op": "crease", "path": [{"bone": "meta.L", "t": 0.06, "side": F, "around": -50}, {"around": 0}, {"around": 50}],
                          "width": 0.012, "depth": [0.001, 0.005, 0.001], "repeat": {"count": 3, "shift": {"t": 0.07}}}
    S["back_ridge"] = {"op": "clay", "path": [{"bone": "neck_b", "t": 0.2, "side": U}, {"bone": "spine_chest", "t": 0.5}, {"bone": "spine_pelvis", "t": 0.0},
                                              {"bone": "tail_tail1", "t": 1.0}, {"bone": "tail_tail2", "t": 0.2}],
                       "width": [0.02, 0.035, 0.035, 0.03, 0.015], "depth": [0.004, 0.01, 0.01, 0.008, 0.0]}

    # ---------------- 色（色は前の絵と同じ系統の赤茶。恐竜図鑑の色は使わない）----------------
    skin = ["body", "jaw"]
    stripe_bones = [("spine_pelvis", 3), ("spine_belly", 2), ("spine_chest", 2), ("tail_tail0", 2), ("tail_tail1", 3), ("tail_tail2", 3), ("tail_tail3", 2)]
    paint = {
        "skin": {"color": "#8a5232", "part": skin, "roughness": 0.55},
        "back_dark": {"color": "#4d2c1c", "part": skin, "facing": [0, 0.15, 1], "range": [-0.05, 0.8], "opacity": 0.85},
        "belly_light": {"color": "#c9ac84", "part": skin, "facing": [0, 0, -1], "range": [0.05, 0.75], "opacity": 0.8},
        "tone": {"color": "#6a3a24", "part": skin, "opacity": 0.4, "noise": {"scale": 0.3, "range": [0.35, 0.75], "seed": 4}},
    }
    for bn, n in stripe_bones:
        paint["stripe_%s.L" % bn] = {"color": "#2e1a12", "part": "body", "opacity": 0.75, "width": [0.04, 0.012], "profile": "soft",
                                     "path": [{"bone": bn, "t": 0.15, "side": [0, 0, 1]}, {"side": [1, 0, 0.15]}],
                                     "repeat": {"count": n, "shift": {"t": 0.7 / n}},
                                     "mask": [{"noise": {"scale": 0.05, "range": [0.25, 0.6], "seed": 7}, "blend": "multiply"}]}
    paint.update({
        "scales": {"color": "#4a2a1a", "part": skin, "opacity": 0.35, "height": -0.0018,
                   "mask": [{"cells": {"scale": 0.035, "range": [0.14, 0.02], "seed": 2}}]},
        "scale_tone": {"color": "#5e3420", "part": skin, "opacity": 0.3, "mask": [{"cells": {"scale": 0.035, "mode": "id", "range": [0.4, 1.0], "seed": 2}}]},
        "back_plates": {"color": "#3c2216", "part": skin, "opacity": 0.4, "height": 0.003,
                        "mask": [{"cells": {"scale": 0.07, "mode": "distance", "range": [0.4, 0.12], "seed": 5}},
                                 {"facing": [0, 0, 1], "range": [0.45, 0.85], "blend": "multiply"}]},
        "belly_bands": {"color": "#a88a66", "part": skin, "opacity": 0.4, "height": -0.0015,
                        "mask": [{"cells": {"scale": 0.04, "range": [0.14, 0.02], "stretch": {"dir": [1, 0, 0], "factor": 3}, "seed": 8}},
                                 {"facing": [0, 0, -1], "range": [0.35, 0.8], "blend": "multiply"}]},
        "head_scales": {"color": "#3e2216", "part": skin, "opacity": 0.4, "height": -0.0012,
                        "mask": [{"cells": {"scale": 0.018, "range": [0.14, 0.02], "seed": 11}},
                                 {"near": ["skull", "muzzle", "muzzle_tip", "cranium", "jaw_a", "jaw_b"], "within": 0.05, "soft": 0.06, "blend": "multiply"}]},
        "crease_dirt": {"color": "#22140c", "part": skin, "cavity": "concave", "radius": [0.05, 0.01], "opacity": 0.65},
        "grime": {"color": "#2a1a10", "part": skin, "opacity": 0.4, "roughness": 0.7, "mask": [{"ao": [0.5, 0.25]}]},
        "gums": {"color": "#8e3a34", "part": skin, "roughness": 0.35, "near": [b for b in B if b.startswith(("ut", "lt"))], "within": 0.02, "soft": 0.02},
        "teeth": {"color": "#d9ccb0", "part": ["teeth", "lteeth"], "roughness": 0.35},
        "teeth_base": {"color": "#a8946c", "part": ["teeth", "lteeth"], "opacity": 0.5, "noise": {"scale": 0.01, "range": [0.3, 0.8], "seed": 12}},
        # 口の中（口を開けたときに見える）：上の歯の近くの下向きの面・下の歯の近くの上向きの面を、暗い赤に
        "palate": {"color": "#6a2824", "part": "body", "roughness": 0.3,
                   "mask": [{"near": [b for b in B if b.startswith("ut")], "within": 0.1, "soft": 0.04},
                            {"facing": [0, 0, -1], "range": [0.15, 0.7], "blend": "multiply"}]},
        "mouth_floor": {"color": "#7a302a", "part": "jaw", "roughness": 0.3,
                        "mask": [{"near": [b for b in B if b.startswith("lt")], "within": 0.1, "soft": 0.04},
                                 {"facing": [0, 0, 1], "range": [0.15, 0.7], "blend": "multiply"}]},
        "claws": {"color": "#1c1612", "part": "claws", "roughness": 0.3},
        "eyes": {"color": "#d8a030", "part": "eyes", "roughness": 0.05, "specular": 0.7},
        "pupil.L": {"color": "#120a06", "part": "eyes", "path": [{"at": "face_eye.L", "offset": [0.05, -0.008, 0.0], "dir": [1, -0.2, 0]}], "width": 0.016},
    })

    spec = {
        "symmetry": True,
        "paint": paint,
        "blend": 0.06,
        "joints": J, "bones": B, "blobs": O, "strokes": S,
        "kits": {
            "foot.L": {"type": "foot", "ankle": "ankle.L", "ball": "toe.L", "toes": 3, "length": 0.2, "lengths": [0.85, 1.0, 0.8],
                       "r": 0.045, "spread": 34, "curl": 8, "heel": 0.05, "size": [0.12, 0.13, 0.08]},
            "face": {"type": "face", "head": "head",
                     "eyes": {"at": [0.15, -0.08, 0.08], "r": 0.046, "upper": 0.45, "lower": 0.2, "dir": [1, -0.25, 0.1],
                              "part": "eyes", "tilt": -6}},
        },
        "parts": {
            "body": {"color": [0.55, 0.32, 0.2]},
            "jaw": {"color": [0.55, 0.34, 0.22]},
            "teeth": {"color": [0.86, 0.8, 0.66]},
            "lteeth": {"color": [0.86, 0.8, 0.66]},
            "claws": {"color": [0.12, 0.1, 0.09]},
            "eyes": {"color": [0.85, 0.62, 0.15]},
        },
    }
    return spec


if __name__ == "__main__":
    spec = build()
    out = os.path.join(HERE, "tyranno.json")
    with open(out, "w", encoding="utf-8") as f:
        json.dump(spec, f, ensure_ascii=False, indent=1)
    print("wrote", out, len(spec["joints"]), "joints", len(spec["bones"]), "bones", len(spec["blobs"]), "blobs")
