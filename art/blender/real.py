"""リアル寄りの見た目（ドット絵にしない版）：Cycles のリアルな光と、肌の質感。

common.REAL = True のとき、common.toon() はここのマテリアルを返し、common.reset_scene() はここの光と影を置く。
  ・光：太陽（左上・手前から。やわらかい影）＋空の明るさ＋うしろからのふちの光
  ・足もとの影：地面に「影だけ写る板」（背景は透明のまま、影だけが絵に入る）
  ・肌：ウロコ（ボロノイ模様のでこぼこ）・しわ・色むら・ウロコのすき間の暗さ・少し光が透ける（サブサーフェス）
       模様は「待機の1コマ目の形」の位置（rest 属性）に貼るので、体が動いても模様がすべらない
  ・歯・爪・角・口の中・舌は、それぞれの材質
"""
import math

import bpy
from mathutils import Vector

from palette import RAMP

SAMPLES = 96


def lin(h):
    c = [int(h[i:i + 2], 16) / 255 for i in (1, 3, 5)]
    return tuple(((x + 0.055) / 1.055) ** 2.4 if x > 0.04045 else x / 12.92 for x in c) + (1.0,)


def mul(c, k, sat=1.0):
    """色を明るさ k 倍に。sat < 1 で少しくすませる（リアル寄りに）"""
    g = (c[0] + c[1] + c[2]) / 3
    return tuple(max(0.0, min(1.0, (g + (x - g) * sat) * k)) for x in c[:3]) + (1.0,)


