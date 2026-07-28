/* ============================================
   工具库与数据层
   ============================================ */
const Utils = {
  // ===== 日期处理 =====
  todayKey() {
    const d = new Date();
    return this.formatDate(d);
  },

  formatDate(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  },

  formatDateShort(d) {
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${m}/${day}`;
  },

  parseDate(str) {
    const [y, m, d] = str.split('-').map(Number);
    return new Date(y, m - 1, d);
  },

  getMonthDays(year, month) {
    return new Date(year, month + 1, 0).getDate();
  },

  // 获取本周一日期
  getMonday(d) {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    date.setDate(diff);
    date.setHours(0, 0, 0, 0);
    return date;
  },

  // 本周日期列表
  getWeekDates(d) {
    const monday = this.getMonday(d);
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const dt = new Date(monday);
      dt.setDate(monday.getDate() + i);
      dates.push(this.formatDate(dt));
    }
    return dates;
  },

  // 当前时间 HH:MM
  nowTime() {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  },

  // ===== localStorage 存储 =====
  // 通用读写
  get(key, def = null) {
    try {
      const v = localStorage.getItem(key);
      return v ? JSON.parse(v) : def;
    } catch (e) {
      console.warn('读取失败:', key, e);
      return def;
    }
  },

  set(key, val) {
    try {
      localStorage.setItem(key, JSON.stringify(val));
      return true;
    } catch (e) {
      console.error('存储失败:', key, e);
      this.toast('存储空间不足，请清理旧数据', 'error');
      return false;
    }
  },

  // 按日期键存储
  getByDate(prefix, dateKey, def = null) {
    return this.get(`${prefix}_${dateKey}`, def);
  },

  setByDate(prefix, dateKey, val) {
    return this.set(`${prefix}_${dateKey}`, val);
  },

  // 全局配置
  getSettings() {
    return this.get('app_settings', {
      notificationsEnabled: false,
      sidebarCollapsed: false,
      lastVisitDate: null,
      studyModalShownDate: null,
    });
  },

  saveSettings(settings) {
    this.set('app_settings', settings);
  },

  // ===== 每日重置检测 =====
  checkDailyReset() {
    const today = this.todayKey();
    const settings = this.getSettings();
    if (settings.lastVisitDate !== today) {
      // 日期变化，执行重置逻辑
      console.log(`日期变化: ${settings.lastVisitDate} → ${today}，执行每日重置`);
      // 各模块自己处理重置，这里仅记录
      settings.lastVisitDate = today;
      settings.studyModalShownDate = null; // 重置学习弹窗标记
      this.saveSettings(settings);
      return true;
    }
    return false;
  },

  // ===== Toast 提示 =====
  toast(msg, type = 'success', duration = 3000) {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icons = {
      success: '✓',
      error: '✕',
      info: 'ℹ',
      warning: '⚠'
    };
    toast.innerHTML = `<span style="font-size:16px">${icons[type] || ''}</span><span>${this.escapeHtml(msg)}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.animation = 'toastOut 0.3s ease forwards';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  },

  // ===== Modal 确认对话框 =====
  confirm(message, title = '确认操作') {
    return new Promise((resolve) => {
      const container = document.getElementById('modalContainer');
      const overlay = document.createElement('div');
      overlay.className = 'modal-overlay';
      overlay.innerHTML = `
        <div class="modal-box">
          <div class="modal-title">${this.escapeHtml(title)}</div>
          <div class="modal-body">${this.escapeHtml(message)}</div>
          <div class="modal-actions">
            <button class="btn btn-outline" data-act="cancel">取消</button>
            <button class="btn btn-primary" data-act="ok">确认</button>
          </div>
        </div>
      `;
      container.appendChild(overlay);
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          overlay.remove();
          resolve(false);
        }
        const act = e.target.closest('[data-act]')?.dataset.act;
        if (act) {
          overlay.remove();
          resolve(act === 'ok');
        }
      });
    });
  },

  // 自定义弹窗（带输入框）
  prompt(message, defaultValue = '', title = '输入') {
    return new Promise((resolve) => {
      const container = document.getElementById('modalContainer');
      const overlay = document.createElement('div');
      overlay.className = 'modal-overlay';
      overlay.innerHTML = `
        <div class="modal-box">
          <div class="modal-title">${this.escapeHtml(title)}</div>
          <div class="modal-body">${this.escapeHtml(message)}</div>
          <input class="input" id="promptInput" value="${this.escapeHtml(String(defaultValue))}" style="margin-bottom:16px" />
          <div class="modal-actions">
            <button class="btn btn-outline" data-act="cancel">取消</button>
            <button class="btn btn-primary" data-act="ok">确认</button>
          </div>
        </div>
      `;
      container.appendChild(overlay);
      const input = overlay.querySelector('#promptInput');
      setTimeout(() => { input.focus(); input.select(); }, 100);
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          overlay.remove();
          resolve(input.value);
        }
        if (e.key === 'Escape') {
          overlay.remove();
          resolve(null);
        }
      });
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          overlay.remove();
          resolve(null);
        }
        const act = e.target.closest('[data-act]')?.dataset.act;
        if (act) {
          overlay.remove();
          resolve(act === 'ok' ? input.value : null);
        }
      });
    });
  },

  // ===== Notification API =====
  async requestNotificationPermission() {
    if (!('Notification' in window)) {
      console.warn('浏览器不支持通知');
      return false;
    }
    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'denied') return false;
    const result = await Notification.requestPermission();
    return result === 'granted';
  },

  sendNotification(title, body) {
    const settings = this.getSettings();
    if (settings.notificationsEnabled && 'Notification' in window && Notification.permission === 'granted') {
      try {
        const notif = new Notification(title, {
          body: body,
          icon: 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><circle cx="32" cy="32" r="30" fill="#7dc67d"/><text x="32" y="42" font-size="32" text-anchor="middle">🌿</text></svg>')
        });
        // 5秒后自动关闭
        setTimeout(() => notif.close(), 8000);
        return true;
      } catch (e) {
        console.warn('通知发送失败', e);
      }
    }
    // 降级为 Toast
    this.toast(`${title}：${body}`, 'info', 5000);
    return false;
  },

  // ===== HTML 转义 =====
  escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = String(str);
    return div.innerHTML;
  },

  // ===== 防抖 =====
  debounce(fn, delay = 300) {
    let timer;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  },

  // ===== 深拷贝 =====
  deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  },

  // ===== 数组洗牌 =====
  shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  },

  // ===== 数字补零 =====
  pad(n) {
    return String(n).padStart(2, '0');
  },

  // 秒数转 mm:ss
  formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${this.pad(m)}:${this.pad(s)}`;
  },

  // 秒数转 hh:mm:ss
  formatTimeHMS(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${this.pad(h)}:${this.pad(m)}:${this.pad(s)}`;
    return `${this.pad(m)}:${this.pad(s)}`;
  },
};

