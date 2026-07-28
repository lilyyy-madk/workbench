/* ============================================
   主应用 - 导航与初始化
   ============================================ */
const App = {
  currentPage: 'todo',
  initialized: false,

  init() {
    if (this.initialized) return;
    this.initialized = true;

    // 日期重置检测
    Utils.checkDailyReset();

    // 渲染日期显示
    this.renderDateDisplay();

    // 绑定导航
    this.bindNavigation();

    // 绑定侧边栏折叠
    this.bindSidebarToggle();

    // 绑定移动端菜单
    this.bindMobileMenu();

    // 初始化各模块
    TodoPage.init();
    WaterPage.init();
    DietPage.init();
    StudyPage.init();
    FitnessPage.init();
    SettingsPage.init();

    // 路由处理
    this.handleRoute();

    // 启动提醒检测
    this.startReminderCheck();

    // 监听 hash 变化
    window.addEventListener('hashchange', () => this.handleRoute());
  },

  renderDateDisplay() {
    const el = document.getElementById('dateDisplay');
    if (!el) return;
    const d = new Date();
    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
    el.textContent = `${d.getMonth() + 1}月${d.getDate()}日 · 周${weekdays[d.getDay()]}`;
  },

  bindNavigation() {
    // 侧边栏导航
    document.querySelectorAll('.sidebar .nav-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const page = item.dataset.page;
        this.navigateTo(page);
        // 移动端关闭侧边栏
        if (window.innerWidth <= 768) {
          this.closeMobileSidebar();
        }
      });
    });

    // 底部导航
    document.querySelectorAll('.bottom-nav .bottom-nav-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        this.navigateTo(item.dataset.page);
      });
    });
  },

  navigateTo(page) {
    this.currentPage = page;
    window.location.hash = page;
  },

  handleRoute() {
    const hash = window.location.hash.replace('#', '') || 'todo';
    const validPages = ['todo', 'water', 'diet', 'study', 'fitness', 'settings'];
    const page = validPages.includes(hash) ? hash : 'todo';
    this.currentPage = page;

    // 更新导航高亮
    document.querySelectorAll('.nav-item').forEach(el => {
      el.classList.toggle('active', el.dataset.page === page);
    });
    document.querySelectorAll('.bottom-nav-item').forEach(el => {
      el.classList.toggle('active', el.dataset.page === page);
    });

    // 切换页面
    document.querySelectorAll('.page').forEach(el => {
      el.classList.remove('active');
    });
    const target = document.getElementById(`page-${page}`);
    if (target) {
      target.classList.add('active');
      // 触发页面刷新
      this.refreshPage(page);
    }

    // 更新移动端标题（带 emoji 图标）+ 顶部栏配色 + theme-color
    const pageMeta = {
      todo:    { title: '✅ 待办事项', color: '#E4F6A9', deep: '#5ba85b', theme: '#7dc67d' },
      water:   { title: '💧 喝水提醒', color: '#CAEBED', deep: '#4ea8c9', theme: '#63BAD9' },
      diet:    { title: '🍽️ 饮食记录', color: '#FED0D6', deep: '#F8819B', theme: '#FF82A2' },
      study:   { title: '📚 每日学习', color: '#c9a063', deep: '#ffffff', theme: '#c9a063' },
      fitness: { title: '🏃 健身计划', color: '#FAE593', deep: '#FE8F29', theme: '#FE8F29' },
      settings:{ title: '⚙️ 设置',     color: '#f0f0ec', deep: '#8a9a8a', theme: '#7dc67d' },
    };
    const meta = pageMeta[page] || pageMeta.todo;
    const mobileTitle = document.getElementById('mobileTitle');
    if (mobileTitle) mobileTitle.textContent = meta.title;
    const mobileDate = document.getElementById('mobileDate');
    if (mobileDate) {
      const d = new Date();
      const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
      mobileDate.textContent = `${d.getMonth() + 1}月${d.getDate()}日 · ${weekdays[d.getDay()]}`;
    }
    // 顶部栏背景跟随页面主题色（与添加按钮色系一致）
    const mobileHeader = document.querySelector('.mobile-header');
    if (mobileHeader) {
      mobileHeader.style.background = meta.color;
      mobileHeader.style.borderColor = meta.color;
    }
    // 同时更新 mobile-title 文字深色，保证对比度
    if (mobileTitle) mobileTitle.style.color = meta.deep;
    const mobileDateEl = document.getElementById('mobileDate');
    if (mobileDateEl) mobileDateEl.style.color = meta.deep;
    // 菜单按钮图标颜色跟随
    const menuBtn = document.getElementById('menuBtn');
    if (menuBtn) menuBtn.style.color = meta.deep;
    // 状态栏 theme-color
    const themeMeta = document.querySelector('meta[name="theme-color"]');
    if (themeMeta) themeMeta.setAttribute('content', meta.theme);

    // 滚动到顶部
    const container = document.getElementById('pageContainer');
    if (container) container.scrollTop = 0;
  },

  refreshPage(page) {
    switch (page) {
      case 'todo': TodoPage.render(); break;
      case 'water': WaterPage.render(); break;
      case 'diet': DietPage.render(); break;
      case 'study': StudyPage.render(); break;
      case 'fitness': FitnessPage.render(); break;
      case 'settings': SettingsPage.render(); break;
    }
  },

  bindSidebarToggle() {
    const toggle = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('sidebar');
    if (!toggle || !sidebar) return;
    const settings = Utils.getSettings();
    if (settings.sidebarCollapsed) sidebar.classList.add('collapsed');
    toggle.addEventListener('click', () => {
      sidebar.classList.toggle('collapsed');
      settings.sidebarCollapsed = sidebar.classList.contains('collapsed');
      Utils.saveSettings(settings);
    });
  },

  bindMobileMenu() {
    const menuBtn = document.getElementById('menuBtn');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    if (!menuBtn) return;
    menuBtn.addEventListener('click', () => {
      sidebar.classList.toggle('show');
      overlay.classList.toggle('show');
    });
    if (overlay) {
      overlay.addEventListener('click', () => this.closeMobileSidebar());
    }
  },

  closeMobileSidebar() {
    document.getElementById('sidebar')?.classList.remove('show');
    document.getElementById('overlay')?.classList.remove('show');
  },

  // ===== 提醒检测（每分钟） =====
  startReminderCheck() {
    // 先检测一次
    this.checkReminders();
    // 每分钟检测
    setInterval(() => this.checkReminders(), 60000);
  },

  checkReminders() {
    const now = Utils.nowTime();
    const today = Utils.todayKey();

    // 喝水提醒 9:30 和 15:30
    if (now === '09:30' || now === '15:30') {
      const waterKey = `water_reminded_${today}_${now}`;
      if (!Utils.get(waterKey)) {
        Utils.set(waterKey, true);
        Utils.sendNotification('喝水提醒 💧', '该喝杯水啦！保持水分摄入～');
        WaterPage.showReminderCard();
      }
    }

    // 学习提醒 19:00
    if (now === '19:00') {
      const studyKey = `study_reminded_${today}`;
      if (!Utils.get(studyKey)) {
        Utils.set(studyKey, true);
        Utils.sendNotification('学习提醒 📚', '该开始学习啦！');
      }
    }

    // 学习强制弹窗 20:00
    if (now === '20:00') {
      const settings = Utils.getSettings();
      if (settings.studyModalShownDate !== today) {
        const studyData = StudyPage.getData(today);
        const allDone = studyData.tasks.length > 0 && studyData.tasks.every(t => t.done);
        const noneDone = studyData.tasks.length === 0 || studyData.tasks.every(t => !t.done);
        if (noneDone && !allDone) {
          settings.studyModalShownDate = today;
          Utils.saveSettings(settings);
          StudyPage.showForceModal();
        }
      }
    }
  },
};

/* ============================================
   1. 待办事项页面
   ============================================ */
