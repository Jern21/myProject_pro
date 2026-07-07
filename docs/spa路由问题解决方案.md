# SPA 路由问题解决方案

> 本文档记录了项目中 SPA 架构下出现的各类问题及其根因、修复方案，供后续排查参考。

---

## 架构概述

本项目采用 **前端 SPA 局部刷新** 架构：

- `spa-router.js` 拦截侧边栏 `a[data-page]` 点击，用 `fetch` 抓取目标页面 HTML
- 通过 `DOMParser` 解析后，只替换 `#page-view` 的 `innerHTML`，不重新加载整页
- 侧边栏、Tailwind CDN、Phosphor Icons 等共享资源不重新加载
- 页面切换后派发 `spa:ready` 事件，通知页面脚本初始化

### 关键文件

| 文件 | 职责 |
|------|------|
| `frontend/js/spa-router.js` | SPA 路由核心：fetch 页面 → 替换 DOM → 注入样式 → 执行脚本 → 派发事件 |
| `frontend/js/sidebar.js` | 侧边栏生成 + 导航激活状态管理 |
| 各页面 `<script>` 内联脚本 | 页面级初始化逻辑（事件绑定、数据加载等） |

---

## 问题 1：SPA 切页后页面样式丢失 / 表单打不开 / 弹窗样式异常

### 症状

- SPA 导航到目标页面后，自定义样式不生效（`.form-input`、`.settings-nav-item` 等无样式）
- 表单弹窗、模态框样式丢失
- 强制刷新（`Ctrl+Shift+R`）后恢复正常

### 根因

**两个问题叠加：**

#### 1.1 只注入 `type="text/tailwindcss"` 的样式，丢弃了普通 `<style>`

旧代码只注入 `<style type="text/tailwindcss">` 标签的样式，页面中其他普通 `<style>` 标签定义的自定义类全部被丢弃。

#### 1.2 样式注入位置错误，被 Tailwind 工具类覆盖

旧代码用 `document.head.appendChild(newStyle)` 将页面样式插在 `<head>` 最末尾。但 Tailwind CDN 运行时会动态生成工具类样式表（包含 `.hidden { display: none }` 等），如果页面样式插在它后面，级联优先级正确；但如果 Tailwind 在页面样式之后动态生成，Tailwind 工具类就会覆盖页面自定义样式。

CSS 级联规则：**相同优先级时，后面的覆盖前面的。**

### 修复方案

```javascript
// 1. 找到 Tailwind 运行时生成的工具类样式表（包含 .hidden {} 等）
function findTailwindUtilityStyle() {
    var styles = document.head.querySelectorAll('style');
    for (var i = 0; i < styles.length; i++) {
        if (/\.hidden\s*\{/.test(styles[i].textContent || '')) {
            return styles[i];
        }
    }
    return null;
}

// 2. 注入目标页的全部 <style>（不仅仅是 tailwindcss 类型），并插在 Tailwind 工具类前面
function injectPageStyles(doc) {
    var tailwindStyle = findTailwindUtilityStyle();
    doc.querySelectorAll('style').forEach(function (style) {
        var newStyle = document.createElement('style');
        // 克隆全部属性（type、data-spa-page 等）
        Array.prototype.slice.call(style.attributes).forEach(function (attr) {
            newStyle.setAttribute(attr.name, attr.value);
        });
        newStyle.setAttribute('data-spa-page', 'true');
        newStyle.textContent = style.textContent;
        // 关键：插在 Tailwind 工具类前面，确保页面自定义样式优先级更高
        if (tailwindStyle && tailwindStyle.parentNode === document.head) {
            document.head.insertBefore(newStyle, tailwindStyle);
        } else {
            document.head.appendChild(newStyle);
        }
    });
}
```

### 要点

- 注入**全部** `<style>` 标签，不只是 `type="text/tailwindcss"`
- 用 `insertBefore(newStyle, tailwindStyle)` 确保页面样式在 Tailwind 工具类**前面**
- 这样页面自定义样式（如 `.form-input`）能覆盖 Tailwind 工具类（如 `.hidden`）

---

## 问题 2：SPA 切页后内联脚本不执行 / 功能失效

### 症状

- SPA 导航到页面后，按钮点击无反应
- 表单无法提交
- 数据不加载（API 不调用）
- 强制刷新后恢复正常

### 根因

#### 2.1 PAGE_BASE 跳过逻辑过于粗暴

旧代码跳过所有包含 `PAGE_BASE` 字符串的内联脚本：

