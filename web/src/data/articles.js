// 全站文章合集：存量稿（主站导入）+ 本地原创稿（news-local.js）。
//
// 为什么单独一个文件：Astro 的 getStaticPaths 会被提升到独立模块执行，
// 读不到页面 frontmatter 里的模块级常量。合并逻辑必须放在双方都能 import
// 的地方，否则 build 报 "ALL_ARTICLES is not defined"。
//
// 排序与去重口径：
//   - 本地原创稿在前：内容日期更新，列表页与详情页「继续看」优先露出；
//   - 按 slug 去重：万一两边出现同一 slug，保留先出现的（本地稿），不生成重复页面。
import { ARTICLES } from './news.js';
import { LOCAL_ARTICLES } from './news-local.js';

export const ALL_ARTICLES = [...LOCAL_ARTICLES, ...ARTICLES].filter(
  (entry, i, arr) => arr.findIndex((x) => x.slug === entry.slug) === i
);