const TodoPage = {
  PRESET_POOL: ['运动', '行测学习', '申论学习', '12点前睡觉', '敷面膜', '打扫房间'],
  calendarMonth: null,

  init() {
    // 确保当日数据存在
    this.getData(Utils.todayKey());
    const now = new Date();
    this.calendarMonth = { year: now.getFullYear(), month: now.getMonth() };
  },

  getData(dateKey) {
    let data = Utils.getByDate('todos', dateKey);
    if (!data) {
      // 每日首次：随机抽取4个预设
      const picked = Utils.shuffle(this.PRESET_POOL).slice(0, 4);
      data = {
        tasks: picked.map(name => ({ id: this.genId(), name, done: false, preset: true })),
      };
      Utils.setByDate('todos', dateKey, data);
    }
    return data;
  },

  genId() {
    return 't_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
  },

  render() {
    const container = document.getElementById('page-todo');
    if (!container) return;
    const today = Utils.todayKey();
    const data = this.getData(today);
    const doneCount = data.tasks.filter(t => t.done).length;
    const total = data.tasks.length;
    const pct = total > 0 ? Math.round((doneCount / total) * 100) : 0;

    container.innerHTML = `
      <div class="page-header">
        <h1 class="page-title">✅ 待办事项 <span class="page-title-decor">${PAGE_DECORATIONS.todo}</span></h1>
        <p class="page-subtitle">今天有 ${total} 件事要做，已完成 ${doneCount} 件</p>
      </div>

      <div class="card todo-progress-card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
          <span style="font-size:13px;color:var(--text-secondary);font-weight:600">今日完成进度</span>
          <span class="tag tag-green">${pct}%</span>
        </div>
        <div class="todo-progress-text">${doneCount}<small>/${total}</small></div>
        <div class="progress-bar" style="margin-top:12px">
          <div class="progress-bar-fill" style="width:${pct}%;background:linear-gradient(90deg,var(--green-primary),var(--green-deep))"></div>
        </div>
      </div>

      <div class="card">
        <div class="card-title">
          ✅ 任务清单
        </div>
        <div class="todo-list" id="todoList">
          ${data.tasks.map(t => this.renderItem(t)).join('')}
        </div>
        ${data.tasks.length === 0 ? '<div class="empty-state"><div class="empty-state-icon">📝</div><div class="empty-state-text">还没有任务，添加一个吧～</div></div>' : ''}
        <div class="todo-add-row">
          <input class="input" id="todoInput" placeholder="添加新任务..." maxlength="30" />
          <button class="btn btn-primary" id="todoAddBtn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            添加
          </button>
        </div>
      </div>

      <div class="card">
        <div class="card-title">
          📅 历史记录
        </div>
        ${this.renderCalendar()}
      </div>
    `;

    this.bindEvents();
  },

  renderItem(task) {
    return `
      <div class="todo-item ${task.done ? 'done' : ''}" data-id="${task.id}">
        <div class="todo-checkbox ${task.done ? 'checked' : ''}" data-action="toggle" data-id="${task.id}">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <span class="todo-text">${Utils.escapeHtml(task.name)}</span>
        ${task.preset ? '<span class="todo-badge">预设</span>' : '<span class="todo-badge custom">自定义</span>'}
        <button class="todo-delete" data-action="delete" data-id="${task.id}" aria-label="删除">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
    `;
  },

  bindEvents() {
    const container = document.getElementById('page-todo');
    if (!container) return;

    // 勾选/取消
    container.querySelectorAll('[data-action="toggle"]').forEach(el => {
      el.addEventListener('click', () => this.toggleTask(el.dataset.id));
    });

    // 删除
    container.querySelectorAll('[data-action="delete"]').forEach(el => {
      el.addEventListener('click', async () => {
        const taskEl = el.closest('.todo-item');
        const taskName = taskEl.querySelector('.todo-text').textContent;
        const ok = await Utils.confirm(`确定要删除「${taskName}」吗？`, '删除任务');
        if (ok) this.deleteTask(el.dataset.id);
      });
    });

    // 添加
    const addBtn = document.getElementById('todoAddBtn');
    const input = document.getElementById('todoInput');
    if (addBtn) addBtn.addEventListener('click', () => this.addTask());
    if (input) {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') this.addTask();
      });
    }

    // 历史日历导航
    container.querySelectorAll('[data-action="prev-month-todo"]').forEach(el => {
      el.addEventListener('click', () => this.changeMonth(-1));
    });
    container.querySelectorAll('[data-action="next-month-todo"]').forEach(el => {
      el.addEventListener('click', () => this.changeMonth(1));
    });
    container.querySelectorAll('.calendar-day[data-date]').forEach(el => {
      el.addEventListener('click', () => this.showDayDetail(el.dataset.date));
    });
  },

  toggleTask(id) {
    const today = Utils.todayKey();
    const data = this.getData(today);
    const task = data.tasks.find(t => t.id === id);
    if (task) {
      task.done = !task.done;
      Utils.setByDate('todos', today, data);
      this.render();
    }
  },

  deleteTask(id) {
    const today = Utils.todayKey();
    const data = this.getData(today);
    data.tasks = data.tasks.filter(t => t.id !== id);
    Utils.setByDate('todos', today, data);
    Utils.toast('已删除任务', 'success');
    this.render();
  },

  addTask() {
    const input = document.getElementById('todoInput');
    if (!input) return;
    const name = input.value.trim();
    if (!name) {
      Utils.toast('请输入任务内容', 'warning');
      input.focus();
      return;
    }
    const today = Utils.todayKey();
    const data = this.getData(today);
    data.tasks.push({ id: this.genId(), name, done: false, preset: false });
    Utils.setByDate('todos', today, data);
    input.value = '';
    this.render();
    Utils.toast('任务已添加', 'success');
  },

  renderCalendar() {
    const { year, month } = this.calendarMonth;
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = Utils.getMonthDays(year, month);
    const today = Utils.todayKey();
    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];

    let cells = '';
    for (let i = 0; i < firstDay; i++) cells += '<div class="calendar-day empty"></div>';
    for (let d = 1; d <= daysInMonth; d++) {
      const dateKey = `${year}-${Utils.pad(month + 1)}-${Utils.pad(d)}`;
      const data = Utils.getByDate('todos', dateKey);
      const hasData = data && data.tasks && data.tasks.length > 0;
      const doneCount = hasData ? data.tasks.filter(t => t.done).length : 0;
      const total = hasData ? data.tasks.length : 0;
      const allDone = hasData && total > 0 && doneCount === total;
      cells += `
        <div class="calendar-day ${dateKey === today ? 'today' : ''} ${hasData ? 'has-data' : ''}"
             data-date="${dateKey}" style="${allDone ? 'background:var(--green-light);color:var(--green-deep)' : hasData ? 'background:var(--beige)' : ''}">
          <span class="calendar-day-num">${d}</span>
          ${hasData ? `<span style="font-size:9px;font-weight:600">${doneCount}/${total}</span>` : ''}
        </div>
      `;
    }

    return `
      <div class="calendar-header">
        <button class="calendar-nav-btn" data-action="prev-month-todo">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
        </button>
        <span class="calendar-month">${year}年${month + 1}月</span>
        <button class="calendar-nav-btn" data-action="next-month-todo">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
        </button>
      </div>
      <div class="calendar-grid">
        ${weekdays.map(w => `<div class="calendar-weekday">${w}</div>`).join('')}
        ${cells}
      </div>
    `;
  },

  changeMonth(delta) {
    let { year, month } = this.calendarMonth;
    month += delta;
    if (month < 0) { month = 11; year--; }
    if (month > 11) { month = 0; year++; }
    this.calendarMonth = { year, month };
    this.render();
  },

  showDayDetail(dateKey) {
    const data = Utils.getByDate('todos', dateKey);
    const isToday = dateKey === Utils.todayKey();
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-box" style="max-width:380px">
        <div class="modal-title">待办记录 · ${dateKey}${isToday ? '（今日）' : ''}</div>
        <div class="modal-body">
          ${data && data.tasks && data.tasks.length > 0
            ? data.tasks.map(t => `<div style="display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid var(--divider);font-size:14px">
                <span style="width:18px;height:18px;border-radius:50%;border:2px solid ${t.done?'var(--green-primary)':'var(--text-light)'};background:${t.done?'var(--green-primary)':'transparent'};display:flex;align-items:center;justify-content:center;color:white;font-size:11px">${t.done?'✓':''}</span>
                <span style="${t.done?'text-decoration:line-through;color:var(--text-light)':''}">${Utils.escapeHtml(t.name)}</span>
                ${t.preset ? '<span class="todo-badge">预设</span>' : '<span class="todo-badge custom">自定义</span>'}
              </div>`).join('') + `
              <div style="display:flex;justify-content:space-between;padding:12px 0;font-weight:700">
                <span>完成情况</span><span style="color:var(--green-deep)">${data.tasks.filter(t=>t.done).length}/${data.tasks.length}</span>
              </div>
            `
            : '<div style="text-align:center;color:var(--text-light);padding:20px 0">当天暂无待办记录</div>'
          }
        </div>
        <div class="modal-actions">
          <button class="btn btn-primary" data-act="close">关闭</button>
        </div>
      </div>
    `;
    document.getElementById('modalContainer').appendChild(modal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal || e.target.closest('[data-act="close"]')) modal.remove();
    });
  },
};

/* ============================================
   2. 喝水提醒页面
   ============================================ */
const WaterPage = {
  DAILY_GOAL: 1000,
  selectedDrink: 'water',
  calendarMonth: null, // {year, month}
  selectedDate: null,  // 日历选中的日期

  init() {
    this.getData(Utils.todayKey());
    const now = new Date();
    this.calendarMonth = { year: now.getFullYear(), month: now.getMonth() };
    this.selectedDate = Utils.todayKey();
  },

  getData(dateKey) {
    let data = Utils.getByDate('water', dateKey);
    if (!data) {
      data = { records: [], total: 0 };
      Utils.setByDate('water', dateKey, data);
    }
    return data;
  },

  render() {
    const container = document.getElementById('page-water');
    if (!container) return;
    const today = Utils.todayKey();
    const data = this.getData(today);
    const total = data.total || 0;
    const pct = Math.min(100, Math.round((total / this.DAILY_GOAL) * 100));
    const circumference = 2 * Math.PI * 70;

    container.innerHTML = `
      <div class="page-header">
        <h1 class="page-title">💧 喝水提醒 <span class="page-title-decor">${PAGE_DECORATIONS.water}</span></h1>
        <p class="page-subtitle">每日目标 ${this.DAILY_GOAL}ml · 9:30 和 15:30 提醒</p>
      </div>

      <div class="card water-hero">
        <div class="progress-ring-wrap">
          <div class="progress-ring">
            <svg width="180" height="180" viewBox="0 0 180 180">
              <defs>
                <linearGradient id="waterGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="#63BAD9"/>
                  <stop offset="100%" stop-color="#7dc67d"/>
                </linearGradient>
              </defs>
              <circle class="ring-bg" cx="90" cy="90" r="70" stroke-width="12"/>
              <circle class="ring-fill" cx="90" cy="90" r="70" stroke-width="12"
                stroke="url(#waterGrad)"
                stroke-dasharray="${circumference}"
                stroke-dashoffset="${circumference - (circumference * pct / 100)}"/>
            </svg>
            <div class="ring-center">
              <div class="ring-value">${pct}<span style="font-size:18px">%</span></div>
              <div class="ring-unit">${total} / ${this.DAILY_GOAL} ml</div>
            </div>
          </div>
          <div class="water-progress-text">已完成 <strong>${pct}%</strong> · 当前 <strong>${total}ml</strong> / ${this.DAILY_GOAL}ml</div>
        </div>
      </div>

      <div class="card">
        <div class="card-title">
          💧 记录饮水
        </div>
        <div class="drink-selector">
          ${DRINK_TYPES.map(d => `
            <div class="drink-option ${this.selectedDrink === d.id ? 'selected' : ''}" data-drink="${d.id}">
              <span class="drink-option-icon">${d.icon}</span>
              <span class="drink-option-name">${d.name}</span>
            </div>
          `).join('')}
        </div>
        <div class="water-add-row">
          <input class="input" type="number" id="waterAmount" placeholder="饮水量 (0-1000ml)" min="0" max="1000" />
          <button class="btn btn-blue" id="waterAddBtn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            添加
          </button>
        </div>
        ${data.records.length > 0 ? `
          <div style="margin-top:16px;border-top:1px solid var(--divider);padding-top:12px">
            <div style="font-size:13px;color:var(--text-secondary);font-weight:600;margin-bottom:8px">今日记录</div>
            ${data.records.slice().reverse().map(r => `
              <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;font-size:13px">
                <span>${DRINK_TYPES.find(d=>d.id===r.drink)?.icon||''} ${DRINK_TYPES.find(d=>d.id===r.drink)?.name||''}</span>
                <span style="color:var(--blue-mid);font-weight:700">${r.amount}ml</span>
              </div>
            `).join('')}
          </div>
        ` : ''}
      </div>

      <div class="card">
        <div class="card-title">
          📆 饮水日历
        </div>
        ${this.renderCalendar()}
      </div>

      <div class="card">
        <div class="card-title">
          📊 统计面板
          <span class="tag tag-blue" style="margin-left:auto">${this.selectedDate === today ? '今日' : this.selectedDate}</span>
        </div>
        ${this.renderStats()}
      </div>
    `;

    this.bindEvents();
  },

  renderCalendar() {
    const { year, month } = this.calendarMonth;
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = Utils.getMonthDays(year, month);
    const today = Utils.todayKey();
    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];

    let cells = '';
    // 空格
    for (let i = 0; i < firstDay; i++) {
      cells += '<div class="calendar-day empty"></div>';
    }
    // 日期
    for (let d = 1; d <= daysInMonth; d++) {
      const dateKey = `${year}-${Utils.pad(month + 1)}-${Utils.pad(d)}`;
      const data = Utils.getByDate('water', dateKey);
      const hasData = data && data.records && data.records.length > 0;
      let icon = '';
      if (hasData) {
        // 找出当日摄入量最大的饮品
        const drinkTotals = {};
        data.records.forEach(r => {
          drinkTotals[r.drink] = (drinkTotals[r.drink] || 0) + r.amount;
        });
        const topDrink = Object.entries(drinkTotals).sort((a, b) => b[1] - a[1])[0];
        const drink = DRINK_TYPES.find(dt => dt.id === topDrink[0]);
        icon = drink ? drink.icon : '';
      }
      cells += `
        <div class="calendar-day ${dateKey === today ? 'today' : ''} ${dateKey === this.selectedDate ? 'selected' : ''} ${hasData ? 'has-data' : ''}"
             data-date="${dateKey}">
          ${icon ? `<span class="calendar-day-icon">${icon}</span>` : ''}
          <span class="calendar-day-num">${d}</span>
        </div>
      `;
    }

    return `
      <div class="calendar-header">
        <button class="calendar-nav-btn" data-action="prev-month">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
        </button>
        <span class="calendar-month">${year}年${month + 1}月</span>
        <button class="calendar-nav-btn" data-action="next-month">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
        </button>
      </div>
      <div class="calendar-grid">
        ${weekdays.map(w => `<div class="calendar-weekday">${w}</div>`).join('')}
        ${cells}
      </div>
    `;
  },

  renderStats() {
    const selectedDate = this.selectedDate;
    const selectedData = Utils.getByDate('water', selectedDate);

    // 柱状图：显示选中日期所在月的每日饮水总量（最近7天有数据的）
    const { year, month } = this.calendarMonth;
    const daysInMonth = Utils.getMonthDays(year, month);
    const today = Utils.todayKey();
    const todayDate = Utils.parseDate(today);

    // 获取最近7天的数据
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const dt = new Date(todayDate);
      dt.setDate(todayDate.getDate() - i);
      const dk = Utils.formatDate(dt);
      const d = Utils.getByDate('water', dk);
      last7Days.push({
        date: dk,
        label: Utils.formatDateShort(dt),
        total: d ? (d.total || 0) : 0,
      });
    }
    const maxTotal = Math.max(...last7Days.map(d => d.total), this.DAILY_GOAL);

    // 饮品累计（根据选中日期范围：如果选中今日显示今日，否则显示当月）
    const isToday = selectedDate === today;
    const drinkTotals = {};
    let periodLabel = isToday ? '今日' : `${month + 1}月`;

    if (isToday) {
      if (selectedData && selectedData.records) {
        selectedData.records.forEach(r => {
          drinkTotals[r.drink] = (drinkTotals[r.drink] || 0) + r.amount;
        });
      }
    } else {
      // 当月累计
      for (let d = 1; d <= daysInMonth; d++) {
        const dk = `${year}-${Utils.pad(month + 1)}-${Utils.pad(d)}`;
        const dData = Utils.getByDate('water', dk);
        if (dData && dData.records) {
          dData.records.forEach(r => {
            drinkTotals[r.drink] = (drinkTotals[r.drink] || 0) + r.amount;
          });
        }
      }
    }

    const totalDrinkAmount = Object.values(drinkTotals).reduce((a, b) => a + b, 0);

    return `
      <div style="margin-bottom:20px">
        <div style="font-size:13px;color:var(--text-secondary);font-weight:600;margin-bottom:10px">近7日饮水总量 ${periodLabel === '今日' ? '· 今日' : ''}</div>
        <div class="bar-chart">
          ${last7Days.map(d => `
            <div class="bar-chart-item">
              <div class="bar-chart-bar" style="height:${maxTotal > 0 ? (d.total / maxTotal * 100) : 0}%;background:linear-gradient(180deg,var(--blue-mid),var(--cyan-light))" title="${d.total}ml"></div>
              <div class="bar-chart-label">${d.label}</div>
            </div>
          `).join('')}
        </div>
      </div>

      <div style="border-top:1px solid var(--divider);padding-top:16px">
        <div style="font-size:13px;color:var(--text-secondary);font-weight:600;margin-bottom:12px">
          ${periodLabel}各类饮品累计 ${totalDrinkAmount > 0 ? `· 共 ${totalDrinkAmount}ml` : ''}
        </div>
        ${totalDrinkAmount === 0
          ? '<div class="empty-state" style="padding:16px"><div class="empty-state-text">暂无饮品记录</div></div>'
          : `<div class="stat-bar-list">
              ${DRINK_TYPES.map(dt => {
                const amt = drinkTotals[dt.id] || 0;
                if (amt === 0) return '';
                const pct = totalDrinkAmount > 0 ? Math.round(amt / totalDrinkAmount * 100) : 0;
                return `
                  <div class="stat-bar-item">
                    <span class="stat-bar-icon">${dt.icon}</span>
                    <div class="stat-bar-info">
                      <div class="stat-bar-label">
                        <span class="name">${dt.name}</span>
                        <span class="value">${amt}ml · ${pct}%</span>
                      </div>
                      <div class="stat-bar-track">
                        <div class="stat-bar-progress" style="width:${pct}%;background:${dt.color}"></div>
                      </div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>`
        }
      </div>
    `;
  },

  bindEvents() {
    const container = document.getElementById('page-water');
    if (!container) return;

    // 选择饮品
    container.querySelectorAll('.drink-option').forEach(el => {
      el.addEventListener('click', () => {
        this.selectedDrink = el.dataset.drink;
        container.querySelectorAll('.drink-option').forEach(o => o.classList.remove('selected'));
        el.classList.add('selected');
      });
    });

    // 添加饮水
    const addBtn = document.getElementById('waterAddBtn');
    const amountInput = document.getElementById('waterAmount');
    if (addBtn) addBtn.addEventListener('click', () => this.addWater());
    if (amountInput) {
      amountInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') this.addWater();
      });
    }

    // 日历导航
    container.querySelectorAll('[data-action="prev-month"]').forEach(el => {
      el.addEventListener('click', () => this.changeMonth(-1));
    });
    container.querySelectorAll('[data-action="next-month"]').forEach(el => {
      el.addEventListener('click', () => this.changeMonth(1));
    });

    // 点击日期
    container.querySelectorAll('.calendar-day[data-date]').forEach(el => {
      el.addEventListener('click', () => this.showDayDetail(el.dataset.date));
    });
  },

  addWater() {
    const input = document.getElementById('waterAmount');
    if (!input) return;
    const amount = parseInt(input.value);
    if (!amount || amount <= 0) {
      Utils.toast('请输入有效的饮水量', 'warning');
      input.focus();
      return;
    }
    if (amount > 1000) {
      Utils.toast('单次饮水量不能超过1000ml', 'warning');
      return;
    }
    const today = Utils.todayKey();
    const data = this.getData(today);
    data.records.push({ drink: this.selectedDrink, amount, time: new Date().toISOString() });
    data.total = data.records.reduce((s, r) => s + r.amount, 0);
    Utils.setByDate('water', today, data);
    input.value = '';
    this.render();
    const drink = DRINK_TYPES.find(d => d.id === this.selectedDrink);
    Utils.toast(`已记录 ${drink.name} ${amount}ml`, 'success');
  },

  changeMonth(delta) {
    let { year, month } = this.calendarMonth;
    month += delta;
    if (month < 0) { month = 11; year--; }
    if (month > 11) { month = 0; year++; }
    this.calendarMonth = { year, month };
    this.render();
  },

  showDayDetail(dateKey) {
    this.selectedDate = dateKey;
    const data = Utils.getByDate('water', dateKey) || { records: [], total: 0 };
    const drink = this.selectedDrink;
    const dateObj = Utils.parseDate(dateKey);
    const isToday = dateKey === Utils.todayKey();

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-box">
        <div class="modal-title">补水记录 · ${dateKey}</div>
        <div class="modal-body">
          ${data.records && data.records.length > 0
            ? data.records.map(r => {
                const dt = DRINK_TYPES.find(d => d.id === r.drink);
                return `<div style="display:flex;justify-content:space-between;padding:6px 0;font-size:14px"><span>${dt?.icon||''} ${dt?.name||''}</span><span style="font-weight:700;color:var(--blue-mid)">${r.amount}ml</span></div>`;
              }).join('')
            : '<div style="color:var(--text-light);text-align:center;padding:12px 0">当天暂无记录</div>'
          }
          <div style="border-top:1px solid var(--divider);margin-top:8px;padding-top:8px;display:flex;justify-content:space-between;font-weight:700">
            <span>合计</span><span style="color:var(--blue-mid)">${data.total||0}ml</span>
          </div>
        </div>
        <div style="margin:16px 0">
          <div style="font-size:13px;font-weight:600;margin-bottom:8px">添加记录</div>
          <div class="drink-selector" style="margin-bottom:10px" id="modalDrinkSelector">
            ${DRINK_TYPES.map(d => `<div class="drink-option ${d.id===drink?'selected':''}" data-drink="${d.id}"><span class="drink-option-icon">${d.icon}</span><span class="drink-option-name">${d.name}</span></div>`).join('')}
          </div>
          <input class="input" type="number" id="modalWaterAmount" placeholder="饮水量(ml)" min="0" max="1000" />
        </div>
        <div class="modal-actions">
          <button class="btn btn-outline" data-act="close">关闭</button>
          <button class="btn btn-blue" data-act="save">保存</button>
        </div>
      </div>
    `;
    document.getElementById('modalContainer').appendChild(modal);

    let modalSelectedDrink = drink;
    modal.querySelectorAll('#modalDrinkSelector .drink-option').forEach(el => {
      el.addEventListener('click', () => {
        modalSelectedDrink = el.dataset.drink;
        modal.querySelectorAll('#modalDrinkSelector .drink-option').forEach(o => o.classList.remove('selected'));
        el.classList.add('selected');
      });
    });

    modal.addEventListener('click', async (e) => {
      if (e.target === modal) {
        modal.remove();
        this.render();
        return;
      }
      const act = e.target.closest('[data-act]')?.dataset.act;
      if (act === 'close') {
        modal.remove();
        this.render();
      }
      if (act === 'save') {
        const amountInput = modal.querySelector('#modalWaterAmount');
        const amount = parseInt(amountInput.value);
        if (!amount || amount <= 0) {
          Utils.toast('请输入有效饮水量', 'warning');
          return;
        }
        if (amount > 1000) {
          Utils.toast('单次不能超过1000ml', 'warning');
          return;
        }
        let dayData = Utils.getByDate('water', dateKey) || { records: [], total: 0 };
        dayData.records.push({ drink: modalSelectedDrink, amount, time: new Date().toISOString() });
        dayData.total = dayData.records.reduce((s, r) => s + r.amount, 0);
        Utils.setByDate('water', dateKey, dayData);
        Utils.toast(`已记录 ${amount}ml`, 'success');
        modal.remove();
        this.render();
      }
    });
  },

  showReminderCard() {
    Utils.toast('💧 喝水时间到！记得补充水分～', 'info', 5000);
  },
};

/* ============================================
   3. 饮食记录页面
   ============================================ */
const DietPage = {
  MEALS: [
    { id: 'breakfast', name: '早餐', icon: '🌅' },
    { id: 'lunch', name: '午餐', icon: '☀️' },
    { id: 'dinner', name: '晚餐', icon: '🌙' },
    { id: 'snack', name: '加餐', icon: '🍪' },
  ],
  currentMeal: 'breakfast',
  calendarMonth: null,

  init() {
    this.getData(Utils.todayKey());
    const now = new Date();
    this.calendarMonth = { year: now.getFullYear(), month: now.getMonth() };
  },

  getData(dateKey) {
    let data = Utils.getByDate('diet', dateKey);
    if (!data) {
      data = {
        breakfast: [],
        lunch: [],
        dinner: [],
        snack: [],
      };
      Utils.setByDate('diet', dateKey, data);
    }
    return data;
  },

  getCustomFoods() {
    return Utils.get('custom_foods', []);
  },

  addCustomFood(name, kcal) {
    const customs = this.getCustomFoods();
    if (!customs.find(f => f.name === name)) {
      customs.push({ name, kcal });
      Utils.set('custom_foods', customs);
    }
  },

  getAllFoods() {
    return [...FOOD_DB, ...this.getCustomFoods()];
  },

  render() {
    const container = document.getElementById('page-diet');
    if (!container) return;
    const today = Utils.todayKey();
    const data = this.getData(today);

    const dayTotal = this.MEALS.reduce((sum, m) => {
      return sum + (data[m.id] || []).reduce((s, f) => s + f.kcal, 0);
    }, 0);

    container.innerHTML = `
      <div class="page-header">
        <h1 class="page-title">🍽️ 饮食记录 <span class="page-title-decor">${PAGE_DECORATIONS.diet}</span></h1>
        <p class="page-subtitle">记录每日饮食，自动估算热量</p>
      </div>

      <div class="card diet-total-card">
        <div class="diet-total-value">${dayTotal}</div>
        <div class="diet-total-unit">kcal</div>
        <div class="diet-total-label">今日总摄入热量</div>
      </div>

      <div class="card meal-selector-card">
        <div class="card-title">🍽️ 选择餐次</div>
        <div class="meal-selector">
          ${this.MEALS.map(m => {
            const kcal = (data[m.id] || []).reduce((s, f) => s + f.kcal, 0);
            return `
              <div class="meal-option ${this.currentMeal === m.id ? 'selected' : ''}" data-meal="${m.id}">
                <span class="meal-option-icon">${m.icon}</span>
                <span class="meal-option-name">${m.name}</span>
                <span class="meal-option-kcal">${kcal} kcal</span>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <div class="card">
        <div class="card-title">
          ➕ 添加食物
        </div>
        <div class="food-add-row">
          <div class="food-search-wrap">
            <input class="input" id="foodSearch" placeholder="搜索食物..." autocomplete="off" />
            <div class="food-suggestions" id="foodSuggestions"></div>
          </div>
          <input class="input" type="number" id="foodWeight" placeholder="重量(g)" value="100" min="1" />
          <div style="display:flex;align-items:center;justify-content:center">
            <span style="font-size:14px;font-weight:700;color:var(--pink-red)" id="foodKcalPreview">0 kcal</span>
          </div>
          <button class="btn btn-pink" id="foodAddBtn">添加</button>
        </div>
        <div style="margin-top:8px;font-size:12px;color:var(--text-light)">
          💡 可搜索内置食物或自定义。点击右侧"+"添加自定义食材。
          <button class="btn btn-sm btn-outline" id="customFoodBtn" style="margin-left:8px">+ 自定义食材</button>
        </div>
      </div>

      <div class="card">
        <div class="card-title">
          ${this.MEALS.find(m => m.id === this.currentMeal).icon}
          ${this.MEALS.find(m => m.id === this.currentMeal).name}清单
        </div>
        <div id="mealFoodList">
          ${this.renderMealList(data[this.currentMeal] || [])}
        </div>
      </div>

      <div class="card">
        <div class="card-title">
          📅 历史记录
        </div>
        ${this.renderCalendar()}
      </div>
    `;

    this.bindEvents();
  },

  renderMealList(foods) {
    if (foods.length === 0) {
      return '<div class="empty-state"><div class="empty-state-icon">🍽️</div><div class="empty-state-text">还没有添加食物</div></div>';
    }
    const subtotal = foods.reduce((s, f) => s + f.kcal, 0);
    return `
      ${foods.map(f => `
        <div class="food-item">
          <div class="food-item-info">
            <span>${Utils.escapeHtml(f.name)}</span>
            <span class="sep">·</span>
            <span style="color:var(--text-secondary)">${f.weight}g</span>
            <span class="sep">·</span>
            <span class="kcal">${f.kcal} kcal</span>
          </div>
          <button class="todo-delete" data-action="del-food" data-id="${f.id}" aria-label="删除">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      `).join('')}
      <div class="meal-subtotal">
        <span>小计</span>
        <span class="kcal-val">${subtotal} kcal</span>
      </div>
    `;
  },

  renderCalendar() {
    const { year, month } = this.calendarMonth;
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = Utils.getMonthDays(year, month);
    const today = Utils.todayKey();
    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];

    let cells = '';
    for (let i = 0; i < firstDay; i++) cells += '<div class="calendar-day empty"></div>';
    for (let d = 1; d <= daysInMonth; d++) {
      const dateKey = `${year}-${Utils.pad(month + 1)}-${Utils.pad(d)}`;
      const data = Utils.getByDate('diet', dateKey);
      const hasData = data && this.MEALS.some(m => (data[m.id] || []).length > 0);
      const dayTotal = data ? this.MEALS.reduce((s, m) => s + (data[m.id]||[]).reduce((ss, f) => ss + f.kcal, 0), 0) : 0;
      cells += `
        <div class="calendar-day ${dateKey === today ? 'today' : ''} ${hasData ? 'has-data' : ''}"
             data-date="${dateKey}" style="${hasData ? 'background:var(--pink-light);color:var(--pink-red)' : ''}">
          <span class="calendar-day-num">${d}</span>
          ${hasData ? `<span style="font-size:9px;font-weight:600">${dayTotal}</span>` : ''}
        </div>
      `;
    }

    return `
      <div class="calendar-header">
        <button class="calendar-nav-btn" data-action="prev-month-diet">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
        </button>
        <span class="calendar-month">${year}年${month + 1}月</span>
        <button class="calendar-nav-btn" data-action="next-month-diet">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
        </button>
      </div>
      <div class="calendar-grid">
        ${weekdays.map(w => `<div class="calendar-weekday">${w}</div>`).join('')}
        ${cells}
      </div>
    `;
  },

  bindEvents() {
    const container = document.getElementById('page-diet');
    if (!container) return;

    // 餐次切换
    container.querySelectorAll('.meal-option').forEach(el => {
      el.addEventListener('click', () => {
        this.currentMeal = el.dataset.meal;
        this.render();
      });
    });

    // 食物搜索
    const search = document.getElementById('foodSearch');
    const suggestions = document.getElementById('foodSuggestions');
    const weightInput = document.getElementById('foodWeight');
    const kcalPreview = document.getElementById('foodKcalPreview');

    if (search) {
      search.addEventListener('input', () => {
        const query = search.value.trim().toLowerCase();
        this.updateKcalPreview();
        if (!query) {
          suggestions.classList.remove('show');
          return;
        }
        const matches = this.getAllFoods().filter(f => f.name.toLowerCase().includes(query)).slice(0, 8);
        if (matches.length === 0) {
          suggestions.innerHTML = `<div class="food-suggestion-item" data-action="add-custom"><span>没有找到「${Utils.escapeHtml(search.value)}」，点击添加自定义</span></div>`;
          suggestions.classList.add('show');
        } else {
          suggestions.innerHTML = matches.map(f => `
            <div class="food-suggestion-item" data-name="${Utils.escapeHtml(f.name)}" data-kcal="${f.kcal}">
              <span>${Utils.escapeHtml(f.name)}</span>
              <span class="kcal">${f.kcal} kcal/100g</span>
            </div>
          `).join('');
          suggestions.classList.add('show');
        }
      });

      search.addEventListener('blur', () => {
        setTimeout(() => suggestions.classList.remove('show'), 200);
      });

      search.addEventListener('focus', () => {
        if (search.value.trim()) suggestions.classList.add('show');
      });
    }

    // 点击建议项
    if (suggestions) {
      suggestions.addEventListener('click', (e) => {
        const item = e.target.closest('.food-suggestion-item');
        if (!item) return;
        if (item.dataset.action === 'add-custom') {
          this.showCustomFoodDialog(search.value);
          suggestions.classList.remove('show');
          return;
        }
        search.value = item.dataset.name;
        search.dataset.kcal = item.dataset.kcal;
        suggestions.classList.remove('show');
        this.updateKcalPreview();
      });
    }

    // 重量变化
    if (weightInput) {
      weightInput.addEventListener('input', () => this.updateKcalPreview());
    }

    // 添加食物
    const addBtn = document.getElementById('foodAddBtn');
    if (addBtn) addBtn.addEventListener('click', () => this.addFood());

    // 删除食物
    container.querySelectorAll('[data-action="del-food"]').forEach(el => {
      el.addEventListener('click', async () => {
        const ok = await Utils.confirm('确定删除这条食物记录？', '删除');
        if (ok) this.deleteFood(el.dataset.id);
      });
    });

    // 自定义食材按钮
    const customBtn = document.getElementById('customFoodBtn');
    if (customBtn) customBtn.addEventListener('click', () => this.showCustomFoodDialog(''));

    // 日历导航
    container.querySelectorAll('[data-action="prev-month-diet"]').forEach(el => {
      el.addEventListener('click', () => this.changeMonth(-1));
    });
    container.querySelectorAll('[data-action="next-month-diet"]').forEach(el => {
      el.addEventListener('click', () => this.changeMonth(1));
    });

    // 点击日期查看历史
    container.querySelectorAll('.calendar-day[data-date]').forEach(el => {
      el.addEventListener('click', () => this.showDayDetail(el.dataset.date));
    });
  },

  updateKcalPreview() {
    const search = document.getElementById('foodSearch');
    const weightInput = document.getElementById('foodWeight');
    const kcalPreview = document.getElementById('foodKcalPreview');
    if (!search || !weightInput || !kcalPreview) return;

    const foodName = search.value.trim();
    const weight = parseInt(weightInput.value) || 0;
    let kcalPer100g = 0;

    if (search.dataset.kcal) {
      kcalPer100g = parseInt(search.dataset.kcal);
    } else if (foodName) {
      const food = this.getAllFoods().find(f => f.name === foodName);
      if (food) kcalPer100g = food.kcal;
    }

    const totalKcal = Math.round(kcalPer100g * weight / 100);
    kcalPreview.textContent = `${totalKcal} kcal`;
  },

  addFood() {
    const search = document.getElementById('foodSearch');
    const weightInput = document.getElementById('foodWeight');
    if (!search || !weightInput) return;

    const name = search.value.trim();
    const weight = parseInt(weightInput.value);

    if (!name) {
      Utils.toast('请选择或输入食物名称', 'warning');
      search.focus();
      return;
    }
    if (!weight || weight <= 0) {
      Utils.toast('请输入有效重量', 'warning');
      weightInput.focus();
      return;
    }

    let kcalPer100g = 0;
    if (search.dataset.kcal) {
      kcalPer100g = parseInt(search.dataset.kcal);
    } else {
      const food = this.getAllFoods().find(f => f.name === name);
      if (food) kcalPer100g = food.kcal;
    }

    if (kcalPer100g <= 0) {
      Utils.toast('未找到该食物热量信息，请添加自定义食材', 'warning');
      this.showCustomFoodDialog(name);
      return;
    }

    const totalKcal = Math.round(kcalPer100g * weight / 100);
    const today = Utils.todayKey();
    const data = this.getData(today);
    const foodItem = {
      id: 'f_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
      name,
      weight,
      kcal: totalKcal,
    };
    data[this.currentMeal].push(foodItem);
    Utils.setByDate('diet', today, data);

    search.value = '';
    delete search.dataset.kcal;
    weightInput.value = '100';
    this.updateKcalPreview();
    this.render();
    Utils.toast(`已添加 ${name} · ${totalKcal} kcal`, 'success');
  },

  deleteFood(id) {
    const today = Utils.todayKey();
    const data = this.getData(today);
    data[this.currentMeal] = (data[this.currentMeal] || []).filter(f => f.id !== id);
    Utils.setByDate('diet', today, data);
    this.render();
    Utils.toast('已删除', 'success');
  },

  showCustomFoodDialog(defaultName) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-box">
        <div class="modal-title">添加自定义食材</div>
        <div class="modal-body">手动录入食材的每100g热量</div>
        <div style="margin-bottom:12px">
          <label style="font-size:13px;font-weight:600;display:block;margin-bottom:4px">食材名称</label>
          <input class="input" id="customFoodName" value="${Utils.escapeHtml(defaultName)}" placeholder="如：紫薯" />
        </div>
        <div style="margin-bottom:16px">
          <label style="font-size:13px;font-weight:600;display:block;margin-bottom:4px">每100g热量 (kcal)</label>
          <input class="input" type="number" id="customFoodKcal" placeholder="如：86" min="0" />
        </div>
        <div class="modal-actions">
          <button class="btn btn-outline" data-act="cancel">取消</button>
          <button class="btn btn-primary" data-act="save">保存</button>
        </div>
      </div>
    `;
    document.getElementById('modalContainer').appendChild(modal);

    const nameInput = modal.querySelector('#customFoodName');
    const kcalInput = modal.querySelector('#customFoodKcal');
    setTimeout(() => nameInput.focus(), 100);

    modal.addEventListener('click', async (e) => {
      if (e.target === modal) { modal.remove(); return; }
      const act = e.target.closest('[data-act]')?.dataset.act;
      if (act === 'cancel') modal.remove();
      if (act === 'save') {
        const name = nameInput.value.trim();
        const kcal = parseInt(kcalInput.value);
        if (!name) { Utils.toast('请输入食材名称', 'warning'); return; }
        if (!kcal || kcal < 0) { Utils.toast('请输入有效热量', 'warning'); return; }
        this.addCustomFood(name, kcal);
        // 自动填充到搜索框
        const search = document.getElementById('foodSearch');
        if (search) {
          search.value = name;
          search.dataset.kcal = kcal;
        }
        this.updateKcalPreview();
        Utils.toast(`已添加自定义食材：${name}`, 'success');
        modal.remove();
      }
    });
  },

  changeMonth(delta) {
    let { year, month } = this.calendarMonth;
    month += delta;
    if (month < 0) { month = 11; year--; }
    if (month > 11) { month = 0; year++; }
    this.calendarMonth = { year, month };
    this.render();
  },

  showDayDetail(dateKey) {
    const data = Utils.getByDate('diet', dateKey);
    const isToday = dateKey === Utils.todayKey();
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-box" style="max-width:420px">
        <div class="modal-title">饮食详情 · ${dateKey}${isToday ? '（今日）' : ''}</div>
        <div class="modal-body" style="max-height:60vh;overflow-y:auto">
          ${data && this.MEALS.some(m => (data[m.id]||[]).length > 0)
            ? this.MEALS.map(m => {
                const foods = data[m.id] || [];
                if (foods.length === 0) return '';
                const sub = foods.reduce((s, f) => s + f.kcal, 0);
                return `
                  <div style="margin-bottom:14px">
                    <div style="font-size:14px;font-weight:700;margin-bottom:6px">${m.icon} ${m.name} <span style="color:var(--pink-red);font-size:12px">${sub} kcal</span></div>
                    ${foods.map(f => `<div style="display:flex;justify-content:space-between;padding:4px 8px;font-size:13px;background:var(--bg-main);border-radius:6px;margin-bottom:3px"><span>${Utils.escapeHtml(f.name)} · ${f.weight}g</span><span style="color:var(--pink-red);font-weight:600">${f.kcal} kcal</span></div>`).join('')}
                  </div>
                `;
              }).join('')
            : '<div style="text-align:center;color:var(--text-light);padding:20px 0">当天暂无饮食记录</div>'
          }
        </div>
        <div class="modal-actions">
          <button class="btn btn-primary" data-act="close">关闭</button>
        </div>
      </div>
    `;
    document.getElementById('modalContainer').appendChild(modal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal || e.target.closest('[data-act="close"]')) modal.remove();
    });
  },
};

