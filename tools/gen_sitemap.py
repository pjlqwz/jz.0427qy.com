#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
重新生成 sitemap.xml（站2 上线前必须：旧版 1114 条含 13 条已下架 URL）。

v2 变更（2026-10-19，内容层 SEO 优化）：
  - 收录口径从「articles.json 排除 blocked」改为「从 web/dist 构建产物反推」：
    产物 head 带 `<meta name="robots" content="noindex,follow">` 的页面不进 sitemap。
    单一真源 = 构建产物，与 web/src/pages/news/industry/[...slug].astro 的
    indexable() 分层（.docs/keyword-plan-0427qy-2026-10-18.md 7.2 节）天然对齐，
    不再出现「页面 noindex 但 sitemap 仍提交」的矛盾信号。
  - 依赖 astro build 先跑完（deploy.py 本来就要求 dist 存在）。

规则:
  - 可索引 URL：dist 全部 .html 中 head 无 noindex 的页面
  - lastmod：新闻页继承原 sitemap 的值（不假装更新，避免搜索引擎无谓重抓）；
              原 sitemap 中没有的页（静态页/新增页）用生成日期
  - 原文件先备份到 tools/backup/sitemap-YYYYMMDD.xml，不覆盖式丢失
    （2026-10-21 修正：备份原先落在仓库根 = 网站根目录，公开可访问。
     sitemap 备份没有理由被搜索引擎/访客读到，挪出站点根）

用法:
    python tools/gen_sitemap.py            # 生成（备份原文件，需先 astro build）
    python tools/gen_sitemap.py --dry-run  # 只打印统计，不写文件
"""
import json
import os
import re
import shutil
import sys
from datetime import date

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, "web", "src", "data", "articles.json")
DIST = os.path.join(ROOT, "web", "dist")
SITEMAP = os.path.join(ROOT, "sitemap.xml")
# 备份放 tools/ 下，不放仓库根：根目录 = 网站根目录，放这儿等于把历史版本公开出去
BACKUP_DIR = os.path.join(ROOT, "tools", "backup")
TODAY = date.today().isoformat()

# 静态页优先级表（不在表内的 dist 页面默认 0.8）
PRIORITY = {
    "index.html": "1.0",
    "case/index.html": "0.9",
    "about/index.html": "0.9",
    "contect/index.html": "0.9",
    "prodect/index.html": "0.8",
    "prodect/wzjs.html": "0.7",
    "prodect/wztg.html": "0.7",
    "prodect/wzyw.html": "0.7",
    "prodect/wzcz.html": "0.9",
    "news/index.html": "0.8",
    "industry/index.html": "0.9",
}
NEWS_PREFIX = "news/"
HELP_PREFIX = "news/help/"


def parse_old_lastmod():
    """从原 sitemap.xml 解析 loc -> lastmod 映射"""
    mapping = {}
    if not os.path.exists(SITEMAP):
        return mapping
    with open(SITEMAP, encoding="utf-8") as f:
        content = f.read()
    for block in re.findall(r"<url>(.*?)</url>", content, re.S):
        loc = re.search(r"<loc>(.*?)</loc>", block)
        mod = re.search(r"<lastmod>(.*?)</lastmod>", block)
        if loc and mod:
            path = loc.group(1).strip().replace("https://yk.0427qy.com", "").lstrip("/")
            mapping[path] = mod.group(1).strip()
    return mapping


def head_of(html):
    m = re.search(r"<head[^>]*>(.*?)</head>", html, re.S)
    return m.group(1) if m else ""


def indexable_from_dist():
    """从构建产物反推可索引页面：rel path 列表（排除 head 带 noindex 的）。"""
    out, excluded = [], []
    for root, _dirs, files in os.walk(DIST):
        for f in sorted(files):
            if not f.endswith(".html"):
                continue
            full = os.path.join(root, f)
            rel = os.path.relpath(full, DIST).replace(os.sep, "/")
            with open(full, encoding="utf-8", errors="ignore") as fh:
                head = head_of(fh.read())
            if re.search(r'<meta name="robots" content="[^"]*noindex', head):
                excluded.append(rel)
            else:
                out.append(rel)
    return out, excluded


def main():
    dry = "--dry-run" in sys.argv
    if not os.path.isdir(DIST):
        print("没有 web/dist，先构建： cd web && node node_modules/astro/astro.js build")
        return 1

    # 营口站不继承站2 的 articles.json：那 1453 篇是站群历史文章，营口那 61 篇经抽检
    # 含虚构人物与虚构客户案例数据，不进城市站。本站资讯内容在 web/src/data/news.js。
    blocked = 0

    paths, noindex_paths = indexable_from_dist()
    # 404 页不是内容，不进 sitemap
    paths = [p for p in paths if p != "404.html"]
    news = [p for p in paths if p.startswith(NEWS_PREFIX)]
    help_ = [p for p in paths if p.startswith(HELP_PREFIX)]
    static = [p for p in paths if p not in news and p not in help_]

    old_mod = parse_old_lastmod()
    entries = []  # (path, lastmod, changefreq, priority)
    for path in static:
        entries.append((path, TODAY, "weekly", PRIORITY.get(path, "0.8")))
    for path in news + help_:
        entries.append((path, old_mod.get(path, TODAY), "daily", "0.6"))

    print(f"dist 可索引页面: {len(paths)}（noindex 排除 {len(noindex_paths)} 个）")
    print(f"  静态页 {len(static)} | 行业文章/分页 {len(news)} | 产品帮助 {len(help_)}")
    print(f"合计: {len(entries)} 条")
    inherited = sum(1 for p, *_ in entries if p in old_mod)
    print(f"继承原 lastmod: {inherited} 条；新页用今天({TODAY}): {len(entries) - inherited} 条")

    if dry:
        print("dry-run，不写文件")
        return 0

    if os.path.exists(SITEMAP):
        os.makedirs(BACKUP_DIR, exist_ok=True)
        bak = os.path.join(BACKUP_DIR, f"sitemap-{TODAY.replace('-', '')}.xml")
        shutil.copy2(SITEMAP, bak)
        print(f"原文件已备份: tools/backup/{os.path.basename(bak)}")

    lines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
        'xmlns:mobile="http://www.baidu.com/schemas/sitemap-mobile/1/">',
    ]
    for path, mod, freq, prio in entries:
        loc = f"https://yk.0427qy.com/{path}"
        # 目录式 URL（index.html）输出 /xxx/ 形态，与线上一致
        loc = loc.replace("/index.html", "/")
        lines.append("<url>")
        lines.append(f"<loc>{loc}</loc>")
        lines.append('<mobile:mobile type="pc,mobile"/>')
        lines.append(f"<lastmod>{mod}</lastmod>")
        lines.append(f"<changefreq>{freq}</changefreq>")
        lines.append(f"<priority>{prio}</priority>")
        lines.append("</url>")
    lines.append("</urlset>")

    with open(SITEMAP, "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")
    print(f"已生成: sitemap.xml（{os.path.getsize(SITEMAP)} B）")
    return 0


if __name__ == "__main__":
    sys.exit(main())
