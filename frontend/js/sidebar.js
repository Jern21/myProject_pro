document.addEventListener('DOMContentLoaded', () => {
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
        'stats.html': 'pages/content/stats.html',
        'project.html': 'pages/content/project.html',
        'resume.html': 'pages/personal/resume.html',
        'memo.html': 'pages/personal/memo.html',
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
                    <p class="text-xs text-gray-400">高效管理 · 轻松接单</p>
                </div>
            </div>

            <!-- Navigation -->
            <nav class="space-y-1 mt-2" id="sidebar-nav">
                <a href="${PB}${ROUTES['index.html']}" class="nav-link flex items-center px-4 py-2.5 mx-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer text-sm font-medium" data-page="index.html">
                    <i class="ph ph-house text-lg mr-3 icon-base text-gray-500"></i>首页
                </a>
                <a href="${PB}${ROUTES['orders.html']}" class="nav-link flex items-center px-4 py-2.5 mx-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer text-sm font-medium" data-page="orders.html">
                    <i class="ph ph-receipt text-lg mr-3 icon-base text-gray-500"></i>接单记录
                </a>
                <a href="${PB}${ROUTES['quote.html']}" class="nav-link flex items-center px-4 py-2.5 mx-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer text-sm font-medium" data-page="quote.html">
                    <i class="ph ph-currency-cny text-lg mr-3 icon-base text-gray-500"></i>报价管理
                </a>
                <a href="${PB}${ROUTES['posters.html']}" class="nav-link flex items-center px-4 py-2.5 mx-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer text-sm font-medium" data-page="posters.html">
                    <i class="ph ph-image text-lg mr-3 icon-base text-gray-500"></i>宣传海报
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
                <a href="${PB}${ROUTES['resume.html']}" class="nav-link flex items-center px-4 py-2.5 mx-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer text-sm font-medium" data-page="resume.html">
                    <i class="ph ph-file-text text-lg mr-3 icon-base text-gray-500"></i>简历迭代
                </a>
                <a href="${PB}${ROUTES['memo.html']}" class="nav-link flex items-center px-4 py-2.5 mx-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer text-sm font-medium" data-page="memo.html">
                    <i class="ph ph-notepad text-lg mr-3 icon-base text-gray-500"></i>信息备忘录
                </a>
                <a href="${PB}${ROUTES['settings.html']}" class="nav-link flex items-center px-4 py-2.5 mx-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer text-sm font-medium" data-page="settings.html">
                    <i class="ph ph-gear text-lg mr-3 icon-base text-gray-500"></i>设置中心
                </a>
            </nav>
        </div>

        <!-- 柴犬桌宠区域 -->
        <div class="flex-shrink-0 border-t border-gray-50 pt-2 pb-3 px-2 relative">
            <div id="shiba-bubble" class="opacity-0 translate-y-2 scale-75 pointer-events-none transition-all duration-300 mb-1 bg-white border border-stone-800 text-stone-700 text-[10px] font-bold py-0.5 px-2 rounded-md shadow-sm max-w-[140px] text-center relative mx-auto" style="font-family: 'ZCOOL KuaiLe', sans-serif;">
                <span id="shiba-bubble-text">你好呀！</span>
                <div class="absolute bottom-[-4px] left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-white border-r border-b border-stone-800 rotate-45"></div>
            </div>
            <div class="flex justify-center cursor-pointer" id="shiba-pet-area">
                <canvas id="shiba-canvas" width="80" height="80" class="w-12 h-12" style="image-rendering: pixelated;"></canvas>
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
});

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
    ]
};

var SHIBA_SPEECHES = [
    '汪！今天也要开心呀！🐾',
    '贴贴你，继续加油！✨',
    '呼哧呼哧... 一直陪着你！🐕',
    '捏捏我的毛绒小耳朵吧~ 🐶',
    '最喜欢你啦！❤️',
    '累了就伸个懒腰汪！',
    '代码写完了？真棒！🎉'
];

var SHIBA_PIXEL_SCALE = 3;
var shibaState = null;

