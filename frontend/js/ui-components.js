/**
 * UI 组件库
 *
 * 功能：
 *   - 全局加载状态管理（Loading）
 *   - 全局错误/成功提示（Toast）
 *   - 确认对话框（Confirm）
 *
 * 用法：
 *   ui.showLoading('加载中...')           // 显示加载
 *   ui.hideLoading()                     // 隐藏加载
 *   ui.toast.success('操作成功')          // 成功提示
 *   ui.toast.error('操作失败')            // 错误提示
 *   ui.confirm('确定删除？', fn)          // 确认对话框
 */
(function () {
    'use strict';

    // ========== Loading 组件 ==========

    var loadingEl = null;
    var loadingCount = 0;

    function createLoadingElement() {
        var div = document.createElement('div');
        div.id = 'global-loading';
        div.className = 'fixed inset-0 z-[99999] flex items-center justify-center bg-black/30 backdrop-blur-sm hidden';
        div.innerHTML =
            '<div class="bg-white rounded-xl shadow-2xl p-6 flex flex-col items-center gap-3 min-w-[140px]">' +
            '  <div class="w-10 h-10 border-4 border-brand-200 border-t-brand-500 rounded-full animate-spin"></div>' +
            '  <span id="loading-text" class="text-sm text-gray-600">加载中...</span>' +
            '</div>';
        document.body.appendChild(div);
        return div;
    }

    function showLoading(text) {
        // 检查 loadingEl 是否存在且仍在 DOM 中
        if (!loadingEl || !document.body.contains(loadingEl)) {
            loadingEl = createLoadingElement();
        }
        // 使用 loadingEl 内部查询，避免全局查询不到
        var textEl = loadingEl.querySelector('#loading-text');
        if (textEl) {
            textEl.textContent = text || '加载中...';
        }
        loadingEl.classList.remove('hidden');
        loadingCount++;
    }

    function hideLoading() {
        loadingCount = Math.max(0, loadingCount - 1);
        if (loadingCount === 0 && loadingEl && document.body.contains(loadingEl)) {
            loadingEl.classList.add('hidden');
        }
    }

    // ========== Toast 组件 ==========

    var toastContainer = null;

    function createToastContainer() {
        var div = document.createElement('div');
        div.id = 'toast-container';
        div.className = 'fixed top-4 right-4 z-[99999] flex flex-col gap-2 pointer-events-none';
        document.body.appendChild(div);
        return div;
    }

    function showToast(message, type, duration) {
        // 检查 toastContainer 是否存在且仍在 DOM 中
        if (!toastContainer || !document.body.contains(toastContainer)) {
            toastContainer = createToastContainer();
        }

        type = type || 'info';
        duration = duration || 3000;

        // 图标映射
        var icons = {
            success: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>',
            error: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>',
            warning: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>',
            info: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>'
        };

        // 颜色映射
        var colors = {
            success: 'bg-green-500',
            error: 'bg-red-500',
            warning: 'bg-yellow-500',
            info: 'bg-brand-500'
        };

        var toast = document.createElement('div');
        toast.className = colors[type] + ' text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 min-w-[200px] max-w-[400px] pointer-events-auto transform translate-x-full transition-transform duration-300';
        toast.innerHTML = icons[type] + '<span class="text-sm font-medium">' + message + '</span>';

        toastContainer.appendChild(toast);

        // 动画进入
        requestAnimationFrame(function () {
            toast.classList.remove('translate-x-full');
        });

        // 自动关闭
        setTimeout(function () {
            toast.classList.add('translate-x-full');
            setTimeout(function () {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, duration);
    }

    var toast = {
        success: function (msg, duration) { showToast(msg, 'success', duration); },
        error: function (msg, duration) { showToast(msg, 'error', duration); },
        warning: function (msg, duration) { showToast(msg, 'warning', duration); },
        info: function (msg, duration) { showToast(msg, 'info', duration); }
    };

    // ========== Confirm 对话框 ==========

    function confirm(message, onConfirm, onCancel) {
        // 创建遮罩
        var overlay = document.createElement('div');
        overlay.className = 'fixed inset-0 z-[99999] bg-black/50 backdrop-blur-sm flex items-center justify-center';

        // 创建对话框
        var dialog = document.createElement('div');
        dialog.className = 'bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full mx-4 transform scale-95 opacity-0 transition-all duration-200';
        dialog.innerHTML =
            '<div class="flex items-center gap-3 mb-4">' +
            '  <div class="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600">' +
            '    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>' +
            '  </div>' +
            '  <h3 class="text-lg font-semibold text-gray-900">确认操作</h3>' +
            '</div>' +
            '<p class="text-gray-600 mb-6">' + message + '</p>' +
            '<div class="flex gap-3 justify-end">' +
            '  <button id="confirm-cancel" class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">取消</button>' +
            '  <button id="confirm-ok" class="px-4 py-2 bg-brand-500 text-white hover:bg-brand-600 rounded-lg transition-colors">确定</button>' +
            '</div>';

        overlay.appendChild(dialog);
        document.body.appendChild(overlay);

        // 动画进入
        requestAnimationFrame(function () {
            dialog.classList.remove('scale-95', 'opacity-0');
            dialog.classList.add('scale-100', 'opacity-100');
        });

        // 事件处理
        function close() {
            dialog.classList.remove('scale-100', 'opacity-100');
            dialog.classList.add('scale-95', 'opacity-0');
            setTimeout(function () {
                if (overlay.parentNode) {
                    overlay.parentNode.removeChild(overlay);
                }
            }, 200);
        }

        document.getElementById('confirm-cancel').onclick = function () {
            close();
            if (onCancel) onCancel();
        };

        document.getElementById('confirm-ok').onclick = function () {
            close();
            if (onConfirm) onConfirm();
        };

        // 点击遮罩关闭
        overlay.onclick = function (e) {
            if (e.target === overlay) {
                close();
                if (onCancel) onCancel();
            }
        };
    }

    // ========== 暴露 API ==========

    window.ui = {
        showLoading: showLoading,
        hideLoading: hideLoading,
        toast: toast,
        confirm: confirm
    };

})();
