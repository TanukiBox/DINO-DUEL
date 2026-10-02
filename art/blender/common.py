"""Blender の中で使う共通の道具（シーン・カメラ・セル調の塗り・線・形づくり）。

多幸寿（Oh!Edo Taco Tuesday!!）の art/blender/common.py と同じ方式：
  ・塗りはセル調：光の向きで「影・地の色・明るい色」の3段（3色ともパレットの色）。光源はいらない（発光で塗る）
  ・内側の線は Freestyle：部品が重なる所に、その部品の色を暗くした線。外側の輪郭はドット絵にする段階で引く
  ・乱数は名前から作った固定の種。毎回同じ絵になる
このファイルは build.py から Blender（画面なし）で動く。
"""
import math
import os
import sys
import zlib
import random

import bpy
import bmesh
from mathutils import Vector, Matrix
from bpy_extras.object_utils import world_to_camera_view

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "pipeline"))
from palette import RAMP, PALETTE  # noqa: E402

# ---------------------------------------------------------------------------
# 全部の恐竜でそろえる設定（カメラの角度・ドットの大きさ・光の向き）
# ---------------------------------------------------------------------------
FRAME = (128, 96)          # 1コマの完成サイズ（ドット）
SCALE = 4                  # 4倍で描いて縮める
ORTHO = 4.4                # 画面の横幅 = 4.4（世界の長さ）。全種で同じなので、ドットの大きさがそろう
CAM_AZ = 15.0              # カメラの向き：真横から 15度 前に回りこむ（横顔の形がわかり、胸も少し見える）
CAM_EL = 14.0              # 見下ろす角度
CAM_TARGET = (-0.08, 0.0, 0.8)
TOON_LIGHT = Vector((-0.45, -0.7, 0.55)).normalized()   # 光の来る向き（左上・手前から。多幸寿と同じ）
LINE_PX = 4.2              # 内側の線の太さ（4倍で描くので、完成で約1ドット）


def rng_for(name):
    return random.Random(zlib.crc32(name.encode("utf-8")))


# ---------------------------------------------------------------------------
# シーン
# ---------------------------------------------------------------------------
def reset_scene(size=FRAME):
    for coll in (bpy.data.objects, bpy.data.meshes, bpy.data.materials, bpy.data.lights,
                 bpy.data.cameras, bpy.data.images, bpy.data.worlds, bpy.data.curves):
        for item in list(coll):
            coll.remove(item)
    scene = bpy.context.scene
    r = scene.render
    r.engine = "CYCLES"
    r.film_transparent = True
    r.resolution_x = size[0] * SCALE
    r.resolution_y = size[1] * SCALE
    r.resolution_percentage = 100
    r.image_settings.file_format = "PNG"
    r.image_settings.color_mode = "RGBA"
    r.image_settings.color_depth = "8"
    c = scene.cycles
    c.device = "CPU"
    c.samples = 8
    c.use_adaptive_sampling = False
    c.seed = 0
    c.use_animated_seed = False
    c.use_denoising = False
    c.pixel_filter_type = "BOX"
    c.filter_width = 1.0
    c.max_bounces = 0
    scene.view_settings.view_transform = "Standard"
    scene.view_settings.look = "None"
    scene.view_settings.exposure = 0.0
    scene.view_settings.gamma = 1.0
    w = bpy.data.worlds.new("World")
    scene.world = w
    try:
        w.use_nodes = True
        for n in w.node_tree.nodes:
            if n.type == "BACKGROUND":
                n.inputs["Strength"].default_value = 0.0
    except Exception:
        pass
    inner_lines()
    scene.frame_set(1)
    return scene


def set_size(size):
    r = bpy.context.scene.render
    r.resolution_x = size[0] * SCALE
    r.resolution_y = size[1] * SCALE


def render_to(path):
    scene = bpy.context.scene
    scene.render.filepath = path
    bpy.ops.render.render(write_still=True)
    print("  rendered:", os.path.basename(path), flush=True)


def link(obj):
    bpy.context.scene.collection.objects.link(obj)
    return obj


