文件结构：


diguo/
├── sitemap.php          # 入口路由文件
└── z/
    ├── common.php       # 公共初始化（数据库连接、登录验证）
    ├── diag.php         # 诊断功能
    ├── post.php         # 简化发布功能
    ├── friendlink.php   # 友情链接管理（增删改查）
    └── sitemap_xml.php  # Sitemap XML生成


路由方式：

● 直接访问 `sitemap.php` → 返回XML格式的站点地图
● `?action=diag` → 诊断功能（验证登录和数据库）
● `?action=post` → 简化发布功能
● `?action=get_friend_links` → 查询友情链接
● `?action=add_friend_link` → 新增友情链接
● `?action=update_friend_link` → 更新友情链接
● `?action=delete_friend_link` → 删除友情链接
● `?action=sync_friend_links_json` → 同步友情链接JSON

