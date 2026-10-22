// 成品站预览图的选择逻辑（构建期使用）
//
// 有 demo 站、截图已生成 → 用真实首屏截图（/images/demo/d<num>.webp，16:10），
//   live 由 BAD_DEMO 单独决定（能开交互 / 只给图）
// 没有截图 → 退回老站封面图（/images/tpl/t<id>.webp，4:3），不出「加载真实演示站」
//
// 2026-10-21 晚：原 294/295/305/314/329/366/368/373 这 8 个模板没有演示站，
// 曾手工裁出显示器屏幕区凑成 16:10，但客户点开仍看不到原站 —— 已整条从模板库删除，
// 不再靠裁图凑数。列表因此由 50 → 42，可看真站 36 个。
//
// 单独放一个模块是有原因的：Astro 的 getStaticPaths 在独立作用域里执行，
// 拿不到页面 `---` 顶层的 const，只有 import 进来的绑定才可见。
// 注意本文件是 .js（不是 .ts），不能写类型标注，否则 rollup 直接报 Expected ',' got ':'。
import fs from 'node:fs';
import path from 'node:path';

const pub = path.join(process.cwd(), 'public');

// 不可引用的演示站（2026-10-21 用真浏览器逐站 console 复查过，判据是「资源真的加载不出来」）
//
// 这 6 个站都把 jQuery / jquery-ui / banner 图**外链**到了 demoall.kuaituiyun.cn，
// 而那张证书的域名对不上 → Chrome 直接 ERR_CERT_COMMON_NAME_INVALID（不是慢，是必挂，换了网络也一样）：
//
//   1300  首屏 2 张 banner 破图 —— 客户第一眼就看到两个空框
//   3725  1 张产品图破图
//   5410  1 张图破图
//   8086  1 张图破图，且整站 25s 都打不开（最慢的一个）
//   6183  jquery-ui.min.js 加载失败 —— 弹层/轮播初始化不了，点了没反应
//   6850  jquery-1.11.3.js 加载失败 —— jQuery 没了，整站交互全死
//
// 判定口径：只算**首屏可见的图**和**决定交互的脚本**。
// layer.css 的 404 到处都有（15 个站），那是弹层插件样式、首屏看不见，
// 真按字面把所有「缺资源」的站都剔掉会一口气砍掉 15 个，属于过度反应。
//
// 复查方法（tabbit 真浏览器，单线程不并发，25s 超时；并发跑会自己制造一堆假失败）：
//   requestfailed 取 errorText + response 取 status≥400，按站点记 firstBroken / allBroken
const BAD_DEMO = new Set([1300, 3725, 5410, 6183, 6850, 8086]);

export function shotOf(x) {
  // 三件事分开判（2026-10-21）：
  //   1) 有没有截图 —— 决定列表卡片用什么图（视觉统一靠这个）
  //   2) 能不能开交互 —— 决定要不要出「可看真站」角标与 iframe
  //   3) 列表用缩略图、详情用大图 —— 卡片只显示 ~260px 宽，喂 1440 宽的图等于多下 3.4 倍字节、
  //      多解 21 倍像素。thumb 由 .docs/shop-kefu/make_thumb.py 生成（520×325 q75，约 13KB）。
  // 原来 1) 和 2) 合成一个判断，导致 BAD_DEMO 的 6 个虽然截图好好的，也被退回设备样机封面，
  // 列表页于是出现「满铺网页」和「白边样机图」两种视觉。实测这 6 张截图本身完整可看，
  // 坏的只是站内的 jQuery / 外链图（点开才会遇到），所以：图用截图，交互不给。
  if (x.demo) {
    const rel = `/images/demo/d${x.demo}.webp`;
    if (fs.existsSync(path.join(pub, rel))) {
      const thumbRel = `/images/thumb/d${x.demo}.webp`;
      return {
        src: rel,
        thumb: fs.existsSync(path.join(pub, thumbRel)) ? thumbRel : rel,
        live: !BAD_DEMO.has(Number(x.demo)),
      };
    }
  }
  // 回退到老站封面图（设备样机图，4:3）——只应出现在「有封面但还没截到真站」的新条目上，
  // 属过渡态，成批加条目时要先补截图再上线，否则列表页会混进白边样机图。
  return { src: x.pic, thumb: x.pic, live: false };
}