def inner_lines():
    """内側の線（Freestyle）：部品が重なる所に、その部品の色を暗くした線。外側の輪郭は描かない（pipeline で描く）"""
    scene = bpy.context.scene
    scene.render.use_freestyle = True
    scene.render.line_thickness_mode = "ABSOLUTE"
    vl = bpy.context.view_layer
    vl.use_freestyle = True
    fs = vl.freestyle_settings
    ls = fs.linesets[0] if len(fs.linesets) else fs.linesets.new("lines")
    ls.select_by_visibility = True
    ls.select_by_edge_types = True
    ls.select_silhouette = True
    ls.select_border = False
    ls.select_crease = False
    ls.select_external_contour = True
    ls.exclude_external_contour = True
    ls.edge_type_combination = "AND"
    nl = noline_coll()
    ls.select_by_collection = True
    ls.collection = nl
    ls.collection_negation = "EXCLUSIVE"
    st = ls.linestyle
    st.thickness = LINE_PX
    st.color = (0.02, 0.01, 0.01)
    if not any(m.type == "MATERIAL" for m in st.color_modifiers):
        mod = st.color_modifiers.new("mat", "MATERIAL")
        mod.material_attribute = "LINE"


def noline_coll():
    c = bpy.data.collections.get("noline") or bpy.data.collections.new("noline")
    if c.name not in bpy.context.scene.collection.children:
        bpy.context.scene.collection.children.link(c)
    return c


# ---------------------------------------------------------------------------
# カメラ（全部の恐竜で同じ。右を向いた恐竜を、少し前・少し上から見る）
# ---------------------------------------------------------------------------
def cam_dir(az=CAM_AZ, el=CAM_EL):
    a, e = math.radians(az), math.radians(el)
    return Vector((math.sin(a) * math.cos(e), -math.cos(a) * math.cos(e), math.sin(e)))


def dino_camera(target=CAM_TARGET, ortho=ORTHO, az=CAM_AZ, el=CAM_EL, name="Cam"):
    cd = bpy.data.cameras.new(name)
    cd.type = "ORTHO"
    cd.ortho_scale = ortho
    cd.clip_start = 0.01
    cd.clip_end = 100.0
    ob = link(bpy.data.objects.new(name, cd))
    t = Vector(target)
    ob.location = t + cam_dir(az, el) * 20.0
    # カメラの -Z を見る向きに、Y（画面の上）を世界の上へ向ける（地面が画面で水平に写る）
    ob.rotation_euler = (t - ob.location).to_track_quat("-Z", "Y").to_euler()
    bpy.context.scene.camera = ob
    return ob


def facing_eye(Mh, near, far):
    """頭の左右の目（頭の中での位置 near=手前・far=奥）のうち、カメラの方を向いている方の位置。
    ふつうは手前の目。倒れて頭が裏返ったコマでは奥の目になる（描く目はいつも1つだけで、消えない）"""
    n = (Mh.to_3x3() @ Vector((0, -1, 0))).normalized()
    return Mh @ Vector(near) if n.dot(cam_dir()) >= 0 else Mh @ Vector(far)


def front_camera(target=(0, 0, 0), ortho=2.0, name="CamFront"):
    """正面から見るカメラ（エフェクト用。-Y の方向から見る）"""
    return dino_camera(target, ortho, az=0.0, el=0.0, name=name)


def to_pixel(cam, p, size=FRAME):
    """世界の点 → 完成サイズのドット座標 (x, y)"""
    v = world_to_camera_view(bpy.context.scene, cam, Vector(p))
    return [round(v.x * size[0], 1), round((1 - v.y) * size[1], 1)]


# ---------------------------------------------------------------------------
# セル調の塗り
# ---------------------------------------------------------------------------
def lin(h):
    h = h.lstrip("#")
    out = []
    for i in (0, 2, 4):
        c = int(h[i:i + 2], 16) / 255.0
        out.append(c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4)
    return (*out, 1.0)


def _new_mat(name):
    m = bpy.data.materials.new(name)
    try:
        m.use_nodes = True
    except Exception:
        pass
    nt = m.node_tree
    for n in list(nt.nodes):
        nt.nodes.remove(n)
    return m, nt


def _toon_fac(nt):
    geo = nt.nodes.new("ShaderNodeNewGeometry")
    dot = nt.nodes.new("ShaderNodeVectorMath")
    dot.operation = "DOT_PRODUCT"
    dot.inputs[1].default_value = tuple(TOON_LIGHT)
    nt.links.new(geo.outputs["Normal"], dot.inputs[0])
    ma = nt.nodes.new("ShaderNodeMath")
    ma.operation = "MULTIPLY_ADD"
    ma.inputs[1].default_value = 0.5
    ma.inputs[2].default_value = 0.5
    nt.links.new(dot.outputs["Value"], ma.inputs[0])
    return ma.outputs[0]


