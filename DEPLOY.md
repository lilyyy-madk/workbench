# 部署到 GitHub Pages 指南

## 方法一：网页上传（最简单，无需装任何工具）

### 1. 创建仓库
1. 打开 https://github.com 登录（没账号先注册）
2. 右上角 **+** → **New repository**
3. 仓库名填 `workbench`，选 **Public**，点 **Create repository**

### 2. 上传文件
1. 在仓库页面点 **uploading an existing file**（或 **Add file → Upload files**）
2. 把 zip 解压后的**所有文件**拖进去（index.html、style.css、utils.js、app.js、manifest.json、icon.svg、icon-*.png、apple-touch-icon.png）
3. 点 **Commit changes**

### 3. 开启 GitHub Pages
1. 进入仓库 **Settings** 标签页
2. 左侧菜单找 **Pages**
3. **Source** 下拉选 **Deploy from a branch**
4. **Branch** 选 `main`，文件夹选 `/ (root)`
5. 点 **Save**

### 4. 获取链接
等待 1-2 分钟，刷新 Pages 设置页，顶部会出现：
```
https://你的用户名.github.io/workbench/
```
这就是你的应用链接！

### 5. 添加到手机/iPad 桌面
- **iPhone/iPad**：Safari 打开链接 → 分享按钮 → 添加到主屏幕
- **Android**：Chrome 打开链接 → 三点菜单 → 安装应用 / 添加到主屏幕

---

## 方法二：命令行推送（如果你有 Git 环境）

```bash
# 解压 zip
unzip workbench.zip -d workbench
cd workbench

# 初始化并推送
git init
git add .
git commit -m "个人工作台"
git branch -M main
git remote add origin https://github.com/你的用户名/workbench.git
git push -u origin main
```

然后按方法一的步骤 3-4 开启 GitHub Pages。

---

## 文件清单

| 文件 | 作用 |
|------|------|
| index.html | 应用入口 |
| style.css | 样式 |
| utils.js | 工具库与数据 |
| app.js | 5 大功能模块逻辑 |
| manifest.json | PWA 配置（Android 可"安装"） |
| icon.svg | 矢量图标 |
| icon-192.png | Android 图标 |
| icon-512.png | PWA 高清图标 |
| apple-touch-icon.png | iOS 桌面图标 |

---

## 常见问题

**Q: Pages 链接打不开？**
A: 等 2-3 分钟让 GitHub 构建完成，确认 Settings → Pages 里显示绿色 ✓。

**Q: 仓库名不是 workbench 怎么办？**
A: 链接里的路径就是仓库名，如 `https://用户名.github.io/你的仓库名/`。

**Q: 想用自定义域名？**
A: 在 Pages 设置里添加 Custom domain，按提示配置 DNS 即可。
