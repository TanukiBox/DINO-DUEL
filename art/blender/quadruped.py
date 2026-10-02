"""体型の型：角のある四足（トリケラトプスなど）。

二足の肉食（theropod.py）と同じ作り方：骨組みの数字とポーズの数字から関節の位置を計算し、そのたびに形を作る。
  ・体は しっぽの先 → 腰 → おなか → 胸 → 肩 → 首 を1本の管でつなぐ（背中は腰がいちばん高く、肩へ下がる）
  ・頭は低く前へ下げて持つ。頭の骨・下あご（ちょうつがい）・くちばし・えり飾り（ふちに小さなトゲ）・角（目の上に長い2本、鼻に短い1本）
  ・脚は4本とも足の裏を地面に置いたまま、ひざ・ひじの位置を計算する（後ろ脚のひざは前へ、前脚のひじは後ろへ曲がる）
  ・目は3Dでは作らず、手前の目の位置だけを返す（ドット絵にしたあとで描き足す）
"""
import math

import bmesh
from mathutils import Vector, Matrix

import common as C
from theropod import Ry, Rz, Rx, Tr, _ik, _seg_points

POSE = dict(
    root_dx=0.0, root_dz=0.0, root_pitch=0.0, root_roll=0.0,
    spine=(0, 0, 0, 0, 0),
    head_pitch=0.0, head_yaw=0.0, head_roll=0.0,
    jaw=2.0,
    tail_lift=0.0, tail_sway=0.0, tail_phase=0.0,
    breathe=1.0,
    hind_dx=0.0, fore_dx=0.0,
    legs_free=False,
    eye_closed=False,
)