def _ramp3(nt, fac, base, cut=(0.4, 0.8)):
    sh, li, _ = RAMP.get(base, (base, base, PALETTE[0]))
    cr = nt.nodes.new("ShaderNodeValToRGB")
    cr.color_ramp.interpolation = "CONSTANT"
    els = cr.color_ramp.elements
    els[0].position, els[0].color = 0.0, lin(sh)
    els[1].position, els[1].color = cut[0], lin(base)
    e = els.new(cut[1])
    e.color = lin(li)
    nt.links.new(fac, cr.inputs["Fac"])
    return cr.outputs["Color"]


def _math(nt, op, a, b=None):
    n = nt.nodes.new("ShaderNodeMath")
    n.operation = op
    for i, v in enumerate((a, b)):
        if v is None:
            continue
        if isinstance(v, (int, float)):
            n.inputs[i].default_value = v
        else:
            nt.links.new(v, n.inputs[i])
    return n.outputs[0]


def _mix(nt, mask, a, b):
    mx = nt.nodes.new("ShaderNodeMix")
    mx.data_type = "RGBA"
    nt.links.new(mask, mx.inputs["Factor"])
    nt.links.new(a, mx.inputs[6])
    nt.links.new(b, mx.inputs[7])
    return mx.outputs[2]


def toon(base, belly=None, belly_cut=-0.35, stripe=None, stripe_freq=9.0, stripe_w=0.32, stripe_top=0.05,
         stripe_u=(0.0, 1.0), emit=False, name=None):
    """セル調のマテリアル。
    belly：おなか側（形の "pv" 属性の y = 断面の上下 -1〜1 が belly_cut より下）を別の色に
    stripe：背中側のしま模様（pv の x = 体の前後 0〜1 に stripe_freq 本。stripe_u の範囲だけ）
    emit=True は光るもの（影をつけず、その色そのまま）"""
    key = name or "m_%s_%s_%s_%s" % (base.strip("#"), (belly or "").strip("#"), (stripe or "").strip("#"), int(emit))
    found = bpy.data.materials.get(key)
    if found:
        return found
    m, nt = _new_mat(key)
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    em = nt.nodes.new("ShaderNodeEmission")
    nt.links.new(em.outputs[0], out.inputs["Surface"])
    if emit:
        em.inputs["Color"].default_value = lin(base)
    else:
        fac = _toon_fac(nt)
        col = _ramp3(nt, fac, base)
        if belly or stripe:
            attr = nt.nodes.new("ShaderNodeAttribute")
            attr.attribute_name = "pv"
            sep = nt.nodes.new("ShaderNodeSeparateXYZ")
            nt.links.new(attr.outputs["Vector"], sep.inputs[0])
            u, cv = sep.outputs["X"], sep.outputs["Y"]
            if stripe:
                # しま：u を本数倍して小数部分が幅より小さい所。断面の上の方だけ。少しななめにする
                sk = _math(nt, "MULTIPLY", u, stripe_freq)
                sk = _math(nt, "ADD", sk, _math(nt, "MULTIPLY", cv, 0.35))
                fr = _math(nt, "FRACT", sk)
                m1 = _math(nt, "LESS_THAN", fr, stripe_w)
                m2 = _math(nt, "GREATER_THAN", cv, stripe_top)
                m3 = _math(nt, "GREATER_THAN", u, stripe_u[0])
                m4 = _math(nt, "LESS_THAN", u, stripe_u[1])
                mask = _math(nt, "MULTIPLY", _math(nt, "MULTIPLY", m1, m2), _math(nt, "MULTIPLY", m3, m4))
                col = _mix(nt, mask, col, _ramp3(nt, fac, stripe))
            if belly:
                bm_ = _math(nt, "LESS_THAN", cv, belly_cut)
                col = _mix(nt, bm_, col, _ramp3(nt, fac, belly))
        nt.links.new(col, em.inputs["Color"])
    line = RAMP.get(base, (None, None, PALETTE[0]))[2]
    try:
        m.line_color = lin(line)
    except Exception:
        pass
    m.diffuse_color = lin(base)
    return m


# ---------------------------------------------------------------------------
# 形づくり
# ---------------------------------------------------------------------------
def mesh_object(name, bm, material, smooth=True, noline=False, pv=None):
    """bm → オブジェクト。pv は頂点ごとの (前後, 上下, 左右) の値（模様用。動いてもずれない）"""
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    me.polygons.foreach_set("use_smooth", [smooth] * len(me.polygons))
    if pv is not None:
        at = me.attributes.new("pv", "FLOAT_VECTOR", "POINT")
        at.data.foreach_set("vector", [c for p in pv for c in p])
    me.materials.append(material)
    ob = bpy.data.objects.new(name, me)
    if noline:
        noline_coll().objects.link(ob)
    else:
        link(ob)
    return ob


