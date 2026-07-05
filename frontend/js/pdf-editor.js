/**
 * pdf-editor.js —— PDF 上传、预览、标注编辑器
 *
 * 基于 PDF.js（Mozilla）实现 PDF 读取与渲染
 * 基于 pdf-lib 实现 PDF 标注编辑与导出
 *
 * 功能：
 *   - 拖拽 / 点击上传 PDF
 *   - 翻页、缩放
 *   - 标注工具：文本、高亮、画笔、矩形、箭头
 *   - 颜色选择、撤销、清除
 *   - 导出编辑后的 PDF
 *
 * 使用方式：
 *   在页面中引入本脚本，然后调用 window.openPdfEditor()
 */
(function () {
    'use strict';

    // ==================== 状态 ====================
    var state = {
        pdfDoc: null,           // PDF.js 文档对象
        currentPage: 1,         // 当前页码
        totalPages: 0,          // 总页数
        scale: 1.5,             // 渲染缩放比
        annotations: [],        // 标注列表
        currentTool: 'select',  // 当前工具
        currentColor: '#ef4444',// 当前颜色
        fontSize: 16,           // 文本字号
        isDrawing: false,       // 是否正在绘制
        startPos: null,         // 绘制起点
        currentPath: null,      // 画笔当前路径
        originalBytes: null,    // 原始 PDF 字节
        fileName: '',           // 文件名
        renderTask: null,       // 当前渲染任务（可取消）
        pageViewport: null      // 当前页视口（用于坐标转换）
    };

    // ==================== 工具映射 ====================
    var TOOL_NAMES = {
        'select': '选择',
        'text': '文本',
        'highlight': '高亮',
        'pen': '画笔',
        'rectangle': '矩形',
        'arrow': '箭头'
    };

    // ==================== 初始化 ====================
    var modalCreated = false;

    function ensureModal() {
        if (modalCreated) return;
        modalCreated = true;
        createModal();
        bindEvents();
    }

    /**
     * 动态创建模态框 HTML，挂载到 body 末尾
     * （不受 SPA #page-view 替换影响）
     */
    function createModal() {
        var html = ''
            + '<div id="pdf-editor-modal" class="fixed inset-0 z-[9999] hidden">'
            + '  <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" data-action="close"></div>'
            + '  <div class="absolute inset-2 md:inset-4 bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden">'

            // ---- 顶部工具栏 ----
            + '    <div class="flex items-center gap-2 px-3 py-2.5 border-b border-gray-100 bg-gray-50/80 flex-shrink-0">'
            + '      <button data-action="close" class="w-8 h-8 rounded-lg hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors" title="关闭">'
            + '        <i class="ph ph-x text-lg"></i>'
            + '      </button>'
            + '      <div class="flex items-center gap-2 min-w-0 mr-2">'
            + '        <i class="ph-fill ph-file-pdf text-red-500 text-lg flex-shrink-0"></i>'
            + '        <span id="pdf-filename" class="text-sm font-medium text-gray-700 truncate max-w-[200px]">未选择文件</span>'
            + '      </div>'

            // 翻页
            + '      <div id="pdf-nav" class="hidden items-center gap-1">'
            + '        <button data-action="prev-page" class="w-7 h-7 rounded hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors" title="上一页">'
            + '          <i class="ph ph-caret-left"></i>'
            + '        </button>'
            + '        <span class="text-xs text-gray-500 px-1 select-none">'
            + '          <input id="pdf-page-input" type="number" min="1" value="1" class="w-8 text-center bg-transparent border-b border-gray-300 focus:border-brand-500 outline-none text-xs" />'
            + '          / <span id="pdf-total-pages">1</span>'
            + '        </span>'
            + '        <button data-action="next-page" class="w-7 h-7 rounded hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors" title="下一页">'
            + '          <i class="ph ph-caret-right"></i>'
            + '        </button>'
            + '      </div>'

            // 缩放
            + '      <div id="pdf-zoom" class="hidden items-center gap-1 ml-1">'
            + '        <button data-action="zoom-out" class="w-7 h-7 rounded hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors" title="缩小">'
            + '          <i class="ph ph-minus"></i>'
            + '        </button>'
            + '        <span id="pdf-zoom-level" class="text-xs text-gray-500 w-11 text-center select-none">150%</span>'
            + '        <button data-action="zoom-in" class="w-7 h-7 rounded hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors" title="放大">'
            + '          <i class="ph ph-plus"></i>'
            + '        </button>'
            + '        <button data-action="zoom-fit" class="w-7 h-7 rounded hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors" title="适合宽度">'
            + '          <i class="ph ph-frame-corners text-sm"></i>'
            + '        </button>'
            + '      </div>'

            + '      <div class="flex-1"></div>'

            // 下载
            + '      <button data-action="export" id="pdf-export-btn" class="hidden px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors shadow-sm">'
            + '        <i class="ph ph-download-simple"></i> 下载编辑后PDF'
            + '      </button>'
            + '    </div>'

            // ---- 主内容区 ----
            + '    <div class="flex flex-1 overflow-hidden">'

            // 左侧工具栏
            + '      <div id="pdf-tools" class="hidden w-14 border-r border-gray-100 bg-gray-50/50 flex flex-col items-center py-3 gap-1 flex-shrink-0">'
            + '        <button data-tool="select" class="pdf-tool-btn active" title="选择">'
            + '          <i class="ph ph-cursor text-lg"></i>'
            + '        </button>'
            + '        <button data-tool="text" class="pdf-tool-btn" title="文本">'
            + '          <i class="ph ph-text-aa text-lg"></i>'
            + '        </button>'
            + '        <button data-tool="highlight" class="pdf-tool-btn" title="高亮">'
            + '          <i class="ph ph-highlighter text-lg"></i>'
            + '        </button>'
            + '        <button data-tool="pen" class="pdf-tool-btn" title="画笔">'
            + '          <i class="ph ph-pen-nib text-lg"></i>'
            + '        </button>'
            + '        <button data-tool="rectangle" class="pdf-tool-btn" title="矩形">'
            + '          <i class="ph ph-square text-lg"></i>'
            + '        </button>'
            + '        <button data-tool="arrow" class="pdf-tool-btn" title="箭头">'
            + '          <i class="ph ph-arrow-up-right text-lg"></i>'
            + '        </button>'
            + '        <div class="w-8 h-px bg-gray-200 my-1"></div>'
            + '        <button data-action="undo" class="pdf-tool-btn" title="撤销">'
            + '          <i class="ph ph-arrow-counter-clockwise text-lg"></i>'
            + '        </button>'
            + '        <button data-action="clear" class="pdf-tool-btn" title="清除全部标注">'
            + '          <i class="ph ph-eraser text-lg"></i>'
            + '        </button>'
            + '        <div class="w-8 h-px bg-gray-200 my-1"></div>'
            // 颜色选择
            + '        <div class="flex flex-col gap-1.5">'
            + '          <button data-color="#ef4444" class="pdf-color-btn active" style="background:#ef4444"></button>'
            + '          <button data-color="#f59e0b" class="pdf-color-btn" style="background:#f59e0b"></button>'
            + '          <button data-color="#10b981" class="pdf-color-btn" style="background:#10b981"></button>'
            + '          <button data-color="#3b82f6" class="pdf-color-btn" style="background:#3b82f6"></button>'
            + '          <button data-color="#8b5cf6" class="pdf-color-btn" style="background:#8b5cf6"></button>'
            + '          <button data-color="#1e293b" class="pdf-color-btn" style="background:#1e293b"></button>'
            + '        </div>'
            + '        <div class="w-8 h-px bg-gray-200 my-1"></div>'
            // 字号
            + '        <div id="pdf-fontsize-wrap" class="hidden flex flex-col items-center gap-1">'
            + '          <button data-action="font-inc" class="w-8 h-8 rounded hover:bg-gray-200 flex items-center justify-center text-gray-500 text-xs">A+</button>'
            + '          <span id="pdf-fontsize" class="text-[10px] text-gray-500">16</span>'
            + '          <button data-action="font-dec" class="w-8 h-8 rounded hover:bg-gray-200 flex items-center justify-center text-gray-500 text-xs">A-</button>'
            + '        </div>'
            + '      </div>'

            // 画布区域
            + '      <div class="flex-1 overflow-auto bg-gray-200/60 flex items-center justify-center p-4" id="pdf-canvas-area">'

            // 上传区域
            + '        <div id="pdf-upload-zone" class="w-full max-w-md">'
            + '          <div id="pdf-drop-area" class="border-2 border-dashed border-gray-300 rounded-2xl p-10 text-center hover:border-brand-400 hover:bg-brand-50/30 transition-all cursor-pointer">'
            + '            <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-brand-50 flex items-center justify-center">'
            + '              <i class="ph-fill ph-upload-simple text-3xl text-brand-500"></i>'
            + '            </div>'
            + '            <h3 class="text-base font-bold text-gray-700 mb-1">上传 PDF 文件</h3>'
            + '            <p class="text-xs text-gray-400 mb-4">点击选择文件或拖拽 PDF 到此处</p>'
            + '            <button data-action="select-file" class="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-sm font-medium transition-colors">选择文件</button>'
            + '            <p class="text-[10px] text-gray-300 mt-4">支持 PDF 格式 · 基于 PDF.js + pdf-lib</p>'
            + '          </div>'
            + '        </div>'

            // PDF 画布
            + '        <div id="pdf-viewer" class="hidden relative">'
            + '          <canvas id="pdf-canvas" class="shadow-lg bg-white block"></canvas>'
            + '          <canvas id="pdf-overlay" class="absolute top-0 left-0" style="pointer-events:auto;"></canvas>'
            + '        </div>'

            + '      </div>'
            + '    </div>'

            // ---- 底部状态栏 ----
            + '    <div id="pdf-status" class="hidden items-center justify-between px-4 py-2 border-t border-gray-100 bg-gray-50/80 text-xs text-gray-400 flex-shrink-0">'
            + '      <div class="flex items-center gap-4">'
            + '        <span id="pdf-tool-info">工具: 选择</span>'
            + '        <span id="pdf-ann-count">标注: 0</span>'
            + '      </div>'
            + '      <div>PDF 编辑器 · PDF.js + pdf-lib</div>'
            + '    </div>'

            + '  </div>'
            + '</div>'
            // 隐藏的 file input
            + '<input type="file" id="pdf-file-input" accept="application/pdf" class="hidden" />';

        var container = document.createElement('div');
        container.innerHTML = html;
        while (container.firstChild) {
            document.body.appendChild(container.firstChild);
        }

        // 注入工具按钮样式
        var style = document.createElement('style');
        style.textContent = ''
            + '.pdf-tool-btn{width:36px;height:36px;border-radius:8px;display:flex;align-items:center;justify-content:center;color:#64748b;transition:all .15s;cursor:pointer;border:none;background:transparent;}'
            + '.pdf-tool-btn:hover{background:#e2e8f0;color:#334155;}'
            + '.pdf-tool-btn.active{background:#dbeafe;color:#2563eb;}'
            + '.pdf-color-btn{width:22px;height:22px;border-radius:50%;border:2px solid #fff;box-shadow:0 0 0 1px #cbd5e1;cursor:pointer;transition:all .15s;padding:0;}'
            + '.pdf-color-btn:hover{transform:scale(1.15);}'
            + '.pdf-color-btn.active{box-shadow:0 0 0 2px #2563eb;transform:scale(1.1);}'
            + '#pdf-overlay{cursor:crosshair;}'
            + '#pdf-overlay.tool-select{cursor:default;}'
            + '#pdf-overlay.tool-text{cursor:text;}'
            + '.pdf-text-input{position:absolute;background:#fff;border:2px solid #2563eb;border-radius:4px;padding:2px 6px;font-size:14px;outline:none;z-index:10;box-shadow:0 2px 8px rgba(0,0,0,.15);min-width:60px;}'
            + '.pdf-toast{position:fixed;top:20px;left:50%;transform:translateX(-50%);padding:10px 20px;border-radius:8px;font-size:13px;z-index:99999;animation:pdfToastIn .3s ease;}'
            + '.pdf-toast.success{background:#10b981;color:#fff;}'
            + '.pdf-toast.error{background:#ef4444;color:#fff;}'
            + '.pdf-toast.info{background:#3b82f6;color:#fff;}'
            + '@keyframes pdfToastIn{from{opacity:0;transform:translateX(-50%) translateY(-10px);}to{opacity:1;transform:translateX(-50%) translateY(0);}}'
            + '#pdf-editor-modal .hidden{display:none!important;}'
            + '#pdf-editor-modal .flex{display:flex!important;}'
            + '#pdf-page-input::-webkit-inner-spin-button,#pdf-page-input::-webkit-outer-spin-button{-webkit-appearance:none;margin:0;}';
        document.head.appendChild(style);
    }

    // ==================== 事件绑定 ====================
    function bindEvents() {
        var modal = document.getElementById('pdf-editor-modal');

        // 委托：所有 data-action 点击
        modal.addEventListener('click', function (e) {
            var btn = e.target.closest('[data-action]');
            if (!btn) return;
            var action = btn.getAttribute('data-action');
            switch (action) {
                case 'close': closePdfEditor(); break;
                case 'prev-page': changePage(-1); break;
                case 'next-page': changePage(1); break;
                case 'zoom-in': zoom(0.25); break;
                case 'zoom-out': zoom(-0.25); break;
                case 'zoom-fit': zoomFit(); break;
                case 'export': exportPdf(); break;
                case 'undo': undoAnnotation(); break;
                case 'clear': clearAnnotations(); break;
                case 'select-file': document.getElementById('pdf-file-input').click(); break;
                case 'font-inc': changeFontSize(2); break;
                case 'font-dec': changeFontSize(-2); break;
            }
        });

        // 工具选择
        modal.addEventListener('click', function (e) {
            var btn = e.target.closest('[data-tool]');
            if (!btn) return;
            selectTool(btn.getAttribute('data-tool'));
        });

        // 颜色选择
        modal.addEventListener('click', function (e) {
            var btn = e.target.closest('[data-color]');
            if (!btn) return;
            selectColor(btn.getAttribute('data-color'));
        });

        // 文件上传
        var fileInput = document.getElementById('pdf-file-input');
        fileInput.addEventListener('change', function (e) {
            if (e.target.files && e.target.files[0]) {
                handleFile(e.target.files[0]);
                e.target.value = ''; // 允许重复上传同一文件
            }
        });

        // 拖拽上传
        var dropArea = document.getElementById('pdf-drop-area');
        if (dropArea) {
            dropArea.addEventListener('click', function (e) {
                if (e.target.closest('[data-action="select-file"]')) return;
                document.getElementById('pdf-file-input').click();
            });
            ['dragenter', 'dragover'].forEach(function (evt) {
                dropArea.addEventListener(evt, function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    dropArea.classList.add('border-brand-400', 'bg-brand-50/30');
                });
            });
            ['dragleave', 'drop'].forEach(function (evt) {
                dropArea.addEventListener(evt, function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    dropArea.classList.remove('border-brand-400', 'bg-brand-50/30');
                });
            });
            dropArea.addEventListener('drop', function (e) {
                var file = e.dataTransfer.files[0];
                if (file) handleFile(file);
            });
        }

        // 页码输入
        var pageInput = document.getElementById('pdf-page-input');
        pageInput.addEventListener('change', function () {
            var p = parseInt(pageInput.value, 10);
            if (p >= 1 && p <= state.totalPages) {
                state.currentPage = p;
                renderPage();
            } else {
                pageInput.value = state.currentPage;
            }
        });

        // 画布交互（标注绘制）
        var overlay = document.getElementById('pdf-overlay');
        overlay.addEventListener('mousedown', onCanvasDown);
        overlay.addEventListener('mousemove', onCanvasMove);
        overlay.addEventListener('mouseup', onCanvasUp);
        overlay.addEventListener('mouseleave', onCanvasUp);

        // 触屏支持
        overlay.addEventListener('touchstart', onTouchStart, { passive: false });
        overlay.addEventListener('touchmove', onTouchMove, { passive: false });
        overlay.addEventListener('touchend', onCanvasUp);

        // 键盘快捷键
        document.addEventListener('keydown', onKeyDown);

        // SPA 导航时隐藏模态框
        window.addEventListener('spa:cleanup-forms', function () {
            var m = document.getElementById('pdf-editor-modal');
            if (m && !m.classList.contains('hidden')) {
                m.classList.add('hidden');
                document.body.style.overflow = '';
            }
        });
    }

    // ==================== 键盘快捷键 ====================
    function onKeyDown(e) {
        var modal = document.getElementById('pdf-editor-modal');
        if (!modal || modal.classList.contains('hidden')) return;

        // Esc 关闭
        if (e.key === 'Escape') {
            closePdfEditor();
            return;
        }

        // Ctrl+Z 撤销
        if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
            e.preventDefault();
            undoAnnotation();
            return;
        }

        // 翻页
        if (e.key === 'ArrowLeft') { changePage(-1); return; }
        if (e.key === 'ArrowRight') { changePage(1); return; }

        // 工具快捷键
        if (!e.ctrlKey && !e.metaKey) {
            var map = { 'v': 'select', 't': 'text', 'h': 'highlight', 'p': 'pen', 'r': 'rectangle', 'a': 'arrow' };
            if (map[e.key]) selectTool(map[e.key]);
        }
    }

    // ==================== 打开/关闭 ====================
    window.openPdfEditor = function () {
        ensureModal();
        var modal = document.getElementById('pdf-editor-modal');
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';

        // 初始化 PDF.js worker
        if (!initWorker()) {
            showToast('PDF.js 库未加载，请刷新页面重试', 'error');
        }
    };

    window.closePdfEditor = function () {
        var modal = document.getElementById('pdf-editor-modal');
        if (modal) modal.classList.add('hidden');
        document.body.style.overflow = '';
    };

    function initWorker() {
        if (typeof pdfjsLib === 'undefined') return false;
        if (pdfjsLib.GlobalWorkerOptions.workerSrc) return true;
        var base = window.ROOT_URL || (window.PAGE_BASE || '');
        pdfjsLib.GlobalWorkerOptions.workerSrc = base + 'assets/pdf.worker.min.js';
        return true;
    }

    // ==================== 文件处理 ====================
    function handleFile(file) {
        if (!file || file.type !== 'application/pdf') {
            showToast('请上传 PDF 格式文件', 'error');
            return;
        }
        if (file.size > 50 * 1024 * 1024) {
            showToast('文件大小不能超过 50MB', 'error');
            return;
        }

        state.fileName = file.name;
        document.getElementById('pdf-filename').textContent = file.name;

        var reader = new FileReader();
        reader.onload = function (e) {
            var bytes = new Uint8Array(e.target.result);
            // 保留一份副本（PDF.js 可能会 transfer 底层 buffer）
            state.originalBytes = bytes.slice();
            loadPdf(bytes);
        };
        reader.readAsArrayBuffer(file);
    }

    function loadPdf(bytes) {
        if (!initWorker()) {
            showToast('PDF.js 未加载', 'error');
            return;
        }

        showToast('正在加载 PDF...', 'info');

        var loadingTask = pdfjsLib.getDocument({ data: bytes });
        loadingTask.promise.then(function (doc) {
            state.pdfDoc = doc;
            state.totalPages = doc.numPages;
            state.currentPage = 1;
            state.annotations = [];
            showViewer();
            renderPage();
            updatePageInfo();
            showToast('PDF 加载成功，共 ' + doc.numPages + ' 页', 'success');
        }).catch(function (err) {
            console.error('[PDF Editor] 加载失败:', err);
            showToast('PDF 加载失败: ' + (err.message || '未知错误'), 'error');
        });
    }

    // ==================== 显示/隐藏 UI ====================
    function showViewer() {
        document.getElementById('pdf-upload-zone').classList.add('hidden');
        var viewer = document.getElementById('pdf-viewer');
        viewer.classList.remove('hidden');
        document.getElementById('pdf-tools').classList.remove('hidden');
        document.getElementById('pdf-tools').classList.add('flex');
        document.getElementById('pdf-nav').classList.remove('hidden');
        document.getElementById('pdf-nav').classList.add('flex');
        document.getElementById('pdf-zoom').classList.remove('hidden');
        document.getElementById('pdf-zoom').classList.add('flex');
        document.getElementById('pdf-export-btn').classList.remove('hidden');
        document.getElementById('pdf-status').classList.remove('hidden');
        document.getElementById('pdf-status').classList.add('flex');
    }

    function updatePageInfo() {
        document.getElementById('pdf-total-pages').textContent = state.totalPages;
        document.getElementById('pdf-page-input').value = state.currentPage;
        document.getElementById('pdf-zoom-level').textContent = Math.round(state.scale * 100 / 1.5 * 100) + '%';
        updateAnnCount();
    }

    function updateAnnCount() {
        var count = state.annotations.length;
        document.getElementById('pdf-ann-count').textContent = '标注: ' + count;
    }

    // ==================== 渲染 ====================
    function renderPage() {
        if (!state.pdfDoc) return;

        var canvas = document.getElementById('pdf-canvas');
        var overlay = document.getElementById('pdf-overlay');
        var ctx = canvas.getContext('2d');

        // 取消上一次渲染
        if (state.renderTask) {
            try { state.renderTask.cancel(); } catch (e) {}
        }

        state.pdfDoc.getPage(state.currentPage).then(function (page) {
            var viewport = page.getViewport({ scale: state.scale });
            state.pageViewport = viewport;

            canvas.width = viewport.width;
            canvas.height = viewport.height;
            canvas.style.width = viewport.width + 'px';
            canvas.style.height = viewport.height + 'px';

            overlay.width = viewport.width;
            overlay.height = viewport.height;
            overlay.style.width = viewport.width + 'px';
            overlay.style.height = viewport.height + 'px';

            state.renderTask = page.render({
                canvasContext: ctx,
                viewport: viewport
            });

            state.renderTask.promise.then(function () {
                drawAnnotations();
            }).catch(function (err) {
                if (err && err.name !== 'RenderingCancelledException') {
                    console.error('[PDF Editor] 渲染失败:', err);
                }
            });
        });
    }

    // ==================== 标注绘制 ====================
    function drawAnnotations() {
        var overlay = document.getElementById('pdf-overlay');
        var ctx = overlay.getContext('2d');
        ctx.clearRect(0, 0, overlay.width, overlay.height);

        var pageAnns = state.annotations.filter(function (a) {
            return a.page === state.currentPage;
        });

        pageAnns.forEach(function (ann) {
            drawSingleAnnotation(ctx, ann);
        });
    }

    function drawSingleAnnotation(ctx, ann) {
        ctx.save();
        switch (ann.type) {
            case 'text':
                ctx.fillStyle = ann.color;
                ctx.font = ann.fontSize + 'px "Inter", sans-serif';
                ctx.textBaseline = 'top';
                // 支持多行
                var lines = ann.text.split('\n');
                lines.forEach(function (line, i) {
                    ctx.fillText(line, ann.x, ann.y + i * ann.fontSize * 1.3);
                });
                break;

            case 'highlight':
                ctx.fillStyle = hexToRgba(ann.color, 0.35);
                ctx.fillRect(ann.x, ann.y, ann.w, ann.h);
                break;

            case 'rectangle':
                ctx.strokeStyle = ann.color;
                ctx.lineWidth = 2;
                ctx.strokeRect(ann.x, ann.y, ann.w, ann.h);
                break;

            case 'pen':
                if (ann.points && ann.points.length > 1) {
                    ctx.strokeStyle = ann.color;
                    ctx.lineWidth = ann.lineWidth || 2;
                    ctx.lineCap = 'round';
                    ctx.lineJoin = 'round';
                    ctx.beginPath();
                    ctx.moveTo(ann.points[0].x, ann.points[0].y);
                    for (var i = 1; i < ann.points.length; i++) {
                        ctx.lineTo(ann.points[i].x, ann.points[i].y);
                    }
                    ctx.stroke();
                }
                break;

            case 'arrow':
                ctx.strokeStyle = ann.color;
                ctx.fillStyle = ann.color;
                ctx.lineWidth = 2;
                ctx.lineCap = 'round';
                // 主线
                ctx.beginPath();
                ctx.moveTo(ann.x, ann.y);
                ctx.lineTo(ann.x + ann.w, ann.y + ann.h);
                ctx.stroke();
                // 箭头
                var angle = Math.atan2(ann.h, ann.w);
                var headLen = 12;
                ctx.beginPath();
                ctx.moveTo(ann.x + ann.w, ann.y + ann.h);
                ctx.lineTo(
                    ann.x + ann.w - headLen * Math.cos(angle - Math.PI / 6),
                    ann.y + ann.h - headLen * Math.sin(angle - Math.PI / 6)
                );
                ctx.lineTo(
                    ann.x + ann.w - headLen * Math.cos(angle + Math.PI / 6),
                    ann.y + ann.h - headLen * Math.sin(angle + Math.PI / 6)
                );
                ctx.closePath();
                ctx.fill();
                break;
        }
        ctx.restore();
    }

    // ==================== 画布交互 ====================
    function getCanvasPos(e) {
        var overlay = document.getElementById('pdf-overlay');
        var rect = overlay.getBoundingClientRect();
        var scaleX = overlay.width / rect.width;
        var scaleY = overlay.height / rect.height;
        var clientX = e.clientX !== undefined ? e.clientX : (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
        var clientY = e.clientY !== undefined ? e.clientY : (e.touches && e.touches[0] ? e.touches[0].clientY : 0);
        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY
        };
    }

    function onCanvasDown(e) {
        if (state.currentTool === 'select') return;
        e.preventDefault();

        var pos = getCanvasPos(e);

        if (state.currentTool === 'text') {
            showTextInput(pos.x, pos.y);
            return;
        }

        state.isDrawing = true;
        state.startPos = pos;

        if (state.currentTool === 'pen') {
            state.currentPath = { x: pos.x, y: pos.y };
        }
    }

    function onCanvasMove(e) {
        if (!state.isDrawing) return;
        e.preventDefault();

        var pos = getCanvasPos(e);

        // 实时预览
        drawAnnotations(); // 先重绘已有标注

        var ctx = document.getElementById('pdf-overlay').getContext('2d');
        ctx.save();

        switch (state.currentTool) {
            case 'highlight':
                ctx.fillStyle = hexToRgba(state.currentColor, 0.35);
                ctx.fillRect(state.startPos.x, state.startPos.y,
                    pos.x - state.startPos.x, pos.y - state.startPos.y);
                break;

            case 'rectangle':
                ctx.strokeStyle = state.currentColor;
                ctx.lineWidth = 2;
                ctx.strokeRect(state.startPos.x, state.startPos.y,
                    pos.x - state.startPos.x, pos.y - state.startPos.y);
                break;

            case 'arrow':
                ctx.strokeStyle = state.currentColor;
                ctx.fillStyle = state.currentColor;
                ctx.lineWidth = 2;
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.moveTo(state.startPos.x, state.startPos.y);
                ctx.lineTo(pos.x, pos.y);
                ctx.stroke();
                break;

            case 'pen':
                // 追加路径点
                if (state.currentPath) {
                    state.currentPath = pos; // 简化：只记最新点
                    // 实际用数组存储
                    if (!state._penPoints) state._penPoints = [];
                    state._penPoints.push(pos);
                }
                // 绘制完整路径
                if (state._penPoints && state._penPoints.length > 1) {
                    ctx.strokeStyle = state.currentColor;
                    ctx.lineWidth = 2;
                    ctx.lineCap = 'round';
                    ctx.lineJoin = 'round';
                    ctx.beginPath();
                    ctx.moveTo(state._penPoints[0].x, state._penPoints[0].y);
                    for (var i = 1; i < state._penPoints.length; i++) {
                        ctx.lineTo(state._penPoints[i].x, state._penPoints[i].y);
                    }
                    ctx.stroke();
                }
                break;
        }
        ctx.restore();
    }

    function onCanvasUp(e) {
        if (!state.isDrawing) return;
        state.isDrawing = false;

        var pos = null;
        if (e) {
            pos = getCanvasPos(e);
        }

        var ann = null;

        switch (state.currentTool) {
            case 'highlight':
                if (pos && state.startPos) {
                    var hw = pos.x - state.startPos.x;
                    var hh = pos.y - state.startPos.y;
                    if (Math.abs(hw) > 3 && Math.abs(hh) > 3) {
                        ann = {
                            type: 'highlight',
                            page: state.currentPage,
                            x: hw < 0 ? pos.x : state.startPos.x,
                            y: hh < 0 ? pos.y : state.startPos.y,
                            w: Math.abs(hw),
                            h: Math.abs(hh),
                            color: state.currentColor
                        };
                    }
                }
                break;

            case 'rectangle':
                if (pos && state.startPos) {
                    var rw = pos.x - state.startPos.x;
                    var rh = pos.y - state.startPos.y;
                    if (Math.abs(rw) > 3 && Math.abs(rh) > 3) {
                        ann = {
                            type: 'rectangle',
                            page: state.currentPage,
                            x: rw < 0 ? pos.x : state.startPos.x,
                            y: rh < 0 ? pos.y : state.startPos.y,
                            w: Math.abs(rw),
                            h: Math.abs(rh),
                            color: state.currentColor
                        };
                    }
                }
                break;

            case 'arrow':
                if (pos && state.startPos) {
                    var aw = pos.x - state.startPos.x;
                    var ah = pos.y - state.startPos.y;
                    if (Math.abs(aw) > 5 || Math.abs(ah) > 5) {
                        ann = {
                            type: 'arrow',
                            page: state.currentPage,
                            x: state.startPos.x,
                            y: state.startPos.y,
                            w: aw,
                            h: ah,
                            color: state.currentColor
                        };
                    }
                }
                break;

            case 'pen':
                if (state._penPoints && state._penPoints.length > 1) {
                    ann = {
                        type: 'pen',
                        page: state.currentPage,
                        points: state._penPoints.slice(),
                        color: state.currentColor,
                        lineWidth: 2
                    };
                }
                state._penPoints = null;
                break;
        }

        if (ann) {
            state.annotations.push(ann);
            updateAnnCount();
        }

        state.startPos = null;
        state.currentPath = null;
        drawAnnotations();
    }

    // 触屏事件适配
    function onTouchStart(e) {
        e.preventDefault();
        var touch = e.touches[0];
        onCanvasDown({ clientX: touch.clientX, clientY: touch.clientY, preventDefault: function(){} });
    }

    function onTouchMove(e) {
        e.preventDefault();
        var touch = e.touches[0];
        onCanvasMove({ clientX: touch.clientX, clientY: touch.clientY, preventDefault: function(){} });
    }

    // ==================== 文本输入 ====================
    function showTextInput(x, y) {
        var viewer = document.getElementById('pdf-viewer');
        var overlay = document.getElementById('pdf-overlay');

        // 计算在 viewer 容器中的位置
        var rect = overlay.getBoundingClientRect();
        var viewerRect = viewer.getBoundingClientRect();
        var scaleX = overlay.width / rect.width;
        var scaleY = overlay.height / rect.height;

        var input = document.createElement('input');
        input.type = 'text';
        input.className = 'pdf-text-input';
        input.style.left = (x / scaleX) + 'px';
        input.style.top = (y / scaleY) + 'px';
        input.style.color = state.currentColor;
        input.style.fontSize = (state.fontSize / scaleX) + 'px';
        input.placeholder = '输入文字...';

        viewer.appendChild(input);
        input.focus();

        var committed = false;

        function commit() {
            if (committed) return;
            committed = true;
            var text = input.value.trim();
            if (text) {
                state.annotations.push({
                    type: 'text',
                    page: state.currentPage,
                    x: x,
                    y: y,
                    text: text,
                    color: state.currentColor,
                    fontSize: state.fontSize
                });
                updateAnnCount();
                drawAnnotations();
            }
            input.remove();
        }

        input.addEventListener('blur', commit);
        input.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                input.blur();
            } else if (e.key === 'Escape') {
                committed = true;
                input.remove();
            }
        });
    }

    // ==================== 工具选择 ====================
    function selectTool(tool) {
        state.currentTool = tool;
        // 更新按钮高亮
        var buttons = document.querySelectorAll('#pdf-tools [data-tool]');
        buttons.forEach(function (btn) {
            btn.classList.toggle('active', btn.getAttribute('data-tool') === tool);
        });

        // 更新光标
        var overlay = document.getElementById('pdf-overlay');
        overlay.className = '';
        overlay.classList.add('tool-' + tool);

        // 更新状态栏
        document.getElementById('pdf-tool-info').textContent = '工具: ' + (TOOL_NAMES[tool] || tool);

        // 显示/隐藏字号控制
        var fontWrap = document.getElementById('pdf-fontsize-wrap');
        if (fontWrap) {
            fontWrap.classList.toggle('hidden', tool !== 'text');
            fontWrap.classList.toggle('flex', tool === 'text');
        }
    }

    function selectColor(color) {
        state.currentColor = color;
        var buttons = document.querySelectorAll('#pdf-tools [data-color]');
        buttons.forEach(function (btn) {
            btn.classList.toggle('active', btn.getAttribute('data-color') === color);
        });
    }

    function changeFontSize(delta) {
        state.fontSize = Math.max(8, Math.min(48, state.fontSize + delta));
        var el = document.getElementById('pdf-fontsize');
        if (el) el.textContent = state.fontSize;
    }

    // ==================== 翻页/缩放 ====================
    function changePage(delta) {
        var newPage = state.currentPage + delta;
        if (newPage < 1 || newPage > state.totalPages) return;
        state.currentPage = newPage;
        document.getElementById('pdf-page-input').value = newPage;
        renderPage();
    }

    function zoom(delta) {
        var newScale = state.scale + delta;
        if (newScale < 0.5 || newScale > 5) return;
        state.scale = newScale;
        document.getElementById('pdf-zoom-level').textContent = Math.round(newScale * 100 / 1.5 * 100) + '%';
        renderPage();
    }

    function zoomFit() {
        if (!state.pageViewport) return;
        var area = document.getElementById('pdf-canvas-area');
        var availWidth = area.clientWidth - 32; // padding
        var pageWidth = state.pageViewport.width / state.scale;
        state.scale = Math.max(0.5, Math.min(5, availWidth / pageWidth));
        document.getElementById('pdf-zoom-level').textContent = Math.round(state.scale * 100 / 1.5 * 100) + '%';
        renderPage();
    }

    // ==================== 撤销/清除 ====================
    function undoAnnotation() {
        if (state.annotations.length === 0) {
            showToast('没有可撤销的标注', 'info');
            return;
        }
        state.annotations.pop();
        updateAnnCount();
        drawAnnotations();
    }

    function clearAnnotations() {
        if (state.annotations.length === 0) return;
        if (!confirm('确定要清除所有标注吗？')) return;
        state.annotations = [];
        updateAnnCount();
        drawAnnotations();
        showToast('已清除所有标注', 'success');
    }

    // ==================== 导出 PDF ====================
    function exportPdf() {
        if (!state.originalBytes) {
            showToast('没有可导出的 PDF', 'error');
            return;
        }

        if (typeof PDFLib === 'undefined' || !PDFLib.PDFDocument) {
            showToast('pdf-lib 库未加载', 'error');
            return;
        }

        showToast('正在生成 PDF...', 'info');

        var PDFDocument = PDFLib.PDFDocument;
        var rgb = PDFLib.rgb;
        var StandardFonts = PDFLib.StandardFonts;
        var degrees = PDFLib.degrees;

        PDFDocument.load(state.originalBytes).then(function (doc) {
            var pages = doc.getPages();

            // 按页处理标注
            var annotationsByPage = {};
            state.annotations.forEach(function (ann) {
                if (!annotationsByPage[ann.page]) {
                    annotationsByPage[ann.page] = [];
                }
                annotationsByPage[ann.page].push(ann);
            });

            Object.keys(annotationsByPage).forEach(function (pageNum) {
                var idx = parseInt(pageNum, 10) - 1;
                if (idx < 0 || idx >= pages.length) return;

                var page = pages[idx];
                var pageWidth = page.getWidth();
                var pageHeight = page.getHeight();

                // 计算缩放比：PDF.js 的 scale 与 PDF 原始尺寸的关系
                // viewport.width = pageWidth * scale  →  scale = viewport.width / pageWidth
                var renderScale = state.scale;
                // PDF 原始尺寸 = 渲染尺寸 / scale
                // 标注坐标在渲染空间，需要除以 scale 得到 PDF 空间坐标
                // 注意：PDF y 轴向上，屏幕 y 轴向下

                annotationsByPage[pageNum].forEach(function (ann) {
                    var pdfX = ann.x / renderScale;
                    var pdfY = pageHeight - ann.y / renderScale; // 翻转 y 轴

                    switch (ann.type) {
                        case 'text':
                            var font = doc.embedFont(StandardFonts.Helvetica);
                            var textLines = ann.text.split('\n');
                            var fontSizePdf = ann.fontSize / renderScale;
                            textLines.forEach(function (line, i) {
                                page.drawText(line, {
                                    x: pdfX,
                                    y: pageHeight - (ann.y / renderScale) - fontSizePdf - i * fontSizePdf * 1.3,
                                    size: fontSizePdf,
                                    font: font,
                                    color: hexToRgbObj(ann.color)
                                });
                            });
                            break;

                        case 'highlight':
                            page.drawRectangle({
                                x: ann.x / renderScale,
                                y: pageHeight - (ann.y + ann.h) / renderScale,
                                width: ann.w / renderScale,
                                height: ann.h / renderScale,
                                color: hexToRgbObj(ann.color),
                                opacity: 0.35
                            });
                            break;

                        case 'rectangle':
                            page.drawRectangle({
                                x: ann.x / renderScale,
                                y: pageHeight - (ann.y + ann.h) / renderScale,
                                width: ann.w / renderScale,
                                height: ann.h / renderScale,
                                borderColor: hexToRgbObj(ann.color),
                                borderWidth: 2 / renderScale
                            });
                            break;

                        case 'arrow':
                            // 画线
                            page.drawLine({
                                start: { x: ann.x / renderScale, y: pageHeight - ann.y / renderScale },
                                end: { x: (ann.x + ann.w) / renderScale, y: pageHeight - (ann.y + ann.h) / renderScale },
                                thickness: 2 / renderScale,
                                color: hexToRgbObj(ann.color)
                            });
                            // 画箭头（用两条短线模拟）
                            var angle = Math.atan2(ann.h, ann.w);
                            var headLen = 12 / renderScale;
                            page.drawLine({
                                start: { x: (ann.x + ann.w) / renderScale, y: pageHeight - (ann.y + ann.h) / renderScale },
                                end: {
                                    x: (ann.x + ann.w) / renderScale - headLen * Math.cos(angle - Math.PI / 6),
                                    y: pageHeight - (ann.y + ann.h) / renderScale + headLen * Math.sin(angle - Math.PI / 6)
                                },
                                thickness: 2 / renderScale,
                                color: hexToRgbObj(ann.color)
                            });
                            page.drawLine({
                                start: { x: (ann.x + ann.w) / renderScale, y: pageHeight - (ann.y + ann.h) / renderScale },
                                end: {
                                    x: (ann.x + ann.w) / renderScale - headLen * Math.cos(angle + Math.PI / 6),
                                    y: pageHeight - (ann.y + ann.h) / renderScale + headLen * Math.sin(angle + Math.PI / 6)
                                },
                                thickness: 2 / renderScale,
                                color: hexToRgbObj(ann.color)
                            });
                            break;

                        case 'pen':
                            if (ann.points && ann.points.length > 1) {
                                for (var i = 1; i < ann.points.length; i++) {
                                    page.drawLine({
                                        start: {
                                            x: ann.points[i - 1].x / renderScale,
                                            y: pageHeight - ann.points[i - 1].y / renderScale
                                        },
                                        end: {
                                            x: ann.points[i].x / renderScale,
                                            y: pageHeight - ann.points[i].y / renderScale
                                        },
                                        thickness: (ann.lineWidth || 2) / renderScale,
                                        color: hexToRgbObj(ann.color)
                                    });
                                }
                            }
                            break;
                    }
                });
            });

            return doc.save();

        }).then(function (pdfBytes) {
            // 下载
            var blob = new Blob([pdfBytes], { type: 'application/pdf' });
            var url = URL.createObjectURL(blob);
            var a = document.createElement('a');
            a.href = url;
            var name = state.fileName.replace(/\.pdf$/i, '');
            a.download = name + '_edited.pdf';
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
            showToast('PDF 已导出下载', 'success');
        }).catch(function (err) {
            console.error('[PDF Editor] 导出失败:', err);
            showToast('导出失败: ' + (err.message || '未知错误'), 'error');
        });
    }

    // ==================== 工具函数 ====================
    function hexToRgba(hex, alpha) {
        var r = parseInt(hex.slice(1, 3), 16);
        var g = parseInt(hex.slice(3, 5), 16);
        var b = parseInt(hex.slice(5, 7), 16);
        return 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')';
    }

    function hexToRgbObj(hex) {
        return {
            r: parseInt(hex.slice(1, 3), 16) / 255,
            g: parseInt(hex.slice(3, 5), 16) / 255,
            b: parseInt(hex.slice(5, 7), 16) / 255
        };
    }

    function showToast(msg, type) {
        // 移除已有 toast
        var existing = document.querySelector('.pdf-toast');
        if (existing) existing.remove();

        var toast = document.createElement('div');
        toast.className = 'pdf-toast ' + (type || 'info');
        toast.textContent = msg;
        document.body.appendChild(toast);

        setTimeout(function () {
            toast.style.transition = 'opacity 0.3s';
            toast.style.opacity = '0';
            setTimeout(function () { toast.remove(); }, 300);
        }, 2500);
    }

})();
