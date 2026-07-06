/**
 * 平台管理共享组件
 *
 * 为闲鱼、小红书、抖音三个平台页面提供统一的：
 *   - 数据加载与渲染（从 /api/platform-posts 获取）
 *   - 统计卡片渲染（从 /api/platform-posts/stats/overview 获取）
 *   - 筛选与搜索
 *   - 新建/编辑发布表单弹窗
 *   - 查看数据弹窗
 *   - 删除确认
 *
 * 用法（在各平台 HTML 页面末尾调用）：
 *   PlatformManager.init({
 *     platform: 'xianyu',           // xianyu | xiaohongshu | douyin
 *     label: '闲鱼',
 *     color: 'yellow',
 *     accentClass: 'bg-yellow-400 text-black',
 *     accentLight: 'bg-yellow-50 text-yellow-700 border-yellow-300',
 *     accentText: 'text-yellow-600',
 *     categories: ['引流海报', '毕设代做', '接单定制', '设计服务'],
 *     aspectRatio: 'aspect-[3/4]',  // 卡片图片比例
 *     isVideo: false                // 抖音为 true
 *   });
 */
(function () {
    'use strict';

    // ========== 状态 ==========

    var config = null;
    var allPosts = [];
    var currentFilter = 'all';   // all | published | draft | offline
    var currentCategory = '';
    var editId = null;           // 编辑模式时的记录 ID

    // 平台图标 HTML
    var PLATFORM_ICONS = {
        xianyu: '<span class="font-bold text-[10px]">闲鱼</span>',
        xiaohongshu: '<span class="font-bold text-[10px]">小红书</span>',
        douyin: '<i class="ph-fill ph-tiktok-logo text-sm"></i>'
    };

    // 状态标签映射
    var STATUS_MAP = {
        draft: { label: '草稿', class: 'bg-gray-50 text-gray-500 border-gray-200' },
        pending: { label: '待发布', class: 'bg-orange-50 text-orange-500 border-orange-100' },
        published: { label: '已发布', class: 'bg-green-50 text-green-600 border-green-100' },
        offline: { label: '已下架', class: 'bg-red-50 text-red-500 border-red-100' }
    };

    // ========== 工具函数 ==========

    function api(url, opts) {
        opts = opts || {};
        opts.headers = opts.headers || {};
        if (opts.body && typeof opts.body === 'object' && !(opts.body instanceof FormData)) {
            opts.headers['Content-Type'] = 'application/json';
            opts.body = JSON.stringify(opts.body);
        }
        return fetch(url, opts).then(function (r) { return r.json(); });
    }

    function formatDate(d) {
        if (!d) return '';
        var date = new Date(d);
        var m = String(date.getMonth() + 1).padStart(2, '0');
        var day = String(date.getDate()).padStart(2, '0');
        return m + '-' + day;
    }

    function formatDateTime(d) {
        if (!d) return '';
        var date = new Date(d);
        var m = String(date.getMonth() + 1).padStart(2, '0');
        var day = String(date.getDate()).padStart(2, '0');
        var h = String(date.getHours()).padStart(2, '0');
        var min = String(date.getMinutes()).padStart(2, '0');
        return m + '-' + day + ' ' + h + ':' + min;
    }

    function formatNumber(n) {
        n = parseInt(n) || 0;
        if (n >= 10000) return (n / 10000).toFixed(1) + 'w';
        if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
        return n.toString();
    }

    function formatMoney(n) {
        n = parseFloat(n) || 0;
        if (n >= 10000) return '¥' + (n / 10000).toFixed(1) + 'w';
        return '¥' + n.toLocaleString();
    }

    function escapeHtml(s) {
        if (!s) return '';
        return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    // ========== 初始化 ==========

    function init(userConfig) {
        config = userConfig;
        loadOverview();
        loadPosts();
        bindPageEvents();
    }

    // ========== 数据加载 ==========

    function loadOverview() {
        api('/api/platform-posts/stats/overview').then(function (res) {
            if (res.success && res.data[config.platform]) {
                renderStats(res.data[config.platform]);
            }
        });
    }

    function loadPosts() {
        api('/api/platform-posts?platform=' + config.platform).then(function (res) {
            if (res.success) {
                allPosts = res.data.list || [];
                renderPosts();
                renderTabs();
            }
        });
    }

    // ========== 渲染统计卡片 ==========

    function renderStats(data) {
        var container = document.getElementById('pm-stats');
        if (!container) return;

        var viewsLabel = config.isVideo ? '总播放量' : '总浏览量';
        var viewsIcon = config.isVideo ? 'ph-play' : 'ph-eye';
        var interactLabel = config.isVideo ? '点赞评论' : (config.platform === 'xianyu' ? '私信咨询' : '点赞收藏');
        var interactIcon = config.platform === 'xianyu' ? 'ph-chat-circle-dots' : 'ph-heart';
        var interactValue = config.platform === 'xianyu' ? formatNumber(data.totalViews > 0 ? Math.round(data.totalViews * 0.07) : 0) : formatNumber(data.totalLikes);

        container.innerHTML = [
            '<div class="bg-white rounded-xl border border-gray-100 p-4">',
            '  <div class="flex items-center justify-between mb-2">',
            '    <span class="text-xs text-gray-500">本月发布</span>',
            '    <i class="ph-fill ph-note-pencil ' + config.accentText + ' text-lg"></i>',
            '  </div>',
            '  <p class="text-2xl font-bold text-gray-800">' + data.published + '<span class="text-sm text-gray-400 font-normal ml-1">篇</span></p>',
            '</div>',
            '<div class="bg-white rounded-xl border border-gray-100 p-4">',
            '  <div class="flex items-center justify-between mb-2">',
            '    <span class="text-xs text-gray-500">' + viewsLabel + '</span>',
            '    <i class="ph-fill ' + viewsIcon + ' ' + config.accentText + ' text-lg"></i>',
            '  </div>',
            '  <p class="text-2xl font-bold text-gray-800">' + formatNumber(data.totalViews) + '</p>',
            '</div>',
            '<div class="bg-white rounded-xl border border-gray-100 p-4">',
            '  <div class="flex items-center justify-between mb-2">',
            '    <span class="text-xs text-gray-500">' + interactLabel + '</span>',
            '    <i class="ph-fill ' + interactIcon + ' ' + config.accentText + ' text-lg"></i>',
            '  </div>',
            '  <p class="text-2xl font-bold text-gray-800">' + interactValue + '</p>',
            '</div>',
            '<div class="bg-white rounded-xl border border-gray-100 p-4">',
            '  <div class="flex items-center justify-between mb-2">',
            '    <span class="text-xs text-gray-500">成交金额</span>',
            '    <i class="ph-fill ph-currency-cny ' + config.accentText + ' text-lg"></i>',
            '  </div>',
            '  <p class="text-2xl font-bold text-gray-800">' + formatMoney(data.totalRevenue) + '</p>',
            '</div>'
        ].join('');
    }

    // ========== 渲染筛选 Tab ==========

    function renderTabs() {
        var counts = { all: allPosts.length, published: 0, draft: 0, offline: 0 };
        allPosts.forEach(function (p) {
            if (counts[p.status] !== undefined) counts[p.status]++;
        });

        var container = document.getElementById('pm-tabs');
        if (!container) return;

        var tabs = [
            { key: 'all', label: '全部', count: counts.all },
            { key: 'published', label: '已发布', count: counts.published },
            { key: 'draft', label: '草稿', count: counts.draft },
            { key: 'offline', label: '已下架', count: counts.offline }
        ];

        container.innerHTML = tabs.map(function (t) {
            var active = currentFilter === t.key;
            var cls = active
                ? 'px-4 py-1.5 bg-white shadow-sm rounded-md text-gray-800 text-sm font-medium transition-colors'
                : 'px-4 py-1.5 text-gray-500 hover:text-gray-800 rounded-md text-sm font-medium transition-colors';
            return '<button class="' + cls + '" data-filter="' + t.key + '">' + t.label + ' (' + t.count + ')</button>';
        }).join('');

        // 重新绑定 tab 点击
        container.querySelectorAll('button[data-filter]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                currentFilter = btn.getAttribute('data-filter');
                renderTabs();
                renderPosts();
            });
        });
    }

    // ========== 渲染分类筛选 ==========

    function renderCategoryFilters() {
        var container = document.getElementById('pm-categories');
        if (!container || !config.categories) return;

        container.innerHTML = config.categories.map(function (cat) {
            var active = currentCategory === cat;
            var cls = active
                ? 'px-3 py-1.5 ' + config.accentLight + ' rounded-lg text-xs font-medium border'
                : 'px-3 py-1.5 bg-white border border-gray-200 text-gray-500 hover:text-gray-800 rounded-lg text-xs font-medium transition-colors';
            return '<button class="' + cls + '" data-category="' + escapeHtml(cat) + '">' + escapeHtml(cat) + '</button>';
        }).join('');

        container.querySelectorAll('button[data-category]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var cat = btn.getAttribute('data-category');
                currentCategory = currentCategory === cat ? '' : cat;
                renderCategoryFilters();
                renderPosts();
            });
        });
    }

    // ========== 渲染帖子卡片 ==========

    function getFilteredPosts() {
        var filtered = allPosts;
        if (currentFilter !== 'all') {
            filtered = filtered.filter(function (p) { return p.status === currentFilter; });
        }
        if (currentCategory) {
            filtered = filtered.filter(function (p) { return p.category === currentCategory; });
        }
        return filtered;
    }

    function renderPosts() {
        var container = document.getElementById('pm-posts');
        if (!container) return;

        var posts = getFilteredPosts();

        if (posts.length === 0) {
            container.innerHTML = [
                '<div class="col-span-full text-center py-16 text-gray-400">',
                '  <i class="ph ph-tray text-5xl mb-3 block"></i>',
                '  <p class="text-sm">暂无内容，点击右上角「新建发布」开始创建</p>',
                '</div>'
            ].join('');
            return;
        }

        container.innerHTML = posts.map(function (p) {
            return buildPostCard(p);
        }).join('');

        // 绑定卡片操作按钮
        container.querySelectorAll('[data-action]').forEach(function (btn) {
            btn.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                var action = btn.getAttribute('data-action');
                var id = btn.getAttribute('data-id');
                if (action === 'edit') openFormModal(id);
                else if (action === 'data') openDataModal(id);
                else if (action === 'delete') deletePost(id);
                else if (action === 'publish') publishPost(id);
            });
        });
    }

    function buildPostCard(p) {
        var status = STATUS_MAP[p.status] || STATUS_MAP.draft;
        var stats = p.stats || {};
        var viewsLabel = config.isVideo ? '播放' : '浏览';
        var interactLabel = config.platform === 'xianyu' ? '私信' : '点赞';

        // 封面区域
        var coverHtml = '';
        if (config.isVideo) {
            // 抖音视频卡片
            var duration = p.videoDuration || '00:00';
            coverHtml = [
                '<div class="absolute top-4 left-4 bg-black/40 text-white text-[10px] px-2 py-1 rounded backdrop-blur-sm flex items-center gap-1">',
                '  <i class="ph-fill ph-play"></i> ' + escapeHtml(duration),
                '</div>'
            ].join('');
            if (p.images && p.images.length > 0) {
                coverHtml += '<img src="' + escapeHtml(p.images[0]) + '" class="absolute inset-0 w-full h-full object-cover">';
            } else {
                coverHtml += [
                    '<div class="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">',
                    '  <i class="ph-fill ph-film-strip text-5xl text-gray-700 mb-3"></i>',
                    '  <h3 class="font-bold text-white text-lg leading-tight">' + escapeHtml(p.title || '') + '</h3>',
                    '</div>'
                ].join('');
            }
        } else if (p.images && p.images.length > 0) {
            coverHtml = '<img src="' + escapeHtml(p.images[0]) + '" class="absolute inset-0 w-full h-full object-cover">';
        } else {
            // 无图片时的占位封面
            coverHtml = [
                '<div class="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">',
                '  <i class="ph ph-image text-4xl text-gray-700 mb-2"></i>',
                '  <h3 class="font-bold text-white text-base leading-tight">' + escapeHtml(p.title || '未命名') + '</h3>',
                '</div>'
            ].join('');
        }

        // 背景渐变
        var bgClass = config.isVideo ? 'bg-gray-900' : 'bg-gradient-to-br from-gray-800 to-gray-950';

        return [
            '<div class="bg-white rounded-xl border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-hover hover:-translate-y-1 flex flex-col group relative">',
            '  <div class="relative ' + config.aspectRatio + ' ' + bgClass + ' overflow-hidden">',
            '    <div class="absolute inset-0 bg-gray-900/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-center items-center gap-3 z-10 backdrop-blur-[2px]">',
            (p.status === 'published' ?
                '      <button data-action="data" data-id="' + p.id + '" class="bg-white text-gray-800 hover:' + config.accentLight + ' px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors cursor-pointer"><i class="ph ph-chart-bar"></i> 查看数据</button>' : ''
            ),
            '      <button data-action="edit" data-id="' + p.id + '" class="bg-transparent border border-white/50 text-white hover:bg-white/10 hover:border-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors cursor-pointer"><i class="ph ph-pencil-simple"></i> 编辑记录</button>',
            (p.status === 'draft' || p.status === 'pending' ?
                '      <button data-action="publish" data-id="' + p.id + '" class="bg-green-500 text-white hover:bg-green-600 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors cursor-pointer"><i class="ph ph-rocket-launch"></i> 发布</button>' : ''
            ),
            '    </div>',
            coverHtml,
            (p.status === 'published' ? '<span class="absolute top-3 right-3 z-20 px-2 py-0.5 ' + config.accentClass + ' text-[10px] font-bold rounded">已发布</span>' : ''),
            '  </div>',
            '  <div class="p-4 border-t border-gray-50 flex flex-col justify-between flex-1 bg-white relative z-20">',
            '    <div>',
            '      <div class="flex justify-between items-start mb-1">',
            '        <h4 class="font-semibold text-gray-800 text-sm truncate pr-2">' + escapeHtml(p.title || '') + '</h4>',
            '        <span class="text-[10px] text-gray-400 flex-shrink-0">' + formatDate(p.publishTime || p.createdAt) + '</span>',
            '      </div>',
            '      <p class="text-xs text-gray-400 mb-2 truncate">' + escapeHtml(p.category || '') + '</p>',
            '    </div>',
            '    <div class="grid grid-cols-3 gap-1 text-center mt-2 pt-2 border-t border-gray-50">',
            '      <div><p class="text-xs font-bold text-gray-800">' + formatNumber(stats.views) + '</p><p class="text-[10px] text-gray-400">' + viewsLabel + '</p></div>',
            '      <div><p class="text-xs font-bold text-gray-800">' + formatNumber(config.platform === 'xianyu' ? stats.inquiries : stats.likes) + '</p><p class="text-[10px] text-gray-400">' + interactLabel + '</p></div>',
            '      <div><p class="text-xs font-bold text-green-600">' + formatMoney(stats.revenue) + '</p><p class="text-[10px] text-gray-400">成交</p></div>',
            '    </div>',
            '    <div class="flex items-center justify-between mt-2">',
            '      <span class="px-2 py-0.5 rounded text-[10px] font-medium border inline-block ' + status.class + '">' + status.label + '</span>',
            '      <button data-action="delete" data-id="' + p.id + '" class="text-[10px] text-red-400 hover:text-red-600 transition-colors flex items-center gap-1"><i class="ph ph-trash"></i>删除</button>',
            '    </div>',
            '  </div>',
            '</div>'
        ].join('');
    }

    // ========== 表单弹窗（新建/编辑） ==========

    function openFormModal(id) {
        editId = id || null;
        var record = id ? allPosts.find(function (p) { return p.id === id; }) : null;

        // 构建 Modal DOM
        var modalHtml = buildFormModalHtml(record);
        var existing = document.getElementById('pm-form-modal');
        if (existing) existing.remove();
        document.body.insertAdjacentHTML('beforeend', modalHtml);

        // 绑定事件
        bindFormEvents(record);

        // 显示
        var modal = document.getElementById('pm-form-modal');
        requestAnimationFrame(function () {
            modal.classList.remove('opacity-0');
            modal.querySelector('.pm-modal-body').classList.remove('scale-95', 'opacity-0');
        });
        document.body.style.overflow = 'hidden';
    }

    function closeFormModal() {
        var modal = document.getElementById('pm-form-modal');
        if (!modal) return;
        modal.classList.add('opacity-0');
        modal.querySelector('.pm-modal-body').classList.add('scale-95', 'opacity-0');
        setTimeout(function () {
            modal.remove();
            document.body.style.overflow = '';
            editId = null;
        }, 200);
    }

    function buildFormModalHtml(record) {
        var r = record || {};
        var stats = r.stats || {};
        var title = editId ? '编辑发布记录' : '新建发布';
        var submitText = editId ? '保存修改' : '创建发布';

        return [
            '<div id="pm-form-modal" class="fixed inset-0 z-[9999] flex items-center justify-center opacity-0 transition-opacity duration-200">',
            '  <div class="absolute inset-0 bg-black/40" id="pm-form-overlay"></div>',
            '  <div class="pm-modal-body relative bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col scale-95 opacity-0 transition-all duration-200">',
            // Header
            '    <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">',
            '      <h3 class="font-bold text-gray-800 text-base">' + title + '</h3>',
            '      <button id="pm-form-close" class="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition"><i class="ph ph-x text-lg"></i></button>',
            '    </div>',
            // Body
            '    <div class="flex-1 overflow-y-auto px-6 py-5">',
            '      <form id="pm-post-form" class="space-y-5">',
            // 基本信息
            '        <div class="space-y-3">',
            '          <div class="flex items-center gap-2 text-sm font-semibold text-gray-800"><i class="ph ph-info text-brand-500"></i>基本信息</div>',
            '          <div class="grid grid-cols-2 gap-x-4 gap-y-3">',
            '            <div class="col-span-2"><label class="block text-xs text-gray-500 mb-1.5">内容标题 <span class="text-red-400">*</span></label><input type="text" name="title" value="' + escapeHtml(r.title || '') + '" placeholder="如：闲鱼引流主图-07" class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15 transition-all bg-white"></div>',
            '            <div><label class="block text-xs text-gray-500 mb-1.5">内容分类</label><select name="category" class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-500 bg-white">' + config.categories.map(function (c) { return '<option value="' + c + '"' + (r.category === c ? ' selected' : '') + '>' + c + '</option>'; }).join('') + '</select></div>',
            '            <div><label class="block text-xs text-gray-500 mb-1.5">状态</label><select name="status" class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-500 bg-white"><option value="draft"' + (r.status === 'draft' ? ' selected' : '') + '>草稿</option><option value="pending"' + (r.status === 'pending' ? ' selected' : '') + '>待发布</option><option value="published"' + (r.status === 'published' ? ' selected' : '') + '>已发布</option><option value="offline"' + (r.status === 'offline' ? ' selected' : '') + '>已下架</option></select></div>',
            '          </div>',
            '          <div><label class="block text-xs text-gray-500 mb-1.5">内容文案</label><textarea name="content" rows="3" placeholder="输入发布内容文案..." class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15 transition-all bg-white resize-none">' + escapeHtml(r.content || '') + '</textarea></div>',
            '        </div>',
            // 媒体上传
            '        <div class="border-t border-gray-50 pt-4 space-y-3">',
            '          <div class="flex items-center gap-2 text-sm font-semibold text-gray-800"><i class="ph ph-image text-blue-500"></i>' + (config.isVideo ? '视频信息' : '图片上传') + '</div>',
            config.isVideo ? [
            '          <div class="grid grid-cols-2 gap-x-4 gap-y-3">',
            '            <div><label class="block text-xs text-gray-500 mb-1.5">视频链接</label><input type="text" name="videoUrl" value="' + escapeHtml(r.videoUrl || '') + '" placeholder="视频文件 URL" class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-500 bg-white"></div>',
            '            <div><label class="block text-xs text-gray-500 mb-1.5">视频时长</label><input type="text" name="videoDuration" value="' + escapeHtml(r.videoDuration || '') + '" placeholder="如 00:45" class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-500 bg-white"></div>',
            '          </div>'
            ].join('') : '',
            '          <div><label class="block text-xs text-gray-500 mb-1.5">封面/图片（可多选，直接文件存储）</label>',
            '            <div id="pm-image-upload" class="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:border-brand-300 transition cursor-pointer">',
            '              <i class="ph ph-cloud-arrow-up text-2xl text-gray-400 mb-1 block"></i>',
            '              <p class="text-xs text-gray-500">点击或拖拽图片到此处上传</p>',
            '              <input type="file" id="pm-file-input" accept="image/*" multiple class="hidden">',
            '            </div>',
            '            <div id="pm-image-preview" class="flex flex-wrap gap-2 mt-2"></div>',
            '          </div>',
            '        </div>',
            // 发布设置
            '        <div class="border-t border-gray-50 pt-4 space-y-3">',
            '          <div class="flex items-center gap-2 text-sm font-semibold text-gray-800"><i class="ph ph-calendar-check text-green-500"></i>发布设置</div>',
            '          <div class="grid grid-cols-2 gap-x-4 gap-y-3">',
            '            <div><label class="block text-xs text-gray-500 mb-1.5">发布时间</label><input type="datetime-local" name="publishTime" value="' + (r.publishTime ? r.publishTime.substring(0, 16) : '') + '" class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-500 bg-white"></div>',
            '            <div><label class="block text-xs text-gray-500 mb-1.5">发布方式</label><select name="publishType" class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-500 bg-white"><option value="manual"' + (r.publishType !== 'scheduled' ? ' selected' : '') + '>手动发布</option><option value="scheduled"' + (r.publishType === 'scheduled' ? ' selected' : '') + '>定时发布</option></select></div>',
            '          </div>',
            '        </div>',
            // 数据统计（仅已发布才填）
            '        <div class="border-t border-gray-50 pt-4 space-y-3">',
            '          <div class="flex items-center gap-2 text-sm font-semibold text-gray-800"><i class="ph ph-chart-bar text-purple-500"></i>数据统计</div>',
            '          <div class="grid grid-cols-3 gap-x-4 gap-y-3">',
            '            <div><label class="block text-xs text-gray-500 mb-1.5">' + (config.isVideo ? '播放量' : '浏览量') + '</label><input type="number" name="views" value="' + (stats.views || 0) + '" class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-500 bg-white"></div>',
            '            <div><label class="block text-xs text-gray-500 mb-1.5">点赞</label><input type="number" name="likes" value="' + (stats.likes || 0) + '" class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-500 bg-white"></div>',
            '            <div><label class="block text-xs text-gray-500 mb-1.5">评论</label><input type="number" name="comments" value="' + (stats.comments || 0) + '" class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-500 bg-white"></div>',
            '            <div><label class="block text-xs text-gray-500 mb-1.5">分享</label><input type="number" name="shares" value="' + (stats.shares || 0) + '" class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-500 bg-white"></div>',
            '            <div><label class="block text-xs text-gray-500 mb-1.5">' + (config.platform === 'xianyu' ? '私信咨询' : '收藏/转发') + '</label><input type="number" name="inquiries" value="' + (stats.inquiries || 0) + '" class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-500 bg-white"></div>',
            '            <div><label class="block text-xs text-gray-500 mb-1.5">成交金额</label><input type="number" name="revenue" value="' + (stats.revenue || 0) + '" class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-500 bg-white"></div>',
            '          </div>',
            '        </div>',
            // 标签
            '        <div class="border-t border-gray-50 pt-4">',
            '          <label class="block text-xs text-gray-500 mb-1.5">标签</label>',
            '          <input type="text" name="tags" value="' + escapeHtml((r.tags || []).join(', ')) + '" placeholder="多个标签用逗号分隔" class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-500 bg-white">',
            '        </div>',
            '      </form>',
            '    </div>',
            // Footer
            '    <div class="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between flex-shrink-0">',
            '      <div class="text-xs text-gray-400" id="pm-form-hint">字段标记 * 为必填</div>',
            '      <div class="flex gap-3">',
            '        <button id="pm-form-cancel" class="px-5 py-2 border border-gray-200 text-gray-600 bg-white rounded-lg hover:bg-gray-50 transition text-sm font-medium">取消</button>',
            '        <button id="pm-form-submit" class="px-5 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition text-sm font-medium shadow-sm flex items-center gap-1.5"><i class="ph ph-check"></i>' + submitText + '</button>',
            '      </div>',
            '    </div>',
            '  </div>',
            '</div>'
        ].join('');
    }

    // ========== 图片上传处理 ==========

    var formImages = []; // 存储当前表单中的图片 URL（已上传至服务器）
    var isUploading = false; // 是否正在上传图片

    function bindFormEvents(record) {
        var closeBtn = document.getElementById('pm-form-close');
        var cancelBtn = document.getElementById('pm-form-cancel');
        var overlay = document.getElementById('pm-form-overlay');
        var submitBtn = document.getElementById('pm-form-submit');
        var uploadZone = document.getElementById('pm-image-upload');
        var fileInput = document.getElementById('pm-file-input');

        if (closeBtn) closeBtn.addEventListener('click', closeFormModal);
        if (cancelBtn) cancelBtn.addEventListener('click', closeFormModal);
        if (overlay) overlay.addEventListener('click', closeFormModal);
        if (submitBtn) submitBtn.addEventListener('click', submitForm);

        // 初始化已有图片
        formImages = (record && record.images) ? record.images.slice() : [];
        renderImagePreviews();

        // 图片上传
        if (uploadZone) {
            uploadZone.addEventListener('click', function () {
                fileInput.click();
            });
            uploadZone.addEventListener('dragover', function (e) {
                e.preventDefault();
                uploadZone.classList.add('border-brand-400', 'bg-brand-50/30');
            });
            uploadZone.addEventListener('dragleave', function () {
                uploadZone.classList.remove('border-brand-400', 'bg-brand-50/30');
            });
            uploadZone.addEventListener('drop', function (e) {
                e.preventDefault();
                uploadZone.classList.remove('border-brand-400', 'bg-brand-50/30');
                handleFiles(e.dataTransfer.files);
            });
        }

        if (fileInput) {
            fileInput.addEventListener('change', function () {
                handleFiles(this.files);
            });
        }

        // ESC 关闭
        document.addEventListener('keydown', formEscHandler);
    }

    function formEscHandler(e) {
        if (e.key === 'Escape') {
            closeFormModal();
            document.removeEventListener('keydown', formEscHandler);
        }
    }

    function handleFiles(files) {
        if (!files || files.length === 0) return;
        if (isUploading) return;

        // 筛选合法图片文件
        var validFiles = [];
        for (var i = 0; i < files.length; i++) {
            var file = files[i];
            if (!file.type.startsWith('image/')) continue;
            if (file.size > 10 * 1024 * 1024) {
                showFormHint('图片 ' + file.name + ' 超过 10MB，已跳过', 'error');
                continue;
            }
            validFiles.push(file);
        }
        if (validFiles.length === 0) return;

        isUploading = true;
        showFormHint('正在上传 ' + validFiles.length + ' 张图片...', '');

        // 通过 /api/upload/multiple 直接上传文件到服务器
        var formData = new FormData();
        validFiles.forEach(function (f) {
            formData.append('files', f);
        });

        fetch('/api/upload/multiple', { method: 'POST', body: formData })
            .then(function (r) { return r.json(); })
            .then(function (res) {
                isUploading = false;
                if (res.success && Array.isArray(res.data)) {
                    res.data.forEach(function (item) {
                        if (item && item.url) {
                            formImages.push(item.url);
                        }
                    });
                    renderImagePreviews();
                    showFormHint('字段标记 * 为必填', '');
                } else {
                    showFormHint(res.error || '上传失败', 'error');
                }
            })
            .catch(function (err) {
                isUploading = false;
                showFormHint('上传失败: ' + err.message, 'error');
            });
    }

    function renderImagePreviews() {
        var container = document.getElementById('pm-image-preview');
        if (!container) return;
        container.innerHTML = formImages.map(function (src, idx) {
            return [
                '<div class="relative w-16 h-16 rounded-lg border border-gray-200 overflow-hidden group">',
                '  <img src="' + src + '" class="w-full h-full object-cover">',
                '  <button type="button" data-remove-img="' + idx + '" class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition"><i class="ph ph-trash text-lg"></i></button>',
                '</div>'
            ].join('');
        }).join('');

        container.querySelectorAll('[data-remove-img]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var idx = parseInt(btn.getAttribute('data-remove-img'));
                formImages.splice(idx, 1);
                renderImagePreviews();
            });
        });
    }

    function showFormHint(msg, type) {
        var hint = document.getElementById('pm-form-hint');
        if (!hint) return;
        hint.textContent = msg;
        hint.className = type === 'error' ? 'text-xs text-red-500' : 'text-xs text-gray-400';
        if (type === 'error') {
            setTimeout(function () {
                hint.textContent = '字段标记 * 为必填';
                hint.className = 'text-xs text-gray-400';
            }, 3000);
        }
    }

    // ========== 提交表单 ==========

    function submitForm() {
        var form = document.getElementById('pm-post-form');
        if (!form) return;

        var title = form.title.value.trim();
        if (!title) {
            showFormHint('请填写内容标题', 'error');
            form.title.focus();
            return;
        }

        var data = {
            title: title,
            platform: config.platform,
            category: form.category.value,
            content: form.content.value.trim(),
            images: formImages.slice(),
            videoUrl: form.videoUrl ? form.videoUrl.value.trim() : '',
            videoDuration: form.videoDuration ? form.videoDuration.value.trim() : '',
            publishTime: form.publishTime.value || '',
            publishType: form.publishType.value,
            status: form.status.value,
            stats: {
                views: parseInt(form.views.value) || 0,
                likes: parseInt(form.likes.value) || 0,
                comments: parseInt(form.comments.value) || 0,
                shares: parseInt(form.shares.value) || 0,
                inquiries: parseInt(form.inquiries.value) || 0,
                revenue: parseFloat(form.revenue.value) || 0
            },
            tags: form.tags.value ? form.tags.value.split(/[,，]/).map(function (t) { return t.trim(); }).filter(Boolean) : []
        };

        var submitBtn = document.getElementById('pm-form-submit');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="ph ph-spinner animate-spin"></i> 保存中...';
        }

        var url = '/api/platform-posts';
        var method = 'POST';
        if (editId) {
            url = '/api/platform-posts/' + editId;
            method = 'PUT';
        }

        api(url, { method: method, body: data }).then(function (res) {
            if (res.success) {
                closeFormModal();
                loadPosts();
                loadOverview();
            } else {
                showFormHint(res.error || '保存失败', 'error');
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = '<i class="ph ph-check"></i> ' + (editId ? '保存修改' : '创建发布');
                }
            }
        }).catch(function (err) {
            showFormHint('网络错误: ' + err.message, 'error');
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="ph ph-check"></i> ' + (editId ? '保存修改' : '创建发布');
            }
        });
    }

    // ========== 数据查看弹窗 ==========

    function openDataModal(id) {
        var record = allPosts.find(function (p) { return p.id === id; });
        if (!record) return;

        var stats = record.stats || {};
        var modalHtml = buildDataModalHtml(record, stats);
        var existing = document.getElementById('pm-data-modal');
        if (existing) existing.remove();
        document.body.insertAdjacentHTML('beforeend', modalHtml);

        var modal = document.getElementById('pm-data-modal');
        requestAnimationFrame(function () {
            modal.classList.remove('opacity-0');
            modal.querySelector('.pm-modal-body').classList.remove('scale-95', 'opacity-0');
        });
        document.body.style.overflow = 'hidden';

        // 绑定关闭
        var closeBtn = document.getElementById('pm-data-close');
        var overlay = document.getElementById('pm-data-overlay');
        var cancelBtn = document.getElementById('pm-data-cancel');
        if (closeBtn) closeBtn.addEventListener('click', closeDataModal);
        if (overlay) overlay.addEventListener('click', closeDataModal);
        if (cancelBtn) cancelBtn.addEventListener('click', closeDataModal);

        document.addEventListener('keydown', dataEscHandler);
    }

    function dataEscHandler(e) {
        if (e.key === 'Escape') {
            closeDataModal();
            document.removeEventListener('keydown', dataEscHandler);
        }
    }

    function closeDataModal() {
        var modal = document.getElementById('pm-data-modal');
        if (!modal) return;
        modal.classList.add('opacity-0');
        modal.querySelector('.pm-modal-body').classList.add('scale-95', 'opacity-0');
        setTimeout(function () {
            modal.remove();
            document.body.style.overflow = '';
        }, 200);
    }

    function buildDataModalHtml(record, stats) {
        var status = STATUS_MAP[record.status] || STATUS_MAP.draft;
        var viewsLabel = config.isVideo ? '播放量' : '浏览量';

        var metrics = [
            { label: viewsLabel, value: stats.views || 0, icon: 'ph-eye', color: 'text-blue-500' },
            { label: '点赞', value: stats.likes || 0, icon: 'ph-heart', color: 'text-red-500' },
            { label: '评论', value: stats.comments || 0, icon: 'ph-chat-circle', color: 'text-gray-600' },
            { label: '分享', value: stats.shares || 0, icon: 'ph-share-network', color: 'text-green-500' },
            { label: config.platform === 'xianyu' ? '私信咨询' : '收藏/转发', value: stats.inquiries || 0, icon: config.platform === 'xianyu' ? 'ph-chat-circle-dots' : 'ph-bookmark-simple', color: 'text-yellow-500' },
            { label: '成交金额', value: formatMoney(stats.revenue), icon: 'ph-currency-cny', color: 'text-green-600' }
        ];

        // 转化率计算
        var inquiryRate = stats.views > 0 ? ((stats.inquiries / stats.views) * 100).toFixed(2) : '0';
        var conversionRate = stats.inquiries > 0 ? ((1 / stats.inquiries) * 100).toFixed(1) : '0';

        return [
            '<div id="pm-data-modal" class="fixed inset-0 z-[9999] flex items-center justify-center opacity-0 transition-opacity duration-200">',
            '  <div class="absolute inset-0 bg-black/40" id="pm-data-overlay"></div>',
            '  <div class="pm-modal-body relative bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col scale-95 opacity-0 transition-all duration-200">',
            '    <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">',
            '      <div>',
            '        <h3 class="font-bold text-gray-800 text-base">数据详情</h3>',
            '        <p class="text-xs text-gray-400 mt-0.5 truncate">' + escapeHtml(record.title || '') + '</p>',
            '      </div>',
            '      <button id="pm-data-close" class="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition"><i class="ph ph-x text-lg"></i></button>',
            '    </div>',
            '    <div class="flex-1 overflow-y-auto px-6 py-5">',
            // 状态信息
            '      <div class="flex items-center gap-3 mb-5">',
            '        <span class="px-2 py-1 rounded text-xs font-medium border ' + status.class + '">' + status.label + '</span>',
            '        <span class="text-xs text-gray-500">分类: ' + escapeHtml(record.category || '未分类') + '</span>',
            '        <span class="text-xs text-gray-500">发布: ' + formatDateTime(record.publishTime || record.createdAt) + '</span>',
            '      </div>',
            // 数据卡片网格
            '      <div class="grid grid-cols-3 gap-3 mb-5">',
            metrics.map(function (m) {
                return [
                    '<div class="bg-gray-50 rounded-lg p-3 text-center">',
                    '  <i class="ph-fill ' + m.icon + ' ' + m.color + ' text-xl mb-1 block"></i>',
                    '  <p class="text-lg font-bold text-gray-800">' + (typeof m.value === 'number' ? formatNumber(m.value) : m.value) + '</p>',
                    '  <p class="text-[10px] text-gray-400 mt-0.5">' + m.label + '</p>',
                    '</div>'
                ].join('');
            }).join(''),
            '      </div>',
            // 转化分析
            '      <div class="bg-brand-50/50 rounded-lg p-4">',
            '        <h4 class="text-sm font-semibold text-gray-800 mb-3"><i class="ph ph-chart-line-up text-brand-500 mr-1"></i>转化分析</h4>',
            '        <div class="grid grid-cols-2 gap-4">',
            '          <div><p class="text-xs text-gray-500 mb-1">浏览→咨询转化率</p><p class="text-lg font-bold text-brand-600">' + inquiryRate + '%</p></div>',
            '          <div><p class="text-xs text-gray-500 mb-1">咨询→成交转化率</p><p class="text-lg font-bold text-green-600">' + conversionRate + '%</p></div>',
            '        </div>',
            '      </div>',
            // 标签
            (record.tags && record.tags.length > 0 ? '<div class="mt-4"><p class="text-xs text-gray-500 mb-2">标签</p><div class="flex flex-wrap gap-2">' + record.tags.map(function (t) { return '<span class="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">' + escapeHtml(t) + '</span>'; }).join('') + '</div></div>' : ''),
            '    </div>',
            '    <div class="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex justify-end flex-shrink-0">',
            '      <button id="pm-data-cancel" class="px-5 py-2 border border-gray-200 text-gray-600 bg-white rounded-lg hover:bg-gray-50 transition text-sm font-medium">关闭</button>',
            '    </div>',
            '  </div>',
            '</div>'
        ].join('');
    }

    // ========== 删除帖子 ==========

    function deletePost(id) {
        var record = allPosts.find(function (p) { return p.id === id; });
        if (!record) return;

        if (!confirm('确定要删除「' + (record.title || '此记录') + '」吗？此操作不可撤销。')) return;

        api('/api/platform-posts/' + id, { method: 'DELETE' }).then(function (res) {
            if (res.success) {
                loadPosts();
                loadOverview();
            } else {
                alert('删除失败: ' + (res.error || '未知错误'));
            }
        });
    }

    // ========== 发布帖子 ==========

    function publishPost(id) {
        api('/api/platform-posts/' + id, { method: 'PUT', body: { status: 'published', publishTime: new Date().toISOString() } }).then(function (res) {
            if (res.success) {
                loadPosts();
                loadOverview();
            } else {
                alert('发布失败: ' + (res.error || '未知错误'));
            }
        });
    }

    // ========== 页面事件绑定 ==========

    function bindPageEvents() {
        // 新建发布按钮
        var newBtn = document.getElementById('pm-new-btn');
        if (newBtn) {
            newBtn.addEventListener('click', function () { openFormModal(null); });
        }

        // 渲染分类筛选
        renderCategoryFilters();

        // SPA 切换时清理
        window.addEventListener('spa:cleanup-forms', function () {
            var formModal = document.getElementById('pm-form-modal');
            var dataModal = document.getElementById('pm-data-modal');
            if (formModal) formModal.remove();
            if (dataModal) dataModal.remove();
            document.body.style.overflow = '';
        });
    }

    // ========== 暴露全局 API ==========

    window.PlatformManager = {
        init: init
    };

})();