// ===== 食物数据库 =====
const FOOD_DB = [
  { name: '米饭', kcal: 116 },
  { name: '馒头', kcal: 223 },
  { name: '面条（煮）', kcal: 107 },
  { name: '白粥', kcal: 46 },
  { name: '全麦面包', kcal: 246 },
  { name: '鸡蛋', kcal: 144 },
  { name: '牛奶', kcal: 54 },
  { name: '豆浆', kcal: 31 },
  { name: '苹果', kcal: 53 },
  { name: '香蕉', kcal: 93 },
  { name: '西瓜', kcal: 31 },
  { name: '鸡胸肉', kcal: 133 },
  { name: '猪瘦肉', kcal: 143 },
  { name: '牛肉', kcal: 125 },
  { name: '草鱼', kcal: 113 },
  { name: '虾', kcal: 93 },
  { name: '豆腐', kcal: 82 },
  { name: '番茄', kcal: 20 },
  { name: '黄瓜', kcal: 16 },
  { name: '土豆', kcal: 81 },
  { name: '红薯', kcal: 86 },
  { name: '蛋糕', kcal: 348 },
  { name: '奶茶', kcal: 65 },
  { name: '拿铁', kcal: 56 },
  { name: '美式', kcal: 2 },
  { name: '啤酒', kcal: 32 },
  { name: '茶', kcal: 1 },
];

