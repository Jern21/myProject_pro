/**
 * 平台图标替换器
 * 自动将页面中的文字/Phosphor图标占位替换为 assets/svg/ 下的本地 SVG 应用图标
 *
 * 替换规则：
 *   1. <i class="ph-fill ph-tiktok-logo"> → <img src="assets/svg/抖音.svg">
 *   2. 带 bg-yellow-400 且含"闲"/"闲鱼"文字的容器 → <img src="assets/svg/闲鱼.svg">
 *   3. 带 bg-red-500 且含"小红书"文字的容器 → <img src="assets/svg/小红书.svg">
 *   4. 带 bg-black/bg-gray-900 且含 ph-tiktok-logo 的容器 → <img src="assets/svg/抖音.svg">
 *   5. data-platform="xianyu|xiaohongshu|douyin" 属性 → 直接替换内容
 *
 * 图标尺寸统一由容器 w-x h-x 控制，<img> 使用 block w-full h-full 填满容器
 * 容器自动移除 flex 居中类并添加 overflow-hidden 确保裁剪正确
 */
(function () {
    'use strict';

    // SVG 文件名映射（不含路径前缀，路径在运行时动态拼接）
    var ICON_FILES = {
        xianyu: '闲鱼.svg',
        xiaohongshu: '小红书.svg',
        douyin: '抖音.svg',
    };

    var PLATFORM_NAMES = {
        xianyu: '闲鱼',
        xiaohongshu: '小红书',
        douyin: '抖音',
    };

    /**
     * 运行时计算 SVG 绝对路径
     * 优先使用 spa-router.js 提供的 ROOT_URL（绝对 URL），
     * 确保 SPA 切换到任意子目录后路径始终正确
     */
    function getIconUrl(platform) {
        var base = window.ROOT_URL || window.PAGE_BASE || '';
        return base + 'assets/svg/' + ICON_FILES[platform];
    }

    /**
     * 创建平台图标 <img> 元素
     * 统一使用 w-full h-full 填满父容器，由容器控制实际大小
     * @param {string} platform - 平台名称
     * @returns {HTMLImageElement}
     */
    function createIconImg(platform) {
        var img = document.createElement('img');
        img.src = getIconUrl(platform);
        img.alt = PLATFORM_NAMES[platform];
        img.className = 'block w-full h-full';
        img.loading = 'lazy';
        return img;
    }

    /**
     * 移除元素的品牌背景色和文字样式类（SVG 自带背景）
     */
    function removeBrandClasses(el) {
        el.classList.remove(
            'bg-yellow-400', 'bg-red-500', 'bg-black', 'bg-gray-900',
            'text-black', 'text-white',
            'font-bold', 'text-[10px]', 'text-xs', 'text-sm', 'text-lg', 'text-xl', 'text-2xl',
            'leading-none',
            'flex', 'inline-flex', 'items-center', 'justify-center'
        );
        // 确保容器裁剪图片（配合 rounded-* 实现圆角）
        el.classList.add('overflow-hidden');
    }

    /**
     * 检查元素是否有明确的宽高尺寸类（如 w-6 h-6）
     * 用于区分图标容器和小内联标签
     */
    function hasExplicitSize(el) {
        return /\bw-\d+/.test(el.className) && /\bh-\d+/.test(el.className);
    }

    /**
     * 检查元素文本是否匹配某平台
     */
    function matchPlatformByText(text) {
        text = (text || '').trim();
        if (text === '闲' || text === '闲鱼') return 'xianyu';
        if (text === '小红书') return 'xiaohongshu';
        return null;
    }

    /**
     * 核心替换函数
     */
    function replaceIcons() {
        // ===== 1. 替换所有 ph-tiktok-logo <i> 元素 =====
        var tiktokIcons = document.querySelectorAll('i.ph-tiktok-logo');
        tiktokIcons.forEach(function (icon) {
            var parent = icon.parentElement;

            // 情况 A：父元素是纯图标容器（bg-black/bg-gray-900 且有明确尺寸），替换整个父元素内容
            if (parent && hasExplicitSize(parent) &&
                (parent.classList.contains('bg-black') || parent.classList.contains('bg-gray-900'))) {
                var parentText = parent.textContent.trim();
                if (parentText === '' || parentText === '抖音') {
                    removeBrandClasses(parent);
                    parent.innerHTML = '';
                    parent.appendChild(createIconImg('douyin'));
                    return;
                }
            }

            // 情况 B：父元素有明确的 w-x h-x 尺寸，替换 <i> 为填满父元素的 <img>
            if (parent && /w-\d+/.test(parent.className) && /h-\d+/.test(parent.className)) {
                removeBrandClasses(parent);
                icon.parentNode.replaceChild(createIconImg('douyin'), icon);
                return;
            }

            // 情况 C：独立的 <i> 标签，包裹一个固定尺寸的 span 容器
            // 跳过小内联标签（有 px-/py- padding 但无明确尺寸的徽章）
            if (parent && !hasExplicitSize(parent) &&
                /\bpx-/.test(parent.className) && /\bpy-/.test(parent.className)) {
                return; // 小标签内的 <i> 不替换，保留原始 Phosphor 图标
            }
            var wrapper = document.createElement('span');
            wrapper.className = 'inline-block overflow-hidden w-5 h-5';
            wrapper.appendChild(createIconImg('douyin'));
            icon.parentNode.replaceChild(wrapper, icon);
        });

        // ===== 2. 替换含"闲"/"闲鱼"文字 + bg-yellow-400 的容器（须有明确尺寸） =====
        document.querySelectorAll('[class*="bg-yellow-400"]').forEach(function (el) {
            if (!hasExplicitSize(el)) return;
            var platform = matchPlatformByText(el.textContent);
            if (platform === 'xianyu') {
                removeBrandClasses(el);
                el.innerHTML = '';
                el.appendChild(createIconImg('xianyu'));
            }
        });

        // ===== 3. 替换含"小红书"文字 + bg-red-500 的容器（须有明确尺寸） =====
        document.querySelectorAll('[class*="bg-red-500"]').forEach(function (el) {
            if (!hasExplicitSize(el)) return;
            var platform = matchPlatformByText(el.textContent);
            if (platform === 'xiaohongshu') {
                removeBrandClasses(el);
                el.innerHTML = '';
                el.appendChild(createIconImg('xiaohongshu'));
            }
        });

        // ===== 4. 替换 data-platform 属性的元素 =====
        document.querySelectorAll('[data-platform]').forEach(function (el) {
            var platform = el.getAttribute('data-platform');
            if (!ICON_FILES[platform]) return;
            removeBrandClasses(el);
            el.innerHTML = '';
            el.appendChild(createIconImg(platform));
        });
    }

    // 初始执行
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', replaceIcons);
    } else {
        replaceIcons();
    }

    // SPA 局部刷新后重新替换
    window.addEventListener('spa:ready', replaceIcons);
})();
