/**
 * 我的订单表单组件 —— 独立可复用的右侧抽屉表单
 *
 * 功能：
 *   - 新建 / 编辑我的订单
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
    var editId = null; // 编辑模式下的订单 ID
    var uploadedFiles = {}; // { screenshot: {name,size,type,url}, showcase: {...}, quote: {...}, taskBook: {...} }

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

    function uploadZoneHtml(type, icon, label, hint, accept) {
        accept = accept || '';
        return [
            '<div class="order-upload-zone border-2 border-dashed border-gray-200 rounded-lg p-4 text-center hover:border-brand-300 transition cursor-pointer relative" data-upload-type="' + type + '">',
            '  <div class="upload-placeholder">',
            '    <i class="ph ' + icon + ' text-2xl text-gray-300"></i>',
            '    <p class="text-xs text-gray-400 mt-1">' + label + '</p>',
            '    <p class="text-[10px] text-gray-300 mt-0.5">' + hint + '</p>',
            '  </div>',
            '  <div class="upload-preview hidden">',
            '    <div class="flex items-center gap-2 px-1">',
            '      <i class="ph ph-file-pdf text-lg text-red-500 file-icon"></i>',
            '      <span class="text-xs text-gray-600 flex-1 truncate text-left file-name"></span>',
            '      <button type="button" class="upload-remove w-5 h-5 flex items-center justify-center text-gray-400 hover:text-red-500 transition flex-shrink-0"><i class="ph ph-x text-xs"></i></button>',
            '    </div>',
            '  </div>',
            '  <input type="file" class="upload-input hidden" accept="' + accept + '">',
            '</div>'
        ].join('');
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
            '      <h3 class="font-bold text-gray-800 text-base" id="order-form-title">新建我的订单</h3>',
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
            uploadZoneHtml('screenshot', 'ph-chat-circle-dots', '需求沟通截图', '点击或拖拽上传', 'image/*'),
            uploadZoneHtml('showcase', 'ph-images', '成品展示图', '点击或拖拽上传', 'image/*'),
            '        </div>',
            '        <div class="mt-3">',
            uploadZoneHtml('quote', 'ph-file-pdf', '报价单', '支持 PDF / Word / 图片，点击或拖拽上传', '.pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.webp'),
            '        </div>',
            '        <div class="mt-3">',
            uploadZoneHtml('taskBook', 'ph-file-text', '项目任务书（可选）', '支持 PDF / Word / 图片，点击或拖拽上传', '.pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.webp,.txt,.md'),
            '        </div>',
            '      </div>',
            '    </form>',
            '  </div>',
            // Footer
            '  <div class="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between flex-shrink-0">',
            '    <div class="text-xs text-gray-400" id="order-form-hint">数据将保存到后端服务器</div>',
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

    // ========== 文件上传 ==========

    function revokeFileUrl(file) {
        if (file && file.url && file.url.indexOf('blob:') === 0 && window.URL && window.URL.revokeObjectURL) {
            window.URL.revokeObjectURL(file.url);
        }
    }

    function createFileRecord(file) {
        var url = '';
        if (window.URL && window.URL.createObjectURL) {
            url = window.URL.createObjectURL(file);
        }
        return {
            name: file.name,
            size: file.size,
            type: file.type,
            url: url,
            _needsUpload: true // 标记需要上传到服务器
        };
    }

    /**
     * 上传单个文件到服务器
     */
    function uploadFileToServer(file) {
        if (!file || !file._needsUpload) return Promise.resolve(file);
        if (!file.url || file.url.indexOf('blob:') !== 0) return Promise.resolve(file);

        // 从 blob URL 获取原始 File 对象
        return fetch(file.url).then(function (r) { return r.blob(); }).then(function (blob) {
            var formData = new FormData();
            formData.append('file', blob, file.name);
            return fetch('/api/upload', { method: 'POST', body: formData }).then(function (r) { return r.json(); });
        }).then(function (res) {
            if (res.success && res.data) {
                return {
                    name: res.data.originalName || file.name,
                    size: res.data.size || file.size,
                    type: res.data.mimetype || file.type,
                    url: res.data.url
                };
            }
            return file; // 上传失败则保留原信息
        }).catch(function (err) {
            console.error('[OrderForm] 文件上传失败:', err);
            return file;
        });
    }

    /**
     * 上传所有需要上传的文件
     */
    function uploadAllFiles() {
        var keys = ['screenshot', 'showcase', 'quote', 'taskBook'];
        var promises = keys.map(function (key) {
            if (uploadedFiles[key] && uploadedFiles[key]._needsUpload) {
                return uploadFileToServer(uploadedFiles[key]).then(function (result) {
                    uploadedFiles[key] = result;
                });
            }
            return Promise.resolve();
        });
        return Promise.all(promises);
    }

    function getFileIconClass(file) {
        var type = (file && file.type) || '';
        var name = (file && file.name) || '';
        var iconClass = 'ph file-icon text-lg ';
        if (type.startsWith('image/')) {
            iconClass += 'ph-image text-blue-500';
        } else if (type.indexOf('pdf') !== -1 || name.match(/\.pdf$/i)) {
            iconClass += 'ph-file-pdf text-red-500';
        } else if (type.indexOf('word') !== -1 || name.match(/\.(doc|docx)$/i)) {
            iconClass += 'ph-file-doc text-blue-600';
        } else {
            iconClass += 'ph-file text-gray-500';
        }
        return iconClass;
    }

    function handleFileUpload(type, file, zone) {
        var placeholder = zone.querySelector('.upload-placeholder');
        var preview = zone.querySelector('.upload-preview');
        var fileNameEl = zone.querySelector('.file-name');
        var fileIcon = zone.querySelector('.file-icon');

        revokeFileUrl(uploadedFiles[type]);
        uploadedFiles[type] = createFileRecord(file);

        placeholder.classList.add('hidden');
        preview.classList.remove('hidden');
        if (fileNameEl) fileNameEl.textContent = file.name;

        if (fileIcon) {
            fileIcon.className = getFileIconClass(uploadedFiles[type]);
        }
    }

    function bindUploadEvents() {
        document.querySelectorAll('.order-upload-zone').forEach(function (zone) {
            var type = zone.getAttribute('data-upload-type');
            var fileInput = zone.querySelector('.upload-input');
            var placeholder = zone.querySelector('.upload-placeholder');
            var removeBtn = zone.querySelector('.upload-remove');

            // 点击上传
            zone.addEventListener('click', function (e) {
                if (e.target.closest('.upload-remove')) return;
                fileInput.click();
            });

            // 文件选择
            fileInput.addEventListener('change', function () {
                if (this.files && this.files[0]) {
                    handleFileUpload(type, this.files[0], zone);
                }
            });

            // 拖拽
            zone.addEventListener('dragover', function (e) {
                e.preventDefault();
                zone.classList.add('border-brand-400', 'bg-brand-50/30');
            });
            zone.addEventListener('dragleave', function () {
                zone.classList.remove('border-brand-400', 'bg-brand-50/30');
            });
            zone.addEventListener('drop', function (e) {
                e.preventDefault();
                zone.classList.remove('border-brand-400', 'bg-brand-50/30');
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleFileUpload(type, e.dataTransfer.files[0], zone);
                }
            });

            // 移除文件
            if (removeBtn) {
                removeBtn.addEventListener('click', function (e) {
                    e.stopPropagation();
                    revokeFileUrl(uploadedFiles[type]);
                    uploadedFiles[type] = null;
                    placeholder.classList.remove('hidden');
                    zone.querySelector('.upload-preview').classList.add('hidden');
                    fileInput.value = '';
                });
            }
        });
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
            quoteRef: form.quoteRef.value.trim(),
            uploadedFiles: {
                screenshot: uploadedFiles.screenshot || null,
                showcase: uploadedFiles.showcase || null,
                quote: uploadedFiles.quote || null,
                taskBook: uploadedFiles.taskBook || null
            }
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

        // 付款比例
        if (form.paymentRatio && data.paymentRatio) form.paymentRatio.value = data.paymentRatio;

        // 上传文件恢复
        var files = data.uploadedFiles || {};
        uploadedFiles = {};
        ['screenshot', 'showcase', 'quote', 'taskBook'].forEach(function (key) {
            if (files[key]) {
                uploadedFiles[key] = files[key];
                var zone = document.querySelector('.order-upload-zone[data-upload-type="' + key + '"]');
                if (zone) {
                    var ph = zone.querySelector('.upload-placeholder');
                    var pv = zone.querySelector('.upload-preview');
                    var fnEl = zone.querySelector('.file-name');
                    var iconEl = zone.querySelector('.file-icon');
                    if (ph) ph.classList.add('hidden');
                    if (pv) pv.classList.remove('hidden');
                    if (fnEl) fnEl.textContent = files[key].name;
                    if (iconEl) iconEl.className = getFileIconClass(files[key]);
                }
            }
        });

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
                    hint.textContent = '数据将保存到后端服务器';
                    hint.className = 'text-xs text-gray-400';
                }, 3000);
                return;
            }

            var submitBtn = document.getElementById('order-form-submit');
            var originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="ph ph-spinner animate-spin"></i> 保存中...';
            submitBtn.disabled = true;

            var data = collectData();
            if (editId) data.id = editId;

            // 先上传文件，再提交表单
            uploadAllFiles().then(function () {
                // 更新 data 中的 uploadedFiles（去除 _needsUpload 标记）
                var cleanFiles = {};
                ['screenshot', 'showcase', 'quote', 'taskBook'].forEach(function (key) {
                    if (uploadedFiles[key]) {
                        var f = uploadedFiles[key];
                        cleanFiles[key] = { name: f.name, size: f.size, type: f.type, url: f.url || '' };
                    }
                });
                data.uploadedFiles = cleanFiles;

                var url = editId ? '/api/orders/' + encodeURIComponent(editId) : '/api/orders';
                var method = editId ? 'PUT' : 'POST';

                return fetch(url, {
                    method: method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                }).then(function (r) { return r.json(); });
            }).then(function (res) {
                if (res.success) {
                    window.dispatchEvent(new CustomEvent('order-form:saved', { detail: res.data }));
                    closeOrderForm();
                } else {
                    var hint = document.getElementById('order-form-hint');
                    hint.textContent = '保存失败：' + (res.error || '未知错误');
                    hint.className = 'text-xs text-red-500';
                    submitBtn.innerHTML = originalText;
                    submitBtn.disabled = false;
                }
            }).catch(function (err) {
                console.error('[OrderForm] 保存失败:', err);
                var hint2 = document.getElementById('order-form-hint');
                hint2.textContent = '保存失败：' + err.message;
                hint2.className = 'text-xs text-red-500';
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            });
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

        // 文件上传
        bindUploadEvents();

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
        uploadedFiles = {};
        editMode = !!data;
        editId = data && data.id ? data.id : null;

        // 标题
        document.getElementById('order-form-title').textContent = editMode ? '编辑我的订单' : '新建我的订单';

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

    // SPA 切换页面时清理：重置内部状态，防止 isOpen 卡死导致表单打不开
    window.addEventListener('spa:cleanup-forms', function () {
        if (isOpen) {
            if (overlay) { overlay.remove(); overlay = null; }
            if (drawer) { drawer.remove(); drawer = null; }
            document.body.style.overflow = '';
            isOpen = false;
        }
    });

    // 暴露全局 API
    window.openOrderForm = openOrderForm;
    window.closeOrderForm = closeOrderForm;
})();
