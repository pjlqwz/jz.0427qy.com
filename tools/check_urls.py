#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
URL 零差异校验：对比"仓库里现有的静态页"与"Astro 构建产物"，逐条列出差异。

用法:
    python tools/check_urls.py                # 只看 news/ 目录
    python tools/check_urls.py --all          # 全站
    python tools/check_urls.py --dir news/help

判定: 退出码 0 = 无缺失；1 = 有缺失 URL（会导致线上 404）
"""
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIST = os.path.join(ROOT, "web", "dist")
DATA = os.path.join(ROOT, "web", "src", "data", "articles.json")
SKIP_TOP = {".git", "web", "tools", "node_modules", ".workbuddy"}

# 帝国CMS 系统目录自动索引页（d/ html/ dl/ search/ skin/ 等）与旧版 HTML 地图页：
# 不是内容页，tools/deploy-keep.txt 已保护不会被部署删除，不参与比对
SKIP_PREFIXES = ("d/", "html/", "dl/", "search/", "skin/", "sitemap.html")


def blocked_paths():
    """已下架的文章：故意不生成页面，不算缺失。清单见 tools/extract.py 的 BLOCKED。"""
    if not os.path.exists(DATA):
        return set()
    with open(DATA, encoding="utf-8") as f:
        items = json.load(f)
    return {i["url_path"].lstrip("/") for i in items if i.get("blocked")}


def collect(base, sub=None, skip_top=True):
    out = set()
    if not os.path.isdir(base):
        return out
    for dirpath, dirnames, files in os.walk(base):
        rel_dir = os.path.relpath(dirpath, base).replace(os.sep, "/")
        if skip_top and rel_dir == ".":
            dirnames[:] = [d for d in dirnames if d not in SKIP_TOP]
        for f in files:
            if not f.endswith(".html"):
                continue
            p = os.path.join(dirpath, f).replace(os.sep, "/")
            rel = os.path.relpath(p, base).replace(os.sep, "/")
            if sub and not rel.startswith(sub):
                continue
            out.add(rel)
    return out


def main():
    sub = None
    if "--all" not in sys.argv:
        sub = "news/"
    for i, a in enumerate(sys.argv):
        if a == "--dir" and i + 1 < len(sys.argv):
            sub = sys.argv[i + 1]

    src = collect(ROOT, sub)
    dist = collect(DIST, sub, skip_top=False)

    gone = blocked_paths()
    src_effective = src - gone
    removed = sorted(src & gone)

    # 过滤系统目录索引页（两侧都过滤，保持口径一致）
    src_effective = {p for p in src_effective if not p.startswith(SKIP_PREFIXES)}
    dist = {p for p in dist if not p.startswith(SKIP_PREFIXES)}

    missing = sorted(src_effective - dist)
    extra = sorted(dist - src)

    print(f"原站页面: {len(src)}   构建产物: {len(dist)}   目录: {sub or '(全站)'}")
    if removed:
        print(f"已下架(故意不生成，不算缺失): {len(removed)}")
        for m in removed[:20]:
            print("  x", m)
    print(f"缺失(会 404): {len(missing)}")
    for m in missing[:20]:
        print("  -", m)
    print(f"多出(原站没有): {len(extra)}")
    for m in extra[:20]:
        print("  +", m)

    if missing:
        print("\n结论: 不通过，先补路由再上线")
        return 1
    print("\n结论: 通过，URL 一一对应")
    return 0


if __name__ == "__main__":
    sys.exit(main())
