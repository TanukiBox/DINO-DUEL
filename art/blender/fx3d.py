"""3Dで作るエフェクト（恐竜と同じセル調の塗り・同じパレット・同じドット絵の変換）。

  chomp … 噛みつき：上下の歯が、相手の上でガチンと閉じる（正面から見た 64×64、6コマ）
  wave  … 咆哮の音の波：輪が前へ広がる（恐竜と同じカメラ。48×64、5コマ）。ゲームが口から相手へ飛ばす
  burst … 咆哮が当たった衝撃波：正面向きの輪が広がる（80×80、6コマ）
大きさ（size）を変えた同じ形を、強い技ほど大きく使う（段階2）。
"""
import math
import os

import bmesh
from mathutils import Vector, Matrix

import common as C

CHOMP = (64, 64)
WAVE = (48, 64)
BURST = (80, 80)


def _jaw(upper, gap, spread, mats, prefix):
    """歯ぐきの弧と、内側を向いた歯。upper=True なら上あご（下向きの歯）。gap = 上下の離れぐあい"""
    s = 1 if upper else -1
    gum, tooth = mats
    # 歯ぐき：横に長い弧（正面から見て「へ」の字）
    pts = []
    n = 9
    for i in range(n):
        t = (i / (n - 1)) * 2 - 1
        x = t * spread
        z = s * (gap + 0.16 * (t * t))
        pts.append(Vector((x, 0, z)))
    # 断面は「上下（z）× 奥行き（-y = カメラの方）」の だ円
    rings = [(p, Vector((0, 0, 1)), Vector((0, -1, 0)), 0.075, 0.06, 0.06, 0.0) for p in pts]
    bm, _ = C.loft(rings, 10)
    C.mesh_object(prefix + "gum", bm, gum)
    # 歯：弧にそって、内側（相手の方）を向く。まん中ほど大きい
    for i in range(1, n - 1):
        t = (i / (n - 1)) * 2 - 1
        p = pts[i]
        L = 0.3 * (1.0 - 0.4 * abs(t))
        C.cone(p + Vector((0, -0.04, -s * 0.04)), p + Vector((t * 0.05, -0.04, -s * (0.04 + L))), 0.075 * (1 - 0.3 * abs(t)), tooth, name=prefix + "tooth")


def render_chomp(out):
    C.reset_scene(CHOMP)
    C.front_camera(target=(0, 0, 0), ortho=1.6)
    gum = C.toon("#c0322a")
    tooth = C.toon("#fff8ea")
    # 開いている → 閉じていく → ガチン（当たる瞬間 = 3コマ目）→ はね返り → 小さくなって消える
    keys = [(0.5, 1.0), (0.34, 1.0), (0.16, 1.0), (-0.02, 1.0), (0.05, 0.92), (0.12, 0.72)]
    for i, (gap, sc) in enumerate(keys):
        C.remove_objects("F_")
        _jaw(True, gap, 0.62 * sc, (gum, tooth), "F_u")
        _jaw(False, gap, 0.62 * sc, (gum, tooth), "F_l")
        if sc < 1:
            for ob in [o for o in list(C.bpy.data.objects) if o.name.startswith("F_")]:
                ob.scale = (sc, sc, sc)
        C.render_to(os.path.join(out, "fx_chomp_%d.png" % i))


def _ring(center, normal, radius, thick, mat, name):
    """輪（トーラス）。normal は輪の向き"""
    bm = bmesh.new()
    seg, segm = 40, 8
    rows = []
    for i in range(seg):
        a = 2 * math.pi * i / seg
        row = []
        for j in range(segm):
            b = 2 * math.pi * j / segm
            r = radius + thick * math.cos(b)
            row.append(bm.verts.new((r * math.cos(a), r * math.sin(a), thick * math.sin(b))))
        rows.append(row)
    for i in range(seg):
        r0, r1 = rows[i], rows[(i + 1) % seg]
        for j in range(segm):
            k = (j + 1) % segm
            bm.faces.new((r0[j], r1[j], r1[k], r0[k]))
    q = Vector(normal).normalized().to_track_quat("Z", "Y")
    bmesh.ops.transform(bm, matrix=Matrix.Translation(Vector(center)) @ q.to_matrix().to_4x4(), verts=bm.verts)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return C.mesh_object(name, bm, mat)


def render_wave(out):
    """咆哮の音の波（横から見た輪 = 「（」の形）。恐竜と同じカメラ"""
    C.reset_scene(WAVE)
    C.bpy.context.scene.render.use_freestyle = False   # 重なる部品がないので線はいらない
    C.dino_camera(target=(0.0, 0, 0.0), ortho=WAVE[0] / C.FRAME[0] * C.ORTHO)
    m1 = C.toon("#fff8ea")
    m2 = C.toon("#f2c050")
    for i in range(5):
        C.remove_objects("F_")
        r = 0.18 + 0.12 * i
        _ring((-0.1 + 0.08 * i, 0, 0), (1, 0, 0), r, 0.05 - 0.006 * i, m1 if i < 3 else m2, "F_ring")
        if i >= 1:
            _ring((-0.22 + 0.08 * i, 0, 0), (1, 0, 0), r * 0.6, 0.035, m2, "F_ring2")
        C.render_to(os.path.join(out, "fx_wave_%d.png" % i))


def render_burst(out):
    """咆哮が当たったときの衝撃波（正面向きの輪が広がり、細くなる）"""
    C.reset_scene(BURST)
    C.bpy.context.scene.render.use_freestyle = False
    C.front_camera(target=(0, 0, 0), ortho=2.0)
    m1 = C.toon("#fff8ea")
    m2 = C.toon("#f2c050")
    m3 = C.toon("#ff9a3a")
    for i in range(6):
        C.remove_objects("F_")
        r = 0.2 + 0.15 * i
        _ring((0, 0, 0), (0, -1, 0.15), r, max(0.02, 0.09 - 0.014 * i), m1 if i < 2 else m2, "F_ring")
        if 1 <= i <= 4:
            _ring((0, 0, 0), (0, -1, 0.15), r * 0.62, max(0.02, 0.06 - 0.01 * i), m3, "F_ring2")
        C.render_to(os.path.join(out, "fx_burst_%d.png" % i))


def render_all(out):
    render_chomp(out)
    render_wave(out)
    render_burst(out)
