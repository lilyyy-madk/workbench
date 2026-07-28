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
      // 触发云端自动同步
      if (typeof Sync !== 'undefined' && Sync.scheduleUpload) Sync.scheduleUpload();
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

// 页面标题右侧装饰图案（简笔画风格猫咪，每页不同姿态）
const PAGE_DECORATIONS = {
  // 待办：举爪打招呼的猫
  todo: `<svg viewBox="0 0 64 64" width="34" height="34" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 40 C20 30 24 26 32 26 C40 26 44 30 44 40 C44 48 40 52 32 52 C24 52 20 48 20 40 Z"/><path d="M18 20 C16 12 18 8 22 8 C26 8 28 14 28 20"/><path d="M46 20 C48 12 46 8 42 8 C38 8 36 14 36 20"/><circle cx="26" cy="36" r="1.8" fill="currentColor" stroke="none"/><circle cx="38" cy="36" r="1.8" fill="currentColor" stroke="none"/><path d="M30 41 L32 43 L34 41" stroke="#ff9eab"/><path d="M32 43 Q29 47 26 45"/><path d="M32 43 Q35 47 38 45"/><path d="M44 34 Q52 30 50 22"/><path d="M20 50 L16 58"/></svg>`,

  // 喝水：头顶水滴的猫
  water: `<svg viewBox="0 0 64 64" width="34" height="34" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><path d="M40 18 Q44 8 48 18 Q52 28 46 30 Z" fill="#CAEBED" stroke="currentColor"/><path d="M20 42 C20 32 24 28 32 28 C40 28 44 32 44 42 C44 50 40 54 32 54 C24 54 20 50 20 42 Z"/><path d="M18 22 C16 14 18 10 22 10 C26 10 28 16 28 22"/><path d="M46 22 C48 14 46 10 42 10 C38 10 36 16 36 22"/><circle cx="26" cy="38" r="1.8" fill="currentColor" stroke="none"/><circle cx="38" cy="38" r="1.8" fill="currentColor" stroke="none"/><path d="M30 43 L32 45 L34 43" stroke="#ff9eab"/><path d="M32 45 Q29 49 26 47"/><path d="M32 45 Q35 49 38 47"/></svg>`,

  // 饮食：汉堡猫（猫头从汉堡里探出，无文字）
  diet: `<svg viewBox="0 0 64 64" width="34" height="34" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10 40 Q10 24 32 24 Q54 24 54 40" fill="#FE8F29" stroke="currentColor"/><path d="M10 40 L54 40" stroke="currentColor"/><path d="M14 44 Q32 50 50 44" fill="#FE8F29" stroke="currentColor"/><path d="M14 50 L50 50" stroke="currentColor"/><circle cx="26" cy="32" r="1.8" fill="currentColor" stroke="none"/><circle cx="38" cy="32" r="1.8" fill="currentColor" stroke="none"/><path d="M28 36 L30 38 L32 36 L34 38 L36 36" stroke="#ff9eab"/><path d="M18 22 C16 16 18 13 21 14"/><path d="M46 22 C48 16 46 13 43 14"/></svg>`,

  // 学习：加油鸭小人
  study: `<svg viewBox="0 0 64 64" width="34" height="34" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="32" cy="20" r="12" fill="#FAE593"/><path d="M26 16 L30 20 L26 24"/><circle cx="40" cy="20" r="3" fill="currentColor" stroke="none"/><path d="M32 32 L32 50"/><path d="M22 38 L32 42 L42 38"/><path d="M24 50 L40 50"/><path d="M44 12 L50 6"/><path d="M50 12 L44 6"/></svg>`,

  // 健身：伸懒腰的猫
  fitness: `<svg viewBox="0 0 64 64" width="34" height="34" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><path d="M16 44 C16 34 22 30 32 30 C42 30 48 34 48 44 C48 50 44 54 32 54 C20 54 16 50 16 44 Z"/><path d="M14 22 C12 14 14 10 18 10 C22 10 24 16 24 22"/><path d="M50 22 C52 14 50 10 46 10 C42 10 40 16 40 22"/><circle cx="24" cy="38" r="1.8" fill="currentColor" stroke="none"/><circle cx="40" cy="38" r="1.8" fill="currentColor" stroke="none"/><path d="M28 42 L30 44 L32 42 L34 44 L36 42" stroke="#ff9eab"/><path d="M8 40 Q4 36 6 28"/><path d="M56 40 Q60 36 58 28"/></svg>`,

  // 设置：趴着睡觉的猫
  settings: `<svg viewBox="0 0 64 64" width="34" height="34" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 44 C14 36 20 32 32 32 C44 32 50 36 50 44 C50 50 46 54 32 54 C18 54 14 50 14 44 Z"/><path d="M14 26 C12 18 14 14 18 14 C22 14 24 20 24 26"/><path d="M50 26 C52 18 50 14 46 14 C42 14 40 20 40 26"/><path d="M24 40 L28 40"/><path d="M36 40 L40 40"/><path d="M28 46 Q32 49 36 46" stroke="#ff9eab"/><path d="M8 46 Q4 44 4 40"/><path d="M56 46 Q60 44 60 40"/></svg>`,
};
