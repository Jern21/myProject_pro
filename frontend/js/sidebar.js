document.addEventListener('DOMContentLoaded', () => {
    const sidebarHTML = `
    <aside class="w-64 bg-white border-r border-gray-100 flex flex-col justify-between h-full flex-shrink-0 relative z-40">
        <div class="overflow-y-auto h-full pb-24">
            <!-- Logo area -->
            <div class="p-6 flex items-center gap-3">
                <div class="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
                    <i class="ph-fill ph-bag text-xl"></i>
                </div>
                <div>
                    <h1 class="font-bold text-gray-800 text-base">接单管理平台</h1>
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
                    <a href="platform.html" class="nav-link flex items-center px-4 py-2.5 mx-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer text-sm font-medium justify-between" data-page="platform.html">
                        <div class="flex items-center">
                            <i class="ph ph-squares-four text-lg mr-3 icon-base text-gray-500"></i>平台管理
                        </div>
                        <i class="ph ph-caret-right text-gray-400 caret-icon"></i>
                    </a>
                    <!-- Sub-menu items -->
                    <div class="space-y-1 mt-1 hidden" id="platform-submenu">
                        <a href="platform.html" class="flex items-center pl-11 pr-4 py-2 mx-2 rounded-lg text-gray-500 hover:text-gray-900 transition-colors cursor-pointer text-sm">总览看板</a>
                        <a href="platform.html" class="flex items-center pl-11 pr-4 py-2 mx-2 rounded-lg bg-brand-50 text-brand-600 font-medium transition-colors cursor-pointer text-sm">内容管理</a>
                        <a href="#" class="flex items-center pl-11 pr-4 py-2 mx-2 rounded-lg text-gray-500 hover:text-gray-900 transition-colors cursor-pointer text-sm">闲鱼</a>
                        <a href="#" class="flex items-center pl-11 pr-4 py-2 mx-2 rounded-lg text-gray-500 hover:text-gray-900 transition-colors cursor-pointer text-sm">小红书</a>
                        <a href="#" class="flex items-center pl-11 pr-4 py-2 mx-2 rounded-lg text-gray-500 hover:text-gray-900 transition-colors cursor-pointer text-sm">抖音</a>
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

        <!-- Bottom Section: Upgrade & Collapse -->
        <div class="absolute bottom-0 left-0 w-full bg-white border-t border-gray-50 p-4 z-20">
            <div class="bg-gray-50 rounded-xl p-4 mb-4 border border-gray-100">
                <div class="flex items-center gap-2 mb-1">
                    <i class="ph-fill ph-crown text-yellow-500 text-lg"></i>
                    <span class="font-semibold text-gray-800 text-sm">专业版</span>
                </div>
                <p class="text-xs text-gray-500 mb-3">2025-12-31 到期</p>
                <button class="w-full py-2 bg-white border border-brand-100 text-brand-600 rounded-lg text-xs font-medium hover:bg-brand-50 transition-colors">
                    升级续费
                </button>
            </div>
            
            <div class="flex justify-center">
                <button class="w-8 h-8 flex items-center justify-center rounded border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors">
                    <i class="ph ph-caret-double-left"></i>
                </button>
            </div>
        </div>
    </aside>
    `;

    // 将侧边栏插入到 body 最前面
    document.body.insertAdjacentHTML('afterbegin', sidebarHTML);

    // 获取当前页面文件名
    let currentPage = window.location.pathname.split('/').pop();
    if (!currentPage || currentPage === '') {
        currentPage = 'index.html';
    }

    // 处理导航激活状态
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        if (link.dataset.page === currentPage) {
            // 移除默认样式
            link.classList.remove('text-gray-700', 'hover:bg-gray-100');
            // 添加激活样式
            link.classList.add('bg-brand-50', 'text-brand-600');
            
            // 切换图标颜色
            const icon = link.querySelector('.icon-base');
            if (icon) {
                icon.classList.remove('text-gray-500');
                icon.classList.add('text-brand-600');
            }

            // 处理平台管理的子菜单展开状态
            if (currentPage === 'platform.html') {
                const submenu = document.getElementById('platform-submenu');
                if (submenu) submenu.classList.remove('hidden');
                
                const caret = link.querySelector('.caret-icon');
                if (caret) {
                    caret.classList.remove('ph-caret-right', 'text-gray-400');
                    caret.classList.add('ph-caret-up', 'text-brand-600');
                }
            }
        }
    });
});
