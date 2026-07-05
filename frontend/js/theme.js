/**
 * theme.js — 全局主题切换
 *
 * 支持主题：
 *   - pure-white（纯白，默认）
 *   - aurora（梦幻极光）
 *
 * 原理：
 *   纯白主题为项目原始配色，无需额外覆盖。
 *   梦幻极光通过在 <html> 上添加 data-theme="aurora" 属性，
 *   配合 CSS 变量覆盖实现全局配色切换。
 *
 * 持久化：localStorage key = "app-theme"
 */
(function () {
    'use strict';

    var STORAGE_KEY = 'app-theme';
    var THEMES = ['pure-white', 'aurora'];

    var AURORA_CSS = [
        '/* ========== 梦幻极光主题 ========== */',
        '[data-theme="aurora"] {',
        '  --aurora-bg: #0f0e17;',
        '  --aurora-surface: #1a1825;',
        '  --aurora-surface-2: #232032;',
        '  --aurora-border: #2d2a40;',
        '  --aurora-text: #e2e0f0;',
        '  --aurora-text-secondary: #a09bb8;',
        '  --aurora-text-muted: #6b6786;',
        '  --aurora-brand: #a78bfa;',
        '  --aurora-brand-hover: #c4b5fd;',
        '  --aurora-brand-light: rgba(167,139,250,0.12);',
        '  --aurora-accent: #f0abfc;',
        '}',
        /* body / main 背景 */
        '[data-theme="aurora"] body,',
        '[data-theme="aurora"] main { background-color: var(--aurora-bg) !important; color: var(--aurora-text) !important; }',
        '[data-theme="aurora"] main.bg-\\[\\#f9fafb\\] { background-color: var(--aurora-bg) !important; }',
        /* 侧边栏 */
        '[data-theme="aurora"] aside { background-color: var(--aurora-surface) !important; border-color: var(--aurora-border) !important; }',
        '[data-theme="aurora"] aside h1 { color: var(--aurora-text) !important; }',
        '[data-theme="aurora"] aside p { color: var(--aurora-text-muted) !important; }',
        '[data-theme="aurora"] .nav-link { color: var(--aurora-text-secondary) !important; }',
        '[data-theme="aurora"] .nav-link:hover { background-color: var(--aurora-surface-2) !important; color: var(--aurora-text) !important; }',
        '[data-theme="aurora"] .nav-link .icon-base { color: var(--aurora-text-muted) !important; }',
        '[data-theme="aurora"] aside .border-gray-50,',
        '[data-theme="aurora"] aside .border-gray-100 { border-color: var(--aurora-border) !important; }',
        /* 卡片 / 面板 */
        '[data-theme="aurora"] .card,',
        '[data-theme="aurora"] .bg-white { background-color: var(--aurora-surface) !important; border-color: var(--aurora-border) !important; color: var(--aurora-text) !important; }',
        '[data-theme="aurora"] .rounded-xl { border-color: var(--aurora-border) !important; }',
        /* 文本 */
        '[data-theme="aurora"] h1,',
        '[data-theme="aurora"] h2,',
        '[data-theme="aurora"] h3,',
        '[data-theme="aurora"] h4 { color: var(--aurora-text) !important; }',
        '[data-theme="aurora"] .text-gray-800,',
        '[data-theme="aurora"] .text-gray-900 { color: var(--aurora-text) !important; }',
        '[data-theme="aurora"] .text-gray-700 { color: var(--aurora-text-secondary) !important; }',
        '[data-theme="aurora"] .text-gray-600 { color: var(--aurora-text-secondary) !important; }',
        '[data-theme="aurora"] .text-gray-500 { color: var(--aurora-text-muted) !important; }',
        '[data-theme="aurora"] .text-gray-400 { color: var(--aurora-text-muted) !important; }',
        /* 输入框 */
        '[data-theme="aurora"] input,',
        '[data-theme="aurora"] select,',
        '[data-theme="aurora"] textarea { background-color: var(--aurora-surface-2) !important; border-color: var(--aurora-border) !important; color: var(--aurora-text) !important; }',
        '[data-theme="aurora"] input::placeholder,',
        '[data-theme="aurora"] textarea::placeholder { color: var(--aurora-text-muted) !important; }',
        '[data-theme="aurora"] input:focus,',
        '[data-theme="aurora"] select:focus,',
        '[data-theme="aurora"] textarea:focus { border-color: var(--aurora-brand) !important; box-shadow: 0 0 0 3px rgba(167,139,250,0.15) !important; }',
        /* 品牌色 */
        '[data-theme="aurora"] .text-brand-600 { color: var(--aurora-brand) !important; }',
        '[data-theme="aurora"] .text-brand-500 { color: var(--aurora-brand) !important; }',
        '[data-theme="aurora"] .bg-brand-600 { background-color: var(--aurora-brand) !important; }',
        '[data-theme="aurora"] .bg-brand-600:hover { background-color: var(--aurora-brand-hover) !important; }',
        '[data-theme="aurora"] .bg-brand-50 { background-color: var(--aurora-brand-light) !important; }',
        '[data-theme="aurora"] .border-brand-500 { border-color: var(--aurora-brand) !important; }',
        '[data-theme="aurora"] .border-brand-100 { border-color: rgba(167,139,250,0.3) !important; }',
        '[data-theme="aurora"] .shadow-brand-500\\/30 { box-shadow: 0 2px 8px rgba(167,139,250,0.25) !important; }',
        /* 表格 */
        '[data-theme="aurora"] table thead tr { background-color: var(--aurora-surface-2) !important; }',
        '[data-theme="aurora"] table tbody tr { border-color: var(--aurora-border) !important; }',
        '[data-theme="aurora"] table tbody tr:hover { background-color: var(--aurora-surface-2) !important; }',
        /* 阴影 */
        '[data-theme="aurora"] .shadow-soft { box-shadow: 0 4px 20px -2px rgba(0,0,0,0.3) !important; }',
        '[data-theme="aurora"] .shadow-sm { box-shadow: 0 1px 3px rgba(0,0,0,0.2) !important; }',
        '[data-theme="aurora"] .shadow-md { box-shadow: 0 4px 6px -1px rgba(0,0,0,0.25) !important; }',
        '[data-theme="aurora"] .shadow-lg { box-shadow: 0 10px 15px -3px rgba(0,0,0,0.3) !important; }',
        '[data-theme="aurora"] .shadow-xl { box-shadow: 0 20px 25px -5px rgba(0,0,0,0.35) !important; }',
        '[data-theme="aurora"] .shadow-2xl { box-shadow: -10px 0 30px -5px rgba(0,0,0,0.4) !important; }',
        /* 边框 */
        '[data-theme="aurora"] .border-gray-50 { border-color: var(--aurora-border) !important; }',
        '[data-theme="aurora"] .border-gray-100 { border-color: var(--aurora-border) !important; }',
        '[data-theme="aurora"] .border-gray-200 { border-color: var(--aurora-border) !important; }',
        /* 背景色辅助 */
        '[data-theme="aurora"] .bg-gray-50 { background-color: var(--aurora-surface-2) !important; }',
        '[data-theme="aurora"] .bg-gray-50\\/50 { background-color: rgba(35,32,50,0.5) !important; }',
        '[data-theme="aurora"] .bg-gray-50\\/80 { background-color: rgba(35,32,50,0.8) !important; }',
        '[data-theme="aurora"] .bg-gray-100 { background-color: var(--aurora-surface-2) !important; }',
        /* 滚动条 */
        '[data-theme="aurora"] ::-webkit-scrollbar-thumb { background: var(--aurora-border) !important; }',
        '[data-theme="aurora"] ::-webkit-scrollbar-thumb:hover { background: var(--aurora-text-muted) !important; }',
        /* 标签 tag */
        '[data-theme="aurora"] .tag { opacity: 0.85; }',
        /* select 下拉箭头颜色 */
        `[data-theme="aurora"] select { background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b6786'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E") !important; }`,
        /* 极光渐变背景装饰 */
        '[data-theme="aurora"] body::before { content: ""; position: fixed; top: 0; left: 0; right: 0; bottom: 0; pointer-events: none; z-index: 0; background: radial-gradient(ellipse at 20% 0%, rgba(167,139,250,0.08), transparent 50%), radial-gradient(ellipse at 80% 100%, rgba(240,171,252,0.06), transparent 50%); }',
        '[data-theme="aurora"] main, [data-theme="aurora"] aside { position: relative; z-index: 1; }'
    ].join('\n');

    /** 当前主题 */
    function getTheme() {
        try {
            return localStorage.getItem(STORAGE_KEY) || 'pure-white';
        } catch (e) {
            return 'pure-white';
        }
    }

    /** 应用主题 */
    function applyTheme(theme) {
        if (THEMES.indexOf(theme) === -1) theme = 'pure-white';
        var html = document.documentElement;
        if (theme === 'aurora') {
            html.setAttribute('data-theme', 'aurora');
        } else {
            html.removeAttribute('data-theme');
        }
        try { localStorage.setItem(STORAGE_KEY, theme); } catch (e) {}
        // 通知其他监听者
        window.dispatchEvent(new CustomEvent('themechange', { detail: { theme: theme } }));
    }

    /** 注入极光主题 CSS（仅一次） */
    function injectAuroraCSS() {
        if (document.getElementById('aurora-theme-css')) return;
        var style = document.createElement('style');
        style.id = 'aurora-theme-css';
        style.textContent = AURORA_CSS;
        document.head.appendChild(style);
    }

    /** 初始化 */
    function init() {
        injectAuroraCSS();
        applyTheme(getTheme());
    }

    // 暴露 API
    window.AppTheme = {
        get: getTheme,
        set: applyTheme,
        themes: THEMES
    };

    // 立即初始化
    init();
})();