```javascript
// 旧代码 —— 过于粗暴
if (text && text.indexOf('PAGE_BASE') !== -1) return;
```

这会误杀所有**引用** `window.PAGE_BASE` 的脚本（比如构建 API 路径的函数），导致整个页面脚本不执行。

#### 2.2 DOMContentLoaded 在 SPA 模式下不触发

SPA 模式下文档早已加载完毕，`document.readyState` 为 `complete`，`DOMContentLoaded` 事件**永远不会再次触发**。如果页面初始化逻辑只绑定在 `DOMContentLoaded` 上，SPA 导航后不会执行。

#### 2.3 spa:ready 监听器无限累积

每次 SPA 导航到某页面，该页面的内联脚本都会重新执行。如果每次都注册 `spa:ready` 监听器但从不移除，第 N 次进入页面时会有 N 个监听器同时触发，引用已移除的旧 DOM 元素。

#### 2.4 dataset 防重复标记设置太早

```javascript
// 错误写法 —— 标记设置在事件绑定之前
function initSomething() {
    var btn = document.getElementById('my-btn');
    if (!btn || btn.dataset.bound) return;
    btn.dataset.bound = '1';           // ← 标记了！
    btn.addEventListener('click', ...); // ← 如果这里异常...
    loadData();                         // ← 不会执行
    // spa:ready 重试时 → dataset.bound 已存在 → return → 永远不会成功
}
```

### 修复方案

#### 2.1 收窄 PAGE_BASE 跳过逻辑

```javascript
// 修复后 —— 只跳过赋值语句，不跳过引用
if (text && /window\.PAGE_BASE\s*=(?!=)/.test(text)) return;
```

正则 `/window\.PAGE_BASE\s*=(?!=)/` 只匹配 `window.PAGE_BASE =` 赋值语句（`(?!=)` 确保不是 `==` 或 `===`），不误杀引用 `PAGE_BASE` 的其他脚本。

#### 2.2 兼容 SPA 和直接访问的初始化模式

```javascript
// 统一初始化入口
function initPage() {
    try { initFeatureA(); } catch(e) { console.error('[Page] initFeatureA failed:', e); }
    try { initFeatureB(); } catch(e) { console.error('[Page] initFeatureB failed:', e); }
    try { initFeatureC(); } catch(e) { console.error('[Page] initFeatureC failed:', e); }
}

// 防止 spa:ready 监听器重复注册
if (window.__pageSpaReadyHandler) {
    window.removeEventListener('spa:ready', window.__pageSpaReadyHandler);
}
window.__pageSpaReadyHandler = function(e) {
    var page = (e.detail && e.detail.page) || '';
    if (page && page.indexOf('当前页面名') === -1) return;
    initPage();
};
window.addEventListener('spa:ready', window.__pageSpaReadyHandler);

// 兼容直接访问（非 SPA）和 SPA 导航
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPage);
} else {
    initPage(); // SPA 导航：文档已加载完成，直接调用
}
```

#### 2.3 dataset 标记放在最后

```javascript
// 正确写法 —— 标记放在所有逻辑完成之后
function initSomething() {
    var btn = document.getElementById('my-btn');
    if (!btn || btn.dataset.bound) return;

    btn.addEventListener('click', ...);
    loadData();

    btn.dataset.bound = '1'; // ← 放在最后一行，确保中途异常时允许重试
}
```

### 要点

- `PAGE_BASE` 跳过正则要精确匹配赋值语句，不误杀引用
- 初始化逻辑必须同时支持 `DOMContentLoaded`（直接访问）和 `spa:ready`（SPA 导航）
- `spa:ready` 监听器必须先移除旧的再注册新的，防止累积
- `dataset` 防重复标记必须放在函数**最后一行**，中途异常时允许下次重试
- 每个 init 函数用 `try-catch` 独立包裹，一个崩溃不影响其他

---

## 问题 3：SPA 切页后后端 API 不生效（404）

### 症状

- 修改了后端代码（新增路由文件、修改 server.js），但 API 返回 404
- 前端提示"无法连接后端服务"

### 根因

Node.js 不会自动热加载代码。如果服务器在修改前就已启动，它跑的还是旧代码。

### 修复方案

重启后端服务器：

```bash
# 方法 1：用 stop.bat + start.bat
双击 stop.bat 停止
双击 start.bat 启动

# 方法 2：手动重启
# 找到 node 进程并终止，然后重新启动
taskkill /IM node.exe /F
cd backend && node server.js

# 方法 3：用 --watch 模式启动（推荐开发时使用）
cd backend && npm run dev
# package.json 中: "dev": "node --watch server.js"
```

