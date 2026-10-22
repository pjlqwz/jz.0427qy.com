#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
发布工具：把 Astro 产物（web/dist）同步到仓库根目录，然后可选提交/推送。

分级：默认只做 dry-run，什么文件都不动。

    python tools/deploy.py                    # 演练：列出将新增/覆盖/删除的文件
    python tools/deploy.py --apply            # 真同步文件（不提交）
    python tools/deploy.py --apply --commit   # 同步 + git add/commit
    python tools/deploy.py --apply --commit --push   # 再 push（= 线上变更）

保护名单：这些顶层项目永远不会被删除
"""
import os
import shutil
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIST = os.path.join(ROOT, "web", "dist")
WEB = os.path.join(ROOT, "web")
KEEP_FILE = os.path.join(ROOT, "tools", "deploy-keep.txt")

# 仓库根下永远保留的东西（源码、工具、git、平台校验文件）
KEEP_DIRS = {".git", "web", "tools", "node_modules"}
KEEP_FILES = {".gitignore", "README.md", "CNAME", "BingSiteAuth.xml", "favicon.ico"}
KEEP_SUFFIX = (".txt",)  # 百度/必应/微信等站点校验文件


def load_keep_prefixes():
    out = []
    if os.path.exists(KEEP_FILE):
        for line in open(KEEP_FILE, encoding="utf-8"):
            line = line.strip()
            if line and not line.startswith("#"):
                out.append(line.lstrip("/"))
    return out


KEEP_PREFIX = load_keep_prefixes()


def protected(rel):
    return any(rel == p or rel.startswith(p if p.endswith("/") else p + "/") or rel.startswith(p)
               for p in KEEP_PREFIX)


def keep(name):
    return (
        name in KEEP_DIRS
        or name in KEEP_FILES
        or name.endswith(KEEP_SUFFIX)
        or name.startswith(".git")
    )


def walk_rel(base):
    out = set()
    for dirpath, _, files in os.walk(base):
        for f in files:
            p = os.path.relpath(os.path.join(dirpath, f), base).replace(os.sep, "/")
            out.add(p)
    return out


def run(cmd, cwd=ROOT):
    print("$", " ".join(cmd))
    r = subprocess.run(cmd, cwd=cwd, shell=(os.name == "nt"))
    if r.returncode != 0:
        print("命令失败，中止。")
        sys.exit(r.returncode)


def file_hash(p):
    import hashlib
    h = hashlib.md5()
    with open(p, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def load_blocked_paths():
    """主动下架清单（写死在 tools/extract.py 的 BLOCKED 里，落到 articles.json 的 blocked 字段）。

    这些页面的删除是**计划内**的，不需要 --allow-delete —— 否则每次部署都会被它们卡住，
    而一旦习惯了随手加 --allow-delete，真正的误删就没人挡了。
    非清单内的删除仍然必须显式授权。"""
    import json
    p = os.path.join(WEB, "src", "data", "articles.json")
    if not os.path.exists(p):
        return set()
    with open(p, encoding="utf-8") as f:
        data = json.load(f)
    return {x["url_path"].lstrip("/") for x in data if x.get("blocked")}


def main():
    apply = "--apply" in sys.argv
    commit = "--commit" in sys.argv
    push = "--push" in sys.argv
    allow_delete = "--allow-delete" in sys.argv

    if not os.path.isdir(DIST):
        print("没有 web/dist，先构建： cd web && npm run build")
        return 1

    dist_files = walk_rel(DIST)
    cur_files = walk_rel(ROOT)

    changed = []
    skipped_same = 0
    for f in sorted(dist_files):
        dp = os.path.join(DIST, f)
        cp = os.path.join(ROOT, f)
        if os.path.exists(cp) and file_hash(dp) == file_hash(cp):
            skipped_same += 1
        else:
            changed.append(f)

    # 现有根目录里、非保护、且产物中没有的 → 待删除（保护清单先挡一道）
    blocked_paths = load_blocked_paths()
    all_delete = sorted(
        f for f in cur_files
        if f.split("/")[0] not in KEEP_DIRS
        and not keep(f.split("/")[0])
        and not protected(f)
        and f not in dist_files
    )
    # 主动下架（写在 BLOCKED 里）与意外缺失分开对待
    to_delete_planned = [f for f in all_delete if f in blocked_paths]
    to_delete = [f for f in all_delete if f not in blocked_paths]
    # 被保护清单救下来的
    saved = sorted(
        f for f in cur_files
        if f.split("/")[0] not in KEEP_DIRS
        and not keep(f.split("/")[0])
        and protected(f)
        and f not in dist_files
    )

    print(f"产物 {len(dist_files)} 个：内容有变化 {len(changed)}，与线上完全一致 {skipped_same}")
    if saved:
        print(f"保护清单挡下 {len(saved)} 个旧文件不删（示例: {', '.join(saved[:3])}）")
    if to_delete_planned:
        print(f"计划内下架 {len(to_delete_planned)} 个（BLOCKED 清单，自动删除）")
        for f in to_delete_planned[:15]:
            print("  ×", f)
    print(f"待删除旧文件 {len(to_delete)} 个（意外缺失，需 --allow-delete）")
    for f in to_delete[:15]:
        print("  -", f)
    if len(to_delete) > 15:
        print(f"  … 其余 {len(to_delete) - 15} 个")

    empty_dirs = []
    for d in sorted({f.split("/")[0] for f in cur_files}):
        full = os.path.join(ROOT, d)
        if d in KEEP_DIRS or keep(d) or not os.path.isdir(full):
            continue
        if not any(x.startswith(d + "/") for x in dist_files) and not any(
            x.startswith(d + "/") for x in saved
        ):
            empty_dirs.append(d)
    if empty_dirs:
        print("将整体移除的旧目录:", ", ".join(empty_dirs))

    if not apply:
        print("\n[dry-run] 未做任何改动。确认无误后加 --apply")
        return 0
    if to_delete and not allow_delete:
        print(f"\n拒绝执行：有 {len(to_delete)} 个文件会被删除。"
              "确认要删再加 --allow-delete（或把路径写进 tools/deploy-keep.txt）")
        return 2

    for f in to_delete_planned + to_delete:
        p = os.path.join(ROOT, f)
        if os.path.exists(p):
            os.remove(p)
    if to_delete_planned:
        print(f"已删除计划内下架 {len(to_delete_planned)} 个文件")
    for d in empty_dirs:
        shutil.rmtree(os.path.join(ROOT, d), ignore_errors=True)

    for f in changed:
        src = os.path.join(DIST, f)
        dst = os.path.join(ROOT, f)
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        shutil.copy2(src, dst)
    print(f"已同步 {len(changed)} 个有变化的文件到仓库根目录")

    if commit:
        run(["git", "add", "-A"])
        run(["git", "commit", "-m", "build: Astro 产物更新 %s" % __import__("datetime").date.today()])
    if push:
        run(["git", "push", "origin", "HEAD"])
        print("已推送。线上生效时间取决于托管方（EdgeOne/CF 通常 1-2 分钟）")

    return 0


if __name__ == "__main__":
    sys.exit(main())
