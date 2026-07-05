(function () {
    'use strict';

    var HEADER_CONFIG = {
        'index.html': {
            type: 'standard',
            title: '欢迎回来，JERN 👋',
            subtitle: '今天是 2025年7月3日 星期四',
            search: '搜索订单、客户、海报等...',
            action: { label: '新建订单', icon: 'ph ph-plus', variant: 'primary' },
            titleClass: 'text-2xl'
        },
        'orders.html': {
            type: 'standard',
            title: '我的订单',
            subtitle: '共 128 条记录',
            search: '搜索订单号、客户、项目名称...',
            action: { label: '新建接单', icon: 'ph ph-plus', variant: 'primary' }
        },
        'quote.html': {
            type: 'standard',
            title: '生成报价单',
            subtitle: '规范化开发报价，支持一键生成文本或导出PDF',
            action: { label: '保存为模板', icon: 'ph ph-floppy-disk', variant: 'secondary' }
        },
        'customer.html': {
            type: 'standard',
            title: '客户管理',
            subtitle: '共 86 位客户',
            search: '搜索客户名称、联系方式、标签...',
            action: { label: '新增客户', icon: 'ph ph-plus', variant: 'primary', onclick: 'openCustomerForm(null,null)' }
        },
        'platform.html': {
            type: 'breadcrumb',
            breadcrumb: ['平台管理', '总览看板'],
            search: '搜索文案、内容、话题...'
        },
        'xianyu.html': {
            type: 'platform',
            platform: 'xianyu',
            title: '闲鱼运营',
            subtitle: '管理闲鱼发帖记录、数据追踪与转化分析',
            search: '搜索帖子标题、标签...',
            action: { label: '记录发帖', icon: 'ph ph-plus', variant: 'primary' }
        },
        'xiaohongshu.html': {
            type: 'platform',
            platform: 'xiaohongshu',
            title: '小红书运营',
            subtitle: '管理小红书发帖记录、数据追踪与转化分析',
            search: '搜索笔记标题、标签...',
            action: { label: '记录发帖', icon: 'ph ph-plus', variant: 'primary' }
        },
        'douyin.html': {
            type: 'platform',
            platform: 'douyin',
            title: '抖音运营',
            subtitle: '管理抖音视频发布、数据追踪与转化分析',
            search: '搜索视频标题、标签...',
            action: { label: '记录发布', icon: 'ph ph-plus', variant: 'primary' }
        },
        'posters.html': {
            type: 'standard',
            title: '宣传海报库',
            subtitle: '管理各平台引流素材，提升获客转化',
            search: '搜索海报名称、标签...',
            secondaryAction: { label: '从模板创建', icon: 'ph ph-copy', variant: 'secondary' },
            action: { label: '上传海报', icon: 'ph ph-upload-simple', variant: 'primary' }
        },
        'stats.html': {
            type: 'standard',
            title: '数据统计',
            subtitle: '多维度数据分析，辅助业务决策',
            controls: [
                { label: '本周', active: false },
                { label: '本月', active: true },
                { label: '本季', active: false },
                { label: '本年', active: false },
                { label: '自定义', active: false, icon: 'ph ph-calendar-blank' }
            ],
            action: { label: '导出报表', icon: 'ph ph-export', variant: 'secondary' }
        },
        'project.html': {
            type: 'standard',
            title: '项目管理',
            subtitle: '共 24 个项目 · 12 个进行中',
            search: '搜索项目名称、客户...',
            action: { label: '新建项目', icon: 'ph ph-plus', variant: 'primary', onclick: 'openEditForm(null)' }
        },
        'resume.html': {
            type: 'standard',
            title: '简历管理',
            subtitle: '管理简历版本，持续优化求职竞争力',
            search: '搜索版本、内容...',
            action: { label: '新增简历', icon: 'ph ph-plus', variant: 'primary', onclick: 'createNewJob()' }
        },
        'memo.html': {
            type: 'standard',
            title: '信息备忘录',
            subtitle: '记录重要信息，快速检索与回顾',
            search: '搜索备忘录内容...',
            action: { label: '新建备忘', icon: 'ph ph-plus', variant: 'primary' }
        },
        'settings.html': {
            type: 'standard',
            title: '设置中心',
            subtitle: '管理账号、数据备份与系统配置'
        }
    };

    function getCurrentPageName() {
        return window.location.pathname.split('/').pop() || 'index.html';
    }

    function getHeaderConfig(pageName) {
        return HEADER_CONFIG[pageName] || HEADER_CONFIG['index.html'];
    }

    function escapeHtml(value) {
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function renderSearch(search) {
        if (!search) return '';
        return [
            '<div class="relative">',
            '    <i class="ph ph-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>',
            '    <input type="text" placeholder="' + escapeHtml(search) + '" class="pl-9 pr-12 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm w-[360px] focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all">',
            '    <div class="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[10px] text-gray-400 bg-white px-1.5 py-0.5 rounded border border-gray-200">',
            '        <i class="ph ph-command"></i> K',
            '    </div>',
            '</div>'
        ].join('');
    }

    function renderBell() {
        return [
            '<button class="relative w-10 h-10 flex items-center justify-center rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">',
            '    <i class="ph ph-bell text-lg"></i>',
            '    <span class="absolute top-0 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white">12</span>',
            '</button>'
        ].join('');
    }

    function renderAvatar() {
        return '<img src="https://ui-avatars.com/api/?name=JERN&background=random&color=fff" alt="User Avatar" class="w-8 h-8 rounded-full">';
    }

    function renderButton(action, variant) {
        if (!action) return '';
        var icon = action.icon ? '<i class="' + escapeHtml(action.icon) + '"></i>' : '';
        var buttonClass = variant === 'secondary'
            ? 'px-4 py-2 border border-gray-200 text-gray-700 bg-white rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium flex items-center gap-2'
            : 'bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-sm shadow-brand-500/30';
        var onclickAttr = action.onclick ? ' onclick="' + escapeHtml(action.onclick) + '"' : '';
        return '<button class="' + buttonClass + '"' + onclickAttr + '>' + icon + escapeHtml(action.label) + '</button>';
    }

    function renderControls(controls) {
        if (!controls || !controls.length) return '';
        return [
            '<div class="flex items-center gap-1 bg-gray-50 p-1 rounded-lg">',
            controls.map(function (control) {
                var className = control.active
                    ? 'px-3 py-1.5 bg-white shadow-sm rounded-md text-gray-800 text-xs font-medium transition-colors'
                    : 'px-3 py-1.5 text-gray-500 hover:text-gray-800 rounded-md text-xs font-medium transition-colors';
                var icon = control.icon ? '<i class="' + escapeHtml(control.icon) + '"></i> ' : '';
                return '<button class="' + className + (control.icon ? ' flex items-center gap-1' : '') + '">' + icon + escapeHtml(control.label) + '</button>';
            }).join(''),
            '</div>'
        ].join('');
    }

    function renderStandardLeft(config) {
        var titleClass = config.titleClass || 'text-xl';
        return [
            '<div>',
            '    <h2 class="' + titleClass + ' font-bold text-gray-800">' + escapeHtml(config.title) + '</h2>',
            config.subtitle ? '    <p class="text-sm text-gray-500 mt-0.5">' + escapeHtml(config.subtitle) + '</p>' : '',
            '</div>'
        ].join('');
    }

    function renderPlatformLeft(config) {
        return [
            '<div class="flex items-center gap-4">',
            '    <div class="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0" data-platform="' + escapeHtml(config.platform) + '"></div>',
            '    <div>',
            '        <h2 class="text-xl font-bold text-gray-800">' + escapeHtml(config.title) + '</h2>',
            '        <p class="text-sm text-gray-500 mt-0.5">' + escapeHtml(config.subtitle) + '</p>',
            '    </div>',
            '</div>'
        ].join('');
    }

    function renderBreadcrumbLeft(config) {
        var crumbs = (config.breadcrumb || []).map(function (item, index, list) {
            var isLast = index === list.length - 1;
            return [
                '<span class="' + (isLast ? 'text-gray-900 font-semibold' : 'text-gray-500') + '">' + escapeHtml(item) + '</span>',
                isLast ? '' : '<i class="ph ph-caret-right text-xs text-gray-300"></i>'
            ].join('');
        }).join('');

        return [
            '<nav class="flex items-center gap-2 text-sm">',
            crumbs,
            '</nav>'
        ].join('');
    }

    function buildHeaderInnerHTML(pageName) {
        var config = getHeaderConfig(pageName);
        var leftHtml;

        if (config.type === 'breadcrumb') {
            leftHtml = renderBreadcrumbLeft(config);
        } else if (config.type === 'platform') {
            leftHtml = renderPlatformLeft(config);
        } else {
            leftHtml = renderStandardLeft(config);
        }

        return [
            '<div class="flex items-center gap-4">',
            leftHtml,
            '</div>',
            '<div class="flex items-center gap-5">',
            renderSearch(config.search),
            renderControls(config.controls),
            renderButton(config.secondaryAction, 'secondary'),
            renderBell(),
            '<div class="flex items-center gap-2 cursor-pointer hover:bg-gray-50 py-1.5 px-2 rounded-lg transition-colors border border-transparent hover:border-gray-200">',
            renderAvatar(),
            '    <span class="text-sm font-medium text-gray-700">JERN</span>',
            '    <i class="ph ph-caret-down text-gray-400 text-xs"></i>',
            '</div>',
            renderButton(config.action, config.action && config.action.variant === 'secondary' ? 'secondary' : 'primary'),
            '</div>'
        ].join('');
    }

    function renderHeader(pageName) {
        var currentPage = pageName || getCurrentPageName();
        var header = document.getElementById('app-header');
        var headerHtml = buildHeaderInnerHTML(currentPage);

        if (header) {
            header.innerHTML = headerHtml;
            return header;
        }

        var main = document.querySelector('main');
        if (!main) return null;

        main.insertAdjacentHTML('afterbegin', [
            '<header id="app-header" class="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-8 flex-shrink-0 relative z-10">',
            headerHtml,
            '</header>'
        ].join(''));

        return document.getElementById('app-header');
    }

    document.addEventListener('DOMContentLoaded', function () {
        renderHeader(getCurrentPageName());
    });

    window.addEventListener('spa:ready', function (event) {
        var pageName = event && event.detail && event.detail.page ? event.detail.page : getCurrentPageName();
        renderHeader(pageName);
    });

    window.renderHeader = renderHeader;
})();
