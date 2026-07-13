/**
 * 页面滚动位置记忆模块
 *
 * 功能：
 *   - 自动保存页面滚动位置到 sessionStorage
 *   - 页面刷新后自动恢复滚动位置
 *   - SPA 路由切换时也有效
 *
 * 用法：
 *   无需手动调用，自动初始化
 *   如需手动保存：scrollMemory.save()
 *   如需手动恢复：scrollMemory.restore()
 */
(function () {
    'use strict';

    var STORAGE_KEY = 'page_scroll_position';
    var isRestoring = false;

    /**
     * 获取当前页面路径作为存储键
     */
    function getPageKey() {
        return window.location.pathname + window.location.hash;
    }

    /**
     * 保存滚动位置
     */
    function saveScrollPosition() {
        if (isRestoring) return;

        var data = {
            x: window.pageXOffset || document.documentElement.scrollLeft || 0,
            y: window.pageYOffset || document.documentElement.scrollTop || 0,
            timestamp: Date.now()
        };

        try {
            var allData = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '{}');
            allData[getPageKey()] = data;
            sessionStorage.setItem(STORAGE_KEY, JSON.stringify(allData));
        } catch (e) {
            // 忽略存储错误
        }
    }

    /**
     * 恢复滚动位置
     */
    function restoreScrollPosition() {
        try {
            var allData = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '{}');
            var data = allData[getPageKey()];

            if (data && typeof data.x === 'number' && typeof data.y === 'number') {
                isRestoring = true;

                // 延迟恢复，确保页面渲染完成
                setTimeout(function () {
                    window.scrollTo(data.x, data.y);
                    isRestoring = false;

                    // 恢复后清除该页面的记录（可选，防止后退时再次恢复）
                    // delete allData[getPageKey()];
                    // sessionStorage.setItem(STORAGE_KEY, JSON.stringify(allData));
                }, 100);
            }
        } catch (e) {
            console.error('恢复滚动位置失败:', e);
            isRestoring = false;
        }
    }

    /**
     * 清除所有滚动位置记录
     */
    function clearAll() {
        try {
            sessionStorage.removeItem(STORAGE_KEY);
        } catch (e) {
            // 忽略
        }
    }

    /**
     * 清除当前页面的滚动位置记录
     */
    function clearCurrent() {
        try {
            var allData = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '{}');
            delete allData[getPageKey()];
            sessionStorage.setItem(STORAGE_KEY, JSON.stringify(allData));
        } catch (e) {
            // 忽略
        }
    }

    // ========== 自动初始化 ==========

    // 页面加载完成后恢复滚动位置
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', restoreScrollPosition);
    } else {
        restoreScrollPosition();
    }

    // 滚动时保存位置（节流，每 200ms 保存一次）
    var saveTimer = null;
    window.addEventListener('scroll', function () {
        if (saveTimer) {
            clearTimeout(saveTimer);
        }
        saveTimer = setTimeout(saveScrollPosition, 200);
    }, { passive: true });

    // 页面卸载前保存位置
    window.addEventListener('beforeunload', saveScrollPosition);

    // SPA 路由切换支持
    window.addEventListener('spa:ready', function () {
        // 路由切换后延迟恢复
        setTimeout(restoreScrollPosition, 150);
    });

    // 点击锚点链接时清除当前记录（避免恢复覆盖锚点定位）
    document.addEventListener('click', function (e) {
        var target = e.target.closest('a[href^="#"]');
        if (target) {
            clearCurrent();
        }
    });

    // ========== 暴露 API ==========

    window.scrollMemory = {
        save: saveScrollPosition,
        restore: restoreScrollPosition,
        clear: clearCurrent,
        clearAll: clearAll
    };

})();
