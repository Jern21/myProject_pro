/**
 * SPA 路由器 —— 拦截侧边栏导航点击，用 fetch 抓取目标页面，
 * 只替换 <main> 内容区域，避免整页重新加载。
 *
 * 核心优势：
 *   - 侧边栏、Tailwind CDN、Phosphor Icons、字体等共享资源不重新加载
 *   - 页面切换瞬间完成（仅一次 fetch + DOM 替换）
 *   - 支持浏览器前进/后退
 */
(function () {
    'use strict';

    var isNavigating = false;

    // 已知共享脚本（已在全局加载，SPA 切换时无需重复加载）
    var SHARED_SCRIPT_KEYWORDS = [
        'tailwindcss', 'phosphor', 'tailwind-config',
        'cdn-fallback', 'sidebar.js', 'spa-router'
    ];

    // ECharts 本地路径（SPA 切换时如需加载）
    var ECHARTS_LOCAL = 'assets/echarts.min.js';

    function isSharedScript(src) {
        if (!src) return true;
        return SHARED_SCRIPT_KEYWORDS.some(function (kw) {
            return src.indexOf(kw) !== -1;
        });
    }

    /**
     * 动态加载一个外部脚本
     */
    function loadScript(src) {
        return new Promise(function (resolve) {
            var script = document.createElement('script');
            script.src = src;
            script.onload = function () { resolve(true); };
            script.onerror = function () {
                console.error('[SPA] 脚本加载失败:', src);
                resolve(false);
            };
            document.head.appendChild(script);
        });
    }

    /**
     * 确保目标页面所需的额外外部脚本已加载
     * 例如：从 orders.html（无 ECharts）跳到 stats.html（需要 ECharts）
     */
    function ensureScriptsLoaded(doc) {
        var headScripts = doc.querySelectorAll('head script[src]');
        var promises = [];

        headScripts.forEach(function (script) {
            var src = script.getAttribute('src');
            if (isSharedScript(src)) return;

            // 检查是否已加载（通过 src 属性匹配）
            var existing = document.querySelector('head script[src="' + src + '"]') ||
                           document.querySelector('body script[src="' + src + '"]');
            if (existing) return;

            // ECharts 特殊处理：从本地加载
            if (src.indexOf('echarts') !== -1) {
                if (typeof echarts !== 'undefined') return; // 已全局可用
                promises.push(loadScript(ECHARTS_LOCAL));
            } else {
                promises.push(loadScript(src));
            }
        });

        return Promise.all(promises);
    }

    /**
     * 更新侧边栏导航激活状态
     */
    function updateActiveNav(targetPage) {
        if (typeof window.updateSidebarActive === 'function') {
            window.updateSidebarActive(targetPage);
        }
    }

    /**
     * 核心导航函数：fetch 目标页面 → 替换 <main> → 执行脚本 → 派发事件
     */
    async function navigateTo(url, pushState) {
        if (isNavigating) return;
        isNavigating = true;

        var main = document.querySelector('main');
        if (!main) {
            // 没有 main 元素，回退到整页跳转
            window.location.href = url;
            return;
        }

        // 淡出过渡
        main.style.opacity = '0.4';
        main.style.transition = 'opacity 0.12s ease';

        try {
            var response = await fetch(url);
            if (!response.ok) throw new Error('HTTP ' + response.status);
            var html = await response.text();
            var doc = new DOMParser().parseFromString(html, 'text/html');

            // 1. 加载缺失的外部脚本（如 ECharts）
            await ensureScriptsLoaded(doc);

            // 2. 更新页面标题
            document.title = doc.title || document.title;

            // 3. 移除上一页的页面专属样式
            document.querySelectorAll('style[data-spa-page]').forEach(function (s) {
                s.remove();
            });

            // 4. 注入新页面的专属样式（<style type="text/tailwindcss">）
            doc.querySelectorAll('style[type="text/tailwindcss"]').forEach(function (style) {
                var newStyle = document.createElement('style');
                newStyle.setAttribute('type', 'text/tailwindcss');
                newStyle.setAttribute('data-spa-page', 'true');
                newStyle.textContent = style.textContent;
                document.head.appendChild(newStyle);
            });

            // 5. 替换 <main> 内容
            var newMain = doc.querySelector('main');
            if (!newMain) {
                window.location.href = url;
                return;
            }
            main.innerHTML = newMain.innerHTML;

            // 6. 执行页面专属内联脚本（无 src 的 <script>）
            var inlineScripts = doc.querySelectorAll('script:not([src])');
            inlineScripts.forEach(function (oldScript) {
                var newScript = document.createElement('script');
                newScript.textContent = oldScript.textContent;
                main.appendChild(newScript);
                // 执行后移除 script 标签保持 DOM 整洁
                newScript.remove();
            });

            // 7. 更新 URL
            if (pushState !== false) {
                history.pushState({ spa: true, url: url }, '', url);
            }

            // 8. 更新侧边栏激活状态
            var pageName = url.split('/').pop();
            updateActiveNav(pageName);

            // 9. 淡入 & 滚动到顶部
            main.style.opacity = '1';

            // 找到滚动容器并重置
            var scrollEl = main.querySelector('.overflow-y-auto, .overflow-auto');
            if (scrollEl) {
                scrollEl.scrollTop = 0;
            } else {
                main.scrollTop = 0;
            }

            // 10. 派发 spa:ready 事件，通知页面执行初始化逻辑
            window.dispatchEvent(new CustomEvent('spa:ready', {
                detail: { page: pageName }
            }));

        } catch (err) {
            console.error('[SPA] 导航失败，回退到整页加载:', err);
            window.location.href = url;
        } finally {
            isNavigating = false;
        }
    }

    // ========== 事件绑定 ==========

    // 拦截侧边栏导航点击
    document.addEventListener('click', function (e) {
        var link = e.target.closest('a[data-page]');
        if (!link) return;

        var href = link.getAttribute('href');
        if (!href || href === '#' || href.indexOf('http') === 0) return;

        // 如果是当前页面，不导航
        var currentPath = window.location.pathname.split('/').pop() || 'index.html';
        if (href === currentPath) {
            e.preventDefault();
            return;
        }

        e.preventDefault();
        navigateTo(href);
    });

    // 处理浏览器前进/后退
    window.addEventListener('popstate', function () {
        var url = window.location.pathname.split('/').pop() || 'index.html';
        navigateTo(url, false);
    });

    // 暴露全局方法（供外部调用）
    window.spaNavigate = navigateTo;
})();
