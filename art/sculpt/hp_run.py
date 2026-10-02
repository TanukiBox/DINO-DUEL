"""hifipushie を呼ぶ（彫刻モデルの確認用）。hifipushie のフォルダの Python で動かす：

  uv run --directory <hifipushie> python art/sculpt/hp_run.py put tyranno        … 設計図（tyranno.json）を読みこむ
  uv run --directory <hifipushie> python art/sculpt/hp_run.py look tyranno [views] [resolution] [shading]
  uv run --directory <hifipushie> python art/sculpt/hp_run.py ref tyranno <横からの影絵の画像>
  uv run --directory <hifipushie> python art/sculpt/hp_run.py compare tyranno

絵は art/build/sculpt/ に書き出す（Git には入れない）。
"""
import json
import os
import sys

from hifipushie import server

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "..", "build", "sculpt")
os.makedirs(OUT, exist_ok=True)


def save_all(res, stem):
    n = 0
    for item in res if isinstance(res, list) else [res]:
        if hasattr(item, "data"):
            p = os.path.join(OUT, "%s_%d.png" % (stem, n))
            open(p, "wb").write(item.data)
            print("image", os.path.abspath(p))
            n += 1
        else:
            print(str(item)[:3000])


def main():
    cmd, name = sys.argv[1], sys.argv[2]
    if cmd == "put":
        spec = json.load(open(os.path.join(HERE, name + ".json"), encoding="utf-8"))
        print(server.put_model(name, spec, note=" ".join(sys.argv[3:]) or "update"))
    elif cmd == "look":
        views = sys.argv[3].split(",") if len(sys.argv) > 3 and sys.argv[3] != "-" else None
        res = int(sys.argv[4]) if len(sys.argv) > 4 else 200
        shading = sys.argv[5] if len(sys.argv) > 5 else "clay"
        save_all(server.look(name, views=views, resolution=res, shading=shading, size=448), "look_%s" % shading)
    elif cmd == "focus":
        # focus x,y,z（hifipushie の座標） zoom
        f = [float(v) for v in sys.argv[3].split(",")]
        save_all(server.look(name, views=sys.argv[5].split(","), focus=f, zoom=float(sys.argv[4]), resolution=220, size=448), "focus")
    elif cmd == "ref":
        save_all(server.set_reference(name, "side", sys.argv[3], flip=False), "ref")
    elif cmd == "compare":
        save_all(server.compare(name, views=["side"]), "compare")
    elif cmd == "export":
        # export 名前 書き出し先 三角形の数 テクスチャの大きさ
        out = sys.argv[3]
        os.makedirs(out, exist_ok=True)
        save_all(server.export_asset(name, out, triangles=int(sys.argv[4]), texture=int(sys.argv[5]), resolution=300), "export")
    elif cmd == "check":
        save_all(server.check(name), "check")


if __name__ == "__main__":
    main()
