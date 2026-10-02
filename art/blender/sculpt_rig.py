"""彫刻モデル（hifipushie で作って書き出した GLB）に骨を入れて、ゲームの動きのポーズで描く。

  ・形と色（テクスチャ）は hifipushie の書き出し（art/build/sculpt/export/<種>.glb）。設計図は art/sculpt/<種>.json
  ・骨組みは設計図の関節から作る。体の各部分の頂点を、いちばん近い骨に（関節の近くはなめらかに混ぜて）くっつける
  ・動きは今までと同じポーズの数字（dinos.ANIMS・theropod.POSE）：体の傾き・背骨の曲げ・頭の向き・あごの開き・
    しっぽの上げ下げと振り・腕。足の裏は地面に置いたまま、ひざの位置を計算する（IK）
  ・下あごと下の歯はあごの骨、上の歯と目玉は頭の骨にそのまま付ける
  ・光と影は real.py（リアル寄り）と同じ
"""
import json
import math
import os

import bpy
from mathutils import Vector, Matrix

import common as C
from theropod import POSE, Ry, Rz, Rx, Tr, _ik

# hifipushie の座標（横 X・後ろ Y・上 Z。恐竜は -Y 向き）→ ゲームの座標（前 x・横 y・上 z）
TO_GAME = Matrix.Rotation(math.radians(90), 4, "Z")


def hp(p):
    return (TO_GAME @ Vector(p).to_4d()).to_3d()


