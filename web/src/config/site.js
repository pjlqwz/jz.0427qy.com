// 站点常量：城市站与总站共用同一套代码骨架，所有跟「城市」有关的东西集中在这里。
// 新增一个城市站 = 复制本文件改一遍，不用去页面里翻硬编码。
//
// ⚠️ 事实边界（2026-10-22 与左总确认，同营口站口径）：
//   千羽的注册主体、办公地、团队都在盘锦，锦州没有实体办公室或分公司。
//   所以本文件的 address / geo 一律写盘锦（真实注册地），只有 areaServed 写锦州。
//   页面上不出现「锦州分公司」「锦州办事处」「锦州本地团队」这类表述。
export const SITE = {
  /** 本站域名（不带尾斜杠） */
  domain: 'https://jz.0427qy.com',
  /** 主站域名：成品站超市等通用资产不重复建设时指过去 */
  mainDomain: 'https://www.0427qy.com',
  /** 本站服务的城市 */
  city: '锦州',
  cityFull: '辽宁省锦州市',
  /** 锦州下辖区县（写落地页与正文时用，不虚构）
   *  官方口径：下辖凌河、古塔、太和 3 区，黑山、义县 2 县，凌海、北镇 2 县级市，
   *  另有经开区、高新区 2 个国家级开发区（市政府「行政区划」页）。 */
  districts: ['凌河区', '古塔区', '太和区', '凌海市', '北镇市', '黑山县', '义县'],
  /** 千羽真实所在地 */
  hqCity: '盘锦',
  hqAddress: '辽宁省盘锦市',
  /** 锦州市区经纬度（用于 JSON-LD areaServed 的地理标注，约值） */
  geo: { lat: 41.10, lng: 121.13 },

  brand: '千羽网络',
  legalName: '千羽亿维（盘锦）网络科技有限公司',
  beian: '辽ICP备17011334号',

  tel: '18624274046',
  telIntl: '+8618624274046',
  email: 'admin@0427qy.com',
  qq: '904392007',
  contactPerson: '左先生',

  /** 结构化数据用的 knowsAbout（与主站一致） */
  knowsAbout: [
    '企业AI服务',
    '企业AI效能提升',
    '一人公司服务',
    '网站建设',
    '小程序开发',
    '软件开发',
  ],
};

/** 组织结构化数据：地址写盘锦（真实），服务区域写锦州（本站定位） */
export const ORG = {
  '@context': 'https://schema.org',
  '@id': `${SITE.domain}/#org`,
  '@type': 'ProfessionalService',
  name: SITE.brand,
  legalName: SITE.legalName,
  url: `${SITE.domain}/`,
  telephone: SITE.telIntl,
  email: SITE.email,
  address: {
    '@type': 'PostalAddress',
    streetAddress: SITE.hqAddress,
    addressLocality: SITE.hqCity + '市',
    addressRegion: '辽宁省',
    addressCountry: 'CN',
  },
  geo: { '@type': 'GeoCoordinates', latitude: 41.12, longitude: 122.07 },
  openingHours: 'Mo-Fr 09:00-18:00',
  priceRange: '¥500-¥30000',
  areaServed: [
    { '@type': 'City', name: '锦州市' },
    { '@type': 'AdministrativeArea', name: '辽宁省' },
  ],
  knowsAbout: SITE.knowsAbout,
};
