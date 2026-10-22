/* ==========================================================================
   拾光小馆 · 演示包运行时
   职责：本地存储（购物车/订单）、tabbar 渲染、toast、模拟支付
   无网络请求、无第三方库。localStorage 不可用时自动降级为内存态。
   ========================================================================== */

const QY = (function () {
  const NS = 'qy_weapp_';

  /* 项目根路径：兼容本地 /wx/ 部署与 file:// 直开 */
  const DIRS = ['trade', 'member', 'promo', 'service'];
  const ROOT = (function () {
    const segs = location.pathname.split('/');
    const i = segs.findIndex(s => DIRS.indexOf(s) > -1);
    return i > 0 ? segs.slice(0, i).join('/') + '/' : './';
  })();

  /* ---------------- 存储 ---------------- */
  const mem = {};
  let lsOK = true;
  try { localStorage.setItem(NS + '__t', '1'); localStorage.removeItem(NS + '__t'); }
  catch (e) { lsOK = false; }

  const store = {
    get(k, def) {
      try {
        const raw = lsOK ? localStorage.getItem(NS + k) : null;
        if (raw == null) return (k in mem) ? mem[k] : def;
        return JSON.parse(raw);
      } catch (e) { return (k in mem) ? mem[k] : def; }
    },
    set(k, v) {
      mem[k] = v;
      try { if (lsOK) localStorage.setItem(NS + k, JSON.stringify(v)); } catch (e) { }
    },
    del(k) {
      delete mem[k];
      try { if (lsOK) localStorage.removeItem(NS + k); } catch (e) { }
    },
    reset() {
      Object.keys(mem).forEach(k => delete mem[k]);
      try {
        if (lsOK) {
          Object.keys(localStorage)
            .filter(k => k.indexOf(NS) === 0)
            .forEach(k => localStorage.removeItem(k));
        }
      } catch (e) { }
    }
  };

  /* ---------------- 工具 ---------------- */
  const money = n => {
    const v = Math.round((Number(n) || 0) * 100) / 100;
    return (v % 1 === 0) ? String(v) : v.toFixed(2);
  };
  const qs = k => new URLSearchParams(location.search).get(k);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const pad = n => String(n).padStart(2, '0');
  const fmtTime = ts => {
    const d = new Date(ts);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };
  const product = id => PRODUCTS.find(p => p.id === id);

  /* ---------------- 购物车 ----------------
     item: { key, id, name, ico, cls, spec:{名:值}, specText, unit, qty } */
  const cart = {
    list() { return store.get('cart', []); },
    save(list) { store.set('cart', list); renderBadge(); },
    add(id, spec, qty) {
      const p = product(id);
      if (!p) return;
      const specObj = spec || {};
      const labels = p.specs.map(s => specObj[s.name] || s.opts[0].label);
      const key = id + '|' + labels.join('|');
      let unit = p.price;
      p.specs.forEach((s, i) => {
        const opt = s.opts.find(o => o.label === labels[i]);
        if (opt && opt.delta) unit += opt.delta;
      });
      const list = cart.list();
      const hit = list.find(i => i.key === key);
      if (hit) hit.qty += (qty || 1);
      else list.push({
        key, id, name: p.name, ico: p.ico, cls: p.cls,
        spec: p.specs.reduce((a, s, i) => (a[s.name] = labels[i], a), {}),
        specText: labels.join(' / '),
        unit, qty: qty || 1
      });
      cart.save(list);
      return key;
    },
    setQty(key, qty) {
      let list = cart.list();
      const hit = list.find(i => i.key === key);
      if (!hit) return;
      hit.qty = qty;
      if (hit.qty <= 0) list = list.filter(i => i.key !== key);
      cart.save(list);
    },
    remove(key) { cart.save(cart.list().filter(i => i.key !== key)); },
    clear() { cart.save([]); },
    count() { return cart.list().reduce((n, i) => n + i.qty, 0); },
    amount() { return cart.list().reduce((n, i) => n + i.unit * i.qty, 0); }
  };

  /* ---------------- 结算金额 ----------------
     mode: 'pickup' | 'delivery'  */
  function calc(mode) {
    const goods = cart.amount();
    const pack = cart.count() > 0 ? PROMO.pack : 0;
    let delivery = 0;
    if (mode === 'delivery' && goods > 0) {
      delivery = goods >= PROMO.freeAt ? 0 : PROMO.delivery;
    }
    const promo = goods >= PROMO.threshold ? PROMO.minus : 0;
    const total = Math.max(0, goods + pack + delivery - promo);
    return { goods, pack, delivery, promo, total };
  }

  /* ---------------- 订单 ---------------- */
  const orders = {
    list() { return store.get('orders', []).slice().sort((a, b) => b.ts - a.ts); },
    get(no) { return orders.list().find(o => o.no === no) || null; },
    last() { return orders.list()[0] || null; },
    create(payload) {
      const d = new Date();
      const no = 'QY' + d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate())
        + String(Math.floor(1000 + Math.random() * 9000));
      const outNo = 'A' + String(Math.floor(10 + Math.random() * 89));
      const order = Object.assign({
        no, outNo, ts: Date.now(),
        status: 'paid', statusText: '已支付 · 制作中',
        payMethod: '微信支付'
      }, payload);
      const list = store.get('orders', []);
      list.push(order);
      store.set('orders', list);
      return order;
    }
  };

  /* ---------------- 界面 ---------------- */
  let toastTimer = null;
  function toast(msg, ms) {
    let el = document.querySelector('.toast');
    if (!el) {
      el = document.createElement('div');
      el.className = 'toast';
      (document.querySelector('.mp') || document.body).appendChild(el);
    }
    el.textContent = msg;
    el.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('is-on'), ms || 1500);
  }

  function paySim(done) {
    let el = document.querySelector('.paying');
    if (!el) {
      el = document.createElement('div');
      el.className = 'paying';
      el.innerHTML =
        '<div class="paying-box">' +
        '<div class="wx"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M8.7 4C4.9 4 1.8 6.6 1.8 9.8c0 1.8 1 3.4 2.6 4.5l-.6 1.9 2.2-1.1c.8.2 1.6.4 2.4.4h.6a5.5 5.5 0 0 1-.2-1.5c0-3.1 3-5.7 6.7-5.7h.6C15.5 5.6 12.4 4 8.7 4Zm-2.3 2.6a.9.9 0 1 1 0 1.8.9.9 0 0 1 0-1.8Zm4.7 0a.9.9 0 1 1 0 1.8.9.9 0 0 1 0-1.8Z"/><path d="M22.2 14c0-2.7-2.7-4.9-5.9-4.9s-5.9 2.2-5.9 4.9 2.7 4.9 5.9 4.9c.7 0 1.4-.1 2-.3l1.8.9-.5-1.6c1.6-.9 2.6-2.3 2.6-3.9Zm-7.8-1.3a.8.8 0 1 1 0 1.6.8.8 0 0 1 0-1.6Zm3.9 0a.8.8 0 1 1 0 1.6.8.8 0 0 1 0-1.6Z"/></svg></div>' +
        '<div class="paying-t" id="payingT">微信支付</div>' +
        '<div class="paying-s">正在安全支付，请勿退出</div>' +
        '<div class="spinner"></div>' +
        '</div>';
      (document.querySelector('.mp') || document.body).appendChild(el);
    }
    el.classList.add('is-on');
    setTimeout(() => { el.classList.remove('is-on'); done && done(); }, 1500);
  }

  /* tabbar */
  const TABS = [
    {
      key: 'home', text: '首页', href: 'trade/home.html',
      ico: '<path d="M12 3.1 3.4 9.9V20a1 1 0 0 0 1 1h5v-6h5.2v6h5a1 1 0 0 0 1-1V9.9L12 3.1Z"/>'
    },
    {
      key: 'menu', text: '点餐', href: 'trade/home.html#menu',
      ico: '<rect x="3" y="3" width="7.4" height="7.4" rx="2"/><rect x="13.6" y="3" width="7.4" height="7.4" rx="2"/><rect x="3" y="13.6" width="7.4" height="7.4" rx="2"/><rect x="13.6" y="13.6" width="7.4" height="7.4" rx="2"/>'
    },
    {
      key: 'cart', text: '购物车', href: 'trade/cart.html', badge: true,
      ico: '<path d="M2.6 3.6h2.2l2.5 10.1a1.8 1.8 0 0 0 1.75 1.37h8.1a1.8 1.8 0 0 0 1.75-1.33l1.5-5.6H6.2" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/><circle cx="9.4" cy="19.6" r="1.5"/><circle cx="17.4" cy="19.6" r="1.5"/>'
    },
    {
      key: 'order', text: '订单', href: 'trade/order.html',
      ico: '<path d="M6 2.6h12a1 1 0 0 1 1 1v17.8l-3-1.7-2.4 1.7L12 19.7l-1.6 1.7L8 19.7l-3 1.7V3.6a1 1 0 0 1 1-1Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M8.6 8h6.8M8.6 11.6h6.8" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>'
    },
    {
      key: 'mine', text: '我的', href: 'member/center.html',
      ico: '<circle cx="12" cy="8.2" r="4.2"/><path d="M3.8 21a8.2 8.2 0 0 1 16.4 0Z"/>'
    }
  ];

  function tabbar(active) {
    const host = document.getElementById('tabbar');
    if (!host) return;
    host.className = 'tabbar';
    host.innerHTML = TABS.map(t =>
      `<a class="tab${t.key === active ? ' is-on' : ''}" href="${ROOT + t.href}">` +
      `<svg viewBox="0 0 24 24" fill="currentColor">${t.ico}</svg>` +
      `<span>${t.text}</span>` +
      (t.badge ? `<i class="tab-badge" data-badge hidden>0</i>` : '') +
      `</a>`
    ).join('');
    renderBadge();
  }

  function renderBadge() {
    const n = cart.count();
    document.querySelectorAll('[data-badge]').forEach(el => {
      el.textContent = n > 99 ? '99+' : String(n);
      el.hidden = n === 0;
    });
  }

  function back() {
    if (history.length > 1) history.back();
    else location.href = ROOT + 'trade/home.html';
  }

  /* ---------------- 会员 / 积分 / 签到 ---------------- */
  const todayKey = () => {
    const d = new Date();
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  };
  const dayDiff = (a, b) => {
    const p = s => { const [y, m, d] = s.split('-').map(Number); return Date.UTC(y, m - 1, d); };
    return Math.round((p(b) - p(a)) / 864e5);
  };

  const member = {
    get() {
      const m = store.get('member', null);
      if (m) return m;
      const init = { points: MEMBER.points, growth: MEMBER.growth, lastSign: '', streak: 0, totalSign: 0, signed: [] };
      store.set('member', init);
      return init;
    },
    save(m) { store.set('member', m); },
    addPoints(n) {
      const m = member.get();
      m.points = Math.max(0, m.points + n);
      m.growth = Math.max(0, (m.growth || 0) + Math.max(0, n));
      member.save(m);
      if (n) member.log(n > 0 ? '消费获得' : '积分扣减', n);
      return m;
    },
    log(t, n) {
      const l = store.get('plog', []);
      l.unshift({ t, n, ts: Date.now() });
      store.set('plog', l.slice(0, 20));
    },
    plog() { return store.get('plog', []); },
    levelOf(growth) {
      const lv = MEMBER.levels.filter(l => growth >= l.need);
      return lv[lv.length - 1] || MEMBER.levels[0];
    },
    signedToday() { return member.get().lastSign === todayKey(); },
    canMakeUp() {
      const m = member.get();
      return !!(m.lastSign && dayDiff(m.lastSign, todayKey()) === 2);
    },
    signin(isMakeUp) {
      const m = member.get();
      const t = todayKey();
      if (m.lastSign === t) return { ok: false, msg: '今天已经签过了' };
      const gap = m.lastSign ? dayDiff(m.lastSign, t) : 999;
      m.streak = (gap === 1) ? (m.streak || 0) + 1 : 1;
      m.lastSign = t;
      m.totalSign = (m.totalSign || 0) + 1;
      if (m.signed.indexOf(t) < 0) m.signed.push(t);
      const base = 10, bonus = m.streak % 7 === 0 ? 50 : 0;
      m.points += base + bonus;
      m.growth = (m.growth || 0) + base + bonus;
      member.save(m);
      member.log(m.streak % 7 === 0 ? `连签 ${m.streak} 天奖励` : '每日签到', base + bonus);
      return { ok: true, points: base + bonus, streak: m.streak, bonus };
    }
  };

  /* ---------------- 券包 ---------------- */
  const coupons = {
    mine() { return store.get('coupons', []); },
    save(list) { store.set('coupons', list); },
    has(id) { return coupons.mine().some(c => c.id === id); },
    claim(id) {
      if (coupons.has(id)) return { ok: false, msg: '已经领过了' };
      const tpl = COUPONS.find(c => c.id === id);
      if (!tpl) return { ok: false, msg: '券不存在' };
      const list = coupons.mine();
      const exp = Date.now() + tpl.days * 864e5;
      list.push({ id, claimedAt: Date.now(), exp, used: false });
      coupons.save(list);
      return { ok: true, tpl };
    },
    usable(amount) {
      return coupons.mine().filter(c => {
        const t = COUPONS.find(x => x.id === c.id);
        return t && !c.used && t.min <= amount;
      });
    },
    use(id) {
      const list = coupons.mine();
      const hit = list.find(c => c.id === id);
      if (hit) { hit.used = true; coupons.save(list); }
    }
  };

  /* ---------------- 抽奖 ---------------- */
  const lottery = {
    MAX: 3,
    state() {
      const s = store.get('lottery', null);
      const t = todayKey();
      if (!s || s.date !== t) {
        const fresh = { date: t, used: 0, records: (s && s.records) || [] };
        store.set('lottery', fresh);
        return fresh;
      }
      return s;
    },
    left() { return Math.max(0, lottery.MAX - lottery.state().used); },
    /* 概率抽取：p 为权重 */
    draw() {
      const s = lottery.state();
      if (lottery.left() <= 0) return null;
      const total = PRIZES.reduce((n, p) => n + p.p, 0);
      let r = Math.random() * total, idx = PRIZES.length - 1;
      for (let i = 0; i < PRIZES.length; i++) {
        r -= PRIZES[i].p;
        if (r <= 0) { idx = i; break; }
      }
      s.used += 1;
      const prize = PRIZES[idx];
      s.records.unshift({ idx, label: prize.label, type: prize.type, value: prize.value, ts: Date.now() });
      store.set('lottery', s);
      return { idx, prize };
    },
    records() { return lottery.state().records; }
  };

  /* ---------------- 预约 ---------------- */
  const booking = {
    list() { return store.get('booking', []).slice().sort((a, b) => b.ts - a.ts); },
    add(o) {
      const list = store.get('booking', []);
      const item = Object.assign({ id: 'BK' + Date.now().toString().slice(-8), ts: Date.now(), status: '待确认' }, o);
      list.push(item);
      store.set('booking', list);
      return item;
    }
  };

  /* ---------------- 留言 ---------------- */
  const messages = {
    list() { return store.get('messages', []); },
    add(text, from) {
      const list = messages.list();
      list.push({ text, from: from || 'me', ts: Date.now() });
      store.set('messages', list);
      return list;
    },
    reply(text) {
      const list = messages.list();
      list.push({ text, from: 'shop', ts: Date.now() });
      store.set('messages', list);
    }
  };

  return {
    store, money, qs, esc, fmtTime, product, cart, calc, orders,
    toast, paySim, tabbar, renderBadge, back,
    root: ROOT,
    biz: BIZ_ID, todayKey, dayDiff, member, coupons, lottery, booking, messages
  };
})();


/* 通用绑定：返回按钮 / 冒泡角标刷新 */
document.addEventListener('click', e => {
  const b = e.target.closest('[data-back]');
  if (b) { e.preventDefault(); QY.back(); }
});
document.addEventListener('DOMContentLoaded', () => QY.renderBadge());
