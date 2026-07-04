/**
 * 接单记录表单组件 —— 独立可复用的右侧抽屉表单
 *
 * 功能：
 *   - 新建 / 编辑接单记录
 *   - 客户信息、项目信息、商务信息、时间节点、状态管理、附件链接
 *   - 净利率 / 时薪 / 交付周期自动计算
 *   - 客户标签多选
 *   - 表单校验
 *
 * 用法：
 *   window.openOrderForm()          // 新建
 *   window.openOrderForm(data)      // 编辑（传入已有数据）
 *   window.closeOrderForm()         // 关闭
 */
(function () {
    'use strict';

    // ========== 常量 ==========

    var PROJECT_TYPES = ['网站开发', '小程序开发', 'UI/设计', '视频剪辑', '平面设计', '文案优化', '其他'];
    var CUSTOMER_SOURCES = ['闲鱼', '小红书', '抖音', '微信', '淘宝', '朋友推荐', '其他'];
    var ORDER_STATUSES = [
        { value: 'pending', label: '待确认需求', color: 'gray' },
        { value: 'processing', label: '开发/设计中', color: 'blue' },
        { value: 'acceptance', label: '待验收', color: 'orange' },
        { value: 'completed', label: '已完成', color: 'green' },
        { value: 'closed', label: '已关闭', color: 'gray' }
    ];
    var PAYMENT_STATUSES = ['未付款', '部分付款', '已结清'];
    var CUSTOMER_TAGS = ['爽快型', '纠结比价型', '急单', '大厂员工', '复购客户', '高价值', '新客户'];

    // ========== 状态 ==========

    var drawer = null;
    var overlay = null;
    var selectedTags = [];
    var isOpen = false;
    var editMode = false;

    // ========== 工具函数 ==========

    function formatDate(d) {
        if (!d) return '';
        if (typeof d === 'string') return d;
        var y = d.getFullYear();
        var m = String(d.getMonth() + 1).padStart(2, '0');
        var day = String(d.getDate()).padStart(2, '0');
        return y + '-' + m + '-' + day;
    }

    function calcDays(start, end) {
        if (!start || !end) return '';
        var s = new Date(start);
        var e = new Date(end);
        if (isNaN(s) || isNaN(e)) return '';
        var diff = Math.round((e - s) / 86400000);
        return diff >= 0 ? diff : '';
    }

    // ========== 构建 HTML ==========

    function buildField(label, innerHtml, opts) {
        opts = opts || {};
        var required = opts.required ? '<span class="text-red-400">*</span>' : '';
        var widthClass = opts.half ? 'col-span-1' : 'col-span-2';
        return [
            '<div class="' + widthClass + '">',
            '  <label class="block text-xs text-gray-500 mb-1.5">' + label + required + '</label>',
            innerHtml,
            '</div>'
        ].join('');
    }

    function inputHtml(name, placeholder, type) {
        type = type || 'text';
        return '<input type="' + type + '" name="' + name + '" placeholder="' + placeholder + '" ' +
            'class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15 transition-all bg-white">';
    }

    function selectHtml(name, options) {
        var opts = options.map(function (o) {
            var val = typeof o === 'object' ? o.value : o;
            var text = typeof o === 'object' ? o.label : o;
            return '<option value="' + val + '">' + text + '</option>';
        }).join('');
        return '<select name="' + name + '" class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15 transition-all bg-white">' + opts + '</select>';
    }

    function textareaHtml(name, placeholder, rows) {
        rows = rows || 3;
        return '<textarea name="' + name + '" placeholder="' + placeholder + '" rows="' + rows + '" ' +
            'class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15 transition-all bg-white resize-none"></textarea>';
    }

    function buildTagHtml() {
        return CUSTOMER_TAGS.map(function (tag) {
            return '<button type="button" data-tag="' + tag + '" ' +
                'class="order-tag px-2.5 py-1 rounded-md text-xs border transition-all ' +
                'border-gray-200 text-gray-500 hover:border-brand-300 hover:text-brand-600">' + tag + '</button>';
        }).join('');
    }

    function buildStatusOptions() {
        return ORDER_STATUSES.map(function (s) {
            return '<option value="' + s.value + '">' + s.label + '</option>';
        }).join('');
    }

    function buildDrawerHTML() {
        return [
            // Overlay
            '<div id="order-form-overlay" class="fixed inset-0 bg-black/20 z-40 opacity-0 transition-opacity duration-200"></div>',
            // Drawer
            '<div id="order-form-drawer" class="fixed right-0 top-0 bottom-0 w-[560px] bg-white z-50 flex flex-col shadow-2xl translate-x-full transition-transform duration-300">',
            // Header
            '  <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">',
            '    <div>',
            '      <h3 class="font-bold text-gray-800 text-base" id="order-form-title">新建接单记录</h3>',
            '      <p class="text-xs text-gray-400 mt-0.5">填写订单信息，标记星号的字段为必填</p>',
            '    </div>',
            '    <button id="order-form-close" class="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition">',
            '      <i class="ph ph-x text-lg"></i>',
            '    </button>',
            '  </div>',
            // Body (scrollable)
            '  <div class="flex-1 overflow-y-auto px-6 py-5">',
            '    <form id="order-form" class="space-y-6">',
            // === Section 1: 客户信息 ===
            '      <div>',
            '        <div class="flex items-center gap-2 mb-3">',
            '          <div class="w-6 h-6 rounded-md bg-blue-50 flex items-center justify-center"><i class="ph ph-user text-blue-500 text-sm"></i></div>',
            '          <h4 class="text-sm font-semibold text-gray-800">客户信息</h4>',
            '        </div>',
            '        <div class="grid grid-cols-2 gap-x-4 gap-y-3">',
            buildField('客户昵称', inputHtml('customerNick', '如：张先生'), { required: true }),
            buildField('真实姓名', inputHtml('customerName', '选填，如：张三')),
            buildField('联系方式', inputHtml('customerPhone', '手机号 / 微信号'), { half: true }),
            buildField('客户来源', selectHtml('customerSource', CUSTOMER_SOURCES), { half: true }),
            '        </div>',
            // Tags
            '        <div class="mt-3">',
            '          <label class="block text-xs text-gray-500 mb-2">客户标签 <span class="text-gray-400">（可多选）</span></label>',
            '          <div class="flex flex-wrap gap-2">' + buildTagHtml() + '</div>',
            '        </div>',
            '      </div>',
            // === Section 2: 项目信息 ===
            '      <div class="border-t border-gray-50 pt-5">',
            '        <div class="flex items-center gap-2 mb-3">',
            '          <div class="w-6 h-6 rounded-md bg-purple-50 flex items-center justify-center"><i class="ph ph-folder-open text-purple-500 text-sm"></i></div>',
            '          <h4 class="text-sm font-semibold text-gray-800">项目信息</h4>',
            '        </div>',
            '        <div class="grid grid-cols-2 gap-x-4 gap-y-3">',
            buildField('项目类型', selectHtml('projectType', PROJECT_TYPES), { required: true, half: true }),
            buildField('项目名称', inputHtml('projectName', '如：企业官网定制开发'), { required: true, half: true }),
            '        </div>',
            '        <div class="mt-3">',
            buildField('需求简述', textareaHtml('projectDesc', '简要描述客户需求和交付要求...', 3)),
            '        </div>',
            '      </div>',
            // === Section 3: 商务信息 ===
            '      <div class="border-t border-gray-50 pt-5">',
            '        <div class="flex items-center gap-2 mb-3">',
            '          <div class="w-6 h-6 rounded-md bg-green-50 flex items-center justify-center"><i class="ph ph-currency-cny text-green-500 text-sm"></i></div>',
            '          <h4 class="text-sm font-semibold text-gray-800">商务信息</h4>',
            '        </div>',
            '        <div class="grid grid-cols-2 gap-x-4 gap-y-3">',
            buildField('成交金额（¥）', inputHtml('amount', '0.00', 'number'), { required: true, half: true }),
            buildField('实际成本（¥）', inputHtml('cost', '0.00', 'number'), { half: true }),
            buildField('实际耗时（小时）', inputHtml('hours', '0', 'number'), { half: true }),
            buildField('预计利润（¥）', '<div id="profit-display" class="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50 rounded-lg border border-gray-100">—</div>', { half: true }),
            buildField('净利率', '<div id="margin-display" class="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50 rounded-lg border border-gray-100">—</div>', { half: true }),
            buildField('时薪（¥/h）', '<div id="rate-display" class="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50 rounded-lg border border-gray-100">—</div>', { half: true }),
            '        </div>',
            '      </div>',
            // === Section 4: 时间节点 ===
            '      <div class="border-t border-gray-50 pt-5">',
            '        <div class="flex items-center gap-2 mb-3">',
            '          <div class="w-6 h-6 rounded-md bg-orange-50 flex items-center justify-center"><i class="ph ph-calendar text-orange-500 text-sm"></i></div>',
            '          <h4 class="text-sm font-semibold text-gray-800">时间节点</h4>',
            '        </div>',
            '        <div class="grid grid-cols-2 gap-x-4 gap-y-3">',
            buildField('接单日期', inputHtml('orderDate', '', 'date'), { required: true, half: true }),
            buildField('需求确认日', inputHtml('confirmDate', '', 'date'), { half: true }),
            buildField('初稿交付日', inputHtml('draftDate', '', 'date'), { half: true }),
            buildField('终稿交付日', inputHtml('finalDate', '', 'date'), { half: true }),
            buildField('交付周期（天）', '<div id="cycle-display" class="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50 rounded-lg border border-gray-100">—</div>', { half: true }),
            '        </div>',
            '      </div>',
            // === Section 5: 状态管理 ===
            '      <div class="border-t border-gray-50 pt-5">',
            '        <div class="flex items-center gap-2 mb-3">',
            '          <div class="w-6 h-6 rounded-md bg-red-50 flex items-center justify-center"><i class="ph ph-traffic-signal text-red-500 text-sm"></i></div>',
            '          <h4 class="text-sm font-semibold text-gray-800">状态管理</h4>',
            '        </div>',
            '        <div class="grid grid-cols-2 gap-x-4 gap-y-3">',
            buildField('订单状态', '<select name="orderStatus" class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15 transition-all bg-white">' + buildStatusOptions() + '</select>', { required: true, half: true }),
            buildField('付款状态', selectHtml('paymentStatus', PAYMENT_STATUSES), { half: true }),
            buildField('付款比例（%）', '<div id="payment-ratio-wrap" class="hidden"><input type="number" name="paymentRatio" placeholder="如：50" min="0" max="100" class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15 transition-all bg-white"></div>', { half: true }),
            buildField('预计回款日', inputHtml('payDate', '', 'date'), { half: true }),
            '        </div>',
            '      </div>',
            // === Section 6: 附件与关联 ===
            '      <div class="border-t border-gray-50 pt-5">',
            '        <div class="flex items-center gap-2 mb-3">',
            '          <div class="w-6 h-6 rounded-md bg-cyan-50 flex items-center justify-center"><i class="ph ph-paperclip text-cyan-500 text-sm"></i></div>',
            '          <h4 class="text-sm font-semibold text-gray-800">附件与关联</h4>',
            '        </div>',
            '        <div class="space-y-3">',
            buildField('Git 仓库链接', inputHtml('gitUrl', 'https://github.com/...')),
            buildField('关联报价单', inputHtml('quoteRef', '输入报价单编号或名称')),
            '        </div>',
            // File uploads
            '        <div class="mt-3 grid grid-cols-2 gap-3">',
            '          <div class="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center hover:border-brand-300 transition cursor-pointer">',
            '            <i class="ph ph-chat-circle-dots text-2xl text-gray-300"></i>',
            '            <p class="text-xs text-gray-400 mt-1">需求沟通截图</p>',
            '            <p class="text-[10px] text-gray-300 mt-0.5">点击或拖拽上传</p>',
            '          </div>',
            '          <div class="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center hover:border-brand-300 transition cursor-pointer">',
            '            <i class="ph ph-images text-2xl text-gray-300"></i>',
            '            <p class="text-xs text-gray-400 mt-1">成品展示图</p>',
            '            <p class="text-[10px] text-gray-300 mt-0.5">点击或拖拽上传</p>',
            '          </div>',
            '        </div>',
            '      </div>',
            '    </form>',
            '  </div>',
            // Footer
            '  <div class="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between flex-shrink-0">',
            '    <div class="text-xs text-gray-400" id="order-form-hint">所有数据仅保存在本地浏览器</div>',
            '    <div class="flex gap-3">',
            '      <button id="order-form-cancel" class="px-5 py-2 border border-gray-200 text-gray-600 bg-white rounded-lg hover:bg-gray-50 transition text-sm font-medium">取消</button>',
            '      <button id="order-form-submit" class="px-5 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition text-sm font-medium shadow-sm shadow-brand-500/30 flex items-center gap-1.5"><i class="ph ph-check"></i>保存</button>',
            '    </div>',
            '  </div>',
            '</div>'
        ].join('');
    }

    // ========== 计算逻辑 ==========

    function updateCalc() {
        var form = document.getElementById('order-form');
        if (!form) return;

        var amount = parseFloat(form.amount.value) || 0;
        var cost = parseFloat(form.cost.value) || 0;
        var hours = parseFloat(form.hours.value) || 0;

        var profit = amount - cost;
        var margin = amount > 0 ? (profit / amount * 100).toFixed(1) + '%' : '—';
        var rate = hours > 0 ? (profit / hours).toFixed(1) : '—';

        var profitEl = document.getElementById('profit-display');
        var marginEl = document.getElementById('margin-display');
        var rateEl = document.getElementById('rate-display');

        if (profitEl) {
            profitEl.textContent = '¥ ' + profit.toLocaleString();
            profitEl.className = 'px-3 py-2 text-sm font-medium rounded-lg border ' +
                (profit > 0 ? 'text-green-600 bg-green-50 border-green-100' : 'text-gray-500 bg-gray-50 border-gray-100');
        }
        if (marginEl) marginEl.textContent = margin;
        if (rateEl) {
            rateEl.textContent = rate === '—' ? '—' : '¥ ' + rate;
        }

        // 交付周期
        var cycle = calcDays(form.orderDate.value, form.finalDate.value);
        var cycleEl = document.getElementById('cycle-display');
        if (cycleEl) cycleEl.textContent = cycle === '' ? '—' : cycle + ' 天';
    }

    // ========== 标签交互 ==========

    function toggleTag(btn) {
        var tag = btn.getAttribute('data-tag');
        var idx = selectedTags.indexOf(tag);
        if (idx === -1) {
            selectedTags.push(tag);
            btn.className = btn.className.replace('border-gray-200 text-gray-500 hover:border-brand-300 hover:text-brand-600', 'border-brand-500 bg-brand-50 text-brand-600');
        } else {
            selectedTags.splice(idx, 1);
            btn.className = btn.className.replace('border-brand-500 bg-brand-50 text-brand-600', 'border-gray-200 text-gray-500 hover:border-brand-300 hover:text-brand-600');
        }
    }

    // ========== 付款状态联动 ==========

    function togglePaymentRatio() {
        var form = document.getElementById('order-form');
        if (!form) return;
        var wrap = document.getElementById('payment-ratio-wrap');
        if (form.paymentStatus.value === '部分付款') {
            wrap.classList.remove('hidden');
        } else {
            wrap.classList.add('hidden');
        }
    }

    // ========== 校验 ==========

    function validate() {
        var form = document.getElementById('order-form');
        if (!form) return false;
        var errors = [];

        if (!form.customerNick.value.trim()) errors.push('客户昵称');
        if (!form.projectType.value) errors.push('项目类型');
        if (!form.projectName.value.trim()) errors.push('项目名称');
        if (!form.amount.value || parseFloat(form.amount.value) <= 0) errors.push('成交金额');
        if (!form.orderDate.value) errors.push('接单日期');

        if (errors.length > 0) {
            // 高亮错误字段
            errors.forEach(function (field) {
                console.warn('[OrderForm] 缺少必填字段: ' + field);
            });
            return false;
        }
        return true;
    }

    // ========== 收集数据 ==========

    function collectData() {
        var form = document.getElementById('order-form');
        return {
            customerNick: form.customerNick.value.trim(),
            customerName: form.customerName.value.trim(),
            customerPhone: form.customerPhone.value.trim(),
            customerSource: form.customerSource.value,
            customerTags: selectedTags.slice(),
            projectType: form.projectType.value,
            projectName: form.projectName.value.trim(),
            projectDesc: form.projectDesc.value.trim(),
            amount: parseFloat(form.amount.value) || 0,
            cost: parseFloat(form.cost.value) || 0,
            hours: parseFloat(form.hours.value) || 0,
            orderDate: form.orderDate.value,
            confirmDate: form.confirmDate.value,
            draftDate: form.draftDate.value,
            finalDate: form.finalDate.value,
            orderStatus: form.orderStatus.value,
            paymentStatus: form.paymentStatus.value,
            paymentRatio: form.paymentRatio ? parseInt(form.paymentRatio.value) || 0 : 0,
            payDate: form.payDate.value,
            gitUrl: form.gitUrl.value.trim(),
            quoteRef: form.quoteRef.value.trim()
        };
    }

    // ========== 填充数据（编辑模式） ==========

    function fillData(data) {
        var form = document.getElementById('order-form');
        if (!form || !data) return;
        form.customerNick.value = data.customerNick || '';
        form.customerName.value = data.customerName || '';
        form.customerPhone.value = data.customerPhone || '';
        form.customerSource.value = data.customerSource || '闲鱼';
        form.projectType.value = data.projectType || '网站开发';
        form.projectName.value = data.projectName || '';
        form.projectDesc.value = data.projectDesc || '';
        form.amount.value = data.amount || '';
        form.cost.value = data.cost || '';
        form.hours.value = data.hours || '';
        form.orderDate.value = data.orderDate || '';
        form.confirmDate.value = data.confirmDate || '';
        form.draftDate.value = data.draftDate || '';
        form.finalDate.value = data.finalDate || '';
        form.orderStatus.value = data.orderStatus || 'pending';
        form.paymentStatus.value = data.paymentStatus || '未付款';
        form.payDate.value = data.payDate || '';
        form.gitUrl.value = data.gitUrl || '';
        form.quoteRef.value = data.quoteRef || '';

        // 标签
        selectedTags = (data.customerTags || []).slice();
        document.querySelectorAll('.order-tag').forEach(function (btn) {
            var tag = btn.getAttribute('data-tag');
            if (selectedTags.indexOf(tag) !== -1) {
                btn.className = 'order-tag px-2.5 py-1 rounded-md text-xs border transition-all border-brand-500 bg-brand-50 text-brand-600';
            }
        });

        togglePaymentRatio();
        updateCalc();
    }

    // ========== 事件绑定 ==========

    function bindEvents() {
        var form = document.getElementById('order-form');

        // 关闭
        document.getElementById('order-form-close').addEventListener('click', closeOrderForm);
        document.getElementById('order-form-cancel').addEventListener('click', closeOrderForm);
        overlay.addEventListener('click', closeOrderForm);

        // 提交
        document.getElementById('order-form-submit').addEventListener('click', function () {
            if (!validate()) {
                var hint = document.getElementById('order-form-hint');
                hint.textContent = '请填写所有必填字段（标 * 号的）';
                hint.className = 'text-xs text-red-500';
                setTimeout(function () {
                    hint.textContent = '所有数据仅保存在本地浏览器';
                    hint.className = 'text-xs text-gray-400';
                }, 3000);
                return;
            }
            var data = collectData();
            window.dispatchEvent(new CustomEvent('order-form:submit', { detail: data }));
            closeOrderForm();
        });

        // 实时计算
        ['amount', 'cost', 'hours'].forEach(function (name) {
            form[name].addEventListener('input', updateCalc);
        });
        ['orderDate', 'finalDate'].forEach(function (name) {
            form[name].addEventListener('change', updateCalc);
        });

        // 付款状态联动
        form.paymentStatus.addEventListener('change', togglePaymentRatio);

        // 标签点击
        document.querySelectorAll('.order-tag').forEach(function (btn) {
            btn.addEventListener('click', function () { toggleTag(btn); });
        });

        // ESC 关闭
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && isOpen) closeOrderForm();
        });
    }

    // ========== 打开 / 关闭 ==========

    function openOrderForm(data) {
        if (isOpen) return;

        // 构建 DOM
        document.body.insertAdjacentHTML('beforeend', buildDrawerHTML());
        drawer = document.getElementById('order-form-drawer');
        overlay = document.getElementById('order-form-overlay');
        selectedTags = [];
        editMode = !!data;

        // 标题
        document.getElementById('order-form-title').textContent = editMode ? '编辑接单记录' : '新建接单记录';

        // 默认接单日期 = 今天
        var form = document.getElementById('order-form');
        if (form.orderDate) form.orderDate.value = formatDate(new Date());

        bindEvents();

        // 编辑模式填充数据
        if (editMode) fillData(data);

        // 动画打开
        requestAnimationFrame(function () {
            overlay.classList.remove('opacity-0');
            drawer.classList.remove('translate-x-full');
        });

        // 锁定 body 滚动
        document.body.style.overflow = 'hidden';
        isOpen = true;
    }

    function closeOrderForm() {
        if (!isOpen) return;

        overlay.classList.add('opacity-0');
        drawer.classList.add('translate-x-full');

        setTimeout(function () {
            if (overlay) { overlay.remove(); overlay = null; }
            if (drawer) { drawer.remove(); drawer = null; }
            document.body.style.overflow = '';
            isOpen = false;
        }, 300);
    }

    // ========== 全局事件监听 ==========

    // 监听包含「新建接单」或「新建订单」的按钮点击
    document.addEventListener('click', function (e) {
        var btn = e.target.closest('button');
        if (!btn) return;
        var text = btn.textContent.trim();
        if (text === '新建接单' || text === '新建订单') {
            e.preventDefault();
            openOrderForm();
        }
    });

    // SPA 切换后重新绑定（防止 DOM 丢失）
    window.addEventListener('spa:ready', function () {
        // 表单是独立 DOM，SPA 切换不影响
    });

    // 暴露全局 API
    window.openOrderForm = openOrderForm;
    window.closeOrderForm = closeOrderForm;
})();
