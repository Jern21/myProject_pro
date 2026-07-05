/**
 * pdf-importer.js —— PDF 简历导入器
 *
 * 功能：
 *   - 上传 PDF 简历文件
 *   - 提取 PDF 中的文字内容
 *   - 智能解析简历结构（姓名、职位、联系方式、简介、技能、项目经验、教育背景）
 *   - 将提取的内容填充到简历预览区域
 *
 * 基于 PDF.js 的文字提取功能
 */
(function () {
    'use strict';

    // ==================== 初始化 PDF.js Worker ====================
    function initWorker() {
        if (typeof pdfjsLib === 'undefined') return false;
        if (pdfjsLib.GlobalWorkerOptions.workerSrc) return true;
        var base = window.ROOT_URL || (window.PAGE_BASE || '');
        pdfjsLib.GlobalWorkerOptions.workerSrc = base + 'assets/pdf.worker.min.js';
        return true;
    }

    // ==================== 打开导入器 ====================
    window.openPdfImporter = function () {
        if (!initWorker()) {
            showToast('PDF.js 库未加载，请刷新页面重试', 'error');
            return;
        }
        ensureModal();
        var modal = document.getElementById('pdf-importer-modal');
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    };

    window.closePdfImporter = function () {
        var modal = document.getElementById('pdf-importer-modal');
        if (modal) modal.classList.add('hidden');
        document.body.style.overflow = '';
    };

    // ==================== 创建模态框 ====================
    var modalCreated = false;

    function ensureModal() {
        if (modalCreated) return;
        modalCreated = true;
        createModal();
        bindEvents();
    }

    function createModal() {
        var html = ''
            + '<div id="pdf-importer-modal" class="fixed inset-0 z-[9999] hidden">'
            + '  <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" data-action="close"></div>'
            + '  <div class="absolute inset-4 md:inset-8 lg:inset-12 bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden">'

            // ---- 顶部工具栏 ----
            + '    <div class="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-gray-50/80 flex-shrink-0">'
            + '      <div class="flex items-center gap-3">'
            + '        <div class="w-9 h-9 rounded-lg bg-brand-100 flex items-center justify-center">'
            + '          <i class="ph-fill ph-file-pdf text-brand-600 text-lg"></i>'
            + '        </div>'
            + '        <div>'
            + '          <h3 class="font-bold text-gray-800 text-sm">PDF 简历导入</h3>'
            + '          <p class="text-[11px] text-gray-400">上传 PDF 自动提取并填充简历内容</p>'
            + '        </div>'
            + '      </div>'
            + '      <button data-action="close" class="w-8 h-8 rounded-lg hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors">'
            + '        <i class="ph ph-x text-lg"></i>'
            + '      </button>'
            + '    </div>'

            // ---- 主内容区 ----
            + '    <div class="flex-1 overflow-auto p-6">'
            + '      <div class="max-w-2xl mx-auto">'

            // 上传区域
            + '        <div id="pdf-import-upload" class="border-2 border-dashed border-gray-300 rounded-xl p-10 text-center hover:border-brand-400 hover:bg-brand-50/30 transition-all cursor-pointer">'
            + '          <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-brand-50 flex items-center justify-center">'
            + '            <i class="ph-fill ph-upload-simple text-3xl text-brand-500"></i>'
            + '          </div>'
            + '          <h4 class="text-base font-bold text-gray-700 mb-1">上传 PDF 简历</h4>'
            + '          <p class="text-xs text-gray-400 mb-4">点击选择文件或拖拽 PDF 到此处</p>'
            + '          <button data-action="select-file" class="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-sm font-medium transition-colors">选择文件</button>'
            + '          <p class="text-[10px] text-gray-300 mt-4">支持 PDF 格式 · 自动提取文字内容</p>'
            + '        </div>'

            // 提取中状态
            + '        <div id="pdf-import-loading" class="hidden text-center py-12">'
            + '          <div class="w-12 h-12 mx-auto mb-4 rounded-full border-3 border-brand-200 border-t-brand-500 animate-spin"></div>'
            + '          <p class="text-sm text-gray-600">正在提取 PDF 内容...</p>'
            + '          <p id="pdf-import-progress" class="text-xs text-gray-400 mt-1">读取第 1 页</p>'
            + '        </div>'

            // 预览与确认区域
            + '        <div id="pdf-import-preview" class="hidden">'
            + '          <div class="flex items-center justify-between mb-4">'
            + '            <h4 class="font-bold text-gray-800 text-sm flex items-center gap-2">'
            + '              <i class="ph-fill ph-check-circle text-green-500"></i> 提取完成'
            + '            </h4>'
            + '            <button data-action="reupload" class="text-xs text-brand-600 hover:underline">重新上传</button>'
            + '          </div>'

            // 解析结果预览
            + '          <div class="space-y-4">'

            // 基本信息
            + '            <div class="bg-gray-50 rounded-lg p-4">'
            + '              <h5 class="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">基本信息</h5>'
            + '              <div class="grid grid-cols-2 gap-3">'
            + '                <div>'
            + '                  <label class="text-[10px] text-gray-400 block mb-1">姓名</label>'
            + '                  <input type="text" id="import-name" class="w-full px-2 py-1.5 text-sm border border-gray-200 rounded bg-white focus:border-brand-500 outline-none" placeholder="未识别">'
            + '                </div>'
            + '                <div>'
            + '                  <label class="text-[10px] text-gray-400 block mb-1">职位</label>'
            + '                  <input type="text" id="import-title" class="w-full px-2 py-1.5 text-sm border border-gray-200 rounded bg-white focus:border-brand-500 outline-none" placeholder="未识别">'
            + '                </div>'
            + '                <div>'
            + '                  <label class="text-[10px] text-gray-400 block mb-1">电话</label>'
            + '                  <input type="text" id="import-phone" class="w-full px-2 py-1.5 text-sm border border-gray-200 rounded bg-white focus:border-brand-500 outline-none" placeholder="未识别">'
            + '                </div>'
            + '                <div>'
            + '                  <label class="text-[10px] text-gray-400 block mb-1">邮箱</label>'
            + '                  <input type="text" id="import-email" class="w-full px-2 py-1.5 text-sm border border-gray-200 rounded bg-white focus:border-brand-500 outline-none" placeholder="未识别">'
            + '                </div>'
            + '                <div class="col-span-2">'
            + '                  <label class="text-[10px] text-gray-400 block mb-1">地点 / GitHub</label>'
            + '                  <input type="text" id="import-location" class="w-full px-2 py-1.5 text-sm border border-gray-200 rounded bg-white focus:border-brand-500 outline-none" placeholder="未识别">'
            + '                </div>'
            + '              </div>'
            + '            </div>'

            // 个人简介
            + '            <div class="bg-gray-50 rounded-lg p-4">'
            + '              <h5 class="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">个人简介</h5>'
            + '              <textarea id="import-summary" rows="3" class="w-full px-3 py-2 text-xs border border-gray-200 rounded bg-white focus:border-brand-500 outline-none resize-none" placeholder="未识别"></textarea>'
            + '            </div>'

            // 技能栈
            + '            <div class="bg-gray-50 rounded-lg p-4">'
            + '              <h5 class="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">技能栈</h5>'
            + '              <input type="text" id="import-skills" class="w-full px-3 py-2 text-xs border border-gray-200 rounded bg-white focus:border-brand-500 outline-none" placeholder="用逗号分隔，如: Vue3, React, TypeScript">'
            + '              <p class="text-[10px] text-gray-400 mt-1">多个技能用逗号分隔</p>'
            + '            </div>'

            // 项目经验
            + '            <div class="bg-gray-50 rounded-lg p-4">'
            + '              <h5 class="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">项目经验</h5>'
            + '              <textarea id="import-projects" rows="6" class="w-full px-3 py-2 text-xs border border-gray-200 rounded bg-white focus:border-brand-500 outline-none resize-none font-mono" placeholder="未识别"></textarea>'
            + '              <p class="text-[10px] text-gray-400 mt-1">格式: 项目名称 | 时间 | 技术栈 | 描述</p>'
            + '            </div>'

            // 教育背景
            + '            <div class="bg-gray-50 rounded-lg p-4">'
            + '              <h5 class="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">教育背景</h5>'
            + '              <div class="grid grid-cols-3 gap-3">'
            + '                <div class="col-span-2">'
            + '                  <input type="text" id="import-edu-school" class="w-full px-2 py-1.5 text-xs border border-gray-200 rounded bg-white focus:border-brand-500 outline-none" placeholder="学校">'
            + '                </div>'
            + '                <div>'
            + '                  <input type="text" id="import-edu-year" class="w-full px-2 py-1.5 text-xs border border-gray-200 rounded bg-white focus:border-brand-500 outline-none" placeholder="年份">'
            + '                </div>'
            + '                <div class="col-span-3">'
            + '                  <input type="text" id="import-edu-major" class="w-full px-2 py-1.5 text-xs border border-gray-200 rounded bg-white focus:border-brand-500 outline-none" placeholder="专业 · 学历">'
            + '                </div>'
            + '              </div>'
            + '            </div>'

            // 确认按钮
            + '            <div class="flex gap-3 pt-2">'
            + '              <button data-action="apply" class="flex-1 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center justify-center gap-2">'
            + '                <i class="ph-fill ph-check"></i> 应用到简历'
            + '              </button>'
            + '              <button data-action="close" class="px-4 py-2.5 border border-gray-200 text-gray-600 bg-white hover:bg-gray-50 rounded-lg text-sm font-medium transition-colors">'
            + '                取消'
            + '              </button>'
            + '            </div>'

            + '          </div>'
            + '        </div>'

            + '      </div>'
            + '    </div>'
            + '  </div>'
            + '</div>'
            + '<input type="file" id="pdf-import-file-input" accept="application/pdf" class="hidden" />';

        var container = document.createElement('div');
        container.innerHTML = html;
        while (container.firstChild) {
            document.body.appendChild(container.firstChild);
        }
    }

    // ==================== 事件绑定 ====================
    function bindEvents() {
        var modal = document.getElementById('pdf-importer-modal');

        // 点击关闭
        modal.addEventListener('click', function (e) {
            var btn = e.target.closest('[data-action]');
            if (!btn) return;
            var action = btn.getAttribute('data-action');
            switch (action) {
                case 'close': closePdfImporter(); break;
                case 'select-file': document.getElementById('pdf-import-file-input').click(); break;
                case 'reupload': showUploadZone(); break;
                case 'apply': applyToResume(); break;
            }
        });

        // 文件上传
        var fileInput = document.getElementById('pdf-import-file-input');
        fileInput.addEventListener('change', function (e) {
            if (e.target.files && e.target.files[0]) {
                handleFile(e.target.files[0]);
                e.target.value = '';
            }
        });

        // 拖拽上传
        var uploadZone = document.getElementById('pdf-import-upload');
        if (uploadZone) {
            ['dragenter', 'dragover'].forEach(function (evt) {
                uploadZone.addEventListener(evt, function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    uploadZone.classList.add('border-brand-400', 'bg-brand-50/30');
                });
            });
            ['dragleave', 'drop'].forEach(function (evt) {
                uploadZone.addEventListener(evt, function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    uploadZone.classList.remove('border-brand-400', 'bg-brand-50/30');
                });
            });
            uploadZone.addEventListener('drop', function (e) {
                var file = e.dataTransfer.files[0];
                if (file) handleFile(file);
            });
            uploadZone.addEventListener('click', function (e) {
                if (e.target.closest('[data-action]')) return;
                document.getElementById('pdf-import-file-input').click();
            });
        }

        // ESC 关闭
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') closePdfImporter();
        });

        // SPA 清理
        window.addEventListener('spa:cleanup-forms', function () {
            var m = document.getElementById('pdf-importer-modal');
            if (m && !m.classList.contains('hidden')) {
                m.classList.add('hidden');
                document.body.style.overflow = '';
            }
        });
    }

    // ==================== 文件处理 ====================
    function handleFile(file) {
        if (!file || file.type !== 'application/pdf') {
            showToast('请上传 PDF 格式文件', 'error');
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            showToast('文件大小不能超过 10MB', 'error');
            return;
        }

        showLoading();

        var reader = new FileReader();
        reader.onload = function (e) {
            var bytes = new Uint8Array(e.target.result);
            extractTextFromPdf(bytes);
        };
        reader.readAsArrayBuffer(file);
    }

    // ==================== PDF 文字提取 ====================
    function extractTextFromPdf(bytes) {
        if (!initWorker()) {
            showToast('PDF.js 未加载', 'error');
            showUploadZone();
            return;
        }

        var loadingTask = pdfjsLib.getDocument({ data: bytes });
        loadingTask.promise.then(function (pdf) {
            var numPages = pdf.numPages;
            var allText = [];

            // 逐页提取文字
            function extractPage(pageNum) {
                document.getElementById('pdf-import-progress').textContent = '读取第 ' + pageNum + ' / ' + numPages + ' 页';

                return pdf.getPage(pageNum).then(function (page) {
                    return page.getTextContent();
                }).then(function (textContent) {
                    var pageText = textContent.items.map(function (item) {
                        return item.str;
                    }).join(' ');
                    allText.push(pageText);

                    if (pageNum < numPages) {
                        return extractPage(pageNum + 1);
                    } else {
                        return allText.join('\n');
                    }
                });
            }

            return extractPage(1);

        }).then(function (fullText) {
            console.log('[PDF Importer] 提取的原始文字:', fullText.substring(0, 500) + '...');
            var parsed = parseResumeText(fullText);
            fillPreviewForm(parsed);
            showPreview();
            showToast('PDF 内容提取成功', 'success');
        }).catch(function (err) {
            console.error('[PDF Importer] 提取失败:', err);
            showToast('PDF 提取失败: ' + (err.message || '未知错误'), 'error');
            showUploadZone();
        });
    }

    // ==================== 智能解析简历文字 ====================
    function parseResumeText(text) {
        var result = {
            name: '',
            title: '',
            phone: '',
            email: '',
            location: '',
            github: '',
            summary: '',
            skills: [],
            projects: [],
            education: { school: '', major: '', year: '' }
        };

        // 清理文字
        var cleanText = text.replace(/\s+/g, ' ').trim();
        var lines = text.split(/[\n\r]+/).map(function (l) { return l.trim(); }).filter(function (l) { return l; });

        // 提取手机号
        var phoneMatch = cleanText.match(/1[3-9]\d{9}|1[3-9]\d{1}[\s\-]?\d{4}[\s\-]?\d{4}/);
        if (phoneMatch) result.phone = phoneMatch[0].replace(/\s|-/g, '');

        // 提取邮箱
        var emailMatch = cleanText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
        if (emailMatch) result.email = emailMatch[0];

        // 提取 GitHub
        var githubMatch = cleanText.match(/github\.com\/[a-zA-Z0-9_-]+/i);
        if (githubMatch) result.github = githubMatch[0];

        // 提取姓名（通常在开头，2-4个汉字或英文名字）
        // 尝试匹配 "姓名 · 职位" 或 "姓名 | 职位" 格式
        var nameTitleMatch = cleanText.match(/^([\u4e00-\u9fa5]{2,4}|[A-Za-z\s]{2,20})\s*[·|]\s*(.+?)(?:\n|$)/);
        if (nameTitleMatch) {
            result.name = nameTitleMatch[1].trim();
            result.title = nameTitleMatch[2].trim();
        } else {
            // 尝试单独匹配姓名
            var nameMatch = cleanText.match(/^([\u4e00-\u9fa5]{2,4})/);
            if (nameMatch) result.name = nameMatch[1];
        }

        // 提取地点（常见城市名）
        var cities = ['北京', '上海', '广州', '深圳', '杭州', '成都', '武汉', '西安', '南京', '重庆', '长沙', '厦门'];
        for (var i = 0; i < cities.length; i++) {
            if (cleanText.indexOf(cities[i]) !== -1) {
                result.location = cities[i];
                break;
            }
        }

        // 提取个人简介（在"个人简介"、"自我介绍"等标题后的段落）
        var summaryPatterns = [/个人简介[：:]?\s*(.+?)(?=技能|项目|教育|经验|$)/i,
                               /自我介绍[：:]?\s*(.+?)(?=技能|项目|教育|经验|$)/i,
                               /个人总结[：:]?\s*(.+?)(?=技能|项目|教育|经验|$)/i];
        for (var j = 0; j < summaryPatterns.length; j++) {
            var summaryMatch = cleanText.match(summaryPatterns[j]);
            if (summaryMatch) {
                result.summary = summaryMatch[1].trim().substring(0, 300);
                break;
            }
        }

        // 提取技能栈
        var skillPatterns = [/技能[栈能]?[：:]?\s*(.+?)(?=项目|经验|教育|工作|$)/i,
                             /技术栈[：:]?\s*(.+?)(?=项目|经验|教育|工作|$)/i,
                             /专业技能[：:]?\s*(.+?)(?=项目|经验|教育|工作|$)/i];
        for (var k = 0; k < skillPatterns.length; k++) {
            var skillMatch = cleanText.match(skillPatterns[k]);
            if (skillMatch) {
                var skillText = skillMatch[1];
                // 提取技术关键词
                var techKeywords = ['Vue', 'React', 'Angular', 'JavaScript', 'TypeScript', 'Node.js', 'Python',
                    'Java', 'Spring', 'Go', 'PHP', 'MySQL', 'PostgreSQL', 'MongoDB', 'Redis',
                    'Docker', 'Kubernetes', 'Linux', 'AWS', '阿里云', 'Git', 'Webpack',
                    'Vite', 'Nginx', 'Elasticsearch', 'RabbitMQ', 'Kafka', 'HTML', 'CSS'];
                var foundSkills = [];
                for (var t = 0; t < techKeywords.length; t++) {
                    if (skillText.toLowerCase().indexOf(techKeywords[t].toLowerCase()) !== -1) {
                        foundSkills.push(techKeywords[t]);
                    }
                }
                if (foundSkills.length > 0) {
                    result.skills = foundSkills;
                } else {
                    // 如果没有匹配到关键词，使用整段文字
                    result.skills = skillText.split(/[,，、\s]+/).filter(function (s) { return s.length > 1; }).slice(0, 10);
                }
                break;
            }
        }

        // 提取项目经验（简化处理：找"项目"相关段落）
        var projectStart = cleanText.search(/项目经验|项目经历|Projects/i);
        if (projectStart !== -1) {
            var projectText = cleanText.substring(projectStart, projectStart + 2000);
            result.projects = projectText;
        }

        // 提取教育背景
        var eduMatch = cleanText.match(/(大学|学院|学校)[：:]?\s*([\u4e00-\u9fa5]+(?:大学|学院))/);
        if (eduMatch) result.education.school = eduMatch[2];

        var majorMatch = cleanText.match(/(计算机|软件|信息|电子|通信|自动化|数学|物理|机械|土木|建筑|金融|经济|管理|市场|人力资源)[\u4e00-\u9fa5]*\s*[·\.]\s*(本科|硕士|博士|大专)/);
        if (majorMatch) {
            result.education.major = majorMatch[0];
        }

        var yearMatch = cleanText.match(/(20\d{2})\s*[-–—]\s*(20\d{2}|至今)/);
        if (yearMatch) {
            result.education.year = yearMatch[0];
        }

        return result;
    }

    // ==================== 填充预览表单 ====================
    function fillPreviewForm(data) {
        document.getElementById('import-name').value = data.name;
        document.getElementById('import-title').value = data.title;
        document.getElementById('import-phone').value = data.phone;
        document.getElementById('import-email').value = data.email;
        document.getElementById('import-location').value = data.location + (data.github ? ' · ' + data.github : '');
        document.getElementById('import-summary').value = data.summary;
        document.getElementById('import-skills').value = data.skills.join(', ');
        document.getElementById('import-projects').value = data.projects;
        document.getElementById('import-edu-school').value = data.education.school;
        document.getElementById('import-edu-major').value = data.education.major;
        document.getElementById('import-edu-year').value = data.education.year;
    }

    // ==================== 应用到简历主图 ====================
    function applyToResume() {
        // 获取表单值
        var name = document.getElementById('import-name').value || '姓名';
        var title = document.getElementById('import-title').value || '职位';
        var phone = document.getElementById('import-phone').value || '';
        var email = document.getElementById('import-email').value || '';
        var location = document.getElementById('import-location').value || '';
        var summary = document.getElementById('import-summary').value || '';
        var skillsText = document.getElementById('import-skills').value || '';
        var projectsText = document.getElementById('import-projects').value || '';
        var eduSchool = document.getElementById('import-edu-school').value || '';
        var eduMajor = document.getElementById('import-edu-major').value || '';
        var eduYear = document.getElementById('import-edu-year').value || '';

        // 更新简历主图 - 使用更精确的选择器
        var resumeContainer = document.querySelector('#page-view .max-w-\[620px\]') ||
                              document.querySelector('.bg-white.rounded-xl.shadow-soft.border.border-gray-100.p-8');

        if (!resumeContainer) {
            showToast('未找到简历预览区域', 'error');
            return;
        }

        // 更新姓名和职位
        var nameEl = resumeContainer.querySelector('h1');
        if (nameEl) {
            nameEl.textContent = name + (title ? ' · ' + title : '');
        }

        // 更新联系方式
        var contactItems = resumeContainer.querySelectorAll('.flex.items-center.gap-3.text-xs.text-gray-500.mt-1 > span');
        if (contactItems.length >= 4) {
            contactItems[0].innerHTML = '<i class="ph ph-phone"></i> ' + (phone || '138****5678');
            contactItems[1].innerHTML = '<i class="ph ph-envelope-simple"></i> ' + (email || 'jern@email.com');
            if (location) {
                contactItems[2].innerHTML = '<i class="ph ph-map-pin"></i> ' + location.split('·')[0].trim();
            }
        }

        // 更新个人简介
        var summaryEl = resumeContainer.querySelector('.mb-6 p.text-xs');
        if (summaryEl && summary) {
            summaryEl.textContent = summary;
        }

        // 更新技能栈
        if (skillsText) {
            var skillsContainer = resumeContainer.querySelector('.flex.flex-wrap.gap-2');
            if (skillsContainer) {
                var skills = skillsText.split(/[,，、\s]+/).filter(function (s) { return s.trim(); });
                var colors = ['blue', 'green', 'orange', 'purple', 'cyan'];
                skillsContainer.innerHTML = skills.map(function (skill, idx) {
                    var color = colors[idx % colors.length];
                    return '<span class="px-2 py-1 bg-' + color + '-50 text-' + color + '-600 text-xs rounded font-medium">' + skill + '</span>';
                }).join('');
            }
        }

        // 更新教育背景
        var eduContainer = resumeContainer.querySelector('.flex.items-center.justify-between.text-xs');
        if (eduContainer) {
            var eduLeft = eduContainer.querySelector('div');
            if (eduLeft) {
                var schoolSpan = eduLeft.querySelector('span:first-child');
                var majorSpan = eduLeft.querySelector('span:last-child');
                if (schoolSpan && eduSchool) schoolSpan.textContent = eduSchool;
                if (majorSpan && eduMajor) majorSpan.textContent = eduMajor;
            }
            var yearSpan = eduContainer.querySelector('span.text-gray-400');
            if (yearSpan && eduYear) yearSpan.textContent = eduYear;
        }

        // 关闭模态框
        closePdfImporter();
        showToast('简历内容已更新', 'success');

        // 重置到上传状态
        setTimeout(showUploadZone, 300);
    }

    // ==================== UI 状态切换 ====================
    function showUploadZone() {
        document.getElementById('pdf-import-upload').classList.remove('hidden');
        document.getElementById('pdf-import-loading').classList.add('hidden');
        document.getElementById('pdf-import-preview').classList.add('hidden');
    }

    function showLoading() {
        document.getElementById('pdf-import-upload').classList.add('hidden');
        document.getElementById('pdf-import-loading').classList.remove('hidden');
        document.getElementById('pdf-import-preview').classList.add('hidden');
    }

    function showPreview() {
        document.getElementById('pdf-import-upload').classList.add('hidden');
        document.getElementById('pdf-import-loading').classList.add('hidden');
        document.getElementById('pdf-import-preview').classList.remove('hidden');
    }

    // ==================== 工具函数 ====================
    function showToast(msg, type) {
        var existing = document.querySelector('.pdf-import-toast');
        if (existing) existing.remove();

        var toast = document.createElement('div');
        toast.className = 'pdf-import-toast fixed top-5 left-1/2 -translate-x-1/2 px-5 py-2.5 rounded-lg text-sm text-white z-[99999] animate-fade-in';
        toast.style.backgroundColor = type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6';
        toast.textContent = msg;
        document.body.appendChild(toast);

        setTimeout(function () {
            toast.style.opacity = '0';
            toast.style.transition = 'opacity 0.3s';
            setTimeout(function () { toast.remove(); }, 300);
        }, 2500);
    }

})();