/* ============================================
   4. 每日学习页面
   ============================================ */
const StudyPage = {
  calendarMonth: null,

  init() {
    this.getData(Utils.todayKey());
    const now = new Date();
    this.calendarMonth = { year: now.getFullYear(), month: now.getMonth() };
  },

  getData(dateKey) {
    let data = Utils.getByDate('study', dateKey);
    if (!data) {
      data = { tasks: [], totalDuration: 0 };
      Utils.setByDate('study', dateKey, data);
    }
    return data;
  },

  genId() {
    return 's_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
  },

  render() {
    const container = document.getElementById('page-study');
    if (!container) return;
    const today = Utils.todayKey();
    const data = this.getData(today);
    const doneCount = data.tasks.filter(t => t.done).length;
    const total = data.tasks.length;
    const pct = total > 0 ? Math.round((doneCount / total) * 100) : 0;
    const totalDuration = data.totalDuration || 0;
    const hours = Math.floor(totalDuration / 60);
    const mins = totalDuration % 60;

    container.innerHTML = `
      <div class="page-header">
        <h1 class="page-title">📚 每日学习 <span class="page-title-decor">${PAGE_DECORATIONS.study}</span></h1>
        <p class="page-subtitle">今日已学习 ${hours}小时${mins}分钟 · 完成 ${doneCount}/${total}</p>
      </div>

      <div class="card study-progress-card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
          <span style="font-size:13px;color:var(--text-secondary);font-weight:600">学习完成进度</span>
          <span class="tag tag-beige">${pct}%</span>
        </div>
        <div class="todo-progress-text" style="color:var(--beige-deep)">${doneCount}<small>/${total}</small></div>
        <div class="progress-bar" style="margin-top:12px">
          <div class="progress-bar-fill" style="width:${pct}%;background:linear-gradient(90deg,var(--beige-hot),var(--beige-deep))"></div>
        </div>
      </div>

      <div class="card study-duration-card">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div>
            <div style="font-size:13px;color:var(--text-secondary);font-weight:600;margin-bottom:4px">⏱️ 今日学习时长</div>
            <div class="study-duration-value">${hours}<span style="font-size:18px">h</span> ${mins}<span style="font-size:18px">min</span></div>
          </div>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--beige-deep)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        </div>
      </div>

      <div class="card">
        <div class="card-title">
          📖 学习任务
        </div>
        <div class="todo-list" id="studyList">
          ${data.tasks.map(t => this.renderItem(t)).join('')}
        </div>
        ${data.tasks.length === 0 ? '<div class="empty-state"><div class="empty-state-icon">📚</div><div class="empty-state-text">添加今天的学习任务吧～<br>如「行测一套卷」「申论一篇」</div></div>' : ''}
        <div class="todo-add-row">
          <input class="input" id="studyInput" placeholder="添加学习任务..." maxlength="30" />
          <button class="btn btn-beige" id="studyAddBtn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            添加
          </button>
        </div>
      </div>

      <div class="card">
        <div class="card-title">
          📅 历史记录
        </div>
        ${this.renderCalendar()}
      </div>
    `;

    this.bindEvents();
  },

  renderItem(task) {
    return `
      <div class="todo-item ${task.done ? 'done' : ''}" data-id="${task.id}">
        <div class="todo-checkbox ${task.done ? 'checked' : ''}" data-action="toggle" data-id="${task.id}">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <div style="flex:1;display:flex;flex-direction:column;gap:4px">
          <span class="todo-text">${Utils.escapeHtml(task.name)}</span>
          <div style="display:flex;align-items:center;gap:6px">
            <span style="font-size:12px;color:var(--text-secondary)">⏱️ 时长</span>
            <input class="study-duration-input" type="number" min="0" max="600" value="${task.duration || ''}"
              placeholder="0" data-action="duration" data-id="${task.id}" /> <span style="font-size:12px;color:var(--text-light)">分钟</span>
          </div>
        </div>
        <button class="todo-delete" data-action="delete" data-id="${task.id}" aria-label="删除">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
    `;
  },

  bindEvents() {
    const container = document.getElementById('page-study');
    if (!container) return;

    container.querySelectorAll('[data-action="toggle"]').forEach(el => {
      el.addEventListener('click', () => this.toggleTask(el.dataset.id));
    });

    container.querySelectorAll('[data-action="delete"]').forEach(el => {
      el.addEventListener('click', async () => {
        const taskEl = el.closest('.todo-item');
        const name = taskEl.querySelector('.todo-text').textContent;
        const ok = await Utils.confirm(`确定要删除「${name}」吗？`, '删除任务');
        if (ok) this.deleteTask(el.dataset.id);
      });
    });

    container.querySelectorAll('[data-action="duration"]').forEach(el => {
      el.addEventListener('change', () => this.updateDuration(el.dataset.id, el.value));
      el.addEventListener('blur', () => this.updateDuration(el.dataset.id, el.value));
    });

    const addBtn = document.getElementById('studyAddBtn');
    const input = document.getElementById('studyInput');
    if (addBtn) addBtn.addEventListener('click', () => this.addTask());
    if (input) {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') this.addTask();
      });
    }

    // 历史日历导航
    container.querySelectorAll('[data-action="prev-month-study"]').forEach(el => {
      el.addEventListener('click', () => this.changeMonth(-1));
    });
    container.querySelectorAll('[data-action="next-month-study"]').forEach(el => {
      el.addEventListener('click', () => this.changeMonth(1));
    });
    container.querySelectorAll('.calendar-day[data-date]').forEach(el => {
      el.addEventListener('click', () => this.showDayDetail(el.dataset.date));
    });
  },

  toggleTask(id) {
    const today = Utils.todayKey();
    const data = this.getData(today);
    const task = data.tasks.find(t => t.id === id);
    if (task) {
      task.done = !task.done;
      Utils.setByDate('study', today, data);
      this.render();
    }
  },

  deleteTask(id) {
    const today = Utils.todayKey();
    const data = this.getData(today);
    data.tasks = data.tasks.filter(t => t.id !== id);
    data.totalDuration = data.tasks.reduce((s, t) => s + (parseInt(t.duration) || 0), 0);
    Utils.setByDate('study', today, data);
    Utils.toast('已删除任务', 'success');
    this.render();
  },

  addTask() {
    const input = document.getElementById('studyInput');
    if (!input) return;
    const name = input.value.trim();
    if (!name) {
      Utils.toast('请输入任务内容', 'warning');
      input.focus();
      return;
    }
    const today = Utils.todayKey();
    const data = this.getData(today);
    data.tasks.push({ id: this.genId(), name, done: false, duration: 0 });
    Utils.setByDate('study', today, data);
    input.value = '';
    this.render();
    Utils.toast('学习任务已添加', 'success');
  },

  updateDuration(id, value) {
    const today = Utils.todayKey();
    const data = this.getData(today);
    const task = data.tasks.find(t => t.id === id);
    if (task) {
      const dur = parseInt(value) || 0;
      if (dur < 0 || dur > 600) {
        Utils.toast('时长应在 0-600 分钟之间', 'warning');
        return;
      }
      task.duration = dur;
      data.totalDuration = data.tasks.reduce((s, t) => s + (parseInt(t.duration) || 0), 0);
      Utils.setByDate('study', today, data);
      // 局部更新顶部时长显示
      this.render();
    }
  },

  renderCalendar() {
    const { year, month } = this.calendarMonth;
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = Utils.getMonthDays(year, month);
    const today = Utils.todayKey();
    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];

    let cells = '';
    for (let i = 0; i < firstDay; i++) cells += '<div class="calendar-day empty"></div>';
    for (let d = 1; d <= daysInMonth; d++) {
      const dateKey = `${year}-${Utils.pad(month + 1)}-${Utils.pad(d)}`;
      const data = Utils.getByDate('study', dateKey);
      const hasData = data && data.tasks && data.tasks.length > 0;
      const doneCount = hasData ? data.tasks.filter(t => t.done).length : 0;
      const total = hasData ? data.tasks.length : 0;
      const dur = hasData ? (data.totalDuration || 0) : 0;
      const allDone = hasData && total > 0 && doneCount === total;
      cells += `
        <div class="calendar-day ${dateKey === today ? 'today' : ''} ${hasData ? 'has-data' : ''}"
             data-date="${dateKey}" style="${allDone ? 'background:var(--blue-soft);color:var(--blue-mid)' : hasData ? 'background:var(--beige)' : ''}">
          <span class="calendar-day-num">${d}</span>
          ${hasData ? `<span style="font-size:9px;font-weight:600">${dur>0?dur+'m':doneCount+'/'+total}</span>` : ''}
        </div>
      `;
    }

    return `
      <div class="calendar-header">
        <button class="calendar-nav-btn" data-action="prev-month-study">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
        </button>
        <span class="calendar-month">${year}年${month + 1}月</span>
        <button class="calendar-nav-btn" data-action="next-month-study">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
        </button>
      </div>
      <div class="calendar-grid">
        ${weekdays.map(w => `<div class="calendar-weekday">${w}</div>`).join('')}
        ${cells}
      </div>
    `;
  },

  changeMonth(delta) {
    let { year, month } = this.calendarMonth;
    month += delta;
    if (month < 0) { month = 11; year--; }
    if (month > 11) { month = 0; year++; }
    this.calendarMonth = { year, month };
    this.render();
  },

  showDayDetail(dateKey) {
    const data = Utils.getByDate('study', dateKey);
    const isToday = dateKey === Utils.todayKey();
    const dur = data ? (data.totalDuration || 0) : 0;
    const hours = Math.floor(dur / 60);
    const mins = dur % 60;
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-box" style="max-width:380px">
        <div class="modal-title">学习记录 · ${dateKey}${isToday ? '（今日）' : ''}</div>
        <div class="modal-body">
          ${data && data.tasks && data.tasks.length > 0
            ? `<div style="display:flex;justify-content:space-between;padding:8px 12px;background:var(--blue-soft);border-radius:8px;margin-bottom:12px">
                <span style="font-weight:700;color:var(--blue-mid)">学习时长</span>
                <span style="font-weight:700;color:var(--blue-mid)">${hours}h ${mins}min</span>
              </div>` + data.tasks.map(t => `<div style="display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid var(--divider);font-size:14px">
                <span style="width:18px;height:18px;border-radius:50%;border:2px solid ${t.done?'var(--pink-hot)':'var(--text-light)'};background:${t.done?'var(--pink-hot)':'transparent'};display:flex;align-items:center;justify-content:center;color:white;font-size:11px">${t.done?'✓':''}</span>
                <span style="${t.done?'text-decoration:line-through;color:var(--text-light)':''}">${Utils.escapeHtml(t.name)}</span>
                ${t.duration ? `<span style="font-size:12px;color:var(--text-light);margin-left:auto">${t.duration}min</span>` : ''}
              </div>`).join('') + `
              <div style="display:flex;justify-content:space-between;padding:12px 0;font-weight:700">
                <span>完成情况</span><span style="color:var(--pink-red)">${data.tasks.filter(t=>t.done).length}/${data.tasks.length}</span>
              </div>
            `
            : '<div style="text-align:center;color:var(--text-light);padding:20px 0">当天暂无学习记录</div>'
          }
        </div>
        <div class="modal-actions">
          <button class="btn btn-primary" data-act="close">关闭</button>
        </div>
      </div>
    `;
    document.getElementById('modalContainer').appendChild(modal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal || e.target.closest('[data-act="close"]')) modal.remove();
    });
  },

  showForceModal() {
    const quote = STUDY_QUOTES[Math.floor(Math.random() * STUDY_QUOTES.length)];
    const overlay = document.createElement('div');
    overlay.className = 'study-modal-overlay';
    overlay.innerHTML = `
      <div class="study-modal">
        <span class="study-modal-emoji">${quote.emoji}</span>
        <div class="study-modal-quote">${Utils.escapeHtml(quote.text)}</div>
        <div class="study-modal-sub">今日学习任务还未开始，加油！</div>
        <button class="btn btn-beige btn-lg btn-block" id="goStudyBtn">去学习</button>
      </div>
    `;
    document.body.appendChild(overlay);

    const goBtn = overlay.querySelector('#goStudyBtn');
    goBtn.addEventListener('click', () => {
      overlay.remove();
      App.navigateTo('study');
    });

    // 不可点击遮罩关闭
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) return; // 不关闭
    });
  },
};

/* ============================================
   5. 健身计划页面
   ============================================ */
const FitnessPage = {
  WEEKLY_GOAL: 120,
  timer: null,
  timerSeconds: 0,
  timerRunning: false,
  timerPaused: false,
  calendarMonth: null,

  init() {
    const now = new Date();
    this.calendarMonth = { year: now.getFullYear(), month: now.getMonth() };
    this.checkTimerState();
  },

  // 获取某日数据
  getDayData(dateKey) {
    return Utils.getByDate('fitness', dateKey, null);
  },

  // 获取某周所有日期数据
  getWeekData(dateKey) {
    const weekDates = Utils.getWeekDates(Utils.parseDate(dateKey));
    const records = [];
    weekDates.forEach(dk => {
      const dayData = this.getDayData(dk);
      if (dayData && dayData.records) {
        dayData.records.forEach(r => {
          records.push({ ...r, date: dk });
        });
      }
    });
    return records;
  },

  getWeekTotal(dateKey) {
    const records = this.getWeekData(dateKey);
    return records.reduce((s, r) => s + r.duration, 0);
  },

  // 保存当日记录
  addRecord(dateKey, duration, note = '') {
    let data = this.getDayData(dateKey) || { records: [], total: 0 };
    data.records.push({
      id: 'r_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
      duration,
      time: new Date().toISOString(),
      note,
    });
    data.total = data.records.reduce((s, r) => s + r.duration, 0);
    Utils.setByDate('fitness', dateKey, data);
  },

  // 检查是否有进行中的计时器
  checkTimerState() {
    const state = Utils.get('fitness_timer', null);
    if (state && state.running) {
      this.timerSeconds = state.seconds;
      this.timerRunning = state.running;
      this.timerPaused = state.paused || false;
      // 如果未暂停，恢复计时
      if (!this.timerPaused) {
        this.startTimerInterval();
      }
    }
  },

  saveTimerState() {
    Utils.set('fitness_timer', {
      running: this.timerRunning,
      paused: this.timerPaused,
      seconds: this.timerSeconds,
      timestamp: Date.now(),
    });
  },

  clearTimerState() {
    localStorage.removeItem('fitness_timer');
    this.timerRunning = false;
    this.timerPaused = false;
    this.timerSeconds = 0;
  },

  startTimerInterval() {
    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(() => {
      if (!this.timerPaused && this.timerRunning) {
        this.timerSeconds++;
        this.saveTimerState();
        this.updateTimerDisplay();
        if (this.timerSeconds >= 120 * 60) {
          // 120分钟到，自动打卡
          this.completeTimer();
        }
      }
    }, 1000);
  },

  updateTimerDisplay() {
    const display = document.getElementById('timerDisplay');
    const btnArea = document.getElementById('timerBtnArea');
    if (!display) return;
    display.textContent = Utils.formatTime(this.timerSeconds);

    if (btnArea) {
      if (this.timerRunning) {
        btnArea.innerHTML = `
          <button class="btn btn-outline" id="pauseBtn">${this.timerPaused ? '继续' : '暂停'}</button>
          <button class="btn btn-orange" id="finishBtn">结束计时</button>
          <button class="btn btn-orange" id="earlyBtn">提前完成</button>
        `;
        this.bindTimerButtons();
      }
    }
  },

  bindTimerButtons() {
    const pauseBtn = document.getElementById('pauseBtn');
    const finishBtn = document.getElementById('finishBtn');
    const earlyBtn = document.getElementById('earlyBtn');
    if (pauseBtn) pauseBtn.addEventListener('click', () => this.togglePause());
    if (finishBtn) finishBtn.addEventListener('click', () => this.finishTimer());
    if (earlyBtn) earlyBtn.addEventListener('click', () => this.earlyFinish());
  },

  startTimer() {
    this.timerRunning = true;
    this.timerPaused = false;
    this.timerSeconds = 0;
    this.startTimerInterval();
    this.saveTimerState();
    this.render();
    Utils.toast('开始锻炼！加油💪', 'success');
  },

  togglePause() {
    this.timerPaused = !this.timerPaused;
    this.saveTimerState();
    this.updateTimerDisplay();
    Utils.toast(this.timerPaused ? '已暂停' : '继续锻炼', 'info');
  },

  finishTimer() {
    const minutes = Math.floor(this.timerSeconds / 60);
    if (minutes > 0) {
      this.addRecord(Utils.todayKey(), minutes, '倒计时结束');
      this.clearTimerState();
      if (this.timer) clearInterval(this.timer);
      this.render();
      Utils.toast(`打卡成功！本次锻炼 ${minutes} 分钟`, 'success', 4000);
    } else {
      this.clearTimerState();
      if (this.timer) clearInterval(this.timer);
      this.render();
      Utils.toast('锻炼时间不足1分钟，未记录', 'warning');
    }
  },

  completeTimer() {
    if (this.timer) clearInterval(this.timer);
    this.addRecord(Utils.todayKey(), 120, '120分钟达标');
    this.clearTimerState();
    this.render();
    // 全屏提示
    Utils.toast('🎉 打卡成功！完成120分钟锻炼目标！', 'success', 5000);
    Utils.sendNotification('健身打卡成功！', '完成120分钟锻炼目标，太棒了！');
  },

  async earlyFinish() {
    const result = await Utils.prompt('请输入实际锻炼分钟数', '60', '提前完成');
    if (result === null) return;
    const minutes = parseInt(result);
    if (!minutes || minutes <= 0) {
      Utils.toast('请输入有效时长', 'warning');
      return;
    }
    if (minutes > 300) {
      Utils.toast('时长不能超过300分钟', 'warning');
      return;
    }
    if (this.timer) clearInterval(this.timer);
    this.addRecord(Utils.todayKey(), minutes, '提前完成');
    this.clearTimerState();
    this.render();
    Utils.toast(`已记录锻炼 ${minutes} 分钟`, 'success');
  },

  render() {
    const container = document.getElementById('page-fitness');
    if (!container) return;
    const today = Utils.todayKey();
    const weekTotal = this.getWeekTotal(today);
    const pct = Math.min(100, Math.round((weekTotal / this.WEEKLY_GOAL) * 100));
    const circumference = 2 * Math.PI * 70;

    // 颜色规则
    let ringColor;
    if (weekTotal <= 120) {
      ringColor = '#FE8F29'; // 橙色
    } else if (weekTotal <= 180) {
      ringColor = '#ffa94d'; // 浅橙
    } else {
      ringColor = '#ff6b6b'; // 红色
    }

    const achieved = weekTotal >= this.WEEKLY_GOAL;

    container.innerHTML = `
      <div class="page-header">
        <h1 class="page-title">🏃 健身计划 <span class="page-title-decor">${PAGE_DECORATIONS.fitness}</span></h1>
        <p class="page-subtitle">每周目标 ${this.WEEKLY_GOAL} 分钟 · ${achieved ? '已达标 ✅' : '继续加油'}</p>
      </div>

      <div class="card fitness-hero">
        <div class="progress-ring-wrap">
          <div class="progress-ring">
            <svg width="180" height="180" viewBox="0 0 180 180">
              <circle class="ring-bg" cx="90" cy="90" r="70" stroke-width="12"/>
              <circle class="ring-fill" cx="90" cy="90" r="70" stroke-width="12"
                stroke="${ringColor}"
                stroke-dasharray="${circumference}"
                stroke-dashoffset="${circumference - (circumference * pct / 100)}"/>
            </svg>
            <div class="ring-center">
              <div class="ring-value">${weekTotal}<span style="font-size:16px">min</span></div>
              <div class="ring-unit">/ ${this.WEEKLY_GOAL} 分钟</div>
            </div>
          </div>
          <div class="fitness-weekly-text">本周锻炼 <strong>${weekTotal}</strong> / ${this.WEEKLY_GOAL} 分钟</div>
          ${achieved ? '<span class="tag tag-orange" style="margin-top:4px">✓ 已达标</span>' : `<span class="tag tag-orange" style="margin-top:4px">还差 ${this.WEEKLY_GOAL - weekTotal} 分钟</span>`}
        </div>

        <div class="fitness-controls">
          ${this.renderTimerArea()}
        </div>
      </div>

      <div class="card">
        <div class="card-title">
          🏃 今日记录
        </div>
        ${this.renderTodayRecords()}
      </div>

      <div class="card">
        <div class="card-title">
          📅 历史记录
        </div>
        ${this.renderCalendar()}
      </div>
    `;

    this.bindEvents();
  },

  renderTimerArea() {
    if (this.timerRunning) {
      return `
        <div style="text-align:center">
          <div class="timer-display" id="timerDisplay">${Utils.formatTime(this.timerSeconds)}</div>
          <div style="font-size:13px;color:var(--text-secondary);margin:8px 0 12px">锻炼中… 剩余 ${Utils.formatTime(Math.max(0, 120*60 - this.timerSeconds))}</div>
          <div id="timerBtnArea" style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center">
            <button class="btn btn-outline" id="pauseBtn">${this.timerPaused ? '继续' : '暂停'}</button>
            <button class="btn btn-orange" id="finishBtn">结束计时</button>
            <button class="btn btn-orange" id="earlyBtn">提前完成</button>
          </div>
        </div>
      `;
    }
    return `
      <button class="btn btn-orange btn-lg" id="startBtn">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
        开始锻炼
      </button>
    `;
  },

  renderTodayRecords() {
    const today = Utils.todayKey();
    const data = this.getDayData(today);
    if (!data || !data.records || data.records.length === 0) {
      return '<div class="empty-state"><div class="empty-state-icon">🏃</div><div class="empty-state-text">今日暂无锻炼记录</div></div>';
    }
    const total = data.total || 0;
    return `
      <div style="display:flex;justify-content:space-between;margin-bottom:12px;padding:8px 12px;background:var(--orange-soft);border-radius:8px">
        <span style="font-weight:700;color:var(--orange-deep)">今日合计</span>
        <span style="font-weight:700;color:var(--orange-deep)">${total} 分钟</span>
      </div>
      ${data.records.map(r => {
        const time = new Date(r.time);
        const timeStr = `${Utils.pad(time.getHours())}:${Utils.pad(time.getMinutes())}`;
        return `
          <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 12px;background:var(--bg-main);border-radius:8px;margin-bottom:6px">
            <div>
              <span style="font-size:14px;font-weight:600">${r.duration} 分钟</span>
              ${r.note ? `<span style="font-size:12px;color:var(--text-light);margin-left:8px">${Utils.escapeHtml(r.note)}</span>` : ''}
            </div>
            <span style="font-size:12px;color:var(--text-light)">${timeStr}</span>
          </div>
        `;
      }).join('')}
    `;
  },

  renderCalendar() {
    const { year, month } = this.calendarMonth;
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = Utils.getMonthDays(year, month);
    const today = Utils.todayKey();
    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];

    let cells = '';
    for (let i = 0; i < firstDay; i++) cells += '<div class="calendar-day empty"></div>';
    for (let d = 1; d <= daysInMonth; d++) {
      const dateKey = `${year}-${Utils.pad(month + 1)}-${Utils.pad(d)}`;
      const data = this.getDayData(dateKey);
      const total = data ? (data.total || 0) : 0;
      const achieved = total >= 20; // 当日有锻炼20分钟以上算达标
      const isFuture = dateKey > today;
      cells += `
        <div class="calendar-day fitness-calendar-day ${dateKey === today ? 'today' : ''} ${achieved ? 'achieved' : ''} ${!achieved && !isFuture ? 'missed' : ''}"
             data-date="${dateKey}">
          <span class="calendar-day-num">${d}</span>
          ${total > 0 ? `<span style="font-size:9px;font-weight:600;color:var(--green-deep)">${total}m</span>` : ''}
        </div>
      `;
    }

    return `
      <div class="calendar-header">
        <button class="calendar-nav-btn" data-action="prev-month-fit">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
        </button>
        <span class="calendar-month">${year}年${month + 1}月</span>
        <button class="calendar-nav-btn" data-action="next-month-fit">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
        </button>
      </div>
      <div class="calendar-grid fitness-calendar">
        ${weekdays.map(w => `<div class="calendar-weekday">${w}</div>`).join('')}
        ${cells}
      </div>
      <div style="display:flex;gap:12px;margin-top:12px;font-size:12px;color:var(--text-secondary)">
        <span style="display:flex;align-items:center;gap:4px"><span style="width:12px;height:12px;background:var(--green-light);border-radius:3px;display:inline-block"></span>已达标</span>
        <span style="display:flex;align-items:center;gap:4px"><span style="width:12px;height:12px;background:var(--bg-main);border-radius:3px;display:inline-block;border:1px solid var(--divider)"></span>未达标</span>
      </div>
    `;
  },

  bindEvents() {
    const container = document.getElementById('page-fitness');
    if (!container) return;

    const startBtn = document.getElementById('startBtn');
    if (startBtn) startBtn.addEventListener('click', () => this.startTimer());

    this.bindTimerButtons();

    // 日历导航
    container.querySelectorAll('[data-action="prev-month-fit"]').forEach(el => {
      el.addEventListener('click', () => this.changeMonth(-1));
    });
    container.querySelectorAll('[data-action="next-month-fit"]').forEach(el => {
      el.addEventListener('click', () => this.changeMonth(1));
    });

    // 点击日期
    container.querySelectorAll('.calendar-day[data-date]').forEach(el => {
      el.addEventListener('click', () => this.showDayDetail(el.dataset.date));
    });
  },

  changeMonth(delta) {
    let { year, month } = this.calendarMonth;
    month += delta;
    if (month < 0) { month = 11; year--; }
    if (month > 11) { month = 0; year++; }
    this.calendarMonth = { year, month };
    this.render();
  },

  showDayDetail(dateKey) {
    const data = this.getDayData(dateKey);
    const isToday = dateKey === Utils.todayKey();
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-box" style="max-width:380px">
        <div class="modal-title">健身记录 · ${dateKey}</div>
        <div class="modal-body">
          ${data && data.records && data.records.length > 0
            ? data.records.map(r => {
                const time = new Date(r.time);
                const timeStr = `${Utils.pad(time.getHours())}:${Utils.pad(time.getMinutes())}`;
                return `<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--divider);font-size:14px">
                  <div>
                    <div style="font-weight:700">${r.duration} 分钟</div>
                    ${r.note ? `<div style="font-size:12px;color:var(--text-light)">${Utils.escapeHtml(r.note)}</div>` : ''}
                  </div>
                  <span style="color:var(--text-secondary);align-self:center">${timeStr}</span>
                </div>`;
              }).join('') + `
              <div style="display:flex;justify-content:space-between;padding:12px 0;font-weight:700">
                <span>当日合计</span><span style="color:var(--green-deep)">${data.total||0} 分钟</span>
              </div>
            `
            : '<div style="text-align:center;color:var(--text-light);padding:20px 0">当天暂无锻炼记录</div>'
          }
        </div>
        <div class="modal-actions">
          <button class="btn btn-outline" data-act="add-manual">手动添加</button>
          <button class="btn btn-primary" data-act="close">关闭</button>
        </div>
      </div>
    `;
    document.getElementById('modalContainer').appendChild(modal);

    modal.addEventListener('click', async (e) => {
      if (e.target === modal) { modal.remove(); return; }
      const act = e.target.closest('[data-act]')?.dataset.act;
      if (act === 'close') modal.remove();
      if (act === 'add-manual') {
        const result = await Utils.prompt(`为 ${dateKey} 添加锻炼时长（分钟）`, '60', '手动添加记录');
        if (result !== null) {
          const minutes = parseInt(result);
          if (!minutes || minutes <= 0) {
            Utils.toast('请输入有效时长', 'warning');
            return;
          }
          this.addRecord(dateKey, minutes, '手动添加');
          Utils.toast(`已记录 ${minutes} 分钟`, 'success');
          modal.remove();
          this.render();
        }
      }
    });
  },
};