# ---------------------------------------------------------------------------
# 光・影・レンダリングの設定
# ---------------------------------------------------------------------------
def setup_scene(scene, light_dir):
    r = scene.render
    r.use_freestyle = False
    c = scene.cycles
    try:
        prefs = bpy.context.preferences.addons["cycles"].preferences
        prefs.compute_device_type = "OPTIX"
        prefs.get_devices()
        for d in prefs.devices:
            d.use = d.type == "OPTIX"
        c.device = "GPU"
    except Exception:
        c.device = "CPU"
    c.samples = SAMPLES
    c.use_adaptive_sampling = True
    c.adaptive_threshold = 0.02
    c.use_denoising = True
    try:
        c.denoiser = "OPENIMAGEDENOISE"
    except Exception:
        pass
    c.pixel_filter_type = "BLACKMAN_HARRIS"
    c.filter_width = 1.5
    c.max_bounces = 6
    c.diffuse_bounces = 3
    c.glossy_bounces = 2
    c.transmission_bounces = 2
    c.seed = 0
    for vt, look in (("AgX", "AgX - Medium High Contrast"), ("AgX", "None"), ("Filmic", "Medium High Contrast")):
        try:
            scene.view_settings.view_transform = vt
            scene.view_settings.look = look
            break
        except Exception:
            continue
    scene.view_settings.exposure = -0.45
    # 空の明るさ（青みのある、やわらかい光）
    w = scene.world
    nt = w.node_tree
    bg = [n for n in nt.nodes if n.type == "BACKGROUND"][0]
    tc = nt.nodes.new("ShaderNodeTexCoord")
    sz = nt.nodes.new("ShaderNodeSeparateXYZ")
    nt.links.new(tc.outputs["Generated"], sz.inputs[0])
    ramp = nt.nodes.new("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].position = 0.42
    ramp.color_ramp.elements[0].color = (0.30, 0.22, 0.15, 1.0)
    ramp.color_ramp.elements[1].position = 0.62
    ramp.color_ramp.elements[1].color = (0.55, 0.68, 0.9, 1.0)
    nt.links.new(sz.outputs["Z"], ramp.inputs["Fac"])
    nt.links.new(ramp.outputs["Color"], bg.inputs["Color"])
    bg.inputs["Strength"].default_value = 0.7
    # 太陽（左上・手前から。高めにして、影を短く＝コマの枠からはみ出さないように）
    L = Vector((0.05, light_dir[1] * 0.75, light_dir[2] * 1.6)).normalized()     # 影は体のうしろへ（コマの左右からはみ出さない）
    sun = bpy.data.lights.new("Sun", "SUN")
    sun.energy = 4.5
    sun.angle = math.radians(11)
    sun.color = (1.0, 0.96, 0.9)
    so = bpy.data.objects.new("Sun", sun)
    so.rotation_euler = (-L).to_track_quat("-Z", "Y").to_euler()
    scene.collection.objects.link(so)
    # ふちの光（うしろ・右上から）
    rim = bpy.data.lights.new("Rim", "SUN")
    rim.energy = 2.0
    rim.angle = math.radians(10)
    rim.color = (0.85, 0.9, 1.0)
    rim.use_shadow = False
    ro = bpy.data.objects.new("Rim", rim)
    ro.rotation_euler = (-Vector((0.6, 0.75, 0.45)).normalized()).to_track_quat("-Z", "Y").to_euler()
    scene.collection.objects.link(ro)
    # 足もとの影だけを写す板
    me = bpy.data.meshes.new("Ground")
    s = 12.0
    me.from_pydata([(-s, -s, 0), (s, -s, 0), (s, s, 0), (-s, s, 0)], [], [(0, 1, 2, 3)])
    g = bpy.data.objects.new("Ground", me)
    g.is_shadow_catcher = True
    scene.collection.objects.link(g)


# ---------------------------------------------------------------------------
# マテリアル
# ---------------------------------------------------------------------------
def _new(name):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    for n in list(nt.nodes):
        nt.nodes.remove(n)
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    b = nt.nodes.new("ShaderNodeBsdfPrincipled")
    nt.links.new(b.outputs[0], out.inputs["Surface"])
    return m, nt, b


def _set(b, **kw):
    names = {"base": "Base Color", "rough": "Roughness", "ss": "Subsurface Weight", "ss_r": "Subsurface Radius",
             "ss_s": "Subsurface Scale", "spec": "Specular IOR Level", "coat": "Coat Weight", "coat_r": "Coat Roughness"}
    for k, v in kw.items():
        try:
            b.inputs[names[k]].default_value = v
        except Exception:
            pass


def _math(nt, op, a, b=None, clamp=False):
    n = nt.nodes.new("ShaderNodeMath")
    n.operation = op
    n.use_clamp = clamp
    for i, v in enumerate((a, b)):
        if v is None:
            continue
        if isinstance(v, (int, float)):
            n.inputs[i].default_value = v
        else:
            nt.links.new(v, n.inputs[i])
    return n.outputs[0]


def _mix(nt, fac, a, b):
    n = nt.nodes.new("ShaderNodeMix")
    n.data_type = "RGBA"
    for idx, v in ((0, fac), (6, a), (7, b)):
        if isinstance(v, (int, float)):
            n.inputs[idx].default_value = v
        elif isinstance(v, tuple):
            n.inputs[idx].default_value = v
        else:
            nt.links.new(v, n.inputs[idx])
    return n.outputs[2]


def _range(nt, v, a, b, c=0.0, d=1.0):
    n = nt.nodes.new("ShaderNodeMapRange")
    n.clamp = True
    nt.links.new(v, n.inputs["Value"])
    n.inputs["From Min"].default_value = a
    n.inputs["From Max"].default_value = b
    n.inputs["To Min"].default_value = c
    n.inputs["To Max"].default_value = d
    return n.outputs["Result"]


def _attr(nt, name):
    a = nt.nodes.new("ShaderNodeAttribute")
    a.attribute_name = name
    return a


def _vor(nt, vec, scale, feature="F1"):
    v = nt.nodes.new("ShaderNodeTexVoronoi")
    v.voronoi_dimensions = "3D"
    v.feature = feature
    v.inputs["Scale"].default_value = scale
    nt.links.new(vec, v.inputs["Vector"])
    return v.outputs["Distance"]


def _noise(nt, vec, scale, detail=6.0, rough=0.55):
    n = nt.nodes.new("ShaderNodeTexNoise")
    n.inputs["Scale"].default_value = scale
    n.inputs["Detail"].default_value = detail
    n.inputs["Roughness"].default_value = rough
    nt.links.new(vec, n.inputs["Vector"])
    return n.outputs["Fac"]


def skin(name, base, belly=None, belly_cut=-0.35, stripe=None, stripe_freq=9.0, stripe_w=0.32, stripe_top=0.05,
         stripe_u=(0.0, 1.0), scale=1.0):
    """ウロコのある肌。base = 背中の色、belly = おなかの色、stripe = しまの色（pv 属性がある形だけ）"""
    m, nt, b = _new(name)
    rest = _attr(nt, "rest").outputs["Vector"]
    pv = _attr(nt, "pv").outputs["Vector"]
    sep = nt.nodes.new("ShaderNodeSeparateXYZ")
    nt.links.new(pv, sep.inputs[0])
    u, cv = sep.outputs["X"], sep.outputs["Y"]
    # でこぼこ：小さなウロコ（すき間がみぞ）＋背中の大きめのウロコ＋しわ＋大きなうねり
    edge = _vor(nt, rest, 32.0 / scale, "DISTANCE_TO_EDGE")
    groove = _range(nt, edge, 0.0, 0.12)                       # 0 = ウロコのすき間、1 = ウロコの上
    dome = _range(nt, _vor(nt, rest, 32.0 / scale), 0.6, 0.0)    # ウロコの真ん中が高い
    big = _range(nt, _vor(nt, rest, 7.0 / scale, "DISTANCE_TO_EDGE"), 0.0, 0.07)
    wr = _noise(nt, rest, 6.0 / scale, 6.0, 0.55)
    swell = _noise(nt, rest, 2.2, 3.0, 0.5)
    wave = nt.nodes.new("ShaderNodeTexWave")
    wave.wave_type = "BANDS"
    wave.bands_direction = "X"
    wave.inputs["Scale"].default_value = 9.0 / scale
    wave.inputs["Distortion"].default_value = 7.0
    wave.inputs["Detail"].default_value = 3.0
    nt.links.new(rest, wave.inputs["Vector"])
    fold = _range(nt, wave.outputs["Fac"], 0.0, 1.0)
    h = _math(nt, "MULTIPLY", groove, 0.25)
    h = _math(nt, "ADD", h, _math(nt, "MULTIPLY", dome, 0.35))
    h = _math(nt, "ADD", h, _math(nt, "MULTIPLY", big, 0.35))
    h = _math(nt, "ADD", h, _math(nt, "MULTIPLY", wr, 0.35))
    h = _math(nt, "ADD", h, _math(nt, "MULTIPLY", swell, 0.6))
    h = _math(nt, "ADD", h, _math(nt, "MULTIPLY", fold, 0.22))
    bump = nt.nodes.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = 0.45
    bump.inputs["Distance"].default_value = 0.02 * scale
    nt.links.new(h, bump.inputs["Height"])
    nt.links.new(bump.outputs["Normal"], b.inputs["Normal"])
    # 色：地の色に色むら、ウロコのすき間は暗く、背中の大きなウロコの縁も少し暗く
    c0 = lin(base)
    mott = _noise(nt, rest, 3.2, 6.0, 0.6)
    col = _mix(nt, _range(nt, mott, 0.3, 0.7), mul(c0, 0.42, 0.62), mul(c0, 0.8, 0.7))
    patch = _noise(nt, rest, 1.4, 3.0, 0.5)
    col = _mix(nt, _range(nt, patch, 0.45, 0.65, 0.0, 0.5), col, mul(c0, 0.3, 0.55))
    if stripe:
        # しま：体にそった位置 u ごと。ふちを色むらでくずして、自然な模様に
        sk = _math(nt, "MULTIPLY", u, stripe_freq)
        sk = _math(nt, "ADD", sk, _math(nt, "MULTIPLY", cv, 0.35))
        sk = _math(nt, "ADD", sk, _math(nt, "MULTIPLY", _noise(nt, rest, 5.0, 4.0, 0.6), 0.35))
        fr = _math(nt, "FRACT", sk)
        m1 = _range(nt, fr, stripe_w + 0.06, stripe_w - 0.06)
        m2 = _range(nt, cv, stripe_top - 0.15, stripe_top + 0.25)
        m3 = _math(nt, "GREATER_THAN", u, stripe_u[0])
        m4 = _math(nt, "LESS_THAN", u, stripe_u[1])
        mask = _math(nt, "MULTIPLY", _math(nt, "MULTIPLY", m1, m2), _math(nt, "MULTIPLY", m3, m4))
        col = _mix(nt, _math(nt, "MULTIPLY", mask, 0.75), col, mul(lin(stripe), 0.7, 0.6))
    if belly:
        bm_ = _range(nt, _math(nt, "ADD", cv, _math(nt, "MULTIPLY", _noise(nt, rest, 4.0, 4.0, 0.6), 0.2)), belly_cut + 0.22, belly_cut - 0.22)
        bc = lin(belly)
        warm = (bc[0] * 0.9, bc[1] * 0.78, bc[2] * 0.55, 1.0)
        bcol = _mix(nt, _range(nt, mott, 0.3, 0.7), mul(warm, 0.45, 0.6), mul(warm, 0.66, 0.65))
        col = _mix(nt, bm_, col, bcol)
    cav = _math(nt, "ADD", _math(nt, "MULTIPLY", groove, 0.15), 0.85)
    # 背中側を暗く・おなか側を明るく（上を向いた面ほど暗い）
    geo = nt.nodes.new("ShaderNodeNewGeometry")
    sepn = nt.nodes.new("ShaderNodeSeparateXYZ")
    nt.links.new(geo.outputs["Normal"], sepn.inputs[0])
    cav = _math(nt, "MULTIPLY", cav, _range(nt, sepn.outputs["Z"], 0.1, 0.95, 1.0, 0.72))
    col2 = nt.nodes.new("ShaderNodeMix")
    col2.data_type = "RGBA"
    col2.blend_type = "MULTIPLY"
    col2.inputs[0].default_value = 1.0
    nt.links.new(col, col2.inputs[6])
    cvn = nt.nodes.new("ShaderNodeCombineColor")
    for k in ("Red", "Green", "Blue"):
        nt.links.new(cav, cvn.inputs[k])
    nt.links.new(cvn.outputs[0], col2.inputs[7])
    nt.links.new(col2.outputs[2], b.inputs["Base Color"])
    rough = _math(nt, "ADD", 0.5, _math(nt, "MULTIPLY", _math(nt, "SUBTRACT", 1.0, groove), 0.3))
    nt.links.new(rough, b.inputs["Roughness"])
    _set(b, ss=0.06, ss_r=(1.0, 0.35, 0.18), ss_s=0.03, spec=0.35)
    return m


def plain(name, color, rough=0.4, ss=0.0, coat=0.0, noise=0.0):
    m, nt, b = _new(name)
    _set(b, base=color, rough=rough, ss=ss, ss_r=(1.0, 0.3, 0.2), ss_s=0.01, coat=coat, coat_r=0.15, spec=0.5)
    if noise:
        rest = _attr(nt, "rest").outputs["Vector"]
        n = _noise(nt, rest, 18.0, 5.0, 0.6)
        col = _mix(nt, _range(nt, n, 0.3, 0.7), mul(color, 1.0 - noise), mul(color, 1.0 + noise * 0.5))
        nt.links.new(col, b.inputs["Base Color"])
    return m


def eye_mat(iris):
    m, nt, b = _new("eye_" + iris.strip("#"))
    _set(b, base=lin(iris), rough=0.08, coat=1.0, coat_r=0.02, spec=0.8)
    return m


def material(base, belly=None, belly_cut=-0.35, stripe=None, stripe_freq=9.0, stripe_w=0.32, stripe_top=0.05,
             stripe_u=(0.0, 1.0), emit=False, name=None):
    """common.toon() と同じ引数で、リアル寄りのマテリアルを返す（色で 歯・爪・口 などを見分ける）"""
    key = "real_" + (name or "%s_%s_%s" % (base.strip("#"), (belly or "").strip("#"), (stripe or "").strip("#")))
    found = bpy.data.materials.get(key)
    if found:
        return found
    if emit:
        m, nt, b = _new(key)
        _set(b, base=lin(base), rough=0.2)
        return m
    special = {
        "#fff8ea": lambda: plain(key, (0.62, 0.55, 0.40, 1), rough=0.35, ss=0.1, noise=0.2),      # 歯
        "#3e3a48": lambda: plain(key, (0.035, 0.03, 0.03, 1), rough=0.3, coat=0.4, noise=0.2),    # 爪・くちばし
        "#d8d4dc": lambda: plain(key, (0.62, 0.57, 0.47, 1), rough=0.38, coat=0.2, noise=0.25),   # 角
        "#7a1a1a": lambda: plain(key, (0.30, 0.05, 0.06, 1), rough=0.28, ss=0.3),                 # 口の中
        "#e8908a": lambda: plain(key, (0.55, 0.18, 0.19, 1), rough=0.32, ss=0.35),                # 舌
    }
    if not (belly or stripe) and base in special and not (name or "").startswith(("body", "skull", "jaw", "limb", "far", "frill")):
        m = special[base]()
    else:
        m = skin(key, base, belly, belly_cut, stripe, stripe_freq, stripe_w, stripe_top, stripe_u)
    m.diffuse_color = lin(base)
    return m


def eye(center, outward, r, closed, iris, skin_mat, prefix, Rot):
    """3Dの目：目玉（虹彩の色・つやのある表面）＋黒目。閉じたコマは まぶた（肌）でおおう"""
    import common as C
    o = Vector(outward).normalized()
    if closed:
        C.ellipsoid(Vector(center) + o * r * 0.15, (r * 1.15, r * 1.05, r * 1.05), skin_mat, rot=Rot, name=prefix + "lid")
        return
    C.ellipsoid(center, (r, r, r), eye_mat(iris), rot=Rot, name=prefix + "eyeball", noline=True)
    C.ellipsoid(Vector(center) + o * r * 0.62, (r * 0.42, r * 0.42, r * 0.42), eye_mat("#140c08"), rot=Rot, name=prefix + "pupil", noline=True)
    # 上まぶた（目の上半分に少しかぶさる）
    C.ellipsoid(Vector(center) + o * r * 0.1 + Rot @ Vector((0, 0, r * 0.55)), (r * 1.2, r * 1.05, r * 0.55), skin_mat, rot=Rot, name=prefix + "lid")
