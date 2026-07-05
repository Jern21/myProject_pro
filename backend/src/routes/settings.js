/**
 * 设置路由
 *
 * 字段来源：settings.html 设置中心
 *
 * API：
 *   GET    /api/settings           - 读取设置
 *   PUT    /api/settings           - 更新设置（merge 模式）
 *   POST   /api/settings/reset     - 重置为默认设置
 *   POST   /api/settings/backup    - 导出全部数据备份
 *   POST   /api/settings/restore   - 导入数据恢复
 */
'use strict';

var express = require('express');
var router = express.Router();
var fs = require('fs');
var path = require('path');
var resp = require('../utils/response');

var DATA_DIR = path.join(__dirname, '..', '..', 'data');
var SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');

var DEFAULT_SETTINGS = {
    theme: 'pure-white',
    notifications: {
        orderReminders: true,
        customerMessages: true,
        platformUpdates: false,
        weeklyReport: true
    },
    backup: {
        autoBackup: false,
        lastBackup: null
    },
    exportFormat: 'json',
    cleanupDays: 30
};

// ========== 读取设置 ==========
router.get('/', resp.asyncHandler(function (req, res) {
    try {
        var raw = fs.readFileSync(SETTINGS_FILE, 'utf-8');
        var settings = JSON.parse(raw);
        return resp.success(res, settings);
    } catch (e) {
        return resp.success(res, DEFAULT_SETTINGS);
    }
}));

// ========== 更新设置 ==========
router.put('/', resp.asyncHandler(function (req, res) {
    try {
        // 读取当前设置，merge 新值
        var current = {};
        try {
            current = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf-8'));
        } catch (e) {}

        var updated = deepMerge(current, req.body || {});
        fs.writeFileSync(SETTINGS_FILE, JSON.stringify(updated, null, 2), 'utf-8');
        return resp.success(res, updated);
    } catch (e) {
        return resp.error(res, '保存设置失败: ' + e.message, 500);
    }
}));

// ========== 重置为默认 ==========
router.post('/reset', resp.asyncHandler(function (req, res) {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(DEFAULT_SETTINGS, null, 2), 'utf-8');
    return resp.success(res, DEFAULT_SETTINGS);
}));

// ========== 导出全部数据备份 ==========
router.post('/backup', resp.asyncHandler(function (req, res) {
    var backup = {};
    var files = fs.readdirSync(DATA_DIR).filter(function (f) { return f.endsWith('.json'); });

    files.forEach(function (file) {
        try {
            var content = JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), 'utf-8'));
            backup[file.replace('.json', '')] = content;
        } catch (e) {
            backup[file.replace('.json', '')] = [];
        }
    });

    backup._meta = {
        exportedAt: new Date().toISOString(),
        version: '1.0.0'
    };

    // 更新备份时间
    try {
        var settings = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf-8'));
        settings.backup = settings.backup || {};
        settings.backup.lastBackup = new Date().toISOString();
        fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf-8');
    } catch (e) {}

    return resp.success(res, backup);
}));

// ========== 导入数据恢复 ==========
router.post('/restore', resp.asyncHandler(function (req, res) {
    var backup = req.body || {};
    if (!backup || !backup._meta) {
        return resp.error(res, '无效的备份数据格式');
    }

    var restored = [];
    Object.keys(backup).forEach(function (key) {
        if (key === '_meta') return;
        var filePath = path.join(DATA_DIR, key + '.json');
        try {
            fs.writeFileSync(filePath, JSON.stringify(backup[key], null, 2), 'utf-8');
            restored.push(key);
        } catch (e) {
            console.error('[Restore] 恢复失败:', key, e.message);
        }
    });

    return resp.success(res, { restored: restored, count: restored.length });
}));

// ========== 深度合并工具 ==========
function deepMerge(target, source) {
    var result = Object.assign({}, target);
    Object.keys(source).forEach(function (key) {
        if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
            result[key] = deepMerge(target[key] || {}, source[key]);
        } else {
            result[key] = source[key];
        }
    });
    return result;
}

module.exports = router;
