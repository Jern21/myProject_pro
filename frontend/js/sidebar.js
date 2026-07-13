function initSidebar() {
    // 防重复插入保护：SPA 切换时不会二次执行
    if (document.querySelector('#sidebar-nav')) return;

    var PB = window.PAGE_BASE || '';

    // 页面路由表：短文件名 → 相对于 frontend 根目录的完整路径
    var ROUTES = {
        'index.html': 'index.html',
        'orders.html': 'pages/business/orders.html',
        'quote.html': 'pages/business/quote.html',
        'customer.html': 'pages/business/customer.html',
        'platform.html': 'pages/platform/platform.html',
        'xianyu.html': 'pages/platform/xianyu.html',
        'xiaohongshu.html': 'pages/platform/xiaohongshu.html',
        'douyin.html': 'pages/platform/douyin.html',
        'posters.html': 'pages/content/posters.html',
        'canvas.html': 'pages/content/canvas.html',
        'stats.html': 'pages/content/stats.html',
        'project.html': 'pages/content/project.html',
        'accounts.html': 'pages/personal/accounts.html',
        'bookmarks.html': 'pages/personal/bookmarks.html',
        'resume.html': 'pages/personal/resume.html',
        'memo.html': 'pages/personal/memo.html',
        'reminder.html': 'pages/personal/reminder.html',
        'settings.html': 'pages/personal/settings.html'
    };

    const sidebarHTML = `
    <aside class="w-56 bg-white border-r border-gray-100 flex flex-col h-full flex-shrink-0 relative z-40">
        <div class="overflow-y-auto flex-1 pb-4">
            <!-- Logo area -->
            <div class="p-6 flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0">
                    <img src="${PB}assets/gif/logo.gif" alt="Logo" class="w-full h-full object-cover">
                </div>
                <div>
                    <h1 class="font-bold text-gray-800 text-base">文的项目工作台</h1>
                    <p class="text-xs text-gray-400">大吉大利 · 今晚接单</p>
                </div>
            </div>

            <!-- Navigation -->
            <nav class="space-y-1 mt-2" id="sidebar-nav">
                <a href="${PB}${ROUTES['index.html']}" class="nav-link flex items-center px-4 py-2.5 mx-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer text-sm font-medium" data-page="index.html">
                    <i class="ph ph-house text-lg mr-3 icon-base text-gray-500"></i>首页
                </a>
                <a href="${PB}${ROUTES['orders.html']}" class="nav-link flex items-center px-4 py-2.5 mx-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer text-sm font-medium" data-page="orders.html">
                    <i class="ph ph-receipt text-lg mr-3 icon-base text-gray-500"></i>我的订单
                </a>
                <a href="${PB}${ROUTES['quote.html']}" class="nav-link flex items-center px-4 py-2.5 mx-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer text-sm font-medium" data-page="quote.html">
                    <i class="ph ph-currency-cny text-lg mr-3 icon-base text-gray-500"></i>报价管理
                </a>
                <a href="${PB}${ROUTES['posters.html']}" class="nav-link flex items-center px-4 py-2.5 mx-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer text-sm font-medium" data-page="posters.html">
                    <i class="ph ph-image text-lg mr-3 icon-base text-gray-500"></i>宣传海报
                </a>
                <a href="${PB}${ROUTES['canvas.html']}" class="nav-link flex items-center px-4 py-2.5 mx-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer text-sm font-medium" data-page="canvas.html">
                    <i class="ph ph-infinity text-lg mr-3 icon-base text-gray-500"></i>无限画布
                </a>
                
                <!-- Expanded Menu: Platform Management -->
                <div class="mt-2">
                    <div class="flex items-center mx-2 rounded-lg hover:bg-gray-100 transition-colors">
                        <a href="${PB}${ROUTES['platform.html']}" class="nav-link flex items-center flex-1 px-4 py-2.5 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer text-sm font-medium" data-page="platform.html">
                            <i class="ph ph-squares-four text-lg mr-3 icon-base text-gray-500"></i>平台管理
                        </a>
                        <button id="platform-toggle" class="px-3 py-2.5 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer">
                            <i class="ph ph-caret-right caret-icon"></i>
                        </button>
                    </div>
                    <!-- Sub-menu items -->
                    <div class="space-y-1 mt-1 hidden" id="platform-submenu">
                        <a href="${PB}${ROUTES['platform.html']}" class="nav-link flex items-center pl-11 pr-4 py-2 mx-2 rounded-lg bg-brand-50 text-brand-600 font-medium transition-colors cursor-pointer text-sm" data-page="platform.html">总览看板</a>
                        <a href="${PB}${ROUTES['xianyu.html']}" class="nav-link flex items-center pl-11 pr-4 py-2 mx-2 rounded-lg text-gray-500 hover:text-gray-900 transition-colors cursor-pointer text-sm" data-page="xianyu.html">闲鱼</a>
                        <a href="${PB}${ROUTES['xiaohongshu.html']}" class="nav-link flex items-center pl-11 pr-4 py-2 mx-2 rounded-lg text-gray-500 hover:text-gray-900 transition-colors cursor-pointer text-sm" data-page="xiaohongshu.html">小红书</a>
                        <a href="${PB}${ROUTES['douyin.html']}" class="nav-link flex items-center pl-11 pr-4 py-2 mx-2 rounded-lg text-gray-500 hover:text-gray-900 transition-colors cursor-pointer text-sm" data-page="douyin.html">抖音</a>
                    </div>
                </div>

                <a href="${PB}${ROUTES['customer.html']}" class="nav-link flex items-center px-4 py-2.5 mx-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer text-sm font-medium mt-2" data-page="customer.html">
                    <i class="ph ph-users text-lg mr-3 icon-base text-gray-500"></i>客户管理
                </a>
                <a href="${PB}${ROUTES['stats.html']}" class="nav-link flex items-center px-4 py-2.5 mx-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer text-sm font-medium" data-page="stats.html">
                    <i class="ph ph-chart-bar text-lg mr-3 icon-base text-gray-500"></i>数据统计
                </a>
                <a href="${PB}${ROUTES['project.html']}" class="nav-link flex items-center px-4 py-2.5 mx-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer text-sm font-medium" data-page="project.html">
                    <i class="ph ph-kanban text-lg mr-3 icon-base text-gray-500"></i>项目管理
                </a>
                <a href="${PB}${ROUTES['accounts.html']}" class="nav-link flex items-center px-4 py-2.5 mx-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer text-sm font-medium" data-page="accounts.html">
                    <i class="ph ph-key text-lg mr-3 icon-base text-gray-500"></i>账号管理
                </a>
                <a href="${PB}${ROUTES['bookmarks.html']}" class="nav-link flex items-center px-4 py-2.5 mx-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer text-sm font-medium" data-page="bookmarks.html">
                    <i class="ph ph-bookmark-simple text-lg mr-3 icon-base text-gray-500"></i>网址收藏
                </a>
                <a href="${PB}${ROUTES['resume.html']}" class="nav-link flex items-center px-4 py-2.5 mx-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer text-sm font-medium" data-page="resume.html">
                    <i class="ph ph-file-text text-lg mr-3 icon-base text-gray-500"></i>简历管理
                </a>
                <a href="${PB}${ROUTES['memo.html']}" class="nav-link flex items-center px-4 py-2.5 mx-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer text-sm font-medium" data-page="memo.html">
                    <i class="ph ph-notepad text-lg mr-3 icon-base text-gray-500"></i>信息备忘录
                </a>
                <a href="${PB}${ROUTES['reminder.html']}" class="nav-link flex items-center px-4 py-2.5 mx-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer text-sm font-medium" data-page="reminder.html">
                    <i class="ph ph-bell-ringing text-lg mr-3 icon-base text-gray-500"></i>日期提醒
                </a>
                <a href="${PB}${ROUTES['settings.html']}" class="nav-link flex items-center px-4 py-2.5 mx-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer text-sm font-medium" data-page="settings.html">
                    <i class="ph ph-gear text-lg mr-3 icon-base text-gray-500"></i>设置中心
                </a>
            </nav>
        </div>

        <!-- 柴犬桌宠区域 -->
        <div class="flex-shrink-0 border-t border-gray-50 pt-2 pb-3 px-2 relative">
            <div class="relative cursor-pointer" id="shiba-pet-area">
                <div id="shiba-bubble" class="opacity-0 pointer-events-none absolute z-30 whitespace-nowrap bg-white border border-stone-800 text-stone-700 text-[10px] font-bold py-0.5 px-2 rounded-md shadow-sm max-w-[140px] text-center" style="font-family: 'ZCOOL KuaiLe', sans-serif; left: 50%; transform: translateX(-50%); bottom: 68px; transition: opacity 0.3s ease, transform 0.3s ease;">
                    <span id="shiba-bubble-text">你好呀！</span>
                    <div class="absolute bottom-[-4px] left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-white border-r border-b border-stone-800 rotate-45"></div>
                </div>
                <canvas id="shiba-canvas" width="200" height="64" class="w-full h-16 block" style="image-rendering: pixelated;"></canvas>
            </div>
        </div>

    </aside>
    `;

    // 将侧边栏插入到 body 最前面
    document.body.insertAdjacentHTML('afterbegin', sidebarHTML);

    // 平台管理：点击文字导航并自动展开子菜单
    const platformLink = document.querySelector('.nav-link[data-page="platform.html"]');
    if (platformLink) {
        platformLink.addEventListener('click', function () {
            const submenu = document.getElementById('platform-submenu');
            const caret = document.querySelector('#platform-toggle .caret-icon');
            if (submenu) {
                submenu.classList.remove('hidden');
            }
            if (caret) {
                caret.classList.remove('ph-caret-right', 'text-gray-400');
                caret.classList.add('ph-caret-up', 'text-brand-600');
            }
        });
    }

    // 平台管理：箭头按钮自由展开/收起子菜单
    const platformToggle = document.getElementById('platform-toggle');
    if (platformToggle) {
        platformToggle.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            const submenu = document.getElementById('platform-submenu');
            const caret = platformToggle.querySelector('.caret-icon');
            if (submenu) {
                submenu.classList.toggle('hidden');
            }
            if (caret) {
                const expanded = submenu && !submenu.classList.contains('hidden');
                caret.classList.toggle('ph-caret-right', !expanded);
                caret.classList.toggle('text-gray-400', !expanded);
                caret.classList.toggle('ph-caret-up', expanded);
                caret.classList.toggle('text-brand-600', expanded);
            }
        });
    }

    // 获取当前页面文件名
    let currentPage = window.location.pathname.split('/').pop();
    if (!currentPage || currentPage === '') {
        currentPage = 'index.html';
    }

    // 设置初始激活状态
    updateSidebarActive(currentPage);

    // ========== 柴犬桌宠 ==========
    initShibaPet();
}

