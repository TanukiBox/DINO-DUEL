"""恐竜ごとの設定（形の数字・色）と、動きのポーズ。

1種 = SPECIES の1つ。type が体型の型（theropod = 二足歩行の肉食 …）。
動き（ANIMS）は、型ごとに「待機・被弾・倒れる」と、その恐竜の技の動き。
1コマ = ポーズの数字（theropod.POSE を見る）。ms はゲームで見せる時間のめやす。
impact は「当たる瞬間」のコマ（ゲームはこのコマを、タイミングの輪が縮みきる瞬間に合わせて見せる）。
"""

# ---------------------------------------------------------------------------
# ティラノサウルス（SSR・白亜紀・肉食）
# 調べたこと：骨格の Sue 標本（全長約12m）。頭は大きく奥行きがあり、目の上に張り出した骨と小さな角。
# 体は水平で、しっぽで頭とつり合う。腕はとても短く指は2本。脚は太もも → 前に出たひざ → 長い足の甲 → 前向きの指3本。
# ゲームのティラノ（前の絵）と同じ、赤茶の体・クリーム色のおなか・黒っぽいしま・黄色い目。
# ---------------------------------------------------------------------------
TYRANNO = dict(
    key="tyranno", type="theropod",
    hips=(-0.15, 1.24),
    hip_r=(0.29, 0.32, 0.32),
    # 前の関節：(前へ, 上へ, 横の半径, 上の半径, 下の半径) … おなか・胸・肩・首・首の上
    fwd=[
        (0.36, -0.02, 0.33, 0.32, 0.46),
        (0.30, 0.02, 0.30, 0.31, 0.42),
        (0.22, 0.06, 0.24, 0.26, 0.30),
        (0.14, 0.10, 0.20, 0.21, 0.22),
        (0.10, 0.08, 0.18, 0.19, 0.18),
    ],
    # しっぽの関節（腰から後ろへ。ほぼ水平で、頭とつり合う）
    tail=[
        (-0.32, 0.01, 0.22, 0.25, 0.24),
        (-0.36, 0.0, 0.16, 0.18, 0.17),
        (-0.34, -0.02, 0.11, 0.12, 0.11),
        (-0.30, -0.03, 0.065, 0.07, 0.065),
        (-0.26, -0.03, 0.03, 0.03, 0.03),
        (-0.16, -0.02, 0.008, 0.008, 0.008),
    ],
    head=dict(
        # 頭の骨：(前へ, 横の半径, 上の半径, 下の半径, 中心の高さ)。うしろが高く、鼻先へなだらかに下がる箱形
        skull=[
            (-0.14, 0.17, 0.18, 0.12, 0.04),
            (-0.03, 0.22, 0.24, 0.12, 0.05),
            (0.10, 0.21, 0.23, 0.10, 0.04),
            (0.24, 0.17, 0.19, 0.085, 0.02),
            (0.40, 0.14, 0.155, 0.075, 0.0),
            (0.56, 0.12, 0.13, 0.07, -0.015),
            (0.68, 0.10, 0.105, 0.065, -0.025),
            (0.78, 0.07, 0.08, 0.05, -0.03),
        ],
        hinge=(-0.06, -0.07),
        # 下あご（ちょうつがいからの位置）。あごの下が深い
        jaw=[
            (-0.06, 0.17, 0.035, 0.10, 0.0),
            (0.10, 0.18, 0.03, 0.13, -0.02),
            (0.30, 0.15, 0.025, 0.11, -0.02),
            (0.50, 0.12, 0.022, 0.09, -0.015),
            (0.66, 0.095, 0.02, 0.07, -0.01),
            (0.80, 0.06, 0.018, 0.045, -0.005),
        ],
        mouth_x=(-0.04, 0.62),
        teeth=(7, 6), teeth_x=(0.1, 0.72), tooth_len=0.085, tooth_r=0.022,
        eye=(0.12, 0.10), eye_r=0.05,
        scale=1.12,   # 頭の大きさ（ゲームで見やすいよう、実物より少し大きく）
        horns=[(0.2, 0.6, 0.06)],
    ),
    leg=dict(
        socket=(0.06, 0.24, -0.12),
        thigh=0.52, shin=0.50, meta=0.30, meta_angle=60, toe=0.2, claw=0.07, ball_z=0.04,
        r_thigh=(0.24, 0.26, 0.22, 0.15, 0.115),
        r_shin=(0.12, 0.10, 0.08, 0.07),
        r_meta=(0.07, 0.06, 0.055),
        r_toe=(0.05, 0.04, 0.026),
        near_ball=(0.20, 0.27), far_ball=(-0.28, 0.27),
    ),
    arm=dict(socket=(0.12, 0.2, -0.18), upper=0.16, fore=0.13, r=(0.05, 0.036), fingers=2, claw=0.06),
    colors=dict(base="#b4622e", belly="#fbe8a8", stripe="#5a2e1c", far="#8a4524", eye="#f2c050", pupil="#2e1a14",
                teeth="#fff8ea", claw="#3e3a48", mouth="#7a1a1a", tongue="#e8908a", brow="#5a2e1c", horn="#8a4524"),
    stripes=dict(freq=13, w=0.34, u=(0.08, 0.78)),
)

SPECIES = {"tyranno": TYRANNO}

# ---------------------------------------------------------------------------
# 動き（ティラノ）。待機・被弾・倒れる ＋ 技2つ（クラッシュファング = 噛みつき、暴君のおたけび = 咆哮）
# ---------------------------------------------------------------------------
import math   # noqa: E402


