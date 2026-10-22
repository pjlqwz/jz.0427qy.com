/* ==========================================================================
   小程序能力展厅 · 数据层
   一套页面 × N 个行业 = 换主题色 + 换文案 + 换商品，不复制文件。
   当前行业取 ?biz= 参数，其次 localStorage，最后回落 food。
   ========================================================================== */

/* ---------------- 规格模板 ---------------- */
const SPEC_SIZE = { name: '份量', opts: [{ label: '标准', delta: 0 }, { label: '加量', delta: 5 }] };
const SPEC_SPICY = { name: '辣度', opts: [{ label: '不辣', delta: 0 }, { label: '微辣', delta: 0 }, { label: '中辣', delta: 0 }] };
const SPEC_TEMP = { name: '温度', opts: [{ label: '热饮', delta: 0 }, { label: '常温', delta: 0 }, { label: '去冰', delta: 0 }, { label: '加冰', delta: 0 }] };
const SPEC_SUGAR = { name: '糖度', opts: [{ label: '标准糖', delta: 0 }, { label: '少糖', delta: 0 }, { label: '无糖', delta: 0 }] };
const SPEC_TIME = { name: '时长', opts: [{ label: '标准', delta: 0 }, { label: '加时', delta: 30 }] };
const SPEC_STAFF = { name: '指定', opts: [{ label: '不指定', delta: 0 }, { label: '店长 / 主任', delta: 0 }, { label: '资深', delta: 20 }] };
const SPEC_CLASS = { name: '班型', opts: [{ label: '小班 6 人', delta: 0 }, { label: '1 对 1', delta: 60 }] };
const SPEC_PACK = { name: '规格', opts: [{ label: '常规装', delta: 0 }, { label: '家庭装', delta: 18 }] };
const SPEC_COLOR = { name: '颜色', opts: [{ label: '原色', delta: 0 }, { label: '胡桃', delta: 0 }, { label: '雾灰', delta: 0 }] };

