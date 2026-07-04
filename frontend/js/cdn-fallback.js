/**
 * CDN 故障转移加载器
 * 当主 CDN 加载失败时，自动尝试备用源
 *
 * 支持的资源：
 *   - Tailwind CSS Play CDN（JIT 编译器）
 *   - ECharts 图表库
 *   - Phosphor Icons 图标库
 *
 * 用法：
 *   在所有 CDN <script> 标签之后引入本文件即可自动检测并修复加载失败
 */
(function () {
    'use strict';

    /** 备用 CDN 源列表（按优先级排序，国内源优先） */
    var FALLBACK_SOURCES = {
        tailwind: [
            // 主源在 HTML 中已加载，这里只放备用源
            'https://unpkg.com/@tailwindcss/browser@4.1.13',
        ],
        echarts: [
            'https://cdn.bootcdn.net/ajax/libs/echarts/5.5.0/echarts.min.js',
            'https://cdn.staticfile.net/echarts/5.5.0/echarts.min.js',
            'https://unpkg.com/echarts@5.5.0/dist/echarts.min.js',
        ],
        phosphor: [
            'https://cdn.jsdelivr.net/npm/@phosphor-icons/web@2.1.1',
            'https://cdn.staticfile.net/phosphor-icons/2.1.0/web.min.js',
        ],
    };

    /**
     * 动态加载脚本
     * @param {string} url - 脚本 URL
     * @returns {Promise<void>}
     */
    function loadScript(url) {
        return new Promise(function (resolve, reject) {
            var script = document.createElement('script');
            script.src = url;
            script.onload = function () {
                resolve();
            };
            script.onerror = function () {
                reject(new Error('加载失败: ' + url));
            };
            document.head.appendChild(script);
        });
    }

    /**
     * 按顺序尝试多个源，直到成功
     * @param {string[]} urls - URL 列表
     * @param {number} [index=0] - 当前尝试的索引
     * @returns {Promise<void>}
     */
    function tryFallbacks(urls, index) {
        index = index || 0;
        if (index >= urls.length) {
            return Promise.reject(new Error('所有备用源均加载失败'));
        }
        return loadScript(urls[index]).catch(function () {
            console.warn('[CDN] 备用源失败，尝试下一个:', urls[index]);
            return tryFallbacks(urls, index + 1);
        });
    }

    /**
     * 检测并修复缺失的库
     * 在 DOMContentLoaded 时执行检测
     */
    function checkAndRepair() {
        // 1. 检测 Tailwind CSS
        if (typeof tailwind === 'undefined' && FALLBACK_SOURCES.tailwind.length > 0) {
            console.warn('[CDN] Tailwind CSS 主源加载失败，尝试备用源...');
            tryFallbacks(FALLBACK_SOURCES.tailwind).then(function () {
                console.log('[CDN] Tailwind CSS 备用源加载成功');
                // 备用源加载成功后，tailwind-config.js 的轮询会自动应用配置
            }).catch(function () {
                console.error('[CDN] Tailwind CSS 所有源加载失败，页面样式将无法正常显示');
            });
        }

        // 2. 检测 ECharts（仅当页面中存在图表容器时）
        var hasChart = document.querySelector('[id$="Chart"], [id$="chart"]');
        if (typeof echarts === 'undefined' && hasChart && FALLBACK_SOURCES.echarts.length > 0) {
            console.warn('[CDN] ECharts 主源加载失败，尝试备用源...');
            tryFallbacks(FALLBACK_SOURCES.echarts).then(function () {
                console.log('[CDN] ECharts 备用源加载成功');
                // 触发自定义事件，通知页面可以初始化图表了
                window.dispatchEvent(new CustomEvent('echarts-ready'));
            }).catch(function () {
                console.error('[CDN] ECharts 所有源加载失败，图表将无法显示');
            });
        }

        // 3. 检测 Phosphor Icons
        // Phosphor Icons 通过 CSS @font-face 加载，检测方式不同
        // 检查是否有 phosphor 相关样式表加载
        var hasPhosphorLink = document.querySelector('link[href*="phosphor"]');
        var hasPhosphorScript = document.querySelector('script[src*="phosphor"]');
        if (!hasPhosphorLink && !hasPhosphorScript && FALLBACK_SOURCES.phosphor.length > 0) {
            console.warn('[CDN] Phosphor Icons 可能未加载，尝试备用源...');
            tryFallbacks(FALLBACK_SOURCES.phosphor).catch(function () {
                console.warn('[CDN] Phosphor Icons 备用源加载失败，图标可能无法显示');
            });
        }
    }

    // 在 DOM 加载完成后检测
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', checkAndRepair);
    } else {
        checkAndRepair();
    }
})();