def _idle(k):
    ph = k / 4 * 2 * math.pi
    return dict(root_dz=0.012 * math.sin(ph), breathe=1 + 0.03 * math.sin(ph), jaw=3 + 3 * max(0.0, math.sin(ph)),
                tail_sway=5, tail_phase=k * 90, head_pitch=-2 * math.sin(ph), spine=(0, 0, 0, 1.5 * math.sin(ph), 0))


# 技 → 動き（data.js の技の名前 → ANIMS の動きの名前）
MOVES = {
    "tyranno": {"crush_fang": "bite", "tyrant_roar": "roar"},
}

ANIMS = {
    "tyranno": {
        "idle": dict(frames=[_idle(k) for k in range(4)], ms=[220, 200, 220, 200], loop=True),
        "hit": dict(frames=[
            dict(root_dx=-0.07, root_pitch=7, head_pitch=12, head_roll=-6, jaw=16, tail_lift=-3, eye_closed=True),
            dict(root_dx=-0.03, root_pitch=3, head_pitch=5, jaw=8, tail_lift=-1),
        ], ms=[160, 160]),
        # たおれる：よろける → 横に傾く → 横だおし（背中がこちらを向き、脚は向こう側に投げ出す）
        "faint": dict(frames=[
            dict(root_dx=-0.05, root_pitch=9, head_pitch=16, jaw=22, tail_lift=-2, eye_closed=True),
            dict(root_dx=-0.1, root_dz=-0.34, root_roll=36, root_pitch=-4, head_pitch=-6, head_roll=-10, jaw=16, tail_lift=-3, legs_free=True, eye_closed=True),
            dict(root_dx=-0.12, root_dz=-0.9, root_roll=80, root_pitch=-2, spine=(0, 0, -2, -6, -4), head_pitch=-4, head_roll=-8, jaw=14, tail_lift=-1, arm=-25, legs_free=True, eye_closed=True),
        ], ms=[180, 200, 400]),
        # クラッシュファング：かがむ → 口を大きく開けてのけぞる → 飛びかかる → 噛みつく（当たる瞬間） → 首を振る → もどる
        "bite": dict(frames=[
            dict(root_dx=-0.06, root_dz=-0.04, root_pitch=-6, head_pitch=-6, jaw=4, tail_lift=6, spine=(0, 0, -4, -4, 0)),
            dict(root_dx=-0.1, root_pitch=7, head_pitch=14, jaw=50, tail_lift=9, arm=-20, spine=(0, 2, 4, 6, 4), breathe=1.04),
            dict(root_dx=0.14, root_dz=-0.02, root_pitch=-9, head_pitch=-4, jaw=56, tail_lift=-5, spine=(0, -2, -8, -10, -6), near_dx=0.1),
            dict(root_dx=0.18, root_dz=-0.03, root_pitch=-10, head_pitch=-12, jaw=-1, tail_lift=-9, spine=(0, -2, -8, -10, -6), near_dx=0.1),
            dict(root_dx=0.17, root_dz=-0.03, root_pitch=-9, head_pitch=-10, head_yaw=16, head_roll=8, jaw=0, tail_lift=-7, tail_sway=10, tail_phase=180, spine=(0, -2, -8, -10, -6), near_dx=0.1),
            dict(root_dx=0.17, root_dz=-0.03, root_pitch=-9, head_pitch=-10, head_yaw=-14, head_roll=-8, jaw=0, tail_lift=-7, tail_sway=10, tail_phase=0, spine=(0, -2, -8, -10, -6), near_dx=0.1),
            dict(root_dx=0.04, root_pitch=-2, head_pitch=0, jaw=6, tail_lift=-2),
        ], ms=[200, 300, 120, 160, 90, 90, 160], impact=3, windup=[0, 1], strike=[2, 3], after=[4, 5, 4, 5], recover=[6]),
        # 暴君のおたけび：息を吸う（頭を下げる） → 頭を上げて口を開く → ほえる（当たる瞬間・衝撃波） → ほえつづける → もどる
        "roar": dict(frames=[
            dict(root_dx=-0.05, root_dz=0.01, root_pitch=3, head_pitch=-16, jaw=2, breathe=1.07, tail_lift=4, spine=(0, 0, -4, -8, -4)),
            dict(root_dx=-0.06, root_pitch=10, head_pitch=16, jaw=32, breathe=1.05, tail_lift=6, spine=(0, 2, 6, 10, 4), arm=-10),
            dict(root_dx=0.05, root_pitch=4, head_pitch=6, jaw=68, breathe=0.98, tail_lift=-8, spine=(0, 0, 4, 6, 2), arm=-34),
            dict(root_dx=0.06, root_dz=0.012, root_pitch=4, head_pitch=9, head_roll=4, jaw=64, breathe=0.97, tail_lift=-9, spine=(0, 0, 4, 6, 2), arm=-30, tail_sway=6, tail_phase=90),
            dict(root_dx=0.05, root_dz=-0.01, root_pitch=4, head_pitch=4, head_roll=-4, jaw=68, breathe=0.98, tail_lift=-8, spine=(0, 0, 4, 6, 2), arm=-34, tail_sway=6, tail_phase=270),
            dict(root_dx=0.01, root_pitch=2, head_pitch=2, jaw=10, tail_lift=-2),
        ], ms=[260, 260, 160, 90, 90, 200], impact=2, windup=[0, 1], strike=[2], after=[3, 4, 3, 4, 3], recover=[5]),
    }
}
