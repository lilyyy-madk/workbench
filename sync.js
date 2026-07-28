/* ============================================
   云端同步模块 - GitHub Gist
   数据自动备份到用户私有 Gist，防止本地丢失
   ============================================ */
const Sync = {
  GIST_FILENAME: 'workbench_backup.json',
  GIST_DESC: 'Lily Workbench Data Backup',
  // token 存在 localStorage 的 sync_token key（不参与同步）
  // gist_id 存在 localStorage 的 sync_gist_id key

  getToken() {
    return localStorage.getItem('sync_token') || '';
  },

  setToken(token) {
    if (token) localStorage.setItem('sync_token', token);
    else localStorage.removeItem('sync_token');
  },

  getGistId() {
    return localStorage.getItem('sync_gist_id') || '';
  },

  setGistId(id) {
    if (id) localStorage.setItem('sync_gist_id', id);
    else localStorage.removeItem('sync_gist_id');
  },

  isConfigured() {
    return !!this.getToken();
  },

  // 打包所有需要同步的数据（排除 sync_token 等敏感信息）
  packData() {
    const data = {};
    const excludeKeys = ['sync_token'];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (excludeKeys.indexOf(key) === -1) {
        data[key] = localStorage.getItem(key);
      }
    }
    data.__sync_timestamp = Date.now();
    return JSON.stringify(data, null, 2);
  },

  // 从打包数据恢复到 localStorage
  unpackData(jsonStr) {
    const data = JSON.parse(jsonStr);
    const remoteTs = data.__sync_timestamp || 0;
    const localTs = parseInt(localStorage.getItem('__sync_timestamp') || '0', 10);
    // 远程更新才覆盖
    if (remoteTs > localTs) {
      for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key) && key !== '__sync_timestamp') {
          localStorage.setItem(key, data[key]);
        }
      }
      localStorage.setItem('__sync_timestamp', String(remoteTs));
      return true; // 有更新
    }
    return false; // 本地更新或相同
  },

  // GitHub API 请求
  async api(path, method = 'GET', body = null) {
    const token = this.getToken();
    if (!token) throw new Error('未配置 GitHub Token');
    const opts = {
      method,
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
    };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(`https://api.github.com${path}`, opts);
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`GitHub API ${res.status}: ${err}`);
    }
    return res.json();
  },

  // 创建新 Gist
  async createGist() {
    const content = this.packData();
    const body = {
      description: this.GIST_DESC,
      public: false,
      files: {
        [this.GIST_FILENAME]: { content },
      },
    };
    const gist = await this.api('/gists', 'POST', body);
    this.setGistId(gist.id);
    return gist;
  },

  // 上传所有数据到 Gist
  async upload() {
    if (!this.isConfigured()) return { ok: false, msg: '未配置 Token' };
    try {
      const content = this.packData();
      let gistId = this.getGistId();
      const body = {
        files: {
          [this.GIST_FILENAME]: { content },
        },
      };
      if (!gistId) {
        // 首次：创建
        body.description = this.GIST_DESC;
        body.public = false;
        const gist = await this.api('/gists', 'POST', body);
        this.setGistId(gist.id);
      } else {
        // 更新现有 Gist
        await this.api(`/gists/${gistId}`, 'PATCH', body);
      }
      return { ok: true, msg: '同步成功' };
    } catch (e) {
      // 如果 Gist 不存在了（被删除），重新创建
      if (String(e.message).indexOf('404') !== -1) {
        this.setGistId('');
        try {
          await this.createGist();
          return { ok: true, msg: '已重新创建云端备份' };
        } catch (e2) {
          return { ok: false, msg: e2.message };
        }
      }
      return { ok: false, msg: e.message };
    }
  },

  // 从 Gist 拉取数据
  async download() {
    if (!this.isConfigured()) return { ok: false, msg: '未配置 Token' };
    const gistId = this.getGistId();
    if (!gistId) return { ok: false, msg: '尚未绑定云端' };
    try {
      const gist = await this.api(`/gists/${gistId}`, 'GET');
      const file = gist.files && gist.files[this.GIST_FILENAME];
      if (!file || !file.content) return { ok: false, msg: '云端无数据' };
      const updated = this.unpackData(file.content);
      return { ok: true, msg: updated ? '已恢复云端数据' : '云端数据已是最新', updated };
    } catch (e) {
      return { ok: false, msg: e.message };
    }
  },

  // 验证 Token 是否有效
  async verifyToken(token) {
    try {
      const res = await fetch('https://api.github.com/user', {
        headers: { 'Authorization': `token ${token}`, 'Accept': 'application/vnd.github.v3+json' },
      });
      if (!res.ok) return { ok: false, msg: 'Token 无效' };
      const data = await res.json();
      return { ok: true, msg: data.login };
    } catch (e) {
      return { ok: false, msg: e.message };
    }
  },

  // ===== 自动同步 =====
  _uploadTimer: null,
  _autoSyncEnabled: true,

  // 数据变动后调用，延迟上传避免频繁请求
  scheduleUpload() {
    if (!this.isConfigured() || !this._autoSyncEnabled) return;
    if (this._uploadTimer) clearTimeout(this._uploadTimer);
    this._uploadTimer = setTimeout(() => {
      this.upload().then(r => {
        if (r.ok) console.log('[Sync] 自动上传成功', new Date().toLocaleTimeString());
        else console.warn('[Sync] 自动上传失败:', r.msg);
      });
    }, 3000); // 数据变动 3 秒后上传
  },

  // 应用启动时拉取
  async pullOnStart() {
    if (!this.isConfigured()) return;
    const r = await this.download();
    if (r.ok && r.updated) {
      console.log('[Sync] 启动时从云端恢复数据');
      // 触发页面刷新
      if (typeof App !== 'undefined' && App.refreshPage) {
        App.refreshPage(App.currentPage);
      }
    }
  },

  // 解绑
  unbind() {
    this.setGistId('');
    this.setToken('');
    localStorage.removeItem('__sync_timestamp');
  },
};