// 饮品类型
const DRINK_TYPES = [
  { id: 'coffee', name: '咖啡', icon: '☕', color: '#8b6b4e' },
  { id: 'milktea', name: '奶茶', icon: '🧋', color: '#d4a574' },
  { id: 'milk', name: '牛奶', icon: '🥛', color: '#9a9a9a' },
  { id: 'water', name: '水', icon: '💧', color: '#63BAD9' },
  { id: 'beer', name: '啤酒', icon: '🍺', color: '#e8b82e' },
  { id: 'tea', name: '茶', icon: '🍵', color: '#7dc67d' },
];

// 学习语录
const STUDY_QUOTES = [
  { emoji: '🔥', text: '快起床！你要上岸！' },
  { emoji: '💪', text: '成功的人怎么不能是你？继续学习吧！' },
  { emoji: '⭐', text: '今天的努力是明天的底气！' },
];

// 页面标题右侧装饰图案（简笔画风格）
const PAGE_DECORATIONS = {
  todo: `<svg viewBox="0 0 64 64" width="36" height="36" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><circle cx="32" cy="30" r="18"/><path d="M18 14 L14 6 L26 12"/><path d="M46 14 L50 6 L38 12"/><path d="M24 28 L30 34 L42 22"/><path d="M22 52 L18 62"/><path d="M42 52 L46 62"/></svg>`,

  water: `<svg viewBox="0 0 64 64" width="36" height="36" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 48 Q12 32 24 28 Q20 20 28 18 Q32 10 36 18 Q44 20 40 28 Q52 32 52 48 Q52 58 32 58 Q12 58 12 48 Z"/><path d="M42 12 Q46 4 50 12 Q54 20 48 22"/><circle cx="24" cy="40" r="2" fill="currentColor" stroke="none"/><circle cx="40" cy="40" r="2" fill="currentColor" stroke="none"/></svg>`,

  diet: `<svg viewBox="0 0 64 64" width="36" height="36" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><path d="M10 24 Q10 10 32 10 Q54 10 54 24"/><path d="M10 24 L54 24 L50 52 Q50 58 32 58 Q14 58 14 52 Z"/><circle cx="32" cy="32" r="3" fill="currentColor" stroke="none"/><path d="M22 40 Q32 46 42 40"/><path d="M16 20 Q32 14 48 20"/></svg>`,

  study: `<svg viewBox="0 0 64 64" width="36" height="36" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><circle cx="32" cy="24" r="14"/><path d="M22 16 L30 24 L22 32"/><path d="M32 38 L32 56"/><path d="M22 56 L42 56"/><path d="M48 14 L54 8"/><path d="M54 14 L48 8"/></svg>`,

  fitness: `<svg viewBox="0 0 64 64" width="36" height="36" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><path d="M18 48 Q10 40 18 32 Q14 24 22 22 Q26 14 34 18 Q42 14 46 22 Q54 24 50 32 Q58 40 50 48 Q52 56 44 58 Q36 62 28 58 Q20 56 22 48"/><circle cx="26" cy="34" r="2" fill="currentColor" stroke="none"/><circle cx="42" cy="34" r="2" fill="currentColor" stroke="none"/></svg>`,

  settings: `<svg viewBox="0 0 64 64" width="36" height="36" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><circle cx="32" cy="32" r="20"/><path d="M18 16 L14 10 L24 14"/><path d="M46 16 L50 10 L40 14"/><path d="M26 40 Q32 44 38 40"/><path d="M18 48 L16 56"/><path d="M46 48 L48 56"/></svg>`,
};
