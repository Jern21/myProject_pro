document.addEventListener('DOMContentLoaded', () => {
    // 防重复插入保护：SPA 切换时不会二次执行
    if (document.querySelector('#sidebar-nav')) return;

    const sidebarHTML = `
    <aside class="w-64 bg-white border-r border-gray-100 flex flex-col justify-between h-full flex-shrink-0 relative z-40">
        <div class="overflow-y-auto h-full pb-6">
            <!-- Logo area -->
            <div class="p-6 flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0">
                    <img src="assets/jpg/logo.jpg" alt="Logo" class="w-full h-full object-cover">
                </div>
                <div>
                    <h1 class="font-bold text-gray-800 text-base">文的项目工作台</h1>
                    <p class="text-xs text-gray-400">高效管理 · 轻松接单</p>
                </div>
            </div>

            <!-- Navigation -->
            <nav class="space-y-1 mt-2" id="sidebar-nav">
                <a href="index.html" class="nav-link flex items-center px-4 py-2.5 mx-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer text-sm font-medium" data-page="index.html">
                    <i class="ph ph-house text-lg mr-3 icon-base text-gray-500"></i>首页
                </a>
                <a href="orders.html" class="nav-link flex items-center px-4 py-2.5 mx-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer text-sm font-medium" data-page="orders.html">
                    <i class="ph ph-receipt text-lg mr-3 icon-base text-gray-500"></i>接单记录
                </a>
                <a href="quote.html" class="nav-link flex items-center px-4 py-2.5 mx-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer text-sm font-medium" data-page="quote.html">
                    <i class="ph ph-currency-cny text-lg mr-3 icon-base text-gray-500"></i>报价管理
                </a>
                <a href="posters.html" class="nav-link flex items-center px-4 py-2.5 mx-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer text-sm font-medium" data-page="posters.html">
                    <i class="ph ph-image text-lg mr-3 icon-base text-gray-500"></i>宣传海报
                </a>
                
                <!-- Expanded Menu: Platform Management -->
                <div class="mt-2">
                    <div class="flex items-center mx-2 rounded-lg hover:bg-gray-100 transition-colors">
                        <a href="platform.html" class="nav-link flex items-center flex-1 px-4 py-2.5 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer text-sm font-medium" data-page="platform.html">
                            <i class="ph ph-squares-four text-lg mr-3 icon-base text-gray-500"></i>平台管理
                        </a>
                        <button id="platform-toggle" class="px-3 py-2.5 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer">
                            <i class="ph ph-caret-right caret-icon"></i>
                        </button>
                    </div>
                    <!-- Sub-menu items -->
                    <div class="space-y-1 mt-1 hidden" id="platform-submenu">
                        <a href="platform.html" class="flex items-center pl-11 pr-4 py-2 mx-2 rounded-lg bg-brand-50 text-brand-600 font-medium transition-colors cursor-pointer text-sm">总览看板</a>
                        <a href="xianyu.html" class="nav-link flex items-center pl-11 pr-4 py-2 mx-2 rounded-lg text-gray-500 hover:text-gray-900 transition-colors cursor-pointer text-sm" data-page="xianyu.html">闲鱼</a>
                        <a href="xiaohongshu.html" class="nav-link flex items-center pl-11 pr-4 py-2 mx-2 rounded-lg text-gray-500 hover:text-gray-900 transition-colors cursor-pointer text-sm" data-page="xiaohongshu.html">小红书</a>
                        <a href="douyin.html" class="nav-link flex items-center pl-11 pr-4 py-2 mx-2 rounded-lg text-gray-500 hover:text-gray-900 transition-colors cursor-pointer text-sm" data-page="douyin.html">抖音</a>
                    </div>
                </div>

                <a href="customer.html" class="nav-link flex items-center px-4 py-2.5 mx-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer text-sm font-medium mt-2" data-page="customer.html">
                    <i class="ph ph-users text-lg mr-3 icon-base text-gray-500"></i>客户管理
                </a>
                <a href="stats.html" class="nav-link flex items-center px-4 py-2.5 mx-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer text-sm font-medium" data-page="stats.html">
                    <i class="ph ph-chart-bar text-lg mr-3 icon-base text-gray-500"></i>数据统计
                </a>
                <a href="project.html" class="nav-link flex items-center px-4 py-2.5 mx-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer text-sm font-medium" data-page="project.html">
                    <i class="ph ph-kanban text-lg mr-3 icon-base text-gray-500"></i>项目管理
                </a>
                <a href="resume.html" class="nav-link flex items-center px-4 py-2.5 mx-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer text-sm font-medium" data-page="resume.html">
                    <i class="ph ph-file-text text-lg mr-3 icon-base text-gray-500"></i>简历迭代
                </a>
                <a href="memo.html" class="nav-link flex items-center px-4 py-2.5 mx-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer text-sm font-medium" data-page="memo.html">
                    <i class="ph ph-notepad text-lg mr-3 icon-base text-gray-500"></i>信息备忘录
                </a>
                <a href="settings.html" class="nav-link flex items-center px-4 py-2.5 mx-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer text-sm font-medium" data-page="settings.html">
                    <i class="ph ph-gear text-lg mr-3 icon-base text-gray-500"></i>设置中心
                </a>
            </nav>
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
});

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
