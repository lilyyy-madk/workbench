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

// 饮品类型（使用 SVG 图标确保跨平台一致）
const DRINK_TYPES = [
  { id: 'coffee', name: '咖啡', icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>`, color: '#8b6b4e' },
  { id: 'milktea', name: '奶茶', icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 8h1a4 4 0 0 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V8z"/><path d="M6 8c0-1.5 1-3 3-3s3 1.5 3 3"/><line x1="12" y1="3" x2="10" y2="8"/><line x1="7" y1="3" x2="9" y2="8"/></svg>`, color: '#d4a574' },
  { id: 'milk', name: '牛奶', icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2h8a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z"/><line x1="10" y1="2" x2="10" y2="6"/><line x1="14" y1="2" x2="14" y2="6"/></svg>`, color: '#9a9a9a' },
  { id: 'water', name: '水', icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>`, color: '#63BAD9' },
  { id: 'beer', name: '啤酒', icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6h8a2 2 0 0 1 2 2v8a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4V8a2 2 0 0 1 2-2z"/><path d="M17 10h3a2 2 0 0 1 0 4h-3"/><path d="M9 14a2 2 0 1 0 4 0 2 2 0 0 0-4 0"/></svg>`, color: '#e8b82e' },
  { id: 'tea', name: '茶', icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><path d="M6 1c0 3 2 4 2 7"/><path d="M10 1c0 3 2 4 2 7"/></svg>`, color: '#7dc67d' },
];

// 学习语录
const STUDY_QUOTES = [
  { emoji: '🔥', text: '快起床！你要上岸！' },
  { emoji: '💪', text: '成功的人怎么不能是你？继续学习吧！' },
  { emoji: '⭐', text: '今天的努力是明天的底气！' },
];