/* ---------------- 6 个行业 ---------------- */
const BIZS = {

  /* ========== 餐饮 ========== */
  food: {
    id: 'food', name: '餐饮', label: '餐饮 / 简餐 / 茶饮', icon: 'bowl',
    theme: { b: '#e0632c', b2: '#f2914a', bInk: '#b44c1c', soft: '#fcefe6' },
    shop: {
      name: '拾光小馆', branch: '万达店', slogan: '简餐 · 手作饮品 · 现点现做',
      address: '盘锦市兴隆台区石油大街 88 号 万达广场 3F', phone: '0427-8888 666',
      hours: '10:00 – 21:00', rating: '4.9', sold: '2368', eta: '15 分钟出餐',
      notices: ['新客首单立减 5 元，到店自取免打包费', '满 50 减 5，满 88 赠手作饮品一杯', '会员日每周三积分双倍']
    },
    promo: { threshold: 50, minus: 5, pack: 2, delivery: 5, freeAt: 88 }, modeWord: '到店自取', deliver: true,
    cats: [{ id: 'all', name: '全部' }, { id: 'hot', name: '招牌' }, { id: 'meal', name: '简餐' }, { id: 'drink', name: '饮品' }, { id: 'combo', name: '套餐' }],
    items: [
      { id: 'p1', name: '拾光招牌牛腩饭', cat: 'hot', ico: 'bowl', cls: 't1', sub: '慢炖 3 小时牛腩 · 配溏心蛋与例汤', price: 38, oldPrice: 45, sales: 1286, rating: '4.9', tags: ['招牌', '现做'], desc: '整块牛肋条，八角桂皮香叶慢炖三小时，出锅前收汁到挂勺。米饭用五常稻花香。', materials: ['澳洲牛肋条 180g', '五常稻花香米', '溏心蛋 1 枚'], specs: [SPEC_SIZE, SPEC_SPICY] },
      { id: 'p2', name: '香煎鸡腿饭', cat: 'hot', ico: 'bowl', cls: 't2', sub: '带皮去骨 · 黑椒汁 · 配西兰花', price: 32, oldPrice: 38, sales: 964, rating: '4.8', tags: ['热销'], desc: '带皮鸡腿肉先腌 4 小时，铁板煎至皮脆肉嫩，淋现熬黑椒汁。', materials: ['去骨鸡腿排 200g', '黑椒汁', '西兰花'], specs: [SPEC_SIZE, SPEC_SPICY] },
      { id: 'p3', name: '藤椒鸡丝凉面', cat: 'meal', ico: 'noodle', cls: 't3', sub: '鲜藤椒油 · 手工碱水面 · 微麻', price: 26, oldPrice: 0, sales: 712, rating: '4.8', tags: ['微麻'], desc: '每天现挤藤椒油，麻而不苦。碱水面过冰水，拌开不坨。', materials: ['手工碱水面 160g', '鸡胸丝 80g', '鲜藤椒油'], specs: [SPEC_SIZE, SPEC_SPICY] },
      { id: 'p4', name: '番茄牛腩意面', cat: 'meal', ico: 'plate', cls: 't4', sub: '整颗番茄熬汁 · 现煮 7 分钟', price: 34, oldPrice: 39, sales: 508, rating: '4.7', tags: ['酸甜'], desc: '整颗沙瓤番茄压碎慢熬成酱，不加番茄膏，酸味干净。', materials: ['意大利直面 140g', '牛腩粒 100g', '帕玛森碎'], specs: [SPEC_SIZE] },
      { id: 'p5', name: '手打柠檬茶', cat: 'drink', ico: 'cup', cls: 't5', sub: '香水柠檬 · 现捶现摇 · 500ml', price: 18, oldPrice: 22, sales: 1893, rating: '4.9', tags: ['销冠', '现捶'], desc: '每杯现捶 6 片香水柠檬，茶底用鸭屎香单丛，冰摇 20 下出杯。', materials: ['香水柠檬 6 片', '鸭屎香单丛', '黄冰糖浆'], specs: [SPEC_TEMP, SPEC_SUGAR] },
      { id: 'p6', name: '冰摇桂花乌龙', cat: 'drink', ico: 'cup', cls: 't6', sub: '桂花蜜 · 冷萃乌龙 · 不苦', price: 20, oldPrice: 0, sales: 634, rating: '4.7', tags: ['少甜'], desc: '冷萃 8 小时的乌龙做底，桂花蜜现调，回甘明显。', materials: ['冷萃乌龙茶', '桂花蜜', '青柠角'], specs: [SPEC_TEMP, SPEC_SUGAR] },
      { id: 'p7', name: '生椰拿铁', cat: 'drink', ico: 'coffee', cls: 't7', sub: '厚椰乳 · 深烘意式 · 双份浓缩', price: 24, oldPrice: 28, sales: 1102, rating: '4.8', tags: ['咖啡'], desc: '深烘豆双份浓缩，配厚椰乳，不加糖也有甜感。', materials: ['厚椰乳 200ml', '双份浓缩 40ml'], specs: [SPEC_TEMP, SPEC_SUGAR] },
      { id: 'p8', name: '双人午市套餐', cat: 'combo', ico: 'bowl', cls: 't8', sub: '2 份主食 + 2 杯饮品 · 立省 24 元', price: 68, oldPrice: 92, sales: 356, rating: '4.9', tags: ['套餐', '立省24'], desc: '任选 2 份简餐主食、2 杯 500ml 饮品，工作日 11:00–14:00 供应。', materials: ['主食任选 2', '饮品任选 2', '赠开胃小食'], specs: [SPEC_SPICY] },
      { id: 'p9', name: '芝士厚蛋烧', cat: 'meal', ico: 'plate', cls: 't9', sub: '4 层蛋皮 · 拉丝芝士 · 现煎', price: 22, oldPrice: 0, sales: 421, rating: '4.6', tags: ['小食'], desc: '土鸡蛋 3 枚分 4 层卷制，中间夹马苏里拉，切开能拉丝。', materials: ['土鸡蛋 3 枚', '马苏里拉芝士', '木鱼花'], specs: [SPEC_SIZE] }
    ],
    prizes: [
      { label: '5 元无门槛券', type: 'coupon', value: 5, p: 8 },
      { label: '加料券', type: 'gift', value: 0, p: 14 },
      { label: '20 积分', type: 'points', value: 20, p: 22 },
      { label: '谢谢参与', type: 'none', value: 0, p: 36 },
      { label: '免配送费', type: 'coupon', value: 5, p: 12 },
      { label: '招牌菜品免单', type: 'gift', value: 38, p: 8 }
    ],
    booking: { title: '订座 / 预点单', items: ['包间订座（4–8 人）', '生日套餐预留', '团体餐预订'], slots: ['11:00', '11:30', '12:00', '12:30', '17:30', '18:00', '18:30', '19:00'] },
    member: { level: '银卡会员', next: '金卡', points: 1280, growth: 1280, growthMax: 2000, rate: 0.95, levels: [{ name: '普通会员', need: 0, off: '无折扣' }, { name: '银卡会员', need: 1000, off: '9.5 折' }, { name: '金卡会员', need: 2000, off: '9 折 + 生日礼' }] },
    reviews: [
      { name: 'M**', stars: 5, text: '牛腩给得实在，汁比较多一定要拌饭。取餐半小时内就好，不用等。', date: '10-19' },
      { name: '橙**', stars: 5, text: '柠檬茶是真的现捶，冰块化了也不涩。第二次点了。', date: '10-17' }
    ]
  },

  /* ========== 美业 ========== */
  beauty: {
    id: 'beauty', name: '美业', label: '美容 / 美发 / 美甲', icon: 'scissors',
    theme: { b: '#c2568c', b2: '#dd85b0', bInk: '#98376a', soft: '#fceef4' },
    shop: {
      name: '茱萸美学', branch: '旗舰店', slogan: '头皮管理 · 美甲美睫 · 一对一预约',
      address: '盘锦市兴隆台区惠宾大街 12 号 2F', phone: '0427-7777 218',
      hours: '10:00 – 20:30', rating: '4.9', sold: '986', eta: '需提前预约',
      notices: ['首次到店赠头皮检测一次', '会员生日月护理 8 折', '周三女士专场，14:00 前 9 折']
    },
    promo: { threshold: 200, minus: 30, pack: 0, delivery: 0, freeAt: 999 }, modeWord: '到店服务', deliver: false,
    cats: [{ id: 'all', name: '全部' }, { id: 'hair', name: '头皮养护' }, { id: 'nail', name: '美甲' }, { id: 'lash', name: '美睫' }, { id: 'face', name: '面部' }],
    items: [
      { id: 'b1', name: '头皮深层清洁', cat: 'hair', ico: 'plate', cls: 't4', sub: '60 分钟 · 含检测与按摩', price: 168, oldPrice: 218, sales: 326, rating: '4.9', tags: ['店长推荐'], desc: '头皮检测后分区清洁，配合低刺激配方，做完不打结不干涩。', materials: ['头皮检测', '深层清洁', '头部按摩 15 分钟'], specs: [SPEC_STAFF] },
      { id: 'b2', name: '氨基酸护理', cat: 'hair', ico: 'plate', cls: 't6', sub: '烫染后修护 · 45 分钟', price: 238, oldPrice: 0, sales: 208, rating: '4.8', tags: ['烫染后'], desc: '针对烫染受损的发芯补水，做完蓬松不假滑。', materials: ['氨基酸护理液', '蒸汽导入'], specs: [SPEC_STAFF] },
      { id: 'b3', name: '奶油裸粉延长甲', cat: 'nail', ico: 'bag', cls: 't9', sub: '含卸甲 · 约 90 分钟', price: 188, oldPrice: 228, sales: 415, rating: '4.8', tags: ['热门', '可换色'], desc: '本甲延长，裸粉色系，做完可以做家务不掉边。', materials: ['本甲延长', '奶油裸粉', '免费卸甲'], specs: [SPEC_TIME] },
      { id: 'b4', name: '日式手绘款', cat: 'nail', ico: 'bag', cls: 't5', sub: '10 指手绘 · 需预约', price: 268, oldPrice: 0, sales: 132, rating: '4.9', tags: ['手绘'], desc: '按参考图手绘，每只手指单独设计，工期约 2 小时。', materials: ['甲油胶', '手绘设计', '封层'], specs: [SPEC_TIME] },
      { id: 'b5', name: '自然嫁接睫毛', cat: 'lash', ico: 'cup', cls: 't7', sub: '单根嫁接 · 约 90 分钟', price: 158, oldPrice: 188, sales: 286, rating: '4.7', tags: ['自然款'], desc: '单根嫁接，长度 9–11mm 混合，日常通勤不夸张。', materials: ['单根睫毛', '医用胶水', '免费补一次'], specs: [SPEC_STAFF] },
      { id: 'b6', name: '小气泡面部护理', cat: 'face', ico: 'plate', cls: 't1', sub: '70 分钟 · 含清痘', price: 198, oldPrice: 268, sales: 356, rating: '4.8', tags: ['清痘'], desc: '清洁 + 导出 + 收缩三步，敏感肌可做低强度版。', materials: ['小气泡清洁', '冷敷镇静', '修护面膜'], specs: [SPEC_STAFF] }
    ],
    prizes: [
      { label: '30 元护理券', type: 'coupon', value: 30, p: 10 },
      { label: '头皮检测 1 次', type: 'gift', value: 68, p: 12 },
      { label: '50 积分', type: 'points', value: 50, p: 20 },
      { label: '谢谢参与', type: 'none', value: 0, p: 40 },
      { label: '美甲 8 折', type: 'coupon', value: 0, p: 10 },
      { label: '补水面膜 1 片', type: 'gift', value: 28, p: 8 }
    ],
    booking: { title: '预约到店', items: ['头皮养护', '美甲', '美睫', '面部护理'], slots: ['10:00', '11:00', '13:00', '14:00', '15:30', '17:00', '18:30', '19:30'] },
    member: { level: '金卡会员', next: '黑卡', points: 3260, growth: 3260, growthMax: 5000, rate: 0.9, levels: [{ name: '普通会员', need: 0, off: '无折扣' }, { name: '银卡会员', need: 1000, off: '9.5 折' }, { name: '金卡会员', need: 3000, off: '9 折 + 生日礼' }] },
    reviews: [
      { name: '林**', stars: 5, text: '头皮清洁做完真的不油了，第三天还是蓬的。技师会讲清楚护理原理。', date: '10-18' },
      { name: 'Y**', stars: 5, text: '延长甲维持了 4 周没起边，比之前那家强。', date: '10-15' }
    ]
  },

  /* ========== 口腔 ========== */
  dental: {
    id: 'dental', name: '口腔', label: '口腔 / 诊所 / 医疗', icon: 'tooth',
    theme: { b: '#2f8fa8', b2: '#63b6ca', bInk: '#206b7e', soft: '#eaf6f9' },
    shop: {
      name: '明德口腔', branch: '兴隆台院区', slogan: '种植 · 正畸 · 儿童齿科 · 无痛诊疗',
      address: '盘锦市兴隆台区泰山路 66 号 1–2F', phone: '0427-6666 120',
      hours: '08:30 – 18:00', rating: '4.9', sold: '1842', eta: '提前 1 天预约',
      notices: ['首次到店免费口腔检查 + 全景片', '儿童涂氟每季度开放 50 个名额', '种植牙术后 1 年内免费复查']
    },
    promo: { threshold: 300, minus: 50, pack: 0, delivery: 0, freeAt: 999 }, modeWord: '到院就诊', deliver: false,
    cats: [{ id: 'all', name: '全部' }, { id: 'check', name: '检查洁牙' }, { id: 'implant', name: '种植修复' }, { id: 'ortho', name: '正畸' }, { id: 'kid', name: '儿童齿科' }],
    items: [
      { id: 'd1', name: '超声波洁牙', cat: 'check', ico: 'plate', cls: 't6', sub: '含抛光 · 约 40 分钟', price: 98, oldPrice: 158, sales: 1268, rating: '4.9', tags: ['销量第一'], desc: '超声波去结石后抛光，牙龈敏感者可用轻柔档，术后当天不酸。', materials: ['全口洁治', '抛光', '口腔卫生指导'], specs: [SPEC_STAFF] },
      { id: 'd2', name: '口腔全景检查', cat: 'check', ico: 'tooth', cls: 't4', sub: '全景片 + 医生面诊', price: 0, oldPrice: 80, sales: 986, rating: '4.8', tags: ['首诊免费'], desc: '数字化全景片当场出片，医生逐项讲解问题与处理优先级。', materials: ['全景片 1 张', '医生面诊', '治疗方案'], specs: [] },
      { id: 'd3', name: '单颗种植（韩国植体）', cat: 'implant', ico: 'tooth', cls: 't1', sub: '含植体 + 基台 + 全瓷冠', price: 4980, oldPrice: 6800, sales: 186, rating: '4.9', tags: ['含质保'], desc: 'CBCT 定位后植入，全程无痛麻醉，含 5 年质保与术后复查。', materials: ['韩国植体', '全瓷冠', '5 年质保'], specs: [SPEC_STAFF] },
      { id: 'd4', name: '隐形正畸（初诊设计）', cat: 'ortho', ico: 'tooth', cls: 't7', sub: '口扫 + 3D 方案 + 费用评估', price: 680, oldPrice: 1200, sales: 92, rating: '4.8', tags: ['含 3D 方案'], desc: '口内扫描替代取模，当场看 3D 移动模拟，方案不满意可退。', materials: ['口内扫描', '3D 移动方案', '费用清单'], specs: [SPEC_STAFF] },
      { id: 'd5', name: '儿童全口涂氟', cat: 'kid', ico: 'cup', cls: 't5', sub: '3–12 岁 · 约 20 分钟', price: 120, oldPrice: 180, sales: 624, rating: '4.9', tags: ['儿童'], desc: '水果味氟剂，不苦不呛，配合度差的孩子分两次做。', materials: ['全口涂氟', '防龋指导'], specs: [] },
      { id: 'd6', name: '美学树脂补牙', cat: 'implant', ico: 'plate', cls: 't9', sub: '单颗 · 颜色可比色', price: 380, oldPrice: 0, sales: 412, rating: '4.7', tags: ['美学修复'], desc: '分层堆塑，比色后与邻牙一致，做完当天可正常进食。', materials: ['进口树脂', '分层堆塑', '抛光'], specs: [SPEC_STAFF] }
    ],
    prizes: [
      { label: '洁牙 5 折', type: 'coupon', value: 49, p: 10 },
      { label: '免费全景片', type: 'gift', value: 80, p: 16 },
      { label: '100 积分', type: 'points', value: 100, p: 18 },
      { label: '谢谢参与', type: 'none', value: 0, p: 38 },
      { label: '儿童涂氟 1 次', type: 'gift', value: 120, p: 8 },
      { label: '电动牙刷 1 支', type: 'gift', value: 159, p: 10 }
    ],
    booking: { title: '预约挂号', items: ['洁牙', '种植咨询', '正畸初诊', '儿童齿科'], slots: ['08:30', '09:30', '10:30', '14:00', '15:00', '16:00', '17:00'] },
    member: { level: '家庭会员', next: '家庭金卡', points: 2140, growth: 2140, growthMax: 4000, rate: 0.95, levels: [{ name: '普通会员', need: 0, off: '无折扣' }, { name: '家庭会员', need: 2000, off: '9.5 折 + 每年 1 次洁牙' }, { name: '家庭金卡', need: 4000, off: '9 折 + 2 次洁牙' }] },
    reviews: [
      { name: '王**', stars: 5, text: '带孩子涂氟，医生很有耐心，先讲再用模型演示，孩子没哭。', date: '10-16' },
      { name: '赵**', stars: 5, text: '洁牙不酸，医生说的问题都拍了片子给我看，没有硬推销。', date: '10-12' }
    ]
  },

  /* ========== 教育 ========== */
  edu: {
    id: 'edu', name: '教育', label: '教培 / 素质教育 / 托育', icon: 'book',
    theme: { b: '#3a6fc4', b2: '#6b96dc', bInk: '#2a5499', soft: '#eef3fc' },
    shop: {
      name: '启行学堂', branch: '双台子校区', slogan: '少儿编程 · 硬笔书法 · 6 人小班',
      address: '盘锦市双台子区辽河路 5 号 3F', phone: '0427-5555 330',
      hours: '09:00 – 20:00', rating: '4.9', sold: '764', eta: '可先试听',
      notices: ['新生可约 1 节免费试听课', '寒暑假班 12 月 1 日开始预报', '老生带新生，双方各得 4 课时']
    },
    promo: { threshold: 1000, minus: 100, pack: 0, delivery: 0, freeAt: 999 }, modeWord: '到校上课', deliver: false,
    cats: [{ id: 'all', name: '全部' }, { id: 'code', name: '编程' }, { id: 'art', name: '书法美术' }, { id: 'think', name: '思维' }, { id: 'camp', name: '假期班' }],
    items: [
      { id: 'e1', name: '少儿编程 · 图形化入门', cat: 'code', ico: 'book', cls: 't6', sub: '8 课时 · 6–9 岁 · 6 人小班', price: 960, oldPrice: 1280, sales: 168, rating: '4.9', tags: ['试听可约'], desc: '用图形化积木做小游戏，第 4 节课起每个孩子独立完成一个作品。', materials: ['8 课时', '作品点评', '结课作品集'], specs: [SPEC_CLASS] },
      { id: 'e2', name: 'Python 进阶班', cat: 'code', ico: 'book', cls: 't7', sub: '16 课时 · 10 岁以上', price: 2680, oldPrice: 3200, sales: 86, rating: '4.8', tags: ['进阶'], desc: '从语法到小项目，结课做一个可运行的命令行小工具。', materials: ['16 课时', '项目源码', '阶段测评'], specs: [SPEC_CLASS] },
      { id: 'e3', name: '硬笔书法 · 楷书基础', cat: 'art', ico: 'plate', cls: 't9', sub: '12 课时 · 一年级以上', price: 1180, oldPrice: 1480, sales: 214, rating: '4.9', tags: ['热门'], desc: '从握笔和坐姿改起，每节课一对一改字，家长可旁听。', materials: ['12 课时', '字帖 2 本', '每月作品墙'], specs: [SPEC_CLASS] },
      { id: 'e4', name: '创意美术', cat: 'art', ico: 'plate', cls: 't4', sub: '10 课时 · 4–8 岁', price: 880, oldPrice: 0, sales: 192, rating: '4.7', tags: ['低龄'], desc: '综合材料创作，不限制主题，重点在表达而不是画得像。', materials: ['10 课时', '材料全含'], specs: [SPEC_CLASS] },
      { id: 'e5', name: '数学思维训练', cat: 'think', ico: 'book', cls: 't5', sub: '12 课时 · 三至五年级', price: 1480, oldPrice: 1780, sales: 134, rating: '4.8', tags: ['提分'], desc: '以题型拆解为主，每节课配 15 分钟限时练习并当场讲错题。', materials: ['12 课时', '讲义', '错题本'], specs: [SPEC_CLASS] },
      { id: 'e6', name: '寒暑假托管班', cat: 'camp', ico: 'cup', cls: 't1', sub: '按周报名 · 含午餐', price: 680, oldPrice: 880, sales: 246, rating: '4.8', tags: ['假期'], desc: '上午作业辅导，下午素质课，含午餐与午休，按周结算。', materials: ['周一至周五', '午餐 + 午休', '作业辅导'], specs: [] }
    ],
    prizes: [
      { label: '试听课 1 节', type: 'gift', value: 120, p: 14 },
      { label: '100 元课时券', type: 'coupon', value: 100, p: 12 },
      { label: '教材礼包', type: 'gift', value: 68, p: 16 },
      { label: '谢谢参与', type: 'none', value: 0, p: 38 },
      { label: '200 积分', type: 'points', value: 200, p: 12 },
      { label: '报班立减 300', type: 'coupon', value: 300, p: 8 }
    ],
    booking: { title: '预约试听', items: ['少儿编程', '硬笔书法', '创意美术', '数学思维'], slots: ['09:30', '10:30', '14:00', '15:00', '16:30', '18:00', '19:00'] },
    member: { level: '在读学员', next: '年度会员', points: 860, growth: 860, growthMax: 2000, rate: 0.95, levels: [{ name: '体验学员', need: 0, off: '无折扣' }, { name: '在读学员', need: 800, off: '续费 9.5 折' }, { name: '年度会员', need: 2000, off: '续费 9 折 + 赠 2 课时' }] },
    reviews: [
      { name: '李**', stars: 5, text: '孩子原来握笔姿势错得厉害，两个月改过来了，老师每节课都拍视频反馈。', date: '10-14' },
      { name: '孙**', stars: 5, text: '试听课不推销，讲完给了个学习建议表，这点挺难得。', date: '10-11' }
    ]
  },

  /* ========== 健身 ========== */
  fitness: {
    id: 'fitness', name: '健身', label: '健身 / 瑜伽 / 私教', icon: 'dumbbell',
    theme: { b: '#1f9d6b', b2: '#4cc08c', bInk: '#157a51', soft: '#e9f7f0' },
    shop: {
      name: '力线健身', branch: '油田店', slogan: '私教 · 团课 · 体测 · 24 小时',
      address: '盘锦市兴隆台区石油大街 200 号 B1', phone: '0427-4444 900',
      hours: '24 小时营业', rating: '4.8', sold: '1436', eta: '即时入场',
      notices: ['新会员首月私教体验 99 元 2 节', '每周三团课免费开放', '连续打卡 30 天赠月卡']
    },
    promo: { threshold: 500, minus: 50, pack: 0, delivery: 0, freeAt: 999 }, modeWord: '到店训练', deliver: false,
    cats: [{ id: 'all', name: '全部' }, { id: 'pt', name: '私教' }, { id: 'class', name: '团课' }, { id: 'pass', name: '卡种' }, { id: 'test', name: '体测' }],
    items: [
      { id: 'f1', name: '私教体验课 2 节', cat: 'pt', ico: 'dumbbell', cls: 't3', sub: '含体测 + 训练计划', price: 99, oldPrice: 400, sales: 682, rating: '4.9', tags: ['新人价'], desc: '先做体测再上两节课，教练会给一份 4 周训练计划，不强制续课。', materials: ['体测 1 次', '私教 2 节', '4 周计划'], specs: [SPEC_STAFF] },
      { id: 'f2', name: '私教 12 节', cat: 'pt', ico: 'dumbbell', cls: 't1', sub: '单节 60 分钟 · 有效期 3 个月', price: 2880, oldPrice: 3600, sales: 214, rating: '4.8', tags: ['热销'], desc: '按目标定制（减脂/增肌/体态），每 4 节复测一次数据。', materials: ['12 节私教', '每 4 节复测', '饮食建议'], specs: [SPEC_STAFF] },
      { id: 'f3', name: '燃脂搏击团课', cat: 'class', ico: 'cup', cls: 't4', sub: '45 分钟 · 每班 12 人', price: 68, oldPrice: 98, sales: 936, rating: '4.7', tags: ['高消耗'], desc: '拳击基础动作组合，心率维持在中高区间，适合减脂期。', materials: ['45 分钟', '拳套可借'], specs: [] },
      { id: 'f4', name: '流瑜伽', cat: 'class', ico: 'plate', cls: 't6', sub: '60 分钟 · 每班 10 人', price: 78, oldPrice: 0, sales: 428, rating: '4.8', tags: ['舒缓'], desc: '串联体式配合呼吸，适合久坐人群放松肩颈与髋。', materials: ['60 分钟', '垫子提供'], specs: [] },
      { id: 'f5', name: '月卡（不限次）', cat: 'pass', ico: 'bag', cls: 't5', sub: '30 天 · 器械区 + 团课', price: 299, oldPrice: 399, sales: 1562, rating: '4.8', tags: ['性价比'], desc: '器械区与团课不限次，含一次体测与入场手环。', materials: ['30 天', '团课不限次', '1 次体测'], specs: [] },
      { id: 'f6', name: 'InBody 体成分检测', cat: 'test', ico: 'plate', cls: 't7', sub: '含报告解读 · 15 分钟', price: 39, oldPrice: 80, sales: 748, rating: '4.9', tags: ['数据'], desc: '测体脂率、骨骼肌、内脏脂肪等级，教练逐项讲解怎么练。', materials: ['InBody 报告', '教练解读'], specs: [] }
    ],
    prizes: [
      { label: '私教体验 1 节', type: 'gift', value: 200, p: 10 },
      { label: '团课 3 次卡', type: 'gift', value: 204, p: 10 },
      { label: '50 元储值券', type: 'coupon', value: 50, p: 14 },
      { label: '谢谢参与', type: 'none', value: 0, p: 44 },
      { label: '体测 1 次', type: 'gift', value: 39, p: 14 },
      { label: '运动毛巾', type: 'gift', value: 39, p: 8 }
    ],
    booking: { title: '预约训练', items: ['私教课', '团课（搏击）', '团课（瑜伽）', '体测'], slots: ['07:00', '09:00', '12:00', '17:00', '18:30', '19:30', '20:30'] },
    member: { level: '年卡会员', next: '黑卡', points: 4860, growth: 4860, growthMax: 8000, rate: 0.92, levels: [{ name: '体验会员', need: 0, off: '无折扣' }, { name: '月卡会员', need: 1000, off: '9.5 折' }, { name: '年卡会员', need: 4000, off: '9.2 折 + 每月 2 次团课' }] },
    reviews: [
      { name: '周**', stars: 5, text: '体验课没被强推年卡，教练先把体测讲明白，这点很加分。', date: '10-17' },
      { name: 'K**', stars: 4, text: '团课人多的时候器械要等，但晚上 10 点后就空了。', date: '10-13' }
    ]
  },

  /* ========== 零售 ========== */
  retail: {
    id: 'retail', name: '零售', label: '零售 / 生鲜 / 家居', icon: 'bag',
    theme: { b: '#d94a3d', b2: '#e87b6e', bInk: '#a83a2f', soft: '#fdeeed' },
    shop: {
      name: '山野集', branch: '兴隆台仓店', slogan: '当季生鲜 · 产地直发 · 次日自提',
      address: '盘锦市兴隆台区兴油街 18 号 仓储店', phone: '0427-3333 660',
      hours: '07:00 – 21:00', rating: '4.8', sold: '5362', eta: '次日自提',
      notices: ['满 99 免配送费，次日达', '每日 19:00 后生鲜 7 折', '坏果包赔，拍照即退']
    },
    promo: { threshold: 99, minus: 10, pack: 3, delivery: 6, freeAt: 99 }, modeWord: '到店自提', deliver: true,
    cats: [{ id: 'all', name: '全部' }, { id: 'fruit', name: '当季水果' }, { id: 'veg', name: '蔬菜' }, { id: 'meat', name: '肉禽蛋' }, { id: 'home', name: '家居' }],
    items: [
      { id: 'r1', name: '阳光玫瑰葡萄', cat: 'fruit', ico: 'cup', cls: 't5', sub: '云南产地 · 2 斤装', price: 49, oldPrice: 68, sales: 1862, rating: '4.8', tags: ['当季', '包赔'], desc: '当天采摘冷链发出，甜度 18 以上，坏果拍照直接退。', materials: ['2 斤/箱', '冷链发运', '坏果包赔'], specs: [SPEC_PACK] },
      { id: 'r2', name: '阿克苏苹果', cat: 'fruit', ico: 'plate', cls: 't4', sub: '5 斤装 · 中果', price: 39, oldPrice: 49, sales: 2416, rating: '4.7', tags: ['囤货'], desc: '冰糖心，果径 75–80，适合家里常备。', materials: ['5 斤/箱', '果径 75–80'], specs: [SPEC_PACK] },
      { id: 'r3', name: '有机小番茄', cat: 'veg', ico: 'plate', cls: 't9', sub: '500g · 基地直供', price: 16, oldPrice: 0, sales: 928, rating: '4.8', tags: ['基地直供'], desc: '不打催熟，酸甜比稳定，适合直接吃或做沙拉。', materials: ['500g', '有机认证'], specs: [] },
      { id: 'r4', name: '本地散养鸡蛋', cat: 'meat', ico: 'bowl', cls: 't1', sub: '30 枚 · 当日捡拾', price: 32, oldPrice: 38, sales: 3140, rating: '4.9', tags: ['复购第一'], desc: '盘锦本地散养，蛋壳厚，蛋黄颜色深，当日捡拾次日达。', materials: ['30 枚', '当日捡拾'], specs: [] },
      { id: 'r5', name: '原切牛腩块', cat: 'meat', ico: 'bowl', cls: 't8', sub: '1kg · 冷冻分装', price: 89, oldPrice: 108, sales: 764, rating: '4.7', tags: ['原切'], desc: '整块原切不拼接，按 500g 分装，解冻即炖。', materials: ['1kg', '分装 2 袋'], specs: [SPEC_PACK] },
      { id: 'r6', name: '竹纤维厨房纸', cat: 'home', ico: 'bag', cls: 't3', sub: '4 卷装 · 加厚', price: 24, oldPrice: 0, sales: 1286, rating: '4.6', tags: ['家居'], desc: '三层加厚，吸油吸水，可接触食物。', materials: ['4 卷', '三层加厚'], specs: [SPEC_COLOR] }
    ],
    prizes: [
      { label: '10 元无门槛券', type: 'coupon', value: 10, p: 12 },
      { label: '免配送费', type: 'coupon', value: 6, p: 16 },
      { label: '50 积分', type: 'points', value: 50, p: 18 },
      { label: '谢谢参与', type: 'none', value: 0, p: 38 },
      { label: '苹果 1 斤', type: 'gift', value: 8, p: 10 },
      { label: '满 99 减 30', type: 'coupon', value: 30, p: 6 }
    ],
    booking: { title: '到店自提 / 团购', items: ['门店自提', '社区团购点', '企业采购'], slots: ['09:00', '11:00', '14:00', '16:00', '18:00', '20:00'] },
    member: { level: '银卡会员', next: '金卡', points: 1960, growth: 1960, growthMax: 3000, rate: 0.95, levels: [{ name: '普通会员', need: 0, off: '无折扣' }, { name: '银卡会员', need: 1000, off: '9.5 折' }, { name: '金卡会员', need: 3000, off: '9 折 + 每周免配送 1 次' }] },
    reviews: [
      { name: '陈**', stars: 5, text: '葡萄颗颗都是脆的，没有一颗坏的，第二天就到了。', date: '10-18' },
      { name: '刘**', stars: 4, text: '鸡蛋新鲜，就是有时候去晚了自提点会排队。', date: '10-14' }
    ]
  }
};