/* ============================================
   设置页面
   ============================================ */
const SettingsPage = {
  init() {
    // 设置页无需初始化数据
  },

  render() {
    const container = document.getElementById('page-settings');
    if (!container) return;
    const settings = Utils.getSettings();

    // 统计数据
    const keys = Object.keys(localStorage).filter(k =>
      k.startsWith('todos_') || k.startsWith('water_') || k.startsWith('diet_') ||
      k.startsWith('study_') || k.startsWith('fitness_')
    );
    const dataCount = keys.length;
    let storageSize = 0;
    keys.forEach(k => {
      storageSize += (localStorage.getItem(k) || '').length;
    });
    storageSize = Math.round(storageSize / 1024 * 10) / 10;

    container.innerHTML = `
      <div class="page-header">
        <h1 class="page-title">⚙️ 设置 <span class="page-title-decor">${PAGE_DECORATIONS.settings}</span></h1>
        <p class="page-subtitle">全局配置与数据管理</p>
      </div>

      <div class="card">
        <div class="card-title">通知设置</div>
        <div class="settings-section">
          <div class="settings-item">
            <div>
              <div class="settings-label">桌面通知</div>
              <div class="settings-desc">喝水和学习提醒（需授权）</div>
            </div>
            <div class="switch ${settings.notificationsEnabled ? 'on' : ''}" id="notifSwitch"></div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-title">显示设置</div>
        <div class="settings-section">
          <div class="settings-item">
            <div>
              <div class="settings-label">折叠侧边栏</div>
              <div class="settings-desc">仅显示图标（iPad/桌面端）</div>
            </div>
            <div class="switch ${settings.sidebarCollapsed ? 'on' : ''}" id="sidebarSwitch"></div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-title">数据管理</div>
        <div class="settings-item">
          <div>
            <div class="settings-label">已存储记录</div>
            <div class="settings-desc">${dataCount} 条日期数据 · 约 ${storageSize} KB</div>
          </div>
          <button class="btn btn-sm btn-outline" id="exportBtn">导出</button>
        </div>
        <div class="settings-item">
          <div>
            <div class="settings-label" style="color:var(--danger)">清除全部数据</div>
            <div class="settings-desc">删除所有本地存储的记录</div>
          </div>
          <button class="btn btn-sm btn-danger" id="clearBtn">清除</button>
        </div>
      </div>

      <div class="card" style="text-align:center;color:var(--text-light)">
        <div style="font-size:24px;margin-bottom:8px">🌿</div>
        <div style="font-size:14px;font-weight:600;color:var(--text-secondary)">个人专属工作台</div>
        <div style="font-size:12px;margin-top:4px">v1.0 · 本地存储 · 离线可用</div>
      </div>
    `;

    this.bindEvents();
  },

  bindEvents() {
    const container = document.getElementById('page-settings');
    if (!container) return;

    const notifSwitch = document.getElementById('notifSwitch');
    if (notifSwitch) {
      notifSwitch.addEventListener('click', async () => {
        const settings = Utils.getSettings();
        if (!settings.notificationsEnabled) {
          const granted = await Utils.requestNotificationPermission();
          if (granted) {
            settings.notificationsEnabled = true;
            Utils.saveSettings(settings);
            notifSwitch.classList.add('on');
            Utils.toast('通知已开启', 'success');
          } else {
            Utils.toast('通知权限被拒绝，将使用应用内提示', 'warning');
          }
        } else {
          settings.notificationsEnabled = false;
          Utils.saveSettings(settings);
          notifSwitch.classList.remove('on');
          Utils.toast('通知已关闭', 'info');
        }
      });
    }

    const sidebarSwitch = document.getElementById('sidebarSwitch');
    if (sidebarSwitch) {
      sidebarSwitch.addEventListener('click', () => {
        const settings = Utils.getSettings();
        settings.sidebarCollapsed = !settings.sidebarCollapsed;
        Utils.saveSettings(settings);
        sidebarSwitch.classList.toggle('on');
        const sidebar = document.getElementById('sidebar');
        sidebar.classList.toggle('collapsed', settings.sidebarCollapsed);
      });
    }

    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => this.exportData());
    }

    const clearBtn = document.getElementById('clearBtn');
    if (clearBtn) {
      clearBtn.addEventListener('click', async () => {
        const ok = await Utils.confirm('确定要清除全部数据吗？此操作不可撤销！', '清除数据');
        if (ok) {
          const ok2 = await Utils.confirm('再次确认：所有历史记录将被永久删除', '最终确认');
          if (ok2) {
            localStorage.clear();
            Utils.toast('数据已清除', 'success');
            setTimeout(() => location.reload(), 1000);
          }
        }
      });
    }
  },

  exportData() {
    const data = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      data[key] = localStorage.getItem(key);
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `workbench_backup_${Utils.todayKey()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    Utils.toast('数据已导出', 'success');
  },
};

document.addEventListener('DOMContentLoaded', () => App.init());
