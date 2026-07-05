/**
 * CountUp —— 通用数字滚动动效
 *
 * 用法（HTML）：
 *   <h3 data-count-up="128">128</h3>
 *   <h3 data-count-up="28560" data-prefix="¥">¥28,560</h3>
 *   <h3 data-count-up="32" data-suffix="%">32%</h3>
 *   <h3 data-count-up="3680" data-prefix="¥ " data-decimals="0">¥ 3,680</h3>
 *
 * 属性说明：
 *   data-count-up   目标数值（纯数字，不含符号/千分位）
 *   data-prefix     前缀，如 "¥" 或 "¥ "（默认无）
 *   data-suffix     后缀，如 "%"（默认无）
 *   data-decimals   小数位数（默认 0）
 *   data-duration   动画时长 ms（默认 1200）
 *   data-delay      延迟启动 ms（默认 0）
 *
 * 自动扫描：
 *   页面加载 / SPA 切换后会自动扫描 [data-count-up] 元素并播放动画。
 *   也可手动调用 window.CountUp.animate(el) 或 window.CountUp.scan()。
 */
(function () {
    'use strict';

    var EASE_OUT_CUBIC = function (t) { return 1 - Math.pow(1 - t, 3); };

    /**
     * 格式化数字：千分位 + 指定小数位
     */
    function formatNumber(val, decimals) {
        var fixed = Number(val).toFixed(decimals);
        var parts = fixed.split('.');
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        return parts.join('.');
    }

    /**
     * 对单个元素播放滚动动画
     */
    function animate(el) {
        if (!el || el.dataset.countUpDone === 'true') return;

        var target = parseFloat(el.dataset.countUp);
        if (isNaN(target)) return;

        var prefix = el.dataset.prefix || '';
        var suffix = el.dataset.suffix || '';
        var decimals = parseInt(el.dataset.decimals || '0', 10) || 0;
        var duration = parseInt(el.dataset.duration || '1200', 10) || 1200;
        var delay = parseInt(el.dataset.delay || '0', 10) || 0;

        el.dataset.countUpDone = 'true';
        el.textContent = prefix + formatNumber(0, decimals) + suffix;

        setTimeout(function () {
            var startTime = null;

            function tick(now) {
                if (startTime === null) startTime = now;
                var elapsed = now - startTime;
                var progress = Math.min(elapsed / duration, 1);
                var eased = EASE_OUT_CUBIC(progress);
                var current = target * eased;

                el.textContent = prefix + formatNumber(current, decimals) + suffix;

                if (progress < 1) {
                    requestAnimationFrame(tick);
                } else {
                    el.textContent = prefix + formatNumber(target, decimals) + suffix;
                }
            }

            requestAnimationFrame(tick);
        }, delay);
    }

    /**
     * 扫描页面中所有 [data-count-up] 元素并播放动画
     */
    function scan() {
        var els = document.querySelectorAll('[data-count-up]');
        els.forEach(function (el) {
            // 重置标记，允许 SPA 切换后重新播放
            el.dataset.countUpDone = 'false';
            animate(el);
        });
    }

    // 暴露全局接口
    window.CountUp = {
        animate: animate,
        scan: scan
    };

    // ========== 自动初始化 ==========
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', scan);
    } else {
        scan();
    }

    // SPA 局部刷新后重新扫描
    window.addEventListener('spa:ready', function (e) {
        // 延迟一帧确保 DOM 已就绪
        requestAnimationFrame(scan);
    });
})();
