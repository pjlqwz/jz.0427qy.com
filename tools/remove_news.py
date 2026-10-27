# -*- coding: utf-8 -*-
"""从锦州站 news.js 移除指定 slug 的文章（按行删除，保持文件结构不变）。

用法：
  python tools/remove_news.py --slug a,b,c          # dry-run
  python tools/remove_news.py --slug a,b,c --apply
"""
import re
import sys
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'web', 'src', 'data', 'news.js')


def main():
    argv = sys.argv[1:]
    slugs = []
    for i, a in enumerate(argv):
        if a == '--slug' and i + 1 < len(argv):
            slugs = [x.strip() for x in argv[i + 1].split(',') if x.strip()]
    if not slugs:
        print('缺少 --slug')
        return
    apply = '--apply' in argv

    with open(SRC, encoding='utf-8') as f:
        lines = f.readlines()

    out, removed, kept = [], [], []
    for ln in lines:
        m = re.search(r'\{"slug": "([^"]+)"', ln)
        if m and m.group(1) in slugs:
            removed.append(m.group(1))
        else:
            if m:
                kept.append(m.group(1))
            out.append(ln)

    print('移除 %d 条：%s' % (len(removed), removed))
    print('剩余文章：%d 条' % len(kept))
    notfound = [s for s in slugs if s not in removed]
    if notfound:
        print('⚠️ 未命中：', notfound)

    if not apply:
        print('\n[dry-run] 未写入。确认后加 --apply')
        return

    with open(SRC, 'w', encoding='utf-8', newline='\n') as f:
        f.writelines(out)
    print('\n已写回', SRC)


if __name__ == '__main__':
    main()