// 页面加载时初始化（支持普通页面加载和 SPA 切换）
document.addEventListener('DOMContentLoaded', initSidebar);
window.addEventListener('spa:ready', initSidebar);

// ========== 柴犬桌宠逻辑 ==========

var SHIBA_PALETTE = {
    0: 'transparent',
    1: '#1c1917',
    2: '#e07a16',
    3: '#b45309',
    4: '#fffbeb',
    5: '#ffffff',
    6: '#1c1917',
    7: '#fca5a5',
    8: '#ef4444'
};

var SHIBA_SPRITES = {
    side_idle: [
        [0,0,0,1,1,0,0,0,0,1,1,0,0,0,0,0],
        [0,0,1,2,2,1,0,0,1,2,2,1,0,0,0,0],
        [0,0,1,2,2,1,1,1,1,2,3,2,1,0,0,0],
        [0,1,2,2,2,2,2,2,2,2,2,2,1,0,0,0],
        [1,2,5,6,2,2,2,2,2,2,2,2,2,1,0,0],
        [1,2,2,2,2,2,2,2,2,2,2,2,2,1,1,0],
        [1,2,2,2,2,2,4,4,2,2,2,2,2,2,1,0],
        [0,1,2,2,2,4,4,4,4,2,2,2,2,2,1,0],
        [0,0,1,3,2,4,4,4,4,2,2,2,1,1,0,0],
        [0,0,1,3,3,4,4,4,4,3,3,1,0,0,0,0],
        [0,1,2,2,1,1,1,1,1,2,2,1,0,0,0,0],
        [1,2,2,1,0,0,0,0,1,2,2,1,0,0,0,0],
        [1,2,1,0,0,0,0,0,1,2,1,0,0,0,0,0],
        [1,1,0,0,0,0,0,0,1,1,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
    ],
    side_walk: [
        [0,0,0,1,1,0,0,0,0,1,1,0,0,0,0,0],
        [0,0,1,2,2,1,0,0,1,2,2,1,0,0,0,0],
        [0,0,1,2,2,1,1,1,1,2,3,2,1,0,0,0],
        [0,1,2,2,2,2,2,2,2,2,2,2,1,0,0,0],
        [1,2,5,6,2,2,2,2,2,2,2,2,2,1,0,0],
        [1,2,2,2,2,2,2,2,2,2,2,2,2,1,1,0],
        [1,2,2,2,2,2,4,4,2,2,2,2,2,2,1,0],
        [0,1,2,2,2,4,4,4,4,2,2,2,2,2,1,0],
        [0,0,1,3,2,4,4,4,4,2,2,2,1,1,0,0],
        [0,0,1,3,3,4,4,4,4,3,3,1,0,0,0,0],
        [0,1,2,2,1,1,1,1,1,2,2,1,0,0,0,0],
        [0,1,2,2,1,0,0,0,0,1,2,2,1,0,0,0],
        [0,1,2,1,0,0,0,0,0,1,2,1,0,0,0,0],
        [0,1,1,0,0,0,0,0,0,0,1,1,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
    ],
    side_jump: [
        [0,0,0,1,1,0,0,0,0,1,1,0,0,0,0,0],
        [0,0,1,2,2,1,0,0,1,2,2,1,0,0,0,0],
        [0,0,1,2,2,1,1,1,1,2,3,2,1,0,0,0],
        [0,1,2,2,2,2,2,2,2,2,2,2,1,0,0,0],
        [1,2,5,6,2,2,2,2,2,2,2,2,2,1,1,0],
        [1,2,2,2,2,2,2,2,2,2,2,2,2,2,1,0],
        [1,2,2,2,2,4,4,4,4,2,2,2,1,1,0,0],
        [0,1,3,3,4,4,4,4,4,3,3,1,0,0,0,0],
        [0,0,1,1,1,1,1,1,1,1,1,0,0,0,0,0],
        [0,1,2,2,1,0,0,0,1,2,2,1,0,0,0,0],
        [1,2,2,1,0,0,0,0,1,2,2,1,0,0,0,0],
        [1,1,1,0,0,0,0,0,1,1,1,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
    ],
    front_look: [
        [0,0,1,1,0,0,0,0,0,0,0,1,1,0,0,0],
        [0,1,2,2,1,0,0,0,0,0,1,2,2,1,0,0],
        [1,2,3,3,2,1,1,1,1,1,1,2,3,3,2,1],
        [1,2,3,2,2,2,2,2,2,2,2,2,2,3,2,1],
        [1,2,2,5,5,6,2,2,2,2,6,5,5,2,2,1],
        [1,2,2,5,6,6,2,2,2,2,6,6,5,2,2,1],
        [1,2,2,2,2,2,2,1,1,2,2,2,2,2,2,1],
        [1,2,7,7,2,2,1,4,4,1,2,2,7,7,2,1],
        [1,3,2,7,2,1,4,6,6,4,1,2,7,2,3,1],
        [1,3,3,2,2,1,8,8,8,8,1,2,2,3,3,1],
        [0,1,3,3,2,2,1,1,1,1,2,2,3,3,1,0],
        [0,1,1,3,3,2,2,2,2,2,2,3,3,1,1,0],
        [0,1,2,2,1,1,1,1,1,1,1,1,2,2,1,0],
        [1,2,2,2,1,0,0,0,0,0,0,1,2,2,2,1],
        [1,3,3,1,0,0,0,1,1,1,0,0,1,3,3,1],
        [0,1,1,0,0,0,1,2,2,2,1,0,0,1,1,0]
    ],
    side_sleep: [
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,1,1,0,0,0,0,1,1,0,0,0,0,0],
        [0,0,1,2,2,1,1,1,1,2,3,2,1,0,0,0],
        [0,1,2,2,2,2,2,2,2,2,2,2,1,0,0,0],
        [1,2,2,2,2,2,2,2,2,2,2,2,2,1,0,0],
        [1,2,2,2,2,2,2,2,2,2,2,2,2,1,1,0],
        [1,2,2,2,2,2,4,4,2,2,2,2,2,2,1,0],
        [0,1,2,2,2,4,4,4,4,2,2,2,2,2,1,0],
        [0,0,1,3,2,4,4,4,4,2,2,2,1,1,0,0],
        [0,0,1,3,3,4,4,4,4,3,3,1,0,0,0,0],
        [0,1,2,2,1,1,1,1,1,2,2,1,0,0,0,0],
        [1,2,2,1,0,0,0,0,1,2,2,1,0,0,0,0],
        [1,2,1,0,0,0,0,0,1,2,1,0,0,0,0,0],
        [1,1,0,0,0,0,0,0,1,1,0,0,0,0,0,0]
    ]
};

var SHIBA_SPEECHES = [
    '汪！今天也要开心呀！🐾',
    '贴贴你，继续加油！✨',
    '呼哧呼哧... 一直陪着你！🐕',
    '捏捏我的毛绒小耳朵吧~ 🐶',
    '最喜欢你啦！❤️',
    '累了就伸个懒腰汪！',
    '代码写完了？真棒！🎉',
    '陪你改bug到天亮！💪',
    '摸摸我的头就好啦~',
    '今天接了几个单呀？💰'
];

var SHIBA_IDLE_SPEECHES = [
    '呼噜噜... 好困呀 ~',
    '发呆中... 🤔',
    '今天天气不错汪！☀️',
    '要不要休息一下？',
    '我在看着你哦！👀',
    '喝口水再继续吧~',
    '伸个懒腰~ 啊呜'
];

var SHIBA_SLEEP_SPEECHES = [
    '呼噜... 梦到骨头了...',
    'zzZ... 不要吵我...',
    '梦里在跑酷汪！'
];

var SHIBA_BUTTERFLY_SPEECHES = [
    '好多蝴蝶呀！🦋',
    '别飞走嘛~',
    '蝴蝶好漂亮！',
    '抓蝴蝶咯！汪！'
];

var SHIBA_RAIN_SPEECHES = [
    '下雨了汪... ☔',
    '淋湿了要感冒的！',
    '快躲雨呀~',
    '雨滴滴答答的...'
];

// ========== 场景：蝴蝶 & 雨天 ==========

var BUTTERFLY_COLORS = ['#f472b6', '#a78bfa', '#fbbf24', '#60a5fa', '#fb923c', '#4ade80'];

var SHIBA_PIXEL_SCALE = 2;
var SHIBA_SPRITE_W = 16 * 2;   // 32px
var SHIBA_SPRITE_H = 16 * 2;   // 32px
var SHIBA_CANVAS_W = 200;
var SHIBA_CANVAS_H = 64;
var SHIBA_SPRITE_OFFSET_X = (200 - 32) / 2; // 84px 水平居中
var SHIBA_SPRITE_OFFSET_Y = 64 - 32 - 4;     // 28px 贴底放置，留出跳跃空间
var SHIBA_WALK_BOUND = 76;  // 行走边界（像素）
var shibaState = null;

function initShibaPet() {
    var canvas = document.getElementById('shiba-canvas');
    var petArea = document.getElementById('shiba-pet-area');
    if (!canvas || !petArea) return;

    canvas.width = SHIBA_CANVAS_W;
    canvas.height = SHIBA_CANVAS_H;

    shibaState = {
        canvas: canvas,
        ctx: canvas.getContext('2d'),
        petArea: petArea,
        mode: 'IDLE',            // IDLE, HOVERED, SLEEPING
        ticks: 0,
        speechTimer: 0,
        vy: 0,
        jumpOffset: 0,
        isJumping: false,
        direction: 1,            // 1=右, -1=左
        walkOffset: 0,
        walkSpeed: 0,
        walkTimer: Math.floor(Math.random() * 200) + 100,
        idleTimer: 0,
        walkAnimPhase: 0,
        // 场景系统
        sceneType: 'butterflies',
        sceneSwitchTimer: 0,
        butterflies: [],
        raindrops: [],
        splashes: []
    };

    // ---- Hover：回头看你 ----
    petArea.addEventListener('mouseenter', function () {
        shibaState.mode = 'HOVERED';
        shibaState.walkSpeed = 0;
        shibaState.idleTimer = 0;
    });
    petArea.addEventListener('mouseleave', function () {
        if (shibaState.mode === 'HOVERED') {
            shibaState.mode = 'IDLE';
            shibaState.walkTimer = Math.floor(Math.random() * 150) + 100;
        }
    });

    // ---- Click：蹦跳 + 说话 ----
    petArea.addEventListener('click', function () {
        // 睡着了就叫醒
        if (shibaState.mode === 'SLEEPING') {
            shibaState.mode = 'IDLE';
            shibaState.idleTimer = 0;
        }
        if (!shibaState.isJumping) {
            shibaState.vy = -4;
            shibaState.isJumping = true;
        }
        var msg = SHIBA_SPEECHES[Math.floor(Math.random() * SHIBA_SPEECHES.length)];
        triggerShibaSpeech(msg);
    });

    // 初始化场景（固定从蝴蝶开始）
    shibaState.sceneType = 'butterflies';
    shibaState.sceneSwitchTimer = Math.floor(Math.random() * 600) + 900;
    initButterflies();

    // 启动渲染循环
    renderShibaLoop();

    // 初次打招呼
    setTimeout(function () {
        triggerShibaSpeech('汪！你好呀，我是小柴~ 🐶');
    }, 1200);

    // 随机闲聊（每 9 秒检查一次）
    setInterval(function () {
        if (!shibaState || shibaState.speechTimer > 0) return;
        if (shibaState.mode === 'IDLE' && Math.random() < 0.35) {
            var msg = SHIBA_IDLE_SPEECHES[Math.floor(Math.random() * SHIBA_IDLE_SPEECHES.length)];
            triggerShibaSpeech(msg);
        } else if (shibaState.mode === 'SLEEPING' && Math.random() < 0.25) {
            var msg2 = SHIBA_SLEEP_SPEECHES[Math.floor(Math.random() * SHIBA_SLEEP_SPEECHES.length)];
            triggerShibaSpeech(msg2);
        }
    }, 9000);
}

function triggerShibaSpeech(text) {
    var bubble = document.getElementById('shiba-bubble');
    var bText = document.getElementById('shiba-bubble-text');
    if (!bubble || !bText || !shibaState) return;
    bText.innerText = text;
    bubble.style.opacity = '1';
    bubble.style.transform = 'translateX(-50%) translateY(0) scale(1)';
    shibaState.speechTimer = 160;
}

function drawShibaPixelFrame(ctx, matrix, flipX, offsetX, offsetY) {
    ctx.imageSmoothingEnabled = false;
    for (var r = 0; r < matrix.length; r++) {
        for (var c = 0; c < matrix[r].length; c++) {
            var colorIdx = matrix[r][c];
            if (colorIdx !== 0) {
                ctx.fillStyle = SHIBA_PALETTE[colorIdx];
                var targetCol = flipX ? (matrix[r].length - 1 - c) : c;
                ctx.fillRect(
                    offsetX + targetCol * SHIBA_PIXEL_SCALE,
                    offsetY + r * SHIBA_PIXEL_SCALE,
                    SHIBA_PIXEL_SCALE,
                    SHIBA_PIXEL_SCALE
                );
            }
        }
    }
}

function drawPixelHeart(ctx, cx, cy) {
    var heart = [
        [0,1,1,0,1,1,0],
        [1,1,1,1,1,1,1],
        [1,1,1,1,1,1,1],
        [0,1,1,1,1,1,0],
        [0,0,1,1,1,0,0],
        [0,0,0,1,0,0,0]
    ];
    ctx.fillStyle = '#ef4444';
    for (var r = 0; r < heart.length; r++) {
        for (var c = 0; c < heart[r].length; c++) {
            if (heart[r][c]) {
                ctx.fillRect(cx + c, cy + r, 1, 1);
            }
        }
    }
}

// ========== 场景系统函数 ==========

function initButterflies() {
    shibaState.butterflies = [];
    var count = 4 + Math.floor(Math.random() * 2);
    for (var i = 0; i < count; i++) {
        shibaState.butterflies.push({
            x: Math.random() * (SHIBA_CANVAS_W - 20) + 10,
            y: Math.random() * 28 + 4,
            vx: (Math.random() < 0.5 ? -1 : 1) * (0.15 + Math.random() * 0.2),
            vy: (Math.random() < 0.5 ? -1 : 1) * (0.05 + Math.random() * 0.1),
            t: Math.floor(Math.random() * 100),
            color: BUTTERFLY_COLORS[Math.floor(Math.random() * BUTTERFLY_COLORS.length)],
            fade: 0
        });
    }
}

function initRaindrops() {
    shibaState.raindrops = [];
    var count = 35 + Math.floor(Math.random() * 15);
    for (var i = 0; i < count; i++) {
        shibaState.raindrops.push({
            x: Math.random() * SHIBA_CANVAS_W,
            y: Math.random() * SHIBA_CANVAS_H - SHIBA_CANVAS_H,
            speed: 2 + Math.random() * 2,
            length: 3 + Math.floor(Math.random() * 3),
            opacity: 0.25 + Math.random() * 0.35
        });
    }
    shibaState.splashes = [];
}

function switchShibaScene() {
    // 固定交替：蝴蝶 → 下雨 → 蝴蝶 → 下雨
    shibaState.sceneType = shibaState.sceneType === 'butterflies' ? 'rain' : 'butterflies';
    shibaState.sceneSwitchTimer = Math.floor(Math.random() * 600) + 900;
    // 彻底清空上一个场景的数据，确保互不干扰
    shibaState.butterflies = [];
    shibaState.raindrops = [];
    shibaState.splashes = [];
    if (shibaState.sceneType === 'butterflies') {
        initButterflies();
    } else {
        initRaindrops();
    }
    // 不触发台词，不干扰柴犬当前状态（睡眠/行走/对话等）
}

function updateAndDrawButterflies(ctx) {
    var butterflies = shibaState.butterflies;
    for (var i = 0; i < butterflies.length; i++) {
        var b = butterflies[i];

        // 运动：基础速度 + 正弦扰动，模拟蝴蝶飘忽不定
        b.t++;
        b.x += b.vx + Math.sin(b.t * 0.05) * 0.1;
        b.y += b.vy + Math.cos(b.t * 0.05) * 0.1;

        // 边界反弹
        if (b.x < 3) b.vx = Math.abs(b.vx);
        else if (b.x > SHIBA_CANVAS_W - 8) b.vx = -Math.abs(b.vx);
        if (b.y < 3) b.vy = Math.abs(b.vy);
        else if (b.y > 34) b.vy = -Math.abs(b.vy);

        if (b.fade < 1) b.fade += 0.03;

        // 翅膀扇动：高度交替变化模拟扇翅
        var wingH = (b.t % 10 < 5) ? 4 : 2;
        var bx = Math.round(b.x);
        var by = Math.round(b.y);

        ctx.globalAlpha = Math.min(1, b.fade);
        // 左翅
        ctx.fillStyle = b.color;
        ctx.fillRect(bx, by, 2, wingH);
        // 右翅
        ctx.fillRect(bx + 3, by, 2, wingH);
        // 身体（中间 1px 深色）
        ctx.fillStyle = '#1c1917';
        ctx.fillRect(bx + 2, by, 1, wingH);
    }
    ctx.globalAlpha = 1;
}

function updateAndDrawRain(ctx) {
    var drops = shibaState.raindrops;

    for (var i = 0; i < drops.length; i++) {
        var d = drops[i];

        // 更新位置（下落 + 微风偏移）
        d.y += d.speed;
        d.x += 0.4;

        // 落地产生水花后重置
        if (d.y >= SHIBA_CANVAS_H - 3) {
            if (Math.random() < 0.35) {
                shibaState.splashes.push({
                    x: d.x,
                    y: SHIBA_CANVAS_H - 3,
                    life: 6
                });
            }
            d.y = -d.length - Math.random() * 15;
            d.x = Math.random() * SHIBA_CANVAS_W;
        }
        if (d.x > SHIBA_CANVAS_W) {
            d.x -= SHIBA_CANVAS_W;
        }

        // 绘制雨滴
        ctx.globalAlpha = d.opacity;
        ctx.fillStyle = '#93c5fd';
        ctx.fillRect(Math.round(d.x), Math.round(d.y), 1, d.length);
    }

    // 更新和绘制水花
    var splashes = shibaState.splashes;
    for (var j = splashes.length - 1; j >= 0; j--) {
        var s = splashes[j];
        s.life--;
        if (s.life <= 0) {
            splashes.splice(j, 1);
            continue;
        }
        var radius = (6 - s.life) * 0.8;
        ctx.globalAlpha = (s.life / 6) * 0.5;
        ctx.fillStyle = '#bfdbfe';
        ctx.fillRect(Math.round(s.x - radius), Math.round(s.y), 1, 1);
        ctx.fillRect(Math.round(s.x + radius), Math.round(s.y), 1, 1);
    }

    ctx.globalAlpha = 1;
}

function renderShibaLoop() {
    if (!shibaState || !shibaState.canvas) return;

    var ctx = shibaState.ctx;
    var canvas = shibaState.canvas;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    shibaState.ticks++;

    // ---- 场景切换计时 ----
    if (shibaState.sceneSwitchTimer > 0) {
        shibaState.sceneSwitchTimer--;
        if (shibaState.sceneSwitchTimer <= 0) {
            switchShibaScene();
        }
    }

    // ---- 对话气泡倒计时 ----
    if (shibaState.speechTimer > 0) {
        shibaState.speechTimer--;
        if (shibaState.speechTimer === 0) {
            var bubble = document.getElementById('shiba-bubble');
            if (bubble) {
                bubble.style.opacity = '0';
                bubble.style.transform = 'translateX(-50%) translateY(4px) scale(0.85)';
            }
        }
    }

    // ---- 跳跃物理 ----
    if (shibaState.isJumping) {
        shibaState.vy += 0.3;
        shibaState.jumpOffset += shibaState.vy;
        if (shibaState.jumpOffset >= 0) {
            shibaState.jumpOffset = 0;
            shibaState.vy = 0;
            shibaState.isJumping = false;
        }
    }

    // ---- 闲置行为：行走 + 入睡 ----
    if (shibaState.mode === 'IDLE' && !shibaState.isJumping) {
        shibaState.idleTimer++;

        if (shibaState.walkSpeed > 0) {
            // 行走中
            shibaState.walkOffset += shibaState.walkSpeed * shibaState.direction;
            shibaState.walkAnimPhase += 0.18;
            // 走到边界就转身（钳制在边界，不跳到另一侧）
            if (Math.abs(shibaState.walkOffset) > SHIBA_WALK_BOUND) {
                shibaState.walkOffset = SHIBA_WALK_BOUND * Math.sign(shibaState.walkOffset);
                shibaState.direction *= -1;
            }
            shibaState.walkTimer--;
            if (shibaState.walkTimer <= 0) {
                shibaState.walkSpeed = 0;
                shibaState.walkTimer = Math.floor(Math.random() * 150) + 100;
            }
        } else {
            // 站着不动，可能开始走
            shibaState.walkTimer--;
            if (shibaState.walkTimer <= 0) {
                shibaState.walkSpeed = 0.2 + Math.random() * 0.15;
                shibaState.walkTimer = Math.floor(Math.random() * 150) + 120;
                if (Math.random() < 0.5) shibaState.direction *= -1;
            }
        }

        // 闲置约 20 秒后入睡
        if (shibaState.idleTimer > 1200) {
            shibaState.mode = 'SLEEPING';
            shibaState.walkSpeed = 0;
        }
    }

    // ---- 睡眠中说话会醒来 ----
    if (shibaState.mode === 'SLEEPING') {
        if (shibaState.speechTimer > 155) {
            shibaState.mode = 'IDLE';
            shibaState.idleTimer = 0;
        }
    }

    // ---- 计算位置 ----
    var posX = SHIBA_SPRITE_OFFSET_X + shibaState.walkOffset;
    var posY = SHIBA_SPRITE_OFFSET_Y;

    // ---- 气泡跟随宠物水平位置 ----
    var bubble = document.getElementById('shiba-bubble');
    if (bubble && bubble.style.opacity === '1') {
        var petCenterX = posX + SHIBA_SPRITE_W / 2;
        var bubbleLeftPct = (petCenterX / SHIBA_CANVAS_W) * 100;
        bubble.style.left = bubbleLeftPct + '%';
    }

    // ---- 绘制雨天场景（背景层）----
    if (shibaState.sceneType === 'rain') {
        updateAndDrawRain(ctx);
    }

    // ---- 绘制阴影 ----
    var shadowScale = 1;
    if (shibaState.isJumping) {
        shadowScale = Math.max(0.4, 1 + shibaState.jumpOffset / 30);
    }
    ctx.fillStyle = 'rgba(28, 25, 23, 0.08)';
    ctx.beginPath();
    ctx.ellipse(
        posX + SHIBA_SPRITE_W / 2,
        SHIBA_CANVAS_H - 5,
        8 * shadowScale,
        2 * shadowScale,
        0, 0, Math.PI * 2
    );
    ctx.fill();

    // ---- 选择精灵帧 ----
    var sprite = SHIBA_SPRITES.side_idle;
    var flipX = shibaState.direction === -1;

    if (shibaState.mode === 'HOVERED') {
        sprite = SHIBA_SPRITES.front_look;
        flipX = false;
    } else if (shibaState.isJumping) {
        sprite = SHIBA_SPRITES.side_jump;
    } else if (shibaState.mode === 'SLEEPING') {
        sprite = SHIBA_SPRITES.side_sleep;
    } else if (shibaState.walkSpeed > 0) {
        // 行走：交替 idle / walk 帧
        sprite = Math.floor(shibaState.walkAnimPhase) % 2 === 0
            ? SHIBA_SPRITES.side_idle
            : SHIBA_SPRITES.side_walk;
    }

    // ---- 呼吸偏移 ----
    var breathOffset = 0;
    if (!shibaState.isJumping) {
        if (shibaState.mode === 'SLEEPING') {
            breathOffset = Math.sin(shibaState.ticks * 0.04) * 1.2;
        } else {
            breathOffset = Math.sin(shibaState.ticks * 0.08) * 0.5;
        }
    }

    // ---- 行走弹跳 ----
    var walkBob = 0;
    if (shibaState.walkSpeed > 0 && !shibaState.isJumping) {
        walkBob = Math.abs(Math.sin(shibaState.walkAnimPhase)) * 1.5;
    }

    // ---- 绘制柴犬 ----
    ctx.save();
    ctx.translate(0, shibaState.jumpOffset + breathOffset - walkBob);
    drawShibaPixelFrame(ctx, sprite, flipX, posX, posY);

    // ---- Hover：头顶像素心心 ----
    if (shibaState.mode === 'HOVERED') {
        var heartBob = Math.sin(shibaState.ticks * 0.12) * 2;
        drawPixelHeart(ctx, posX + SHIBA_SPRITE_W / 2 - 3, posY - 8 + heartBob);
    }

    // ---- 睡觉：Zzz ----
    if (shibaState.mode === 'SLEEPING') {
        ctx.fillStyle = '#94a3b8';
        ctx.font = 'bold 5px sans-serif';
        ctx.textAlign = 'left';
        var p1 = (shibaState.ticks % 120) / 120;
        ctx.globalAlpha = 1 - p1 * 0.7;
        ctx.fillText('Z', posX + SHIBA_SPRITE_W - 4 + p1 * 6, posY - 1 - p1 * 8);
        var p2 = ((shibaState.ticks + 40) % 120) / 120;
        ctx.globalAlpha = 1 - p2 * 0.7;
        ctx.fillText('z', posX + SHIBA_SPRITE_W + p2 * 5, posY + 3 - p2 * 6);
        ctx.globalAlpha = 1;
    }

    ctx.restore();

    // ---- 绘制蝴蝶场景（前景层）----
    if (shibaState.sceneType === 'butterflies') {
        updateAndDrawButterflies(ctx);
    }

    requestAnimationFrame(renderShibaLoop);
}

/**
 * 更新侧边栏导航激活状态（同时供 SPA 路由器调用）
 * @param {string} targetPage - 目标页面文件名，如 'index.html'
 */
function updateSidebarActive(targetPage) {
    const navLinks = document.querySelectorAll('.nav-link');

    // 第一步：清除所有激活状态，恢复默认样式
    navLinks.forEach(link => {
        link.classList.remove('bg-brand-50', 'text-brand-600');
        link.classList.add('text-gray-700', 'hover:bg-gray-100');

        const icon = link.querySelector('.icon-base');
        if (icon) {
            icon.classList.remove('text-brand-600');
            icon.classList.add('text-gray-500');
        }

    });

    // 第二步：激活目标页面对应的导航项
    navLinks.forEach(link => {
        if (link.dataset.page === targetPage) {
            link.classList.remove('text-gray-700', 'hover:bg-gray-100');
            link.classList.add('bg-brand-50', 'text-brand-600');

            const icon = link.querySelector('.icon-base');
            if (icon) {
                icon.classList.remove('text-gray-500');
                icon.classList.add('text-brand-600');
            }
        }
    });
}

// 暴露为全局函数，供 spa-router.js 调用
window.updateSidebarActive = updateSidebarActive;