class SculptTheropod:
    """二足の肉食の彫刻モデル。build(pose) で、そのポーズにする（形は作り直さず、骨を動かす）"""

    def __init__(self, spec_path, glb_path, dino_spec):
        self.d = dino_spec
        self.spec = json.load(open(spec_path, encoding="utf-8"))
        J = {}
        for k, v in self.spec["joints"].items():
            if "pos" in v:
                J[k] = hp(v["pos"])
                if k.endswith(".L"):
                    q = J[k].copy()
                    q.y = -q.y
                    J[k[:-2] + ".R"] = q
        self.J = J
        self._import(glb_path)
        self._armature()
        self._skin()
        self._lids()
        self._mouth()

    # ------------------------------------------------------------------
    def _import(self, glb):
        before = set(bpy.data.objects)
        bpy.ops.import_scene.gltf(filepath=glb)
        objs = [o for o in bpy.data.objects if o not in before]
        self.parts = {}
        for o in objs:
            if o.type != "MESH":
                continue
            # 向きを「前 = +x」に直して、形そのものに焼きこむ
            o.data.transform(TO_GAME @ o.matrix_world)
            o.matrix_world = Matrix.Identity(4)
            o.parent = None
            name = o.name.split(".")[0].lower()
            name = name.split("_", 1)[-1]            # "tyranno_body" → "body"
            self.parts[name] = o
        for o in objs:
            if o.type != "MESH":
                bpy.data.objects.remove(o)
        print("  sculpt parts:", sorted(self.parts))

    # ------------------------------------------------------------------
    def _bone_list(self):
        """(骨の名前, 根元の関節, 先の関節, 親)"""
        B = [("spine0", "pelvis", "belly", None), ("spine1", "belly", "chest", "spine0"), ("spine2", "chest", "shoulder", "spine1"),
             ("spine3", "shoulder", "neck0", "spine2"), ("spine4", "neck0", "neck1", "spine3"), ("head", "neck1", "nose", "spine4"),
             ("jaw", "jaw_back", "chin", "head"),
             ("tail0", "pelvis", "tail0", "spine0"), ("tail1", "tail0", "tail1", "tail0"), ("tail2", "tail1", "tail2", "tail1"),
             ("tail3", "tail2", "tail3", "tail2"), ("tail4", "tail3", "tail4", "tail3"), ("tail5", "tail4", "tail5", "tail4")]
        for s in ("L", "R"):
            B += [("thigh." + s, "hip." + s, "knee." + s, "spine0"), ("shin." + s, "knee." + s, "ankle." + s, "thigh." + s),
                  ("meta." + s, "ankle." + s, "toe." + s, "shin." + s), ("toes." + s, "toe." + s, "toetip." + s, "meta." + s),
                  ("upperarm." + s, "shoulder." + s, "elbow." + s, "spine1"), ("forearm." + s, "elbow." + s, "wrist." + s, "upperarm." + s),
                  ("hand." + s, "wrist." + s, "f1." + s, "forearm." + s)]
        return B

    def _armature(self):
        J = self.J
        for s, sg in (("L", 1), ("R", -1)):
            J["toetip." + s] = J["toe." + s] + Vector((0.2, 0, -0.02))
        arm = bpy.data.armatures.new("Rig")
        ob = bpy.data.objects.new("Rig", arm)
        C.link(ob)
        bpy.context.view_layer.objects.active = ob
        bpy.ops.object.mode_set(mode="EDIT")
        for name, a, b, parent in self._bone_list():
            e = arm.edit_bones.new(name)
            e.head, e.tail = J[a], J[b]
            # ねじれの基準：体と頭は「上」、脚と腕は「横」
            e.align_roll(Vector((0, 0, 1)) if not any(name.startswith(x) for x in ("thigh", "shin", "meta", "toes", "upperarm", "forearm", "hand")) else Vector((0, 1, 0)))
            if parent:
                e.parent = arm.edit_bones[parent]
        bpy.ops.object.mode_set(mode="OBJECT")
        self.rig = ob
        self.rest = {pb.name: pb.bone.matrix_local.copy() for pb in ob.pose.bones}

    # ------------------------------------------------------------------
    def _skin(self):
        """頂点を骨にくっつける。体：骨の表面までの近さで、いちばん近い骨を中心に混ぜる。ほかの部品は決まった骨に"""
        import numpy as np
        bones = [(n, self.J[a], self.J[b]) for n, a, b, _ in self._bone_list()]
        rad = {}
        for n, a, b, _ in self._bone_list():
            ra = self.spec["joints"].get(a.replace(".R", ".L"), {}).get("r", 0.05)
            rb = self.spec["joints"].get(b.replace(".R", ".L"), {}).get("r", 0.05) if b in self.spec["joints"] or b.replace(".R", ".L") in self.spec["joints"] else ra
            rad[n] = (ra, rb)
        fixed = {"jaw": "jaw", "lteeth": "jaw", "teeth": "head", "eyes": "head"}
        for pname, o in self.parts.items():
            me = o.data
            o.vertex_groups.clear()
            groups = {n: o.vertex_groups.new(name=n) for n, _, _ in bones}
            P = np.array([v.co[:] for v in me.vertices])
            if pname in fixed:
                groups[fixed[pname]].add(list(range(len(P))), 1.0, "REPLACE")
            else:
                D = []
                for n, a, b in bones:
                    A, Bv = np.array(a[:]), np.array(b[:])
                    AB = Bv - A
                    t = np.clip(((P - A) @ AB) / max(AB @ AB, 1e-9), 0, 1)
                    d = np.linalg.norm(P - (A + t[:, None] * AB), axis=1)
                    ra, rb = rad[n]
                    D.append(np.maximum(d - (ra + (rb - ra) * t) * 0.6, 0.004))
                D = np.array(D).T                        # 頂点 × 骨
                # 左右をまちがえない：脚・腕の骨は、反対側の頂点には効かせない。下あごは別の部品なので、体には効かせない
                for j, (n, a, b) in enumerate(bones):
                    if n == "jaw":
                        D[:, j] = 1e9
                    if n.endswith(".L"):
                        D[P[:, 1] < -0.02, j] = 1e9
                    elif n.endswith(".R"):
                        D[P[:, 1] > 0.02, j] = 1e9
                W = 1.0 / D ** 6
                top = np.argsort(-W, axis=1)[:, :3]
                for i in range(len(P)):
                    ws = W[i, top[i]]
                    ws = ws / ws.sum()
                    for j, w in zip(top[i], ws):
                        if w > 0.01:
                            groups[bones[j][0]].add([i], float(w), "ADD")
            mod = o.modifiers.new("rig", "ARMATURE")
            mod.object = self.rig
            o.parent = self.rig

    def _lids(self):
        """目を閉じるコマ用のまぶた（ふだんは隠す）"""
        self.lids = []
        eyes = self.parts.get("eyes")
        if not eyes:
            return
        import numpy as np
        P = np.array([v.co[:] for v in eyes.data.vertices])
        mat = self._plain("lid_skin", (0.17, 0.075, 0.035), 0.6)
        for side in (1, -1):
            Q = P[(P[:, 1] * side) > 0]
            if not len(Q):
                continue
            c = Q.mean(0)
            r = float(np.abs(Q - c).max()) * 1.18
            lid = C.ellipsoid(Vector(c) + Vector((0, side * r * 0.12, 0)), (r * 1.05, r * 0.75, r * 1.0), mat, name="Lid", noline=True)
            vg = lid.vertex_groups.new(name="head")
            vg.add(list(range(len(lid.data.vertices))), 1.0, "REPLACE")
            mod = lid.modifiers.new("rig", "ARMATURE")
            mod.object = self.rig
            lid.parent = self.rig
            lid.hide_render = True
            self.lids.append(lid)

    @staticmethod
    def _plain(name, color, rough):
        m = bpy.data.materials.new(name)
        m.use_nodes = True
        b = m.node_tree.nodes.get("Principled BSDF")
        b.inputs["Base Color"].default_value = (*color, 1.0)
        b.inputs["Roughness"].default_value = rough
        return m

    def _mouth(self):
        """口の中：上（頭の骨にくっつく）と下（あごの骨にくっつく）をつなぐ膜。口を開けると伸びて、赤い口の中・舌が見える"""
        sp = self.spec.get("mouth") or {}
        x0, x1 = sp.get("x", (1.12, 1.74))
        z_of = lambda x: sp.get("z0", 1.22) + (x - 1.2) * sp.get("slope", 0.123)
        w_of = lambda x: max(0.03, sp.get("w0", 0.13) - (x - 1.3) * sp.get("dw", 0.17))
        n = 12
        verts, groups = [], []
        for i in range(n + 1):
            x = x0 + (x1 - x0) * i / n
            z, w = z_of(x), w_of(x) * 0.9
            row = [((x, w, z - 0.004), "head"), ((x, w * 0.92, z - 0.012), "jaw"), ((x, 0.0, z - 0.035), "jaw"),
                   ((x, -w * 0.92, z - 0.012), "jaw"), ((x, -w, z - 0.004), "head"), ((x, 0.0, z + 0.03), "head")]
            for p, g in row:
                verts.append(p)
                groups.append(g)
        faces = []
        k = 6
        for i in range(n):
            a, b = i * k, (i + 1) * k
            # 手前（カメラ側 = -y）のほおの膜は作らない：開いた口から、奥のほお・舌・歯が見えるように
            for j0, j1 in ((0, 1), (1, 2), (2, 3), (4, 5), (5, 0)):
                faces.append((a + j0, a + j1, b + j1, b + j0))
        faces.append(tuple(range(k - 1, -1, -1)))          # のどの奥のふた
        me = bpy.data.meshes.new("Mouth")
        me.from_pydata(verts, [], faces)
        me.materials.append(self._plain("mouth_inside", (0.09, 0.016, 0.016), 0.32))
        ob = bpy.data.objects.new("Mouth", me)
        C.link(ob)
        for gname in ("head", "jaw"):
            vg = ob.vertex_groups.new(name=gname)
            vg.add([i for i, g in enumerate(groups) if g == gname], 1.0, "REPLACE")
        mod = ob.modifiers.new("rig", "ARMATURE")
        mod.object = self.rig
        ob.parent = self.rig
        # 舌（あごの骨）
        t = C.ellipsoid(Vector(((x0 + x1) / 2 - 0.05, 0, z_of((x0 + x1) / 2) - 0.03)), ((x1 - x0) * 0.38, w_of((x0 + x1) / 2) * 0.55, 0.025),
                        self._plain("tongue", (0.3, 0.07, 0.07), 0.35), name="Tongue", noline=True)
        vg = t.vertex_groups.new(name="jaw")
        vg.add(list(range(len(t.data.vertices))), 1.0, "REPLACE")
        mod = t.modifiers.new("rig", "ARMATURE")
        mod.object = self.rig
        t.parent = self.rig

    # ------------------------------------------------------------------
    def _targets(self, P):
        """ポーズの数字 → 骨ごとの「回転（休みの姿勢からの変化）」と根元の位置"""
        J, d = self.J, self.d
        pitch = d.get("pitch", 0.0)
        hip0 = J["pelvis"]
        M0 = Tr(hip0 + Vector((P["root_dx"], 0, P["root_dz"]))) @ Ry(-(pitch + P["root_pitch"])) @ Rx(P["root_roll"])
        chain = ["pelvis", "belly", "chest", "shoulder", "neck0", "neck1"]
        fwd_M = [M0]
        M = M0
        for i in range(1, len(chain)):
            M = M @ Tr(J[chain[i]] - J[chain[i - 1]]) @ Ry(-P["spine"][i - 1])
            fwd_M.append(M)
        Mh = M @ Ry(-P["head_pitch"]) @ Rz(P["head_yaw"]) @ Rx(P["head_roll"])
        Mj = Mh @ Tr(J["jaw_back"] - J["neck1"]) @ Ry(P["jaw"])
        tails = ["pelvis", "tail0", "tail1", "tail2", "tail3", "tail4", "tail5"]
        tail_M = []
        M = M0
        nt = len(tails) - 1
        for k in range(1, len(tails)):
            sway = P["tail_sway"] * math.sin(math.radians(P["tail_phase"]) + (k - 1) * 0.8) * (0.4 + 0.6 * (k - 1) / max(1, nt - 1))
            M = M @ Tr(J[tails[k]] - J[tails[k - 1]]) @ Ry(P["tail_lift"]) @ Rz(sway)
            tail_M.append(M)
        T = {}
        R = lambda m: m.to_3x3().normalized()
        # 体・頭・あご・しっぽ：その関節の座標の回転
        # 骨（関節 i-1 → i）の向きは、根元の関節の座標の回転（関節で曲げてから次の骨へ進むため）
        for i, n in enumerate(("spine0", "spine1", "spine2", "spine3", "spine4")):
            T[n] = (R(fwd_M[i]), fwd_M[i].translation)
        T["head"] = (R(Mh), (fwd_M[5]).translation)
        T["jaw"] = (R(Mj), Mj.translation)
        T["tail0"] = (R(M0), M0.translation)
        for k in range(1, 6):
            T["tail%d" % k] = (R(tail_M[k - 1]), tail_M[k - 1].translation)
        # 脚：足の裏を地面に置いたまま（倒れるときは体といっしょ）
        for s, dx in (("R", P["near_dx"]), ("L", P["far_dx"])):
            hip = M0 @ (J["hip." + s] - hip0)
            if P["legs_free"]:
                R0 = M0.to_3x3()
                ball = M0 @ (J["toe." + s] - hip0 + Vector((0.25, 0, 0.12)))
                ankle = ball + R0 @ (J["ankle." + s] - J["toe." + s])
                knee = _ik(hip, ankle, (J["knee." + s] - J["hip." + s]).length, (J["ankle." + s] - J["knee." + s]).length, R0 @ Vector((1, 0, 0)))
                toe_rot = R0
            else:
                ball = J["toe." + s] + Vector((dx, 0, 0))
                ankle = ball + (J["ankle." + s] - J["toe." + s])
                knee = _ik(hip, ankle, (J["knee." + s] - J["hip." + s]).length, (J["ankle." + s] - J["knee." + s]).length)
                toe_rot = Matrix.Identity(3)
            for n, a, b, ra, rb in (("thigh", hip, knee, "hip", "knee"), ("shin", knee, ankle, "knee", "ankle"), ("meta", ankle, ball, "ankle", "toe")):
                rest_v = J["%s.%s" % (rb, s)] - J["%s.%s" % (ra, s)]
                T["%s.%s" % (n, s)] = (rest_v.rotation_difference(b - a).to_matrix(), a)
            T["toes." + s] = (toe_rot, ball)
        # 腕：胸の座標と「腕の角度」で回す
        Mc = fwd_M[2]
        Rc = R(Mc) @ Matrix.Rotation(math.radians(-P["arm"]), 3, "Y")
        for s in ("L", "R"):
            sh = Mc @ (J["shoulder." + s] - J["chest"])
            T["upperarm." + s] = (Rc, sh)
            el = sh + Rc @ (J["elbow." + s] - J["shoulder." + s])
            T["forearm." + s] = (Rc, el)
            T["hand." + s] = (Rc, el + Rc @ (J["wrist." + s] - J["elbow." + s]))
        anchors = {
            "mouth": Mh @ (J["nose"] - J["neck1"] + Vector((-0.05, 0, -0.12))),
            "head": Mh @ (J["head"] - J["neck1"]),
            "body": fwd_M[1].translation.copy(),
            "feet": Vector((J["toe.R"].x, 0, 0)),
        }
        return T, anchors, Mh

    def build(self, pose, prefix=None):
        P = dict(POSE)
        P.update(pose)
        T, anchors, Mh = self._targets(P)
        ob = self.rig
        order = [n for n, _, _, _ in self._bone_list()]
        for n in order:
            pb = ob.pose.bones[n]
            rot, head = T[n]
            rest = self.rest[n]
            m = (rot @ rest.to_3x3()).to_4x4()
            m.translation = head
            pb.matrix = m
            bpy.context.view_layer.update()
        closed = bool(P["eye_closed"])
        for lid in self.lids:
            lid.hide_render = not closed
        # 目の位置（ゲームの絵の目の点。リアル寄りでは使わないが、演出の位置合わせ用に返す）
        eyes = self.parts.get("eyes")
        eye = anchors["head"]
        if eyes:
            import numpy as np
            P_ = np.array([v.co[:] for v in eyes.data.vertices])
            Q = P_[P_[:, 1] < 0]
            if len(Q):
                c = Vector(Q.mean(0))
                eye = Mh @ (c - self.J["neck1"])
        anchors["eye"] = eye
        anchors["eye_closed"] = closed
        return anchors