function initShibaPet() {
    var canvas = document.getElementById('shiba-canvas');
    var petArea = document.getElementById('shiba-pet-area');
    if (!canvas || !petArea) return;

    shibaState = {
        canvas: canvas,
        ctx: canvas.getContext('2d'),
        mode: 'IDLE',       // IDLE, HOVERED
        ticks: 0,
        speechTimer: 0,
        vy: 0,
        jumpOffset: 0,
        isJumping: false,
        direction: 1
    };

    // hover 回眸
    petArea.addEventListener('mouseenter', function () {
        shibaState.mode = 'HOVERED';
    });
    petArea.addEventListener('mouseleave', function () {
        shibaState.mode = 'IDLE';
    });

    // 点击蹦跳 + 说话
    petArea.addEventListener('click', function () {
        if (!shibaState.isJumping) {
            shibaState.vy = -3.5;
            shibaState.isJumping = true;
        }
        var msg = SHIBA_SPEECHES[Math.floor(Math.random() * SHIBA_SPEECHES.length)];
        triggerShibaSpeech(msg);
    });

    // 启动渲染循环
    renderShibaLoop();

    // 初次打招呼
    setTimeout(function () {
        triggerShibaSpeech('汪！你好呀，我是小柴~ 🐶');
    }, 1200);
}

function triggerShibaSpeech(text) {
    var bubble = document.getElementById('shiba-bubble');
    var bText = document.getElementById('shiba-bubble-text');
    if (!bubble || !bText) return;
    bText.innerText = text;
    bubble.style.opacity = '1';
    bubble.style.transform = 'translateY(0) scale(1)';
    shibaState.speechTimer = 140;
}

function drawShibaPixelFrame(ctx, matrix, flipX) {
    ctx.imageSmoothingEnabled = false;
    for (var r = 0; r < matrix.length; r++) {
        for (var c = 0; c < matrix[r].length; c++) {
            var colorIdx = matrix[r][c];
            if (colorIdx !== 0) {
                ctx.fillStyle = SHIBA_PALETTE[colorIdx];
                var targetCol = flipX ? (matrix[r].length - 1 - c) : c;
                ctx.fillRect(
                    (targetCol + 2) * SHIBA_PIXEL_SCALE,
                    (r + 2) * SHIBA_PIXEL_SCALE,
                    SHIBA_PIXEL_SCALE,
                    SHIBA_PIXEL_SCALE
                );
            }
        }
    }
}

function renderShibaLoop() {
    if (!shibaState || !shibaState.canvas) return;

    var ctx = shibaState.ctx;
    var canvas = shibaState.canvas;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    shibaState.ticks++;

    // 对话气泡消失
    if (shibaState.speechTimer > 0) {
        shibaState.speechTimer--;
        if (shibaState.speechTimer === 0) {
            var bubble = document.getElementById('shiba-bubble');
            if (bubble) {
                bubble.style.opacity = '0';
                bubble.style.transform = 'translateY(4px) scale(0.85)';
            }
        }
    }

    // 跳跃物理
    if (shibaState.isJumping) {
        shibaState.vy += 0.3;
        shibaState.jumpOffset += shibaState.vy;
        if (shibaState.jumpOffset >= 0) {
            shibaState.jumpOffset = 0;
            shibaState.vy = 0;
            shibaState.isJumping = false;
        }
    }

    // 绘制阴影
    var shadowScale = shibaState.isJumping ? Math.max(0.4, 1 + shibaState.jumpOffset / 30) : 1;
    ctx.fillStyle = 'rgba(28, 25, 23, 0.06)';
    ctx.beginPath();
    ctx.ellipse(40, 74, 14 * shadowScale, 2.5 * shadowScale, 0, 0, Math.PI * 2);
    ctx.fill();

    // 选择精灵帧
    var sprite = SHIBA_SPRITES.side_idle;
    if (shibaState.mode === 'HOVERED') {
        sprite = SHIBA_SPRITES.front_look;
    } else if (shibaState.isJumping) {
        sprite = SHIBA_SPRITES.side_jump;
    }

    // 闲置呼吸弹跳
    var breathOffset = 0;
    if (shibaState.mode === 'IDLE' && !shibaState.isJumping) {
        breathOffset = Math.sin(shibaState.ticks * 0.08) * 0.5;
    }

    // 跳跃偏移
    ctx.save();
    ctx.translate(0, shibaState.jumpOffset + breathOffset);

    var flipX = shibaState.direction === -1;
    drawShibaPixelFrame(ctx, sprite, flipX);

    // hover 时头顶冒心心
    if (shibaState.mode === 'HOVERED' && shibaState.ticks % 30 < 15) {
        ctx.fillStyle = '#ef4444';
        ctx.font = '10px serif';
        ctx.fillText('❤️', 14 + Math.sin(shibaState.ticks * 0.1) * 3, 16);
    }

    ctx.restore();

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
