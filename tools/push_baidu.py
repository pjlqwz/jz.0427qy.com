#!/usr/bin/env python3
"""营口站百度主动推送（普通收录 API 推送）。

用法：
    python tools/push_baidu.py                 # 推送 .docs/push-pending.txt 全部待推 URL
    python tools/push_baidu.py --limit 9       # 只推前 N 条（配额有限时用）
    python tools/push_baidu.py --token <tok>   # token 也可用环境变量 BAIDU_PUSH_TOKEN

行为：
    - POST 到 http://data.zz.baidu.com/urls?site=...&token=...（不带 type，
      百度已废弃 type=daily/realtime 参数；实测 remain 配额每天刷新）
    - 推送成功的 URL 从 .docs/push-pending.txt 移除，追加到 .docs/push-done.txt
    - 接口限流时（505 please retry later）自动退避重试，最多 3 次
"""
import argparse
import json
import sys
import time
import urllib.request
from pathlib import Path

SITE = "yk.0427qy.com"
API = "http://data.zz.baidu.com/urls"
ROOT = Path(__file__).resolve().parent.parent
PENDING = ROOT / ".docs" / "push-pending.txt"
DONE = ROOT / ".docs" / "push-done.txt"


def read_urls(path: Path) -> list[str]:
    if not path.exists():
        return []
    return [l.strip() for l in path.read_text(encoding="utf-8").splitlines() if l.strip()]


def push(urls: list[str], token: str, retries: int = 3) -> dict:
    body = "\n".join(urls).encode("utf-8")
    url = f"{API}?site={SITE}&token={token}"
    req = urllib.request.Request(url, data=body, method="POST")
    req.add_header("Content-Type", "text/plain")
    for attempt in range(retries):
        try:
            with urllib.request.urlopen(req, timeout=60) as resp:
                return json.loads(resp.read().decode("utf-8"))
        except Exception as e:
            detail = ""
            if hasattr(e, "read"):
                detail = e.read().decode("utf-8", "ignore")
            # 505 = 限流，退避重试；其他错误直接抛出
            if '"error":505' in detail or "retry later" in detail:
                wait = 45 * (attempt + 1)
                print(f"  接口限流（505），{wait} 秒后重试 {attempt + 1}/{retries}")
                time.sleep(wait)
                continue
            raise RuntimeError(f"推送失败：{e} {detail}")
    raise RuntimeError("多次退避后仍被限流，请稍后再跑")


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--token", default=None, help="百度推送 token（也可用环境变量 BAIDU_PUSH_TOKEN）")
    ap.add_argument("--limit", type=int, default=0, help="只推送前 N 条（0 = 全部）")
    args = ap.parse_args()

    token = args.token or __import__("os").environ.get("BAIDU_PUSH_TOKEN")
    if not token:
        print("错误：未提供 token。用 --token 或环境变量 BAIDU_PUSH_TOKEN", file=sys.stderr)
        return 2

    pending = read_urls(PENDING)
    if not pending:
        print("待推清单为空，没有需要推送的 URL")
        return 0

    batch = pending[: args.limit] if args.limit > 0 else pending
    print(f"推送 {len(batch)} 条到 {SITE} ...")
    result = push(batch, token)
    print(f"返回：{json.dumps(result, ensure_ascii=False)}")

    if "error" in result:
        print(f"接口报错 error={result['error']}：{result.get('message')}", file=sys.stderr)
        return 1

    ok = result.get("success", 0)
    if ok <= 0:
        print("没有推送成功的 URL（可能配额已用完或全部 not_valid）")
        return 1

    # 百度成功数按推送顺序对齐；保守做法：把整个批次视为已推（not_valid/not_same_site 极少见，
    # 真出现了看返回里的明细再手动把有效 URL 放回 pending）
    done = read_urls(DONE)
    with DONE.open("a", encoding="utf-8") as f:
        for u in batch:
            f.write(u + "\n")
    PENDING.write_text("\n".join(pending[len(batch):]) + "\n", encoding="utf-8")
    print(f"已记录 {len(batch)} 条到 .docs/push-done.txt；剩余待推 {len(pending) - len(batch)} 条")
    print(f"今日剩余配额 remain={result.get('remain')}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
