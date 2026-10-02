"""体型の型：二足歩行の肉食（ティラノサウルス・ラプトルなど）。

骨組み（関節の位置）を数字で持ち、ポーズの数字（体の傾き・首・頭・あご・しっぽ・腕）から関節の位置を計算して、
そのたびに形を作り直す。体は しっぽの先 → 腰 → おなか → 胸 → 首 を1本の管でつなぐので、つなぎ目がない。
頭と下あごは別の部品（あごは ちょうつがい で開く）。脚は足の裏を地面に置いたまま、ひざの位置を計算する（IK）。
目は3Dでは作らない。手前の目の位置だけを毎コマ計算して返し、ドット絵にしたあとで決まった形のドットで描き足す（pipeline/eyes.py）。

座標：x = 前（頭の向き）、z = 上、y = 横（カメラは -y の側。手前の脚が y < 0）。
"""
import math

from mathutils import Vector, Matrix

import common as C


def Ry(deg):
    return Matrix.Rotation(math.radians(deg), 4, "Y")


def Rz(deg):
    return Matrix.Rotation(math.radians(deg), 4, "Z")


def Rx(deg):
    return Matrix.Rotation(math.radians(deg), 4, "X")


def Tr(v):
    return Matrix.Translation(Vector(v))


# ポーズの数字（すべて 0 なら 骨組みのまま）。角度は度。
POSE = dict(
    root_dx=0.0, root_dz=0.0,   # 体全体（腰）を前後・上下にずらす
    root_pitch=0.0,             # 体全体の傾き（+ で頭が上がる）
    root_roll=0.0,              # 体全体を横に倒す（たおれるとき）
    spine=(0, 0, 0, 0, 0),      # おなか・胸・肩・首・首の上 の曲げ（+ で上へ）
    head_pitch=0.0, head_yaw=0.0, head_roll=0.0,
    jaw=3.0,                    # 口の開き
    tail_lift=0.0,              # しっぽを上げる（関節ごとの角度）
    tail_sway=0.0, tail_phase=0.0,   # しっぽの左右のゆれ（大きさ・位相）
    arm=0.0,                    # 腕の振り上げ
    breathe=1.0,                # 胸のふくらみ（呼吸）
    near_dx=0.0, far_dx=0.0,    # 手前の足・奥の足を前後に踏みかえる
    legs_free=False,            # True なら足を地面に置かず、体といっしょに動かす（たおれるとき）
    eye_closed=False,
)


def _ik(hip, ankle, l1, l2, fwd=Vector((1, 0, 0))):
    """腰と足首の位置から、ひざの位置（前に曲がる）"""
    d = ankle - hip
    dist = min(d.length, l1 + l2 - 1e-4)
    dist = max(dist, abs(l1 - l2) + 1e-3)
    u = d.normalized()
    cos_a = (l1 * l1 + dist * dist - l2 * l2) / (2 * l1 * dist)
    a = math.acos(max(-1.0, min(1.0, cos_a)))
    v = fwd - u * fwd.dot(u)
    if v.length < 1e-5:
        v = Vector((0, 0, 1))
    v.normalize()
    return hip + (u * math.cos(a) + v * math.sin(a)) * l1


def _seg_points(a, b, n):
    return [a.lerp(b, i / (n - 1)) for i in range(n)]


