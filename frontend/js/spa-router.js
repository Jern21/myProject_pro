/**
 * SPA 路由器 —— 拦截侧边栏导航点击，用 fetch 抓取目标页面，
 * 只替换 <main> 内容区域，避免整页重新加载。
 *
 * 核心优势：
 *   - 侧边栏、Tailwind CDN、Phosphor Icons、字体等共享资源不重新加载
 *   - 页面切换瞬间完成（仅一次 fetch + DOM 替换）
 *   - 支持浏览器前进/后退
 *   - 支持多级目录结构（pages/business/、pages/platform/ 等）
 */
(function () {
    'use strict';

    var isNavigating = false;

    /**
     * 页面路由表：短文件名 → 相对于 frontend 根目录的完整路径
     * sidebar.js 的 data-page 属性使用短文件名，路由器通过此表查找实际路径
     */
    var PAGE_ROUTES = {
        'index.html': 'index.html',
        'orders.html': 'pages/business/orders.html',
        'quote.html': 'pages/business/quote.html',
        'customer.html': 'pages/business/customer.html',
        'platform.html': 'pages/platform/platform.html',
        'xianyu.html': 'pages/platform/xianyu.html',
        'xiaohongshu.html': 'pages/platform/xiaohongshu.html',
        'douyin.html': 'pages/platform/douyin.html',
        'posters.html': 'pages/content/posters.html',
        'stats.html': 'pages/content/stats.html',
        'project.html': 'pages/content/project.html',
        'resume.html': 'pages/personal/resume.html',
        'memo.html': 'pages/personal/memo.html',
        'settings.html': 'pages/personal/settings.html'
    };

    /**
     * 计算前端根目录的绝对 URL（含协议和主机，用于 fetch）
     * 基于 PAGE_BASE（各页面 <head> 中声明）回溯得到根目录
     */
    var ROOT_URL = (function () {
        var base = window.PAGE_BASE || '';
        var url = window.location.href.split('#')[0].split('?')[0];
        url = url.substring(0, url.lastIndexOf('/')); // 移除文件名
        if (base) {
            var ups = (base.match(/\.\.\//g) || []).length;
            for (var i = 0; i < ups; i++) {
                url = url.substring(0, url.lastIndexOf('/'));
            }
        }
        return url + '/';
    })();

    /**
     * 计算前端根目录的根相对路径（以 / 开头，用于 pushState）
     * 与 ROOT_URL 对应，但只保留 pathname 部分，确保 pushState 路径
     * 不受当前 URL 所在子目录影响，避免路径叠加 bug
     */
    var ROOT_PATH = (function () {
        try {
            return new URL(ROOT_URL).pathname;
        } catch (e) {
            var base = window.PAGE_BASE || '';
            var path = window.location.pathname.split('#')[0].split('?')[0];
            path = path.substring(0, path.lastIndexOf('/'));
            if (base) {
                var ups = (base.match(/\.\.\//g) || []).length;
                for (var i = 0; i < ups; i++) {
                    path = path.substring(0, path.lastIndexOf('/'));
                }
            }
            return path + '/';
        }
    })();

    // 已知共享脚本（已在全局加载，SPA 切换时无需重复加载）
    var SHARED_SCRIPT_KEYWORDS = [
        'tailwind', 'tailwind-config', 'cdn-fallback',
        'sidebar.js', 'spa-router', 'avatar.js', 'platform-icons'
    ];

    // ECharts 本地路径（SPA 切换时如需加载）
    // 使用 ROOT_URL 绝对路径，确保在任何子目录下都能正确加载
    var ECHARTS_LOCAL = ROOT_URL + 'assets/echarts.min.js';

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
     * @returns {Promise} resolve 后所有必要脚本已就绪
     */
    function ensureScriptsLoaded(doc) {
        var headScripts = doc.querySelectorAll('head script[src]');
        var promises = [];
        var needEcharts = false;

        headScripts.forEach(function (script) {
            var src = script.getAttribute('src');
            if (isSharedScript(src)) return;

            // 提取文件名部分用于检测是否已加载（忽略路径前缀差异）
            var fileName = src.split('/').pop();
            var existing = document.querySelector('head script[src*="' + fileName + '"]') ||
                           document.querySelector('body script[src*="' + fileName + '"]');
            if (existing) return;

            // ECharts 特殊处理：从本地加载
            if (src.indexOf('echarts') !== -1) {
                if (typeof echarts !== 'undefined') return; // 已全局可用
                needEcharts = true;
                promises.push(loadScript(ECHARTS_LOCAL).then(function (ok) {
                    if (ok) {
                        // 加载成功后派发事件，让页面的 echarts-ready 监听器触发初始化
                        window.dispatchEvent(new CustomEvent('echarts-ready'));
                    }
                }));
            } else {
                promises.push(loadScript(ROOT_URL + src.replace(/^(\.\.\/)+/, '')));
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
     * @param {string} fetchUrl - 用于 fetch 的绝对 URL
     * @param {string} pageName - 短文件名，用于侧边栏激活状态
     * @param {string} pushUrl - 用于 pushState 的根相对路径
     * @param {boolean} pushState - 是否更新浏览器历史
     */
    async function navigateTo(fetchUrl, pageName, pushUrl, pushState) {
        if (isNavigating) return;
        isNavigating = true;

        var main = document.querySelector('main');
        if (!main) {
            window.location.href = fetchUrl;
            return;
        }

        // 淡出过渡
        main.style.opacity = '0.4';
        main.style.transition = 'opacity 0.12s ease';

        try {
            var response = await fetch(fetchUrl);
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

            // 4.5 清理旧 <main> 中的 ECharts 实例，防止内存泄漏和重复初始化警告
            if (typeof echarts !== 'undefined') {
                main.querySelectorAll('[id$="Chart"], [id$="chart"], [_echarts_instance_]').forEach(function (el) {
                    var instance = echarts.getInstanceByDom(el);
                    if (instance) instance.dispose();
                });
            }

            // 5. 替换 <main> 内容
            var newMain = doc.querySelector('main');
            if (!newMain) {
                window.location.href = fetchUrl;
                return;
            }
            main.innerHTML = newMain.innerHTML;

            // 6. 执行页面专属内联脚本（无 src 的 <script>）
            //    跳过 PAGE_BASE 声明，避免覆盖全局 PAGE_BASE 导致路径错乱
            var inlineScripts = doc.querySelectorAll('script:not([src])');
            inlineScripts.forEach(function (oldScript) {
                var text = oldScript.textContent;
                if (text && text.indexOf('PAGE_BASE') !== -1) return;
                var newScript = document.createElement('script');
                newScript.textContent = text;
                main.appendChild(newScript);
                newScript.remove();
            });

            // 7. 更新 URL
            if (pushState !== false && pushUrl) {
                history.pushState({ spa: true, url: pushUrl, page: pageName }, '', pushUrl);
            }

            // 8. 更新侧边栏激活状态
            updateActiveNav(pageName);

            // 9. 淡入 & 滚动到顶部
            main.style.opacity = '1';

            var scrollEl = main.querySelector('.overflow-y-auto, .overflow-auto');
            if (scrollEl) {
                scrollEl.scrollTop = 0;
            } else {
                main.scrollTop = 0;
            }

            // 10. 派发 spa:ready 事件（使用 requestAnimationFrame 确保浏览器完成布局）
            //     这对 ECharts 尤为重要：容器需要先完成布局获得正确尺寸，
            //     否则 echarts.init() 会创建 0×0 的图表导致渲染“丢失”
            requestAnimationFrame(function () {
                window.dispatchEvent(new CustomEvent('spa:ready', {
                    detail: { page: pageName }
                }));
                // 如果 ECharts 已全局可用，也派发 echarts-ready
                // 让页面的 echarts-ready 监听器触发图表初始化
                if (typeof echarts !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('echarts-ready'));
                }
            });

        } catch (err) {
            console.error('[SPA] 导航失败，回退到整页加载:', err);
            window.location.href = fetchUrl;
        } finally {
            isNavigating = false;
        }
    }

    // ========== 事件绑定 ==========

    // 拦截侧边栏导航点击
    document.addEventListener('click', function (e) {
        var link = e.target.closest('a[data-page]');
        if (!link) return;

        var pageName = link.getAttribute('data-page');
        if (!pageName || pageName === '#') return;

        // 查找路由
        var route = PAGE_ROUTES[pageName];
        if (!route) return;

        // 如果是当前页面，不导航
        var currentFile = window.location.pathname.split('/').pop() || 'index.html';
        if (pageName === currentFile) {
            e.preventDefault();
            return;
        }

        e.preventDefault();

        // 构造绝对 fetch URL 和根相对 pushState URL
        // pushUrl 必须以 / 开头（根相对路径），否则浏览器会基于当前 URL 所在目录解析，
        // 导致在子目录页面间切换时路径不断叠加
        var fetchUrl = ROOT_URL + route;
        var pushUrl = ROOT_PATH + route;

        navigateTo(fetchUrl, pageName, pushUrl, true);
    });

    // 处理浏览器前进/后退
    window.addEventListener('popstate', function () {
        var currentFile = window.location.pathname.split('/').pop() || 'index.html';
        var fetchUrl = window.location.href;
        navigateTo(fetchUrl, currentFile, null, false);
    });

    // 暴露全局方法（供外部调用）
    window.spaNavigate = function (pageName) {
        var route = PAGE_ROUTES[pageName];
        if (!route) return;
        navigateTo(ROOT_URL + route, pageName, ROOT_PATH + route, true);
    };

    // 暴露路由表供 sidebar.js 使用
    window.PAGE_ROUTES = PAGE_ROUTES;
    window.ROOT_URL = ROOT_URL;
    window.ROOT_PATH = ROOT_PATH;
})();