def catmull(points, n):
    """点の並びを、なめらかな曲線（キャットマル・ロム）で n 倍に細かくする。戻り値は (点, 元の何番目か の小数)"""
    pts = [Vector(p) for p in points]
    out = []
    for i in range(len(pts) - 1):
        p0 = pts[i - 1] if i > 0 else pts[i] * 2 - pts[i + 1]
        p1, p2 = pts[i], pts[i + 1]
        p3 = pts[i + 2] if i + 2 < len(pts) else pts[i + 1] * 2 - pts[i]
        for k in range(n):
            t = k / n
            t2, t3 = t * t, t * t * t
            p = 0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3)
            out.append((p, i + t))
    out.append((pts[-1], len(pts) - 1))
    return out


def lerp_list(vals, f):
    i = min(int(f), len(vals) - 2)
    t = f - i
    a, b = vals[i], vals[i + 1]
    if isinstance(a, (tuple, list)):
        return tuple(x + (y - x) * t for x, y in zip(a, b))
    return a + (b - a) * t


def loft(rings, segs=16, cap0=True, cap1=True, e_side=1.0, e_top=1.0, e_bot=1.0):
    """断面をつないだ管。rings は [(中心, 横向き, 上向き, 横の半径, 上の半径, 下の半径, u), ...]。
    e_* は断面の丸さ（1 = だ円、小さいほど角ばる）。戻り値は (bmesh, pv の並び)"""
    bm = bmesh.new()
    pv = []
    vrows = []
    for (c, side, up, ry, rt, rb, u) in rings:
        row = []
        for j in range(segs):
            a = 2 * math.pi * j / segs
            ca, sa = math.cos(a), math.sin(a)
            sx = math.copysign(abs(ca) ** e_side, ca)
            if sa >= 0:
                sz = rt * (abs(sa) ** e_top)
            else:
                sz = -rb * (abs(sa) ** e_bot)
            p = c + side * (ry * sx) + up * sz
            row.append(bm.verts.new(p))
            pv.append((u, sa, ca))
        vrows.append(row)
    for a, b in zip(vrows, vrows[1:]):
        for j in range(segs):
            k = (j + 1) % segs
            bm.faces.new((a[j], a[k], b[k], b[j]))
    for ends, row, flip in ((cap0, vrows[0], True), (cap1, vrows[-1], False)):
        if not ends:
            continue
        cen = sum((v.co for v in row), Vector()) / len(row)
        cv = bm.verts.new(cen)
        u0 = pv[0][0] if flip else pv[-1][0]
        pv.append((u0, 0.0, 0.0))
        for j in range(segs):
            k = (j + 1) % segs
            f = (row[k], row[j], cv) if flip else (row[j], row[k], cv)
            bm.faces.new(f)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return bm, pv


def frames_along(points, up_hint=Vector((0, 0, 1))):
    """曲線の各点の向き（横向き・上向き）"""
    out = []
    n = len(points)
    for i in range(n):
        t = (points[min(i + 1, n - 1)] - points[max(i - 1, 0)])
        if t.length < 1e-6:
            t = Vector((1, 0, 0))
        t.normalize()
        side = t.cross(up_hint)
        if side.length < 1e-4:
            side = t.cross(Vector((0, 1, 0)))
        side.normalize()
        up = side.cross(t).normalized()
        out.append((side, up))
    return out


def ellipsoid(center, radii, mat, rot=Matrix.Identity(3), name="ell", noline=False, sub=3):
    bm = bmesh.new()
    bmesh.ops.create_icosphere(bm, subdivisions=sub, radius=1.0)
    M = Matrix.Translation(Vector(center)) @ rot.to_4x4() @ Matrix.Diagonal((*radii, 1.0))
    bmesh.ops.transform(bm, matrix=M, verts=bm.verts)
    return mesh_object(name, bm, mat, noline=noline)


def cone(base, tip, r, mat, name="cone", segs=8, noline=False):
    """base（根元の中心）から tip（先）への円すい（歯・爪・角）"""
    base, tip = Vector(base), Vector(tip)
    d = tip - base
    L = d.length
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=True, segments=segs, radius1=r, radius2=0.0, depth=L)
    q = d.normalized().to_track_quat("Z", "Y")
    M = Matrix.Translation(base + d * 0.5) @ q.to_matrix().to_4x4()
    bmesh.ops.transform(bm, matrix=M, verts=bm.verts)
    return mesh_object(name, bm, mat, smooth=False, noline=noline)


