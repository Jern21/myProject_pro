/**
 * 文件上传路由
 *
 * 使用 multer 处理 multipart/form-data 文件上传
 * 支持图片（JPG/PNG/GIF/WebP）和文档（PDF）和视频（MP4）
 *
 * API：
 *   POST   /api/upload           - 单文件上传
 *   POST   /api/upload/multiple  - 多文件上传（最多10个）
 *   DELETE /api/upload/:filename - 删除文件
 */
'use strict';

var express = require('express');
var router = express.Router();
var multer = require('multer');
var path = require('path');
var fs = require('fs');
var resp = require('../utils/response');

var UPLOAD_DIR = path.join(__dirname, '..', '..', 'data', 'uploads');

// 确保上传目录存在
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// ========== Multer 配置 ==========

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, UPLOAD_DIR);
    },
    filename: function (req, file, cb) {
        var ext = path.extname(file.originalname).toLowerCase();
        var name = Date.now() + '-' + Math.random().toString(36).slice(2, 8) + ext;
        cb(null, name);
    }
});

var allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf', '.doc', '.docx', '.txt', '.md', '.mp4', '.mov'];

var upload = multer({
    storage: storage,
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB
    },
    fileFilter: function (req, file, cb) {
        var ext = path.extname(file.originalname).toLowerCase();
        if (allowedExtensions.indexOf(ext) !== -1) {
            cb(null, true);
        } else {
            cb(new Error('不支持的文件类型: ' + ext + '，仅支持 ' + allowedExtensions.join(', ')));
        }
    }
});

// ========== 单文件上传 ==========

router.post('/', function (req, res, next) {
    upload.single('file')(req, res, function (err) {
        if (err) {
            var msg = err.code === 'LIMIT_FILE_SIZE' ? '文件大小超过 50MB 限制' : (err.message || '上传失败');
            return resp.error(res, msg, 400);
        }
        if (!req.file) {
            return resp.error(res, '请选择要上传的文件');
        }
        return resp.success(res, {
            url: '/uploads/' + req.file.filename,
            filename: req.file.filename,
            originalName: req.file.originalname,
            size: req.file.size,
            mimetype: req.file.mimetype
        }, 201);
    });
});

// ========== 多文件上传 ==========

router.post('/multiple', function (req, res, next) {
    upload.array('files', 10)(req, res, function (err) {
        if (err) {
            var msg = err.code === 'LIMIT_FILE_SIZE' ? '文件大小超过 50MB 限制' : (err.message || '上传失败');
            return resp.error(res, msg, 400);
        }
        if (!req.files || req.files.length === 0) {
            return resp.error(res, '请选择要上传的文件');
        }
        var results = req.files.map(function (f) {
            return {
                url: '/uploads/' + f.filename,
                filename: f.filename,
                originalName: f.originalname,
                size: f.size,
                mimetype: f.mimetype
            };
        });
        return resp.success(res, results, 201);
    });
});

// ========== 删除文件 ==========

router.delete('/:filename', function (req, res) {
    var filename = path.basename(req.params.filename);
    var filePath = path.join(UPLOAD_DIR, filename);

    // 安全检查：防止路径遍历
    if (filename.indexOf('..') !== -1 || filename.indexOf('/') !== -1 || filename.indexOf('\\') !== -1) {
        return resp.error(res, '无效的文件名', 400);
    }

    if (!fs.existsSync(filePath)) {
        return resp.notFound(res, '文件不存在');
    }

    try {
        fs.unlinkSync(filePath);
        return resp.success(res, { filename: filename });
    } catch (e) {
        return resp.error(res, '删除文件失败: ' + e.message, 500);
    }
});

module.exports = router;
