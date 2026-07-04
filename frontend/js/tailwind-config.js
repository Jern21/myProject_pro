/**
 * Tailwind CSS 共享配置
 * 所有页面统一引用，避免重复定义
 * 必须在 Tailwind CDN 之后加载
 *
 * 防御性设计：如果 Tailwind CDN 尚未加载完成，
 * 会轮询等待，避免 ReferenceError 崩溃
 */
(function () {
    'use strict';

    /** Tailwind 主题配置 */
    var TW_CONFIG = {
        theme: {
            extend: {
                fontFamily: {
                    sans: ['Inter', 'sans-serif'],
                },
                colors: {
                    brand: {
                        50: '#eff6ff',
                        100: '#dbeafe',
                        500: '#3b82f6',
                        600: '#2563eb',
                        700: '#1d4ed8',
                    },
                    gray: {
                        50: '#f8fafc',
                        100: '#f1f5f9',
                        200: '#e2e8f0',
                        300: '#cbd5e1',
                        400: '#94a3b8',
                        500: '#64748b',
                        600: '#475569',
                        700: '#334155',
                        800: '#1e293b',
                        900: '#0f172a',
                    }
                },
                boxShadow: {
                    'soft': '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
                    'drawer': '-8px 0 30px -5px rgba(0, 0, 0, 0.08)',
                    'paper': '0 10px 30px -5px rgba(0, 0, 0, 0.1)',
                    'hover': '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                    'widget': '0 2px 10px -2px rgba(0, 0, 0, 0.03)',
                }
            }
        }
    };

    /** 最大重试次数（每次间隔 50ms，共 5 秒） */
    var MAX_RETRIES = 100;
    var retryCount = 0;

    /**
     * 尝试应用配置
     * 如果 tailwind 对象已存在则立即配置，否则轮询等待
     */
    function applyConfig() {
        if (typeof tailwind !== 'undefined') {
            tailwind.config = TW_CONFIG;
            return;
        }

        retryCount++;
        if (retryCount < MAX_RETRIES) {
            setTimeout(applyConfig, 50);
        } else {
            console.warn(
                '[tailwind-config] Tailwind CSS CDN 加载超时（5秒），' +
                '页面样式可能无法正常显示。请检查网络连接或使用 VPN。'
            );
        }
    }

    // 立即尝试，或在下一次事件循环中尝试
    applyConfig();
})();