### 要点

- 修改后端代码后必须重启服务器
- 开发时建议用 `npm run dev`（`node --watch`），文件变更自动重启

---

## 问题 4：SPA 切页后 ECharts 图表丢失 / 尺寸为 0

### 症状

- SPA 导航到含图表的页面后，图表不显示或尺寸为 0×0

### 根因

ECharts 初始化时需要容器已完成布局获得正确尺寸。如果容器还没渲染完就调用 `echarts.init()`，会创建 0×0 的图表。

### 修复方案

`spa-router.js` 中已处理：使用 `requestAnimationFrame` 确保浏览器完成布局后再派发 `spa:ready` 事件：

```javascript
requestAnimationFrame(function () {
    window.dispatchEvent(new CustomEvent('spa:ready', {
        detail: { page: pageName }
    }));
    if (typeof echarts !== 'undefined') {
        window.dispatchEvent(new CustomEvent('echarts-ready'));
    }
});
```

页面脚本应监听 `echarts-ready` 事件而非直接在 `DOMContentLoaded` 中初始化图表。

---

## SPA 页面开发规范

基于以上经验，新增 SPA 页面时应遵循以下规范：

### 1. HTML 结构

```html
<!-- 每个页面必须包含 -->
<script>window.PAGE_BASE='../../';</script>

<!-- <main> 和 #page-view 必须存在 -->
<main class="flex-1 flex flex-col h-full overflow-hidden bg-[#f9fafb]">
    <div id="page-view" class="flex-1 flex flex-col overflow-hidden">
        <!-- 页面内容 -->
    </div>
</main>
```

### 2. 内联脚本初始化模式

```javascript
// ✅ 正确模式
function initMyPage() {
    try { initFeatureA(); } catch(e) { console.error(e); }
    try { initFeatureB(); } catch(e) { console.error(e); }
}

// spa:ready 防重复注册
if (window.__myPageSpaReady) {
    window.removeEventListener('spa:ready', window.__myPageSpaReady);
}
window.__myPageSpaReady = function(e) {
    var page = (e.detail && e.detail.page) || '';
    if (page && page.indexOf('my-page') === -1) return;
    initMyPage();
};
window.addEventListener('spa:ready', window.__myPageSpaReady);

// 兼容直接访问和 SPA
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMyPage);
} else {
    initMyPage();
}
```

### 3. 防重复绑定规范

```javascript
// ✅ dataset 标记放在最后一行
function initSomething() {
    var el = document.getElementById('my-el');
    if (!el || el.dataset.bound) return;

    el.addEventListener('click', handler);
    loadData();

    el.dataset.bound = '1'; // 最后一行！
}
```

### 4. API 路径构建

```javascript
// ✅ 兼容 SPA 和直接访问
function getApiBase() {
    if (window.ROOT_URL) return window.ROOT_URL + 'api/my-module';
    // 回退推导
    var base = window.PAGE_BASE || '';
    var url = window.location.href.split('#')[0].split('?')[0];
    url = url.substring(0, url.lastIndexOf('/'));
    if (base) {
        var ups = (base.match(/\.\.\//g) || []).length;
        for (var i = 0; i < ups; i++) url = url.substring(0, url.lastIndexOf('/'));
    }
    return url + '/api/my-module';
}
```

---

## 快速排查清单

当 SPA 页面出现问题时，按以下顺序排查：

| 步骤 | 检查项 | 工具 |
|------|--------|------|
| 1 | 浏览器控制台是否有 JS 错误 | F12 → Console |
| 2 | 内联脚本是否被执行（PAGE_BASE 跳过是否误杀） | 控制台搜索 `[SPA]` 日志 |
| 3 | `spa:ready` 事件是否触发 | 控制台执行 `window.addEventListener('spa:ready', e => console.log(e.detail))` |
| 4 | 页面样式是否注入 | F12 → Elements 搜索 `data-spa-page` |
| 5 | API 请求是否发出 | F12 → Network |
| 6 | 后端服务器是否运行 | 访问 `http://localhost:3456/api/health` |
| 7 | 后端路由是否注册 | 检查 `server.js` 中 `app.use` + 重启服务器 |
| 8 | dataset 标记是否设置太早 | 检查 init 函数中 `dataset.bound` 位置 |