/* ---------------- 当前行业解析 ---------------- */
const BIZ_IDS = Object.keys(BIZS);
let BIZ_ID = 'food';
try {
  const q = new URLSearchParams(location.search).get('biz');
  if (q && BIZS[q]) {
    BIZ_ID = q;
    localStorage.setItem('qy_weapp_biz', q);
  } else {
    const saved = localStorage.getItem('qy_weapp_biz');
    if (saved && BIZS[saved]) BIZ_ID = saved;
  }
} catch (e) {
  const q = new URLSearchParams(location.search).get('biz');
  if (q && BIZS[q]) BIZ_ID = q;
}

const BIZ = BIZS[BIZ_ID];

/* 当前行业的别名（页面代码只认这些名字，换行业不用改页面） */
const SHOP = BIZ.shop;
const CATS = BIZ.cats;
const PRODUCTS = BIZ.items;
const PRIZES = BIZ.prizes;
const MEMBER = BIZ.member;
const REVIEWS = BIZ.reviews;
const BOOKING = BIZ.booking;
const PROMO = BIZ.promo;
const MODE_WORD = BIZ.modeWord || '到店自取';
const CAN_DELIVER = !!BIZ.deliver;

/* 主题换肤：覆盖 CSS 变量 */
(function () {
  const t = BIZ.theme, r = document.documentElement.style;
  r.setProperty('--brand', t.b);
  r.setProperty('--brand2', t.b2);
  r.setProperty('--brandInk', t.bInk);
  r.setProperty('--brandSoft', t.soft);
})();

