/**
 * 本地图片生成器 —— 替代 ui-avatars.com 和 placehold.co 外部服务
 *
 * 原理：扫描页面中所有指向 ui-avatars.com / placehold.co 的 <img> 标签，
 *       用内联 SVG data URI 替换 src，完全离线可用。
 *
 * 支持的 URL：
 *   ui-avatars.com/api/?name=X&background=Y&color=Z&size=N
 *   placehold.co/WxH/BG/FG?text=TEXT
 */
(function () {
    'use strict';

    /** 预设颜色池（用于 background=random 时按 name 哈希选取） */
    var COLOR_POOL = [
        '2563eb', '7c3aed', 'db2777', 'dc2626', 'ea580c',
        'ca8a04', '16a34a', '0891b2', '475569', '9333ea'
    ];

    /** name → 颜色的确定性哈希（同一 name 始终得到同一颜色） */
    function pickColor(name) {
        var hash = 0;
        for (var i = 0; i < name.length; i++) {
            hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0;
        }
        return COLOR_POOL[Math.abs(hash) % COLOR_POOL.length];
    }

    /** 从 URL query string 中提取参数 */
    function parseParams(url) {
        var qIndex = url.indexOf('?');
        if (qIndex === -1) return {};
        var pairs = url.substring(qIndex + 1).split('&');
        var params = {};
        pairs.forEach(function (pair) {
            var kv = pair.split('=');
            params[decodeURIComponent(kv[0])] = decodeURIComponent(kv[1] || '');
        });
        return params;
    }

    /** 生成 SVG 头像 data URI */
    function generateAvatar(name, bg, fg, size) {
        var initials = name ? name.charAt(0).toUpperCase() : '?';
        var bgColor = (bg === 'random' || !bg) ? pickColor(name) : bg;
        var fgColor = fg || 'fff';
        size = size || 64;

        var fontSize = Math.round(size * 0.45);

        var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + size + '" height="' + size + '" viewBox="0 0 ' + size + ' ' + size + '">'
            + '<rect width="' + size + '" height="' + size + '" fill="#' + bgColor + '"/>'
            + '<text x="50%" y="50%" dy=".07em" fill="#' + fgColor + '" '
            + 'font-family="Inter, system-ui, sans-serif" font-size="' + fontSize + '" font-weight="600" '
            + 'text-anchor="middle" dominant-baseline="middle">' + escapeXml(initials) + '</text>'
            + '</svg>';

        return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    }

    /** 生成 SVG 占位图 data URI（替代 placehold.co） */
    function generatePlaceholder(width, height, bg, fg, text) {
        bg = bg || 'e5e7eb';
        fg = fg || '6b7280';
        text = text || '';
        var fontSize = Math.min(width, height) * 0.15;

        var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + width + '" height="' + height + '" viewBox="0 0 ' + width + ' ' + height + '">'
            + '<rect width="' + width + '" height="' + height + '" fill="#' + bg + '"/>'
            + '<text x="50%" y="50%" dy=".07em" fill="#' + fg + '" '
            + 'font-family="Inter, system-ui, sans-serif" font-size="' + Math.round(fontSize) + '" font-weight="500" '
            + 'text-anchor="middle" dominant-baseline="middle">' + escapeXml(text) + '</text>'
            + '</svg>';

        return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    }

    /** XML 转义 */
    function escapeXml(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    }

    /** 解析 placehold.co URL: /WxH/BG/FG?text=TEXT */
    function parsePlaceholdUrl(url) {
        // URL 格式: https://placehold.co/100x100/1e3a8a/ffffff?text=Img1
        var match = url.match(/placehold\.co\/(\d+)x(\d+)\/([a-fA-F0-9]{3,8})\/([a-fA-F0-9]{3,8})/);
        if (!match) return null;

        var params = parseParams(url);
        return {
            width: parseInt(match[1], 10),
            height: parseInt(match[2], 10),
            bg: match[3],
            fg: match[4],
            text: params.text || ''
        };
    }

    /** 扫描并替换页面中所有外部图片 */
    function replaceImages() {
        // 1. 替换 ui-avatars.com
        var avatarImgs = document.querySelectorAll('img[src*="ui-avatars.com"]');
        avatarImgs.forEach(function (img) {
            var src = img.getAttribute('src');
            var p = parseParams(src);
            if (!p.name) return;

            var dataUri = generateAvatar(
                p.name,
                p.background,
                p.color,
                p.size ? parseInt(p.size, 10) : null
            );
            img.setAttribute('src', dataUri);
        });

        // 2. 替换 placehold.co
        var placeholdImgs = document.querySelectorAll('img[src*="placehold.co"]');
        placeholdImgs.forEach(function (img) {
            var src = img.getAttribute('src');
            var info = parsePlaceholdUrl(src);
            if (!info) return;

            var dataUri = generatePlaceholder(info.width, info.height, info.bg, info.fg, info.text);
            img.setAttribute('src', dataUri);
        });
    }

    // DOM 加载完成时执行
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', replaceImages);
    } else {
        replaceImages();
    }

    // SPA 局部刷新后重新替换
    window.addEventListener('spa:ready', replaceImages);
})();
