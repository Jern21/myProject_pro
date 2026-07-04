/**
 * 本地资源健康检测器
 * 所有第三方库已本地化引入，此文件仅做加载状态检测与日志提示。
 * 若检测到某库未加载成功，会在控制台输出警告便于排查。
 */
(function () {
    'use strict';

    function checkHealth() {
        // 1. 检测 Tailwind CSS
        if (typeof tailwind === 'undefined') {
            console.error('[Health] Tailwind CSS 未加载，请检查 assets/tailwind.min.js 是否存在');
        }

        // 2. 检测 ECharts（仅当页面中存在图表容器时）
        var hasChart = document.querySelector('[id$="Chart"], [id$="chart"]');
        if (hasChart && typeof echarts === 'undefined') {
            console.error('[Health] ECharts 未加载，请检查 assets/echarts.min.js 是否存在');
            // 尝试重新加载本地 ECharts
            var script = document.createElement('script');
            script.src = 'assets/echarts.min.js';
            script.onload = function () {
                console.log('[Health] ECharts 重新加载成功');
                window.dispatchEvent(new CustomEvent('echarts-ready'));
            };
            script.onerror = function () {
                console.error('[Health] ECharts 本地文件加载失败');
            };
            document.head.appendChild(script);
        }

        // 3. 检测 Phosphor Icons CSS
        var hasPhosphorLink = document.querySelector('link[href*="phosphor"]');
        if (!hasPhosphorLink) {
            console.error('[Health] Phosphor Icons CSS 未加载，请检查 assets/fonts/phosphor-*.css 是否存在');
        }
    }

    // 在 DOM 加载完成后检测
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', checkHealth);
    } else {
        checkHealth();
    }
})();