/* 收货地址（虚构） */
const ADDRESS = { name: '左先生', phone: '186****4046', detail: '兴隆台区 石油大街 88 号 万达广场 A 座 1203' };

/* ---------------- 图标 ---------------- */
const ICO = {
  bowl: '<path d="M2 11h20c0 5.52-4.48 10-10 10S2 16.52 2 11Z"/><rect x="1" y="21.4" width="22" height="1.8" rx=".9"/><path d="M8.4 3.4c1.5 1.2 1.5 2.7 0 3.9M12 2.6c1.5 1.2 1.5 2.7 0 3.9M15.6 3.4c1.5 1.2 1.5 2.7 0 3.9" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>',
  noodle: '<path d="M2 11.6h20c0 5.4-4.48 9.8-10 9.8S2 17 2 11.6Z"/><rect x="1" y="21.6" width="22" height="1.6" rx=".8"/><path d="M5.4 11.6c1.6-1.4 3.2-1.4 4.8 0s3.2 1.4 4.8 0 3.4-1.4 4.6 0" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><path d="M9 7.6 12.4 1.8M14.6 7.6 18 1.8" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
  cup: '<path d="M5.4 7.6h13.2l-1.3 12.2a2.2 2.2 0 0 1-2.18 1.96H8.88A2.2 2.2 0 0 1 6.7 19.8L5.4 7.6Z"/><rect x="4.4" y="3.6" width="15.2" height="2.6" rx="1.3"/><path d="M18.6 10.4h1.2a2.6 2.6 0 0 1 0 5.2h-.7" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>',
  coffee: '<path d="M4.6 8.4h12.2l-1.2 11.2a2.2 2.2 0 0 1-2.18 1.96H8A2.2 2.2 0 0 1 5.8 19.6L4.6 8.4Z"/><path d="M16.8 10.6h1.4a2.7 2.7 0 0 1 0 5.4h-1" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><path d="M8.6 4.6c1.2.9 1.2 2 0 2.9M12.4 3.8c1.2.9 1.2 2 0 2.9" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
  plate: '<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.9"/><circle cx="12" cy="12" r="4.6" fill="none" stroke="currentColor" stroke-width="1.5" opacity=".65"/>',
  scissors: '<circle cx="6.4" cy="18" r="2.6" fill="none" stroke="currentColor" stroke-width="1.9"/><circle cx="6.4" cy="6" r="2.6" fill="none" stroke="currentColor" stroke-width="1.9"/><path d="M8.4 7.6 19 18.4M8.4 16.4 19 5.6" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/>',
  tooth: '<path d="M12 3.2c2 0 2.6 1 4.2 1 2 0 3.2 1.4 3.2 4 0 2.4-.7 4-1.3 6.2-.5 1.9-.7 5.4-2.2 5.4-1.3 0-1.4-3.6-2.3-5.4-.4-.8-1.1-1.2-1.6-1.2s-1.2.4-1.6 1.2c-.9 1.8-1 5.4-2.3 5.4-1.5 0-1.7-3.5-2.2-5.4C5.3 12.2 4.6 10.6 4.6 8.2c0-2.6 1.2-4 3.2-4 1.6 0 2.2-1 4.2-1Z"/>',
  book: '<path d="M4 4.4h5.6c1.3 0 2.4 1 2.4 2.3v13c0-1.3-1.1-2.3-2.4-2.3H4V4.4Z"/><path d="M20 4.4h-5.6c-1.3 0-2.4 1-2.4 2.3v13c0-1.3 1.1-2.3 2.4-2.3H20V4.4Z"/><path d="M6.4 9.2h2.8M14.8 9.2h2.8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" fill="none"/>',
  dumbbell: '<rect x="1.6" y="9" width="3.2" height="6" rx="1.2"/><rect x="19.2" y="9" width="3.2" height="6" rx="1.2"/><rect x="5.4" y="6.6" width="3" height="10.8" rx="1.3"/><rect x="15.6" y="6.6" width="3" height="10.8" rx="1.3"/><rect x="8.4" y="11" width="7.2" height="2" rx="1"/>',
  bag: '<path d="M4.6 8.2h14.8l-1.2 11.4a2 2 0 0 1-2 1.8H7.8a2 2 0 0 1-2-1.8L4.6 8.2Z"/><path d="M8.8 8.2V6.4a3.2 3.2 0 0 1 6.4 0v1.8" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/>'
};

/* 优惠券模板（M2 领券中心用） */
const COUPONS = [
  { id: 'c1', t: '新客首单券', v: 5, min: 0, type: 'cash', days: 30, from: 'new' },
  { id: 'c2', t: '满减券', v: 10, min: 68, type: 'cash', days: 15, from: 'promo' },
  { id: 'c3', t: '会员专享券', v: 15, min: 128, type: 'cash', days: 7, from: 'member' },
  { id: 'c4', t: '折扣券', v: 9, min: 0, type: 'off', days: 10, from: 'promo' },
  { id: 'c5', t: '免配送费券', v: 6, min: 0, type: 'ship', days: 20, from: 'promo' }
];
