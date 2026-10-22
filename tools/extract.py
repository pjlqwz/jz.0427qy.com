#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
从 www.0427qy.com 仓库里的静态 HTML 抽取文章内容 -> web/src/data/articles.json
以及一份内容体检报告 web/src/data/inventory.json

用法:
    python tools/extract.py            # 只生成，不写库
    python tools/extract.py --stats    # 只在终端看统计

设计原则:
1. 只读仓库里的静态页，不联网。离线、可重复、幂等。
2. 完全保留原 URL 路径（url_path 字段），供 Astro preserve 模式一一映射。
3. 正文只做最小清洗: mip-img -> img、去掉城市站内链、保留段落与图片。
"""
import json
import os
import re
import sys
from html import unescape

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(ROOT, "web", "src", "data")

# 辽宁及周边可识别的城市/区县，用于给每篇文章打"目标城市"标签
CITY_CN = ["葫芦岛", "阜新", "鞍山", "沈阳", "锦州", "营口", "本溪", "大连", "辽阳", "抚顺",
           "铁岭", "丹东", "盘锦", "盘山", "大洼", "双台子", "兴隆台", "朝阳", "海城", "瓦房店",
           "庄河", "新民", "盖州", "东港", "凤城", "凌海", "北镇", "黑山", "义县", "开原",
           "调兵山", "灯塔", "绥中", "建昌", "建平", "喀左", "凌源", "兴城", "台安", "岫岩",
           "清原", "新宾", "桓仁", "宽甸", "大石桥", "彰武", "康平", "法库"]
CITY_EN = {"Anshan": "鞍山", "Benxi": "本溪", "Chaoyang": "朝阳", "Dalian": "大连",
           "Dandong": "丹东", "Fushun": "抚顺", "Fuxin": "阜新", "Huludao": "葫芦岛",
           "Jinzhou": "锦州", "Liaoyang": "辽阳", "Panjin": "盘锦", "Shenyang": "沈阳",
           "Tieling": "铁岭", "Yingkou": "营口"}

# ══════════════════════════════════════════════════════════════════════════
# 下架清单（左总 2026-10-18 确认"合作并不存在，删了吧"）
# 这 13 篇是虚构的"特稿 / 专访 / 现场直击"：编造了具体企业合作、具体人名发言、
# 具体经营数据。已逐篇看过正文确认，不是关键词误判。
# 处置：不生成页面（URL 变 404），不进列表、不进 sitemap、不进导航。
# 依据：《反不正当竞争法》第八条（虚假商业宣传）+ 民法典姓名权/名誉权。
# 恢复条件：除非能拿出真实合作凭证，否则不得恢复。
# ══════════════════════════════════════════════════════════════════════════
BLOCKED = {
    # — 编造与具体企业/机构的合作 —
    "17472294692544": "编造与锦州百货大楼合作，虚构总经理王建国发言",
    "PanJin-WebProdCo-4731": "编造与盘锦民生信息科技合作，虚构李经理采访",
    "Panjin-WebOpt-Collab-5382": "编造与盘锦石化集团合作，虚构信息技术部负责人李明采访",
    "ca4d0fe9c5faada5f6cc78499321fdc0": "编造与辽滨经开区合作，虚构李主任发言与 4021 路传感器数据",
    "Panjin-Egov-Platform-4398": "编造与辽东湾政务服务中心合作，虚构李主任/张工发言及满意度 68% 等数据",
    "Panjin-MiniApp-SEO-5821": "编造与光合水产合作，虚构项目负责人李明浩发言",
    # — 编造人物与经营数据 —
    "Panjin-Website-MiniProgram-7249": "虚构海产品店主，编造复购率提升 90%、损耗率 12%→4%",
    "Panjin-NetworkCompany-SEO-0711": "虚构 SEO 专员赵志强、林涛人物故事与点击率 270% 数据",
    "Panjin-Miniapp-Optimization-4296": "虚构王记包子王建国、水产商户张丽华，编造跳出率 62%→19%",
    "Panjin-Mini-Program-Development-2396": "虚构深夜开发场景，点名他企「盛悦网络 2403 办公室」",
    "17813348022703": "虚构本溪创业者故事",
    "1d2a55e23eccd9772d2ca9c76f4b0b59": "虚构岫岩县洋河村菇农王桂兰向记者展示订单",
    "e7e17aa5f8334d6ea6f56847173fdd51": "虚构技术负责人李斌与分子结构 3D 模型展示",
}

SITE_SUFFIX = re.compile(r"\s*-\s*千羽网络\|.*$|\s*-\s*盘锦千羽网络\|.*$", re.S)
TITLE_TAIL = re.compile(r"\s*[-_|]\s*千羽网络.*$", re.S)
PAGINATION = re.compile(r"^(?P<base>.+?)_(?P<page>\d+)\.html$")


def read(path):
    with open(path, encoding="utf-8", errors="ignore") as f:
        return f.read()


def strip_tags(s):
    s = re.sub(r"(?is)<(script|style).*?</\1>", " ", s)
    s = re.sub(r"(?s)<[^>]+>", "", s)
    return re.sub(r"\s+", " ", unescape(s)).strip()


def find_block(html, start_marker):
    """返回 start_marker 所在 div 的完整内层 HTML（按 div 深度配平）"""
    i = html.find(start_marker)
    if i < 0:
        return ""
    j = html.find(">", i) + 1
    depth = 1
    pos = j
    for m in re.finditer(r"<(/?)div\b[^>]*>", html[j:], re.I):
        if m.group(1) == "/":
            depth -= 1
            if depth == 0:
                return html[j:j + m.start()]
        else:
            depth += 1
        pos = j + m.end()
    return html[j:pos]


def clean_body(raw):
    s = raw
    # mip-img -> img（保留 src/alt）
    def mip2img(m):
        tag = m.group(0)
        src = re.search(r'src="([^"]+)"', tag)
        alt = re.search(r'alt="([^"]*)"', tag)
        if not src:
            return ""
        url = src.group(1)
        if url.startswith("//"):
            url = "https:" + url
        return '<img src="%s" alt="%s" loading="lazy">' % (url, unescape(alt.group(1)) if alt else "")
    s = re.sub(r"(?is)<mip-img\b[^>]*>.*?</mip-img>|<mip-img\b[^>]*/?>", mip2img, s)
    # 去掉城市站内链（jjz./城市子域 的锚文本保留）
    s = re.sub(r'(?is)<a\b[^>]*href="[^"]*(?:jjz\.|\.0427qy\.com)[^"]*"[^>]*>(.*?)</a>', r"\1", s)
    s = re.sub(r"(?is)<a\b[^>]*class=\"?infotextkey\"?[^>]*>(.*?)</a>", r"\1", s)
    # 去 script/style/注释/空标签
    s = re.sub(r"(?is)<(script|style|iframe).*?</\1>", "", s)
    s = re.sub(r"(?s)<!--.*?-->", "", s)
    s = re.sub(r"(?is)<(p|br|div)\b[^>]*>\s*</\1>", "", s)
    s = re.sub(r"\n{3,}", "\n\n", s)
    return s.strip()


def img_stats(html):
    srcs = re.findall(r'(?:src|data-original)="([^"]+)"', html)
    ext = 0
    loc = 0
    missing = []
    for u in srcs:
        if not re.search(r"\.(jpg|jpeg|png|gif|webp|svg)", u, re.I):
            continue
        if u.startswith("//") or u.startswith("http"):
            ext += 1
        else:
            loc += 1
            p = os.path.join(ROOT, u.lstrip("/"))
            if not os.path.exists(p):
                missing.append(u)
    return ext, loc, missing


def detect_city(title, filename):
    for c in CITY_CN:
        if c in title:
            return c
    low = filename.lower()
    for e, c in CITY_EN.items():
        if e.lower() in low:
            return c
    return ""


def parse_article(path, rel):
    html = read(path)
    fn0 = os.path.basename(rel)
    kind = "list" if fn0.startswith("index") else "article"
    t = re.search(r"(?is)<title>(.*?)</title>", html)
    title = unescape(t.group(1)).strip() if t else ""
    title = SITE_SUFFIX.sub("", title).strip()

    h1 = re.search(r'(?is)<h1[^>]*class="[^"]*sec-title[^"]*"[^>]*>(.*?)</h1>', html) \
        or re.search(r"(?is)<h1[^>]*>(.*?)</h1>", html)
    h1t = strip_tags(h1.group(1)) if h1 else title

    kw = re.search(r'(?is)<meta\s+name="keywords"\s+content="([^"]*)"', html)
    desc = re.search(r'(?is)<meta\s+name="description"\s+content="([^"]*)"', html)
    summary = re.search(r"(?is)<mark>(.*?)</mark>", html)

    body_raw = find_block(html, '<div class="about-desc"')
    if not body_raw:
        body_raw = find_block(html, '<div class="entry-content')
    body = clean_body(body_raw)
    text = strip_tags(body)

    fn = os.path.basename(rel)
    m = PAGINATION.match(fn)
    page = int(m.group("page")) if m else 1
    base = m.group("base") + ".html" if m else fn

    ext, loc, missing = img_stats(body_raw)

    return {
        "url_path": "/" + rel.replace(os.sep, "/"),
        "slug": fn[:-5],
        "dir": os.path.dirname(rel).replace(os.sep, "/"),
        "kind": kind,
        "title": title or h1t,
        "h1": h1t,
        "keywords": unescape(kw.group(1)) if kw else "",
        "description": unescape(desc.group(1)) if desc else "",
        "summary": strip_tags(summary.group(1)) if summary else "",
        "body_html": body,
        "word_count": len(text),
        "city": detect_city(title or h1t, fn),
        "page": page,
        "base_slug": base[:-5],
        "is_pagination": page > 1,
        "img_ext": ext,
        "img_local": loc,
        "img_missing": missing[:5],
        "fake_interview": ("记者" in text and "说" in text),
        "mentions_founder": "左春伟" in text,
        # 虚拟合作/采访类表述：不进可索引分级（见 docs/03 风险清单第 1 条）
        "risk_claim": ("记者" in text) or ("左春伟" in text and bool(re.search(r"携手|联手|签约|合作", text))),
        # 已下架（见文件头部 BLOCKED）：路由不生成，URL 404
        "blocked": fn[:-5] in BLOCKED,
        "blocked_reason": BLOCKED.get(fn[:-5], ""),
    }


def walk(subdir):
    out = []
    base = os.path.join(ROOT, subdir)
    for dirpath, _, files in os.walk(base):
        for f in files:
            if not f.endswith(".html"):
                continue
            full = os.path.join(dirpath, f)
            rel = os.path.relpath(full, ROOT)
            out.append((full, rel))
    return sorted(out)


def main():
    show_stats = "--stats" in sys.argv
    items = []
    for sub in ("news/industry", "news/help"):
        files = walk(sub)
        for full, rel in files:
            try:
                items.append(parse_article(full, rel))
            except Exception as e:  # 单篇失败不影响整体
                print("解析失败:", rel, e, file=sys.stderr)

    # 去重簇（城市名归一后比较正文）
    city_re = "(" + "|".join(CITY_CN) + ")"
    clusters = {}
    for it in items:
        norm = re.sub(city_re, "[C]", strip_tags(it["body_html"]))
        norm = re.sub(r"1[3-9]\d{9}", "", norm)
        it["_key"] = str(hash(norm))
        clusters.setdefault(it["_key"], []).append(it["url_path"])
    for it in items:
        it["dup_cluster_size"] = len(clusters[it["_key"]])
        it.pop("_key")

    stats = {
        "total_files": len(items),
        "articles": sum(1 for i in items if i["kind"] == "article"),
        "list_pages": sum(1 for i in items if i["kind"] == "list"),
        "unique_base_articles": len({i["base_slug"] for i in items}),
        "pagination_files": sum(1 for i in items if i["is_pagination"] and i["kind"] == "article"),
        "dup_clusters": sum(1 for v in clusters.values() if len(v) > 1),
        "dup_files": sum(len(v) for v in clusters.values() if len(v) > 1),
        "by_city": {},
        "empty_body": sum(1 for i in items if i["word_count"] < 200),
        "json_ld": 0,
        "fake_interview": sum(1 for i in items if i["fake_interview"]),
        "mentions_founder": sum(1 for i in items if i["mentions_founder"]),
        "blocked": sum(1 for i in items if i["blocked"]),
        "blocked_but_in_primary": sum(
            1 for i in items
            if i["blocked"] and i["city"] == "盘锦" and i["dup_cluster_size"] == 1 and i["word_count"] >= 300
        ),
        "img_ext": sum(i["img_ext"] for i in items),
        "img_local_missing": sum(1 for i in items if i["img_missing"]),
        "word_avg": int(sum(i["word_count"] for i in items) / max(1, len(items))),
    }
    for i in items:
        c = i["city"] or "(未标注)"
        stats["by_city"][c] = stats["by_city"].get(c, 0) + 1
    stats["panjin"] = stats["by_city"].get("盘锦", 0)
    stats["non_panjin"] = sum(v for k, v in stats["by_city"].items() if k not in ("盘锦", "(未标注)"))

    if show_stats:
        print(json.dumps({k: v for k, v in stats.items() if k != "by_city"},
                         ensure_ascii=False, indent=2))
        print("--- by_city ---")
        for k, v in sorted(stats["by_city"].items(), key=lambda x: -x[1]):
            print(f"{k}\t{v}")
        return 0

    os.makedirs(OUT_DIR, exist_ok=True)
    with open(os.path.join(OUT_DIR, "articles.json"), "w", encoding="utf-8") as f:
        json.dump(items, f, ensure_ascii=False, separators=(",", ":"))
    with open(os.path.join(OUT_DIR, "inventory.json"), "w", encoding="utf-8") as f:
        json.dump(stats, f, ensure_ascii=False, indent=2)
    size = os.path.getsize(os.path.join(OUT_DIR, "articles.json")) / 1024 / 1024
    print(f"已写出 {len(items)} 篇 -> web/src/data/articles.json ({size:.2f} MB)")
    print(json.dumps({k: v for k, v in stats.items() if k != "by_city"},
                     ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