class Theropod:
    def __init__(self, spec):
        self.s = spec
        col = spec["colors"]
        st = spec.get("stripes")
        self.m_body = C.toon(col["base"], belly=col.get("belly"), belly_cut=-0.38,
                             stripe=col.get("stripe") if st else None,
                             stripe_freq=st["freq"] if st else 9, stripe_w=st["w"] if st else 0.3,
                             stripe_u=st["u"] if st else (0, 1), name="body_" + spec["key"])
        self.m_skull = C.toon(col["base"], stripe=col.get("stripe") if st else None,
                              stripe_freq=st.get("head_freq", 0) if st else 0, stripe_w=0.25,
                              stripe_u=(1.02, 1.12), name="skull_" + spec["key"])
        self.m_jaw = C.toon(col["base"], belly=col.get("belly"), belly_cut=-0.72, name="jaw_" + spec["key"])
        self.m_limb = C.toon(col["base"], name="limb_" + spec["key"])
        self.m_far = C.toon(col.get("far", col["base"]), name="far_" + spec["key"])
        self.m_teeth = C.toon(col["teeth"])
        self.m_claw = C.toon(col["claw"])
        self.m_mouth = C.toon(col["mouth"])
        self.m_tongue = C.toon(col["tongue"])
        self.m_eye = C.toon(col["eye"], emit=True)
        self.m_pupil = C.toon(col.get("pupil", "#2e1a14"), emit=True)
        self.m_brow = C.toon(col.get("brow", col["base"]), name="brow_" + spec["key"])
        self.m_horn = C.toon(col.get("horn", col["base"]), name="horn_" + spec["key"])

    # ------------------------------------------------------------------
    def build(self, pose, prefix="D_"):
        """ポーズ pose（POSE の一部だけでもよい）で形を作る。戻り値は演出の位置（口・頭・体の中心など、世界の座標）"""
        s = self.s
        P = dict(POSE)
        P.update(pose)
        C.remove_objects(prefix)
        hx, hz = s["hips"]
        M0 = Tr((hx + P["root_dx"], 0, hz + P["root_dz"])) @ Ry(-(s.get("pitch", 0.0) + P["root_pitch"])) @ Rx(P["root_roll"])

        # --- 前（おなか → 首）---
        fwd_M = [M0]
        M = M0
        for i, seg in enumerate(s["fwd"]):
            M = M @ Tr((seg[0], 0, seg[1])) @ Ry(-P["spine"][i])
            fwd_M.append(M)
        hs = s["head"].get("scale", 1.0)
        Mh = M @ Ry(-P["head_pitch"]) @ Rz(P["head_yaw"]) @ Rx(P["head_roll"]) @ Matrix.Diagonal((hs, hs, hs, 1.0))
        # --- しっぽ ---
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
        nt1 = len(s["tail"])
        for i in range(nt1 + 1, nt1 + 3):   # おなかと胸だけ呼吸でふくらむ
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
        self._legs(M0, P, prefix)
        self._arms(fwd_M[2], P, prefix)

        hd = s["head"]
        jx = hd["skull"][-1][0] * 0.82
        return {
            "mouth": Mh @ Vector((jx, 0, hd["skull"][-2][4] - 0.06)),
            "head": Mh @ Vector((hd["skull"][-1][0] * 0.45, 0, 0.05)),
            "body": fwd_M[1].translation.copy(),
            "feet": Vector((s["hips"][0] + 0.05, 0, 0.0)),
            "eye": eye,                       # 手前の目の位置（ドット絵に目を描き足す場所）
            "eye_closed": bool(P["eye_closed"]),
        }

    # ------------------------------------------------------------------
    def _head(self, Mh, P, prefix):
        hd = self.s["head"]
        R = Mh.to_3x3()
        side_l, up_l = Vector((0, -1, 0)), Vector((0, 0, 1))
        sk = hd["skull"]   # (x, 横, 上, 下, 中心の高さ)
        n_sk = len(sk)

        def ring_list(sections, Mx, u0, u1, n=4):
            pts = C.catmull([Vector((x, 0, zc)) for (x, _, _, _, zc) in sections], n)
            out = []
            Rx_ = Mx.to_3x3()
            for p, f in pts:
                _, ry, rt, rb, _ = C.lerp_list(sections, f)
                out.append((Mx @ p, Rx_ @ side_l, Rx_ @ up_l, ry, rt, rb, u0 + (u1 - u0) * f / (len(sections) - 1)))
            return out

        bm, pv = C.loft(ring_list(sk, Mh, 1.0, 1.15), 18, e_side=0.9, e_bot=0.45)
        C.mesh_object(prefix + "skull", bm, self.m_skull, pv=pv)

        # 下あご（ちょうつがいで開く）
        jx, jz = hd["hinge"]
        Mj = Mh @ Tr((jx, 0, jz)) @ Ry(P["jaw"])
        jw = hd["jaw"]
        bm, pv = C.loft(ring_list(jw, Mj, 1.0, 1.15), 16, e_side=0.9, e_top=0.4)
        C.mesh_object(prefix + "jaw", bm, self.m_jaw, pv=pv)

        def sk_at(x, sections):
            xs = [r[0] for r in sections]
            x = max(xs[0], min(xs[-1], x))
            for i in range(len(xs) - 1):
                if xs[i] <= x <= xs[i + 1]:
                    t = (x - xs[i]) / (xs[i + 1] - xs[i])
                    return tuple(a + (b - a) * t for a, b in zip(sections[i], sections[i + 1]))
            return sections[-1]

        # 口の中（開けたとき奥に見える赤いところ）：上あごのふちと下あごのふちを、奥側でつなぐ膜
        import bmesh
        bm = bmesh.new()
        xs = [hd["mouth_x"][0] + (hd["mouth_x"][1] - hd["mouth_x"][0]) * i / 7 for i in range(8)]
        prev = None
        for x in xs:
            _, ry, rt, rb, zc = sk_at(x, sk)
            up = Mh @ Vector((x, ry * 0.55, zc - rb * 0.6))
            _, jry, jrt, jrb, jzc = sk_at(x - jx, jw)
            lo = Mj @ Vector((x - jx, jry * 0.55, jzc + jrt * 0.3))
            row = (bm.verts.new(up), bm.verts.new(lo))
            if prev:
                bm.faces.new((prev[0], row[0], row[1], prev[1]))
            prev = row
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
        C.mesh_object(prefix + "mouth", bm, self.m_mouth, smooth=False, noline=True)
        # 上あごの裏（口蓋）と舌
        x0, x1 = hd["mouth_x"]
        xm = (x0 + x1) / 2
        _, ry, rt, rb, zc = sk_at(xm, sk)
        C.ellipsoid(Mh @ Vector((xm, 0, zc - rb * 0.75)), ((x1 - x0) / 2, ry * 0.7, 0.02), self.m_mouth, rot=R, name=prefix + "palate", noline=True)
        _, jry, jrt, jrb, jzc = sk_at(xm - jx, jw)
        C.ellipsoid(Mj @ Vector((xm - jx - 0.03, 0, jzc + jrt * 0.4)), ((x1 - x0) / 2 * 0.85, jry * 0.6, 0.022), self.m_tongue, rot=Mj.to_3x3(), name=prefix + "tongue", noline=True)

        # 歯（上は下向き、下は上向き）。まん中あたりがいちばん長い
        tu, tl = hd["teeth"]
        for side in (-1, 1):
            for i in range(tu):
                x = hd["teeth_x"][0] + (hd["teeth_x"][1] - hd["teeth_x"][0]) * i / max(1, tu - 1)
                _, ry, rt, rb, zc = sk_at(x, sk)
                L = hd["tooth_len"] * (0.65 + 0.35 * math.sin(math.pi * (i + 0.5) / tu))
                b = Vector((x, side * ry * 0.8, zc - rb * 0.86))
                C.cone(Mh @ b, Mh @ (b + Vector((0.004, 0, -L))), hd.get("tooth_r", 0.013), self.m_teeth, name=prefix + "tooth", noline=True)
            for i in range(tl):
                x = hd["teeth_x"][0] + 0.03 + (hd["teeth_x"][1] - hd["teeth_x"][0] - 0.06) * i / max(1, tl - 1)
                _, jry, jrt, jrb, jzc = sk_at(x - jx, jw)
                L = hd["tooth_len"] * 0.75 * (0.65 + 0.35 * math.sin(math.pi * (i + 0.5) / tl))
                b = Vector((x - jx, side * jry * 0.78, jzc + jrt * 0.7))
                C.cone(Mj @ b, Mj @ (b + Vector((0.004, 0, L))), hd.get("tooth_r", 0.013) * 0.9, self.m_teeth, name=prefix + "tooth", noline=True)

        # まゆの骨・小さな角・鼻の穴（手前と奥の両方）。目は3Dでは作らず、手前の目の位置だけを返す
        ex, ez = hd["eye"]
        _, ry, rt, rb, zc = sk_at(ex, sk)
        eye = Mh @ Vector((ex, -ry * 0.9, zc + ez))
        for side in (-1, 1):
            far = side > 0
            # まゆの骨：目の上のふくらみ（形だけ。色は頭と同じ。眉の線はドット絵で描く）
            C.ellipsoid(Mh @ Vector((ex - 0.005, side * ry * 0.78, zc + ez + 0.045)), (0.1, 0.05, 0.03), self.m_skull,
                        rot=R @ Matrix.Rotation(math.radians(-12), 3, "Y"), name=prefix + "brow")
            for hz in hd.get("horns", []):
                hx2, hy2, hh = hz
                b = Vector((hx2, side * ry * hy2, zc + rt * 0.75))
                C.cone(Mh @ b, Mh @ (b + Vector((-0.04, side * 0.01, hh))), 0.03, self.m_horn, name=prefix + "horn")
            nx = hd["skull"][-1][0] - 0.07
            _, nry, nrt, nrb, nzc = sk_at(nx, sk)
            if not far:
                C.ellipsoid(Mh @ Vector((nx, side * nry * 0.75, nzc + nrt * 0.35)), (0.02, 0.012, 0.01), self.m_pupil, rot=R, name=prefix + "nose", noline=True)
        return eye

    # ------------------------------------------------------------------
    def _legs(self, M0, P, prefix):
        lg = self.s["leg"]
        for side, ball_xy, dx, mat in ((-1, lg["near_ball"], P["near_dx"], self.m_limb), (1, lg["far_ball"], P["far_dx"], self.m_far)):
            sx, sy, sz = lg["socket"]
            hip = M0 @ Vector((sx, side * sy, sz))
            ma = math.radians(lg["meta_angle"])
            if P["legs_free"]:
                # 体といっしょに動く（立っていたときの足の位置を、体の向きに合わせて回す）。脚は少し前に投げ出す
                hx0, hz0 = self.s["hips"]
                R0 = M0.to_3x3()
                ball = M0 @ Vector((ball_xy[0] - hx0 + 0.25, side * abs(ball_xy[1]) * 1.1, lg["ball_z"] - hz0 + 0.12))
                ankle = ball + R0 @ Vector((-lg["meta"] * math.cos(ma), 0, lg["meta"] * math.sin(ma)))
                knee = _ik(hip, ankle, lg["thigh"], lg["shin"], R0 @ Vector((1, 0, 0)))
            else:
                ball = Vector((ball_xy[0] + dx, side * abs(ball_xy[1]), lg["ball_z"]))
                ankle = ball + Vector((-lg["meta"] * math.cos(ma), 0, lg["meta"] * math.sin(ma)))
                knee = _ik(hip, ankle, lg["thigh"], lg["shin"])
            parts = ((hip, knee, lg["r_thigh"], "thigh"), (knee, ankle, lg["r_shin"], "shin"), (ankle, ball, lg["r_meta"], "meta"))
            for a, b, rr, nm in parts:
                if nm == "thigh":
                    # ふともも：骨の上に、だ円の大きな筋肉（太ももの「ドラムスティック」の形）
                    ax = (b - a)
                    L = ax.length
                    q = ax.normalized().to_track_quat("X", "Z").to_matrix()
                    C.ellipsoid(a.lerp(b, 0.36), (L * 0.74, max(rr) * 0.78, max(rr) * 0.9), mat, rot=q, name=prefix + "thighm", sub=4)
                    rr = rr[-3:]
                    a = a.lerp(b, 0.55)
                pts = _seg_points(a, b, len(rr))
                fr = C.frames_along(pts)
                rings = [(p, sd, up, r, r, r, 0.0) for p, (sd, up), r in zip(pts, fr, rr)]
                bm, _ = C.loft(rings, 18 if nm == "thigh" else 12)
                C.mesh_object(prefix + nm, bm, mat)
            # 指3本（前に開く）と爪
            for k, yaw in enumerate((-24, 0, 24)):
                d = (Matrix.Rotation(math.radians(yaw * side * -1), 3, "Z") @ Vector((1, 0, -0.18))).normalized()
                L = lg["toe"] * (0.85, 1.0, 0.8)[k]
                tip = ball + d * L
                pts = _seg_points(ball, tip, 3)
                fr = C.frames_along(pts)
                rings = [(p, sd, up, r, r, r, 0.0) for p, (sd, up), r in zip(pts, fr, lg["r_toe"])]
                bm, _ = C.loft(rings, 10)
                C.mesh_object(prefix + "toe", bm, mat)
                C.cone(tip - d * 0.01, tip + (d + Vector((0, 0, -0.5))).normalized() * lg["claw"], lg["r_toe"][-1] * 1.05, self.m_claw, name=prefix + "claw", noline=True)

    # ------------------------------------------------------------------
    def _arms(self, Mc, P, prefix):
        ar = self.s.get("arm")
        if not ar:
            return
        for side, mat in ((-1, self.m_limb), (1, self.m_far)):
            ax, ay, az = ar["socket"]
            sh = Mc @ Vector((ax, side * ay, az))
            Rc = Mc.to_3x3() @ Matrix.Rotation(math.radians(-P["arm"]), 3, "Y")
            el = sh + Rc @ Vector((0.4, side * 0.1, -0.9)).normalized() * ar["upper"]
            wr = el + Rc @ Vector((0.95, 0, -0.2)).normalized() * ar["fore"]
            for a, b, r0, r1 in ((sh, el, ar["r"][0], ar["r"][1]), (el, wr, ar["r"][1], ar["r"][1] * 0.8)):
                pts = _seg_points(a, b, 3)
                fr = C.frames_along(pts)
                rings = [(p, sd, up, r, r, r, 0.0) for p, (sd, up), r in zip(pts, fr, (r0, (r0 + r1) / 2, r1))]
                bm, _ = C.loft(rings, 10)
                C.mesh_object(prefix + "arm", bm, mat)
            for k in range(ar["fingers"]):
                d = (Rc @ Vector((0.7, side * (k - 0.5) * 0.4, -0.7))).normalized()
                C.cone(wr, wr + d * ar["claw"], 0.014, self.m_claw, name=prefix + "finger", noline=True)