def remove_objects(prefix):
    for ob in list(bpy.data.objects):
        if ob.name.startswith(prefix):
            me = ob.data
            bpy.data.objects.remove(ob)
            if me is not None and me.users == 0 and isinstance(me, bpy.types.Mesh):
                bpy.data.meshes.remove(me)


# ---------------------------------------------------------------------------
# スキンモディファイア：関節の点に太さを付け、体・脚・腕をなめらかな1つの形にする
# ---------------------------------------------------------------------------
# 体・脚・腕の作り方（render_all.py --skin で切りかえ。比べる用）
#   False   … 今までどおり（胴体は管、脚は管と玉）
#   "full"  … 胴体・脚・腕を全部スキンモディファイアで1つに
#   "limbs" … 胴体は管のまま、脚と腕だけスキンモディファイア
#   "fuse"  … "limbs" のあと、胴体・脚・腕をボクセルで1つの形に溶け合わせ、なめらかにする
SKIN = False
FUSE_VOXEL = 0.013    # "fuse" のボクセルの大きさ（完成の1ドット ≈ 0.034）
SKIN_FIX = 1 / 0.92   # なめらかにすると約0.92倍に細るので、そのぶん太く置く


class Skin:
    """使い方：add() で鎖（関節の点の並び）を足していき、最後に build()。
    太さ (r0, r1) は、横向きの鎖（胴体など）なら (横幅, 高さ)、縦向きの鎖（脚など）なら (前後, 横幅)。
    attach：つなぐ先の鎖の番号（その鎖のいちばん近い点と、この鎖の最初の点をつなぐ）
    pattern=True の鎖（胴体）にそって、模様用の pv（前後・上下・左右）を計算する"""

    def __init__(self):
        self.chains = []
        self.extra = []       # スキン以外で作った形（bmesh）。いっしょに1つにまとめる

    def add(self, pts, radii, mat, attach=None, pattern=False, skin=True):
        """skin=False の鎖は形を作らず、色分けと模様の計算だけに使う（形は extra に入れた管）"""
        self.chains.append(dict(pts=[Vector(p) for p in pts], r=[tuple(r) for r in radii], mat=mat, attach=attach,
                                pattern=pattern, skin=skin))
        return len(self.chains) - 1

    def build(self, name, up_hint=Vector((0, 0, 1)), branch=1.0, fuse=None):
        import numpy as np
        verts, edges, radii, starts = [], [], [], []
        for c in self.chains:
            base = len(verts)
            starts.append(base)
            if not c["skin"]:
                continue
            for k, (p, r) in enumerate(zip(c["pts"], c["r"])):
                verts.append(tuple(p))
                radii.append(r)
                if k:
                    edges.append((base + k - 1, base + k))
            if c["attach"] is not None and self.chains[c["attach"]]["skin"]:
                t = self.chains[c["attach"]]
                d = [(q - c["pts"][0]).length for q in t["pts"]]
                edges.append((starts[c["attach"]] + d.index(min(d)), base))
        roots = [starts[i] for i, c in enumerate(self.chains) if c["skin"] and (c["attach"] is None or not self.chains[c["attach"]]["skin"])]
        me = self._skin_mesh(name, verts, edges, radii, branch, roots)
        if self.extra or fuse:
            bm = bmesh.new()
            if me is not None:
                bm.from_mesh(me)
                bpy.data.meshes.remove(me)
            for b in self.extra:
                tmp = bpy.data.meshes.new("tmp")
                b.to_mesh(tmp)
                b.free()
                bm.from_mesh(tmp)
                bpy.data.meshes.remove(tmp)
            me = bpy.data.meshes.new(name)
            bm.to_mesh(me)
            bm.free()
            if fuse:
                ob = bpy.data.objects.new(name + "_fuse", me)
                bpy.context.scene.collection.objects.link(ob)
                rm = ob.modifiers.new("remesh", "REMESH")
                rm.mode = "VOXEL"
                rm.voxel_size = fuse
                rm.adaptivity = 0.0
                sm = ob.modifiers.new("smooth", "LAPLACIANSMOOTH")
                sm.iterations = 8
                sm.lambda_factor = 1.0
                sm.use_volume_preserve = True
                ev = ob.evaluated_get(bpy.context.evaluated_depsgraph_get())
                me2 = bpy.data.meshes.new_from_object(ev)
                bpy.data.objects.remove(ob)
                bpy.data.meshes.remove(me)
                me = me2
        me.name = name
        return self._finish(name, me, up_hint)

    def _skin_mesh(self, name, verts, edges, radii, branch, roots):
        if not verts:
            return None
        src = bpy.data.meshes.new(name + "_src")
        src.from_pydata(verts, edges, [])
        ob = bpy.data.objects.new(name + "_src", src)
        bpy.context.scene.collection.objects.link(ob)
        sk = ob.modifiers.new("skin", "SKIN")
        sk.branch_smoothing = branch
        sk.use_smooth_shade = True
        sv = src.skin_vertices[0].data
        for i, r in enumerate(radii):
            sv[i].radius = (r[0] * SKIN_FIX, r[1] * SKIN_FIX)
        for i in roots:          # つながった形ごとに1つ「根」が要る
            sv[i].use_root = True
        sub = ob.modifiers.new("sub", "SUBSURF")
        sub.levels = sub.render_levels = 2
        ev = ob.evaluated_get(bpy.context.evaluated_depsgraph_get())
        me = bpy.data.meshes.new_from_object(ev)
        bpy.data.objects.remove(ob)
        bpy.data.meshes.remove(src)
        return me

    def _finish(self, name, me, up_hint):
        import numpy as np
        me.materials.clear()
        # どの鎖の面か（鎖の表面にいちばん近い所）→ マテリアル
        P = np.array([v.co[:] for v in me.vertices])
        best_d = np.full(len(P), 1e9)
        best_c = np.zeros(len(P), dtype=int)
        seg_info = []
        for ci, c in enumerate(self.chains):
            A = np.array([p[:] for p in c["pts"][:-1]])
            B = np.array([p[:] for p in c["pts"][1:]])
            RA = np.array([max(r) for r in c["r"][:-1]])
            RB = np.array([max(r) for r in c["r"][1:]])
            AB = B - A
            L2 = np.maximum((AB * AB).sum(1), 1e-9)
            t = np.clip(((P[:, None, :] - A[None]) * AB[None]).sum(2) / L2[None], 0, 1)
            Q = A[None] + t[..., None] * AB[None]
            dist = np.linalg.norm(P[:, None, :] - Q, axis=2) - (RA[None] + (RB - RA)[None] * t)
            j = dist.argmin(1)
            dmin = dist[np.arange(len(P)), j]
            better = dmin < best_d
            best_d[better] = dmin[better]
            best_c[better] = ci
            seg_info.append((j, t[np.arange(len(P)), j], Q[np.arange(len(P)), j]))
        mats = []
        for c in self.chains:
            if c["mat"] not in mats:
                mats.append(c["mat"])
        for m in mats:
            me.materials.append(m)
        cm = np.array([mats.index(c["mat"]) for c in self.chains])
        mi = []
        for poly in me.polygons:
            vs = list(poly.vertices)
            ch = np.bincount(best_c[vs], minlength=len(self.chains)).argmax()
            mi.append(int(cm[ch]))
        me.polygons.foreach_set("material_index", mi)
        me.polygons.foreach_set("use_smooth", [True] * len(me.polygons))

        # 模様用の pv（胴体の鎖にそった 前後 0〜1・断面の上下・左右）
        pc = [i for i, c in enumerate(self.chains) if c["pattern"]]
        if pc:
            c = self.chains[pc[0]]
            pts = c["pts"]
            fr = frames_along(pts, up_hint)
            acc = [0.0]
            for a, b in zip(pts, pts[1:]):
                acc.append(acc[-1] + (b - a).length)
            j, t, Q = seg_info[pc[0]]
            total = acc[-1]
            pv = []
            for i in range(len(P)):
                k = int(j[i])
                tt = float(t[i])
                u = (acc[k] + (acc[k + 1] - acc[k]) * tt) / total
                side = fr[k][0].lerp(fr[k + 1][0], tt)
                up = fr[k][1].lerp(fr[k + 1][1], tt)
                d = Vector(P[i]) - Vector(Q[i])
                s_, c_ = d.dot(up), d.dot(side)
                n = math.hypot(s_, c_) or 1.0
                pv.append((u, s_ / n, c_ / n))
            at = me.attributes.new("pv", "FLOAT_VECTOR", "POINT")
            at.data.foreach_set("vector", [x for p in pv for x in p])
        obj = bpy.data.objects.new(name, me)
        link(obj)
        return obj
