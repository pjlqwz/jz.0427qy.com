import { defineConfig } from 'astro/config';

// preserve: 与帝国CMS的目录结构一一对齐
//   src/pages/news/industry/[slug].astro -> dist/news/industry/<slug>.html
//   src/pages/news/index.astro           -> dist/news/index.html
// trailingSlash: 'ignore' 避免生成 /xxx/ 形态造成双份
export default defineConfig({
  site: 'https://yk.0427qy.com',
  build: { format: 'preserve' },
  trailingSlash: 'ignore',
  server: { port: 4321 },
  devToolbar: { enabled: false },
});