class Quadruped:
    def __init__(self, spec):
        self.s = spec
        col = spec["colors"]
        st = spec.get("stripes")
        k = spec["key"]
        self.m_body = C.toon(col["base"], belly=col.get("belly"), belly_cut=-0.4,
                             stripe=col.get("stripe") if st else None,
                             stripe_freq=st["freq"] if st else 9, stripe_w=st["w"] if st else 0.3,
                             stripe_u=st["u"] if st else (0, 1), name="body_" + k)
        self.m_skull = C.toon(col["base"], name="skull_" + k)
        self.m_jaw = C.toon(col["base"], belly=col.get("belly"), belly_cut=-0.6, name="jaw_" + k)
        self.m_limb = C.toon(col["base"], name="limb_" + k)
        self.m_far = C.toon(col.get("far", col["base"]), name="far_" + k)
        self.m_frill = C.toon(col["frill"], name="frill_" + k)
        self.m_edge = C.toon(col["frill_edge"])
        self.m_horn = C.toon(col["horn"])
        self.m_beak = C.toon(col["beak"])
        self.m_claw = C.toon(col["claw"])
        self.m_mouth = C.toon(col["mouth"])
        self.m_tongue = C.toon(col["tongue"])

    # ------------------------------------------------------------------
    def build(self, pose, prefix="D_"):
        s = self.s
        P = dict(POSE)
        P.update(pose)
        C.remove_objects(prefix)
        hx, hz = s["hips"]
        M0 = Tr((hx + P["root_dx"], 0, hz + P["root_dz"])) @ Ry(-P["root_pitch"]) @ Rx(P["root_roll"])
        fwd_M = [M0]
        M = M0
        for i, seg in enumerate(s["fwd"]):
            M = M @ Tr((seg[0], 0, seg[1])) @ Ry(-P["spine"][i])
            fwd_M.append(M)
        hd = s["head"]
        hs = hd.get("scale", 1.0)
        Mh = M @ Ry(-(hd.get("rest_pitch", 0.0) + P["head_pitch"])) @ Rz(P["head_yaw"]) @ Rx(P["head_roll"]) @ Matrix.Diagonal((hs, hs, hs, 1.0))
        tail_M = []
        M = M0
        nt = len(s["tail"])
        for k, seg in enumerate(s["tail"]):
            sway = P["tail_sway"] * math.sin(math.radians(P["tail_phase"]) + k * 0.8) * (0.4 + 0.6 * k / max(1, nt - 1))
            M = M @ Tr((seg[0], 0, seg[1])) @ Ry(P["tail_lift"]) @ Rz(sway)
            tail_M.append(M)

        # --- 体（しっぽの先から首まで1本）---
        mats = list(reversed(tail_M)) + fwd_M
        radii = [tuple(seg[2:5]) for seg in reversed(s["tail"])] + [tuple(s["hip_r"])] + [tuple(seg[2:5]) for seg in s["fwd"]]
        br = P["breathe"]
        for i in range(nt + 1, nt + 3):
            ry, rt, rb = radii[i]
            radii[i] = (ry * br, rt * (1 + (br - 1) * 0.6), rb * br)
        pts = [m.translation.copy() for m in mats]
        sm = C.catmull(pts, 6)
        up_hint = (M0.to_3x3() @ Vector((0, 0, 1))).normalized()
        fr = C.frames_along([p for p, _ in sm], up_hint)
        total = sum((sm[i + 1][0] - sm[i][0]).length for i in range(len(sm) - 1))
        acc, rings = 0.0, []
        for i, ((p, f), (side, up)) in enumerate(zip(sm, fr)):
            if i:
                acc += (p - sm[i - 1][0]).length
            ry, rt, rb = C.lerp_list(radii, f)
            rings.append((p, side, up, ry, rt, rb, acc / total))
        bm, pv = C.loft(rings, 18, e_bot=0.92)
        C.mesh_object(prefix + "body", bm, self.m_body, pv=pv)

        eye = self._head(Mh, P, prefix)
        self._legs(M0, fwd_M[3], P, prefix)
        return {
            "mouth": Mh @ Vector((hd["skull"][-1][0] * 0.9, 0, -0.06)),
            "head": Mh @ Vector((hd["skull"][-1][0] * 0.4, 0, 0.05)),
            "body": fwd_M[1].translation.copy(),
            "feet": Vector((s["hips"][0] + 0.3, 0, 0.0)),
            "eye": eye,
            "eye_closed": bool(P["eye_closed"]),
        }

    # ------------------------------------------------------------------
    def _head(self, Mh, P, prefix):
        hd = self.s["head"]
        R = Mh.to_3x3()
        side_l, up_l = Vector((0, -1, 0)), Vector((0, 0, 1))
        sk = hd["skull"]

        def ring_list(sections, Mx, n=4):
            pts = C.catmull([Vector((x, 0, zc)) for (x, _, _, _, zc) in sections], n)
            Rx_ = Mx.to_3x3()
            out = []
            for p, f in pts:
                _, ry, rt, rb, _ = C.lerp_list(sections, f)
                out.append((Mx @ p, Rx_ @ side_l, Rx_ @ up_l, ry, rt, rb, 1.0))
            return out

        def at(x, sections):
            xs = [r[0] for r in sections]
            x = max(xs[0], min(xs[-1], x))
            for i in range(len(xs) - 1):
                if xs[i] <= x <= xs[i + 1]:
                    t = (x - xs[i]) / (xs[i + 1] - xs[i])
                    return tuple(a + (b - a) * t for a, b in zip(sections[i], sections[i + 1]))
            return sections[-1]

        bm, pv = C.loft(ring_list(sk, Mh), 18, e_side=0.9, e_bot=0.6)
        C.mesh_object(prefix + "skull", bm, self.m_skull, pv=pv)
        jx, jz = hd["hinge"]
        Mj = Mh @ Tr((jx, 0, jz)) @ Ry(P["jaw"])
        jw = hd["jaw"]
        bm, pv = C.loft(ring_list(jw, Mj), 16, e_side=0.9, e_top=0.5)
        C.mesh_object(prefix + "jaw", bm, self.m_jaw, pv=pv)

        # 口の中（開けたときに奥に見える）
        bm = bmesh.new()
        prev = None
        x0, x1 = hd["mouth_x"]
        for i in range(8):
            x = x0 + (x1 - x0) * i / 7
            _, ry, rt, rb, zc = at(x, sk)
            up = Mh @ Vector((x, ry * 0.55, zc - rb * 0.6))
            _, jry, jrt, jrb, jzc = at(x - jx, jw)
            lo = Mj @ Vector((x - jx, jry * 0.55, jzc + jrt * 0.3))
            row = (bm.verts.new(up), bm.verts.new(lo))
            if prev:
                bm.faces.new((prev[0], row[0], row[1], prev[1]))
            prev = row
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
        C.mesh_object(prefix + "mouth", bm, self.m_mouth, smooth=False, noline=True)

        # くちばし（上はかぎ形に下へ曲がる）
        bk = hd["beak"]
        tip = sk[-1][0]
        _, ry, rt, rb, zc = at(tip - 0.06, sk)
        C.ellipsoid(Mh @ Vector((tip - 0.05, 0, zc - 0.01)), (0.09, ry * 0.95, rt * 0.95), self.m_beak, rot=R, name=prefix + "beak")
        C.cone(Mh @ Vector((tip - 0.06, 0, zc)), Mh @ Vector((tip + bk[0], 0, zc - bk[1])), bk[2], self.m_beak, name=prefix + "beak2", segs=10)
        jt = jw[-1][0]
        C.ellipsoid(Mj @ Vector((jt - 0.04, 0, jw[-1][4])), (0.07, jw[-1][1] * 1.1, 0.04), self.m_beak, rot=Mj.to_3x3(), name=prefix + "beak3")

        # えり飾り：頭のうしろから立つ大きな盾。うしろへ丸くふくらむ（横から見ても大きな葉の形に見える）。ふちに小さなトゲ
        fr = hd["frill"]
        t = math.radians(fr["tilt"])
        upf = Vector((-math.sin(t), 0, math.cos(t)))      # 盾の上の向き（うしろへ傾く）
        lat = Vector((0, 1, 0))
        nrm = Vector((-math.cos(t), 0, -math.sin(t)))     # 盾のうしろの面が向く方
        Hh, W = fr["h"] / 2, fr["w"]
        cen = Vector((fr["x"], 0, fr["z"])) + upf * Hh
        # 見やすくするための工夫：盾の面を少しカメラの方へ回す（横からだと薄く見えて、えり飾りだとわかりにくいため）
        Mf = Mh @ Matrix.Translation(cen) @ Matrix.Rotation(math.radians(fr.get("yaw", 0.0)), 4, upf) @ Matrix.Translation(-cen)
        Rf = Mf.to_3x3()
        bm = bmesh.new()
        bmesh.ops.create_uvsphere(bm, u_segments=28, v_segments=14, radius=1.0)
        for v in bm.verts:
            a_, b_, c_ = v.co
            w = W * (0.85 + 0.25 * max(0.0, a_))          # 上ほど少し広い
            if a_ < 0:
                b_ = b_ / max(0.55, math.sqrt(max(0.0, 1 - a_ * a_))) * math.sqrt(max(0.0, 1 - a_ * a_)) ** 0.5   # 下も細くしすぎない
            c_ = math.copysign(abs(c_) ** 0.6, c_)          # うしろのふくらみを平らぎみに（横から見て広い葉の形）
            v.co = Mf @ (cen + upf * (Hh * a_) + lat * (w * b_) + nrm * (c_ * (fr["d"] if c_ > 0 else fr["df"])))
        C.mesh_object(prefix + "frill", bm, self.m_frill)
        # ふちどり：えり飾りのふちに沿って、濃い色の細い帯
        rim = []
        for k in range(13):
            a = math.radians(-55 + 110 * k / 12)
            w = W * (0.85 + 0.25 * max(0.0, math.cos(a)))
            sa = math.sin(a)
            if math.cos(a) < 0:
                sa = sa / max(0.55, abs(math.sin(a))) * abs(math.sin(a)) ** 0.5
            rim.append(cen + upf * (Hh * math.cos(a)) + lat * (w * sa))
        frs = C.frames_along(rim, Vector((-1, 0, 0)))
        bm, _ = C.loft([(Mf @ p, Rf @ sd, Rf @ up, 0.035, 0.035, 0.035, 0.0) for p, (sd, up) in zip(rim, frs)], 8)
        C.mesh_object(prefix + "frillrim", bm, self.m_edge, noline=True)
        for k in range(fr["knobs"]):
            a = math.radians(-36 + 72 * k / (fr["knobs"] - 1))
            w = W * (0.85 + 0.25 * max(0.0, math.cos(a)))
            p = cen + upf * (Hh * math.cos(a)) + lat * (w * math.sin(a))
            out = (upf * math.cos(a) + lat * math.sin(a)).normalized()
            C.cone(Mf @ (p - out * 0.02), Mf @ (p + out * fr["knob"]), fr["knob"] * 0.75, self.m_edge, name=prefix + "knob", segs=6)

        # 角：目の上に長い2本（前と少し上へ）、鼻に短い1本
        for side in (-1, 1):
            b = Vector(hd["horn_base"])
            b.y *= side
            pts = [b]
            for (dx, dy, dz) in hd["horn_path"]:
                pts.append(b + Vector((dx, dy * side, dz)))
            frs = C.frames_along(pts)
            rr = hd["horn_r"]
            rings = [(Mh @ p, R @ sd, R @ up, r, r, r, 1.0) for p, (sd, up), r in zip(pts, frs, rr)]
            bm, _ = C.loft(rings, 10)
            C.mesh_object(prefix + "horn", bm, self.m_horn)
        nh = hd["nose_horn"]
        _, ry, rt, rb, zc = at(nh[0], sk)
        b = Vector((nh[0], 0, zc + rt * 0.8))
        C.cone(Mh @ b, Mh @ (b + Vector((nh[1], 0, nh[2]))), nh[3], self.m_horn, name=prefix + "nhorn", segs=10)

        ex, ez = hd["eye"]
        _, ry, rt, rb, zc = at(ex, sk)
        return Mh @ Vector((ex, -ry * 0.92, zc + ez))

    # ------------------------------------------------------------------
    def _limb(self, top, ball, lens, radii, ma, fwd, mat, prefix, nm, thigh=False):
        """1本の脚：上の関節 → ひざ（ひじ）→ 足首 → 足の指。つなぎ目ができないように1本の管にする"""
        l1, l2, l3 = lens
        ankle = ball + Vector((-l3 * math.cos(ma), 0, l3 * math.sin(ma)))
        knee = _ik(top, ankle, l1, l2, fwd)
        if thigh:
            ax = knee - top
            q = ax.normalized().to_track_quat("X", "Z").to_matrix()
            rr = radii[0]
            C.ellipsoid(top.lerp(knee, 0.38), (ax.length * 0.7, max(rr) * 0.8, max(rr) * 0.92), mat, rot=q, name=prefix + nm + "m", sub=4)
        pts, rr = [], []
        for i, (a, b, r) in enumerate(((top, knee, radii[0]), (knee, ankle, radii[1]), (ankle, ball, radii[2]))):
            sp = _seg_points(a, b, len(r))
            if i:
                sp, r = sp[1:], r[1:]
            pts += sp
            rr += list(r)
        sm = C.catmull(pts, 3)
        frs = C.frames_along([p for p, _ in sm])
        rings = [(p, sd, up, r, r, r, 0.0) for (p, f), (sd, up), r in zip(sm, frs, [C.lerp_list([(x,) for x in rr], f)[0] for _, f in sm])]
        bm, _ = C.loft(rings, 14)
        C.mesh_object(prefix + nm, bm, mat)
        return ankle

    def _feet(self, ball, side, lg, mat, prefix):
        """短く太い指3本と、ひづめのような爪"""
        for k, yaw in enumerate((-30, 0, 30)):
            d = (Matrix.Rotation(math.radians(yaw), 3, "Z") @ Vector((1, 0, -0.35))).normalized()
            tip = ball + d * lg["toe"]
            pts = _seg_points(ball, tip, 3)
            frs = C.frames_along(pts)
            rings = [(p, sd, up, r, r, r, 0.0) for p, (sd, up), r in zip(pts, frs, lg["r_toe"])]
            bm, _ = C.loft(rings, 10)
            C.mesh_object(prefix + "toe", bm, mat)
            C.ellipsoid(tip + d * 0.01 + Vector((0, 0, -0.005)), (lg["claw"], lg["r_toe"][-1] * 1.2, lg["r_toe"][-1] * 1.1), self.m_claw,
                        rot=d.to_track_quat("X", "Z").to_matrix(), name=prefix + "hoof", noline=True)

    def _legs(self, M0, Ms, P, prefix):
        for which, Mtop, key, dxk, fwd in (("hind", M0, "hind", "hind_dx", Vector((1, 0, 0))), ("fore", Ms, "fore", "fore_dx", Vector((-1, 0, 0)))):
            lg = self.s[key]
            for side, bx, mat in ((-1, lg["near_x"], self.m_limb), (1, lg["far_x"], self.m_far)):
                sx, sy, sz = lg["socket"]
                top = Mtop @ Vector((sx, side * sy, sz))
                ball = Vector((bx + P[dxk], side * lg["y"], lg["ball_z"]))
                ma = math.radians(lg["meta_angle"])
                self._limb(top, ball, (lg["upper"], lg["lower"], lg["meta"]), (lg["r_upper"], lg["r_lower"], lg["r_meta"]), ma, fwd, mat, prefix,
                           which, thigh=(which == "hind"))
                self._feet(ball, side, lg, mat, prefix)
