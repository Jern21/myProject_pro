/**
 * 文的项目工作台 - 后端服务器入口
 *
 * 功能：
 *   1. 提供 RESTful API（/api/*）
 *   2. 托管前端静态文件（/）
 *   3. 支持 CORS 跨域
 *   4. 统一 JSON body 解析
 *
 * 启动：
 *   cd backend && npm install && npm start
 *   默认端口：3456
 *   访问：http://localhost:3456
 */
'use strict';

var express = require('express');
var cors = require('cors');
var path = require('path');
var fs = require('fs');

var app = express();
var PORT = process.env.PORT || 3456;

// ========== 中间件 ==========

// CORS 跨域
app.use(cors());

// JSON body 解析（文件上传走 multipart/form-data，JSON 仅存 URL 引用）
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// 请求日志
app.use(function (req, res, next) {
    var ts = new Date().toISOString();
    console.log('[' + ts + '] ' + req.method + ' ' + req.url);
    next();
});

// ========== API 路由 ==========

app.use('/api/orders', require('./src/routes/orders'));
app.use('/api/customers', require('./src/routes/customers'));
app.use('/api/quotes', require('./src/routes/quotes'));
app.use('/api/posters', require('./src/routes/posters'));
app.use('/api/projects', require('./src/routes/projects'));
app.use('/api/platform-posts', require('./src/routes/platform-posts'));
app.use('/api/memos', require('./src/routes/memos'));
app.use('/api/reminders', require('./src/routes/reminders'));
app.use('/api/resume', require('./src/routes/resume'));
app.use('/api/upload', require('./src/routes/upload'));
app.use('/api/settings', require('./src/routes/settings'));
app.use('/api/stats', require('./src/routes/stats'));
app.use('/api/image-gen', require('./src/routes/image-gen'));

// API 健康检查
app.get('/api/health', function (req, res) {
    res.json({
        success: true,
        data: {
            status: 'ok',
            service: 'wen-workbench-backend',
            version: '1.0.0',
            uptime: process.uptime(),
            timestamp: new Date().toISOString()
        }
    });
});

// ========== 静态文件托管 ==========

var frontendDir = path.join(__dirname, '..', 'frontend');

// 托管 frontend 下的静态资源
app.use(express.static(frontendDir));

// 托管上传的文件（图片、PDF 等）
var uploadsDir = path.join(__dirname, 'data', 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// SPA 路由回退：所有非 /api 的 GET 请求都返回对应 HTML 文件
// 支持 pages/business/、pages/platform/ 等子目录路径
app.get('*', function (req, res, next) {
    // 跳过 API 请求
    if (req.url.startsWith('/api/')) {
        return next();
    }

    // 尝试匹配实际文件
    var filePath = path.join(frontendDir, req.path);

    // 如果路径以 / 结尾，尝试 index.html
    if (req.path.endsWith('/')) {
        filePath = path.join(filePath, 'index.html');
    }

    // 如果文件存在，直接发送
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        return res.sendFile(filePath);
    }

    // 尝试加 .html 后缀
    if (fs.existsSync(filePath + '.html')) {
        return res.sendFile(filePath + '.html');
    }

    // 回退到首页
    return res.sendFile(path.join(frontendDir, 'index.html'));
});

// ========== 全局错误处理 ==========

app.use(function (err, req, res, next) {
    console.error('[Server Error]', err);
    res.status(500).json({
        success: false,
        error: err.message || '服务器内部错误'
    });
});

// ========== 启动服务器 ==========

app.listen(PORT, function () {
    console.log('');
    console.log('========================================');
    console.log('  文的项目工作台 - 后端服务已启动');
    console.log('========================================');
    console.log('  前端地址: http://localhost:' + PORT);
    console.log('  API 地址: http://localhost:' + PORT + '/api');
    console.log('  健康检查: http://localhost:' + PORT + '/api/health');
    console.log('========================================');
    console.log('');
});
