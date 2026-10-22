#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
站2 本地预览：优先 web/dist，产物里没有的路径回退到仓库根（旧页面/图片）。

为什么要有回退：
    站2 现在是「新闻页已由 Astro 生成 + about/prodect/contect 还是旧页」的过渡状态。
    只服务 dist 会看到一堆 404，看不出整体现状；回退到仓库根才能一次性看全。
    等 P3 栏目页重做完，回退层自动失效（dist 里有了就不再走仓库根）。

用法: python tools/preview.py [端口]     默认 4322
"""
import http.server
import json
import os
import socketserver
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIST = os.path.join(ROOT, "web", "dist")
DATA = os.path.join(ROOT, "web", "src", "data", "articles.json")
PORT = int(sys.argv[1]) if len(sys.argv) > 1 and sys.argv[1].isdigit() else 4322

# 这些目录只存在于仓库根、不进产物（图片、旧皮肤、帝国CMS 系统目录）
ROOT_ONLY = ("d", "dl", "html", "skin", "search", "_files")


def load_blocked():
    """主动下架的页面。仓库根还留着它们的旧文件，预览时必须强制 404，
    否则回退层会把这些页面"复活"，让人误以为下架没生效。"""
    if not os.path.exists(DATA):
        return set()
    with open(DATA, encoding="utf-8") as f:
        data = json.load(f)
    return {x["url_path"] for x in data if x.get("blocked")}


BLOCKED = load_blocked()


def resolve(clean):
    """先查 dist，再回退仓库根。返回实际文件路径或 None。"""
    if clean in BLOCKED:
        return None
    rel = clean.lstrip("/").replace("/", os.sep)
    for base in (DIST, ROOT):
        p = os.path.join(base, rel)
        if clean.endswith("/") or (os.path.isdir(p) and not os.path.splitext(p)[1]):
            p = os.path.join(p, "index.html")
        if os.path.isfile(p):
            return p
    return None


class Handler(http.server.SimpleHTTPRequestHandler):
    def translate_path(self, path):
        clean = path.split("?", 1)[0].split("#", 1)[0]
        p = resolve(clean)
        if p:
            return p
        # 都不存在：交给回退层，让 SimpleHTTPRequestHandler 出 404
        return os.path.join(ROOT, clean.lstrip("/").replace("/", os.sep))

    def send_head(self):
        clean = self.path.split("?", 1)[0].split("#", 1)[0]
        if clean != "/" and resolve(clean) is None:
            self.send_error(404, "Not Found")
            return None
        return super().send_head()

    def log_message(self, fmt, *args):
        pass


if __name__ == "__main__":
    if not os.path.isdir(DIST):
        print("没有 web/dist，先构建： cd web && npm run build")
        sys.exit(1)
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("127.0.0.1", PORT), Handler) as httpd:
        print(f"站2 预览: http://127.0.0.1:{PORT}/   (Ctrl+C 结束)")
        print(f"  dist: {DIST}")
        print(f"  回退: {ROOT}（about/prodect/contect 与图片等旧资源）")
        print(f"  强制 404: {len(BLOCKED)} 个已下架页面")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            pass
