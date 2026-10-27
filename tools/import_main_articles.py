#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""从主站 articles.json 提取 city=锦州 的文章，生成锦州站 news 数据。

用法：
    python tools/import_main_articles.py \
        --src ../qy-main/web/src/data/articles.json \
        --out web/src/data/news.js \
        --report .docs/导入质检报告.md

清洗规则（2026-10-22 与左总确认「复制回来、路径相同」的执行口径）：
1. slug / URL 路径与主站完全一致（/news/industry/<slug>.html）
2. 删正文 <img> 标签：主站文章配图全部是 img.0427qy.com 的同一张 og.png 占位图，
   alt 为关键词堆砌——搬过来只会给新站叠加站群特征，属于负资产
3. 删正文里的站群模板头（【服务热线：...】本页关键词：...）
4. 无日期字段（主站就没有），模板侧去掉日期展示
5. 同时输出虚构案例/无来源表述扫描报告，供人工复核——不自动删正文
"""
import argparse
import json
import re
from pathlib import Path

IMG_RE = re.compile(r'<img\b[^>]*>', re.I)
TEL_HEAD_RE = re.compile(r'【服务热线：[^】]*】\s*')
KEYWORD_HEAD_RE = re.compile(r'本页关键词：[^。<]{0,200}。')
BR_CLEAN_RE = re.compile(r'(<br\s*/?>\s*){2,}', re.I)
TAIL_TEL_RE = re.compile(r'千羽网络服务热线：\s*\d+')
TAIL_SRC_RE = re.compile(r'转载注明来源：https?://\S+')

RISK_PATTERNS = [
    ('虚构客户案例', re.compile(r'某[一我]?\s*[家公司品牌企业厂商户连锁店超市酒店餐厅工厂]')),
    ('虚构业绩数字', re.compile(r'(增长|提升|提高|翻|降至|缩短)(了|至|到|为)?\s*\d+\s*[%％]')),
    ('转化率表述', re.compile(r'转化率')),
    ('无来源调研', re.compile(r'(最新的?市场调研显示|据调研|调查显示)')),
    ('自称领先', re.compile(r'(佼佼者|领航者|龙头|领先的|一流的|顶尖的)')),
    ('无来源统计', re.compile(r'据统计')),
    ('千羽被写成服务方', re.compile(r'千羽[^。]{0,30}(服务过|助力|帮助|为)[^。]{0,20}(某|该)[^。]{0,15}(厂|公司|企业|店|品牌)')),
    ('虚构人物引语', re.compile(r'(技术总监|项目经理|工程师|顾问|专家|负责人)[^，。]{0,6}(指出|表示|介绍|认为|说)')),
]

# 硬线：命中即删句（编造千羽客户业绩 / 虚构具名人物）——左总既定边界「不编造案例与数据」
HARD_DELETE = [
    ('虚构案例+业绩数字', re.compile(r'某[一我]?\s*[家公司品牌企业厂商户连锁店超市酒店餐厅工厂][^。！？]{0,80}\d+\s*[%％]')),
    ('千羽被写成服务方', re.compile(r'千羽[^。]{0,30}(服务过|助力|帮助|为)[^。]{0,20}(某|该)[^。]{0,15}(厂|公司|企业|店|品牌)')),
    ('虚构人物引语', re.compile(r'(技术总监|项目经理|工程师|顾问|专家|负责人)[^，。]{0,6}(指出|表示|介绍|认为|说)')),
]

SENT_SPLIT = re.compile(r'(?<=[。！？；])')


def clean_body(html: str):
    """返回 (清洗后 HTML, 删除日志 list[(规则, 句子)])"""
    html = IMG_RE.sub('', html)
    html = TEL_HEAD_RE.sub('', html)
    html = KEYWORD_HEAD_RE.sub('', html)
    html = TAIL_TEL_RE.sub('', html)
    html = TAIL_SRC_RE.sub('', html)
    removed = []
    # 按 <p>/<br /> 分块，块内按中文句读切句，硬线命中的句子整句删除
    blocks = re.split(r'(<br\s*/?>)', html, flags=re.I)
    out_blocks = []
    for blk in blocks:
        if re.fullmatch(r'<br\s*/?>', blk, flags=re.I):
            out_blocks.append(blk)
            continue
        sents = SENT_SPLIT.split(blk)
        kept = []
        for s in sents:
            if not s.strip():
                kept.append(s)
                continue
            hit = next((name for name, pat in HARD_DELETE if pat.search(s)), None)
            if hit:
                removed.append((hit, re.sub(r'<[^>]+>', '', s).strip()[:80]))
            else:
                kept.append(s)
        out_blocks.append(''.join(kept))
    html = ''.join(out_blocks)
    html = BR_CLEAN_RE.sub('<br />', html)
    # 清掉删空后的空段
    html = re.sub(r'<p>\s*</p>', '', html)
    return html.strip(), removed


def scan_risks(text: str):
    plain = re.sub(r'<[^>]+>', '', text)
    hits = []
    for name, pat in RISK_PATTERNS:
        for m in pat.finditer(plain):
            s = max(0, m.start() - 40)
            hits.append((name, plain[s:m.end() + 40].strip()))
    return hits


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--src', required=True)
    ap.add_argument('--out', required=True)
    ap.add_argument('--report', required=True)
    args = ap.parse_args()

    data = json.loads(Path(args.src).read_text(encoding='utf-8'))
    arts = data if isinstance(data, list) else data.get('articles', data.get('list', []))

    # ⚠️ 2026-10-27 修：必须过滤 blocked。
    # 原实现只有 city 过滤，导致主站每封禁一篇，子站就把它照发出去（seo_check 的 T4
    # "子站正在发布主站已封稿" 就是这条漏的）。当晚 23:49–23:51 三分钟内发生了两次
    # "主站封稿 → 人工去子站删数据" 的手工同步，说明这不是理论风险而是持续复发。
    # 过滤必须放在导入这一步：子站 news.js 的条目字段里没有 blocked，
    # 输出后再筛是筛不出来的（字段在这一步就丢了）。
    jz_all = [a for a in arts if a.get('city') == '锦州']
    jz = [a for a in jz_all if not a.get('blocked')]
    excluded_blocked = [a for a in jz_all if a.get('blocked')]
    if not jz:
        raise SystemExit('未找到 city=锦州 的文章')

    # 断言：产物里不允许出现任何主站已封禁的 slug（防以后有人改动这段逻辑）
    blocked_slugs = {a.get('slug') for a in arts if a.get('blocked')}
    leaked = {a.get('slug') for a in jz} & blocked_slugs
    if leaked:
        raise SystemExit(f'✗ 导入结果里出现主站已封禁文章，拒绝写出：{sorted(leaked)}')

    entries = []
    risk_lines = []
    deleted_count = 0
    for a in jz:
        url = a.get('url_path', '')
        m = re.search(r'/([^/]+)\.html$', url)
        if not m:
            continue
        slug = m.group(1)
        title = (a.get('title') or a.get('h1') or '').strip()
        summary = (a.get('summary') or '').strip()
        body, removed = clean_body(a.get('body_html') or '')
        deleted_count += len(removed)
        keywords = [k.strip() for k in (a.get('keywords') or '').split(',') if k.strip()]
        plain_len = len(re.sub(r'<[^>]+>', '', body))
        entries.append({
            'slug': slug,
            'title': title,
            'summary': summary,
            'keywords': keywords,
            'bodyHtml': body,
            'wordCount': plain_len,
        })
        hits = scan_risks(a.get('body_html') or '')
        if removed or hits:
            risk_lines.append(f"### {title}\n- 路径：`{url}`")
            if removed:
                risk_lines.append(f"- **已删句 {len(removed)} 处**（硬线：编造千羽客户业绩/虚构人物）：")
                for name, ctx in removed:
                    risk_lines.append(f"  - [{name}] 「{ctx}」")
            if hits:
                risk_lines.append('- 保留但需左总知悉（软线）：')
                for name, ctx in hits[:4]:
                    risk_lines.append(f"  - [{name}] …{ctx}…")
            risk_lines.append('')

    # 输出 news.js（JS 字符串用 JSON 序列化防转义问题）
    parts = [
        '// 锦州站资讯数据：从主站 articles.json 导入（city=锦州，2026-10-22）。',
        '// 路径与主站保持一致：/news/industry/<slug>.html。',
        '// 已清洗：删占位图（关键词堆砌 alt）、删站群模板头。',
        '// ⚠️ 导入质检报告见 .docs/导入质检报告.md，含虚构案例扫描结果。',
        'export const ARTICLES = [',
    ]
    for e in entries:
        parts.append('  ' + json.dumps(e, ensure_ascii=False) + ',')
    parts.append('];')
    Path(args.out).write_text('\n'.join(parts), encoding='utf-8')

    total_hit = sum(1 for l in risk_lines if l.startswith('### '))
    report = [
        '# 锦州站文章导入质检报告（2026-10-22）',
        '',
        f'- 导入篇数：**{len(entries)}**（主站 city=锦州 且 **未封禁**）',
        f'- 已排除主站封禁稿：**{len(excluded_blocked)}** 篇（不生成页面）',
        f'- 路径：与主站一致 `/news/industry/<slug>.html`',
        f'- 清洗：删 `<img>` 占位图（alt 关键词堆砌）、删「【服务热线】本页关键词」模板头、删文末「服务热线/转载注明来源」站群尾巴',
        f'- **硬线删句：共 {deleted_count} 处**（编造千羽客户业绩、虚构具名人物——左总既定边界「不编造案例与数据」）',
        f'- 涉及篇章：**{total_hit}** 篇（下面是逐篇处置记录）',
        '',
        '> 分级口径：',
        '> - **硬线（已删句）**：虚构「千羽服务过的某客户 + 业绩数字」、虚构具名人物引语。这些挂在官网上',
        '>   就是千羽在发布虚构信息，触及左总自己定的边界，不删不能上线。',
        '> - **软线（保留 + 在此标注）**：「据统计/数据显示」类无来源行业口径、「转化率」等行业通用词。',
        '>   不指向具体编造，删除会拆散文章结构；是否进一步处理由左总定。',
        '',
    ]
    Path(args.report).write_text('\n'.join(report + risk_lines), encoding='utf-8')

    print(f'导入 {len(entries)} 篇 → {args.out}')
    print(f'已排除主站封禁稿 {len(excluded_blocked)} 篇')
    if excluded_blocked:
        for a in excluded_blocked:
            print(f'  - 跳过（blocked）{a.get("slug")}  {(a.get("title") or "")[:30]}')
    print(f'质检报告 → {args.report}')
    print(f'硬线删句 {deleted_count} 处；涉及篇章 {total_hit} 篇')


if __name__ == '__main__':
    main()
