/**
 * 提醒路由
 *
 * 字段来源：reminder.html 日历 + 模态框
 *
 * API：
 *   GET    /api/reminders           - 查询列表（支持 date/category/status 筛选）
 *   GET    /api/reminders/:id       - 查询单条
 *   GET    /api/reminders/calendar/:year/:month - 按月查询日历
 *   POST   /api/reminders           - 新建
 *   PUT    /api/reminders/:id       - 更新
 *   PUT    /api/reminders/:id/toggle - 切换完成状态
 *   DELETE /api/reminders/:id       - 删除
 */
'use strict';

var express = require('express');
var router = express.Router();
var Storage = require('../utils/storage');
var resp = require('../utils/response');

var reminders = new Storage('reminders');

// ========== 按月查询日历 ==========
router.get('/calendar/:year/:month', resp.asyncHandler(function (req, res) {
    var year = parseInt(req.params.year);
    var month = parseInt(req.params.month); // 1-12
    var all = reminders.findAll();

    var monthPrefix = year + '-' + String(month).padStart(2, '0');
    var monthReminders = all.filter(function (r) {
        return r.date && r.date.startsWith(monthPrefix);
    });

    // 按日期分组
    var byDate = {};
    monthReminders.forEach(function (r) {
        var day = r.date.substring(8, 10);
        if (!byDate[day]) byDate[day] = [];
        byDate[day].push(r);
    });

    return resp.success(res, {
        year: year,
        month: month,
        days: byDate,
        total: monthReminders.length
    });
}));

// ========== 查询列表 ==========
router.get('/', resp.asyncHandler(function (req, res) {
    var all = reminders.findAll();
    var date = req.query.date;
    var category = req.query.category;
    var status = req.query.status; // pending | completed

    if (date) {
        all = all.filter(function (r) { return r.date === date; });
    }
    if (category) {
        all = all.filter(function (r) { return r.category === category; });
    }
    if (status) {
        var isCompleted = status === 'completed';
        all = all.filter(function (r) { return !!r.completed === isCompleted; });
    }

    // 按日期升序排列
    all.sort(function (a, b) {
        return new Date(a.date) - new Date(b.date);
    });

    return resp.success(res, all);
}));

// ========== 查询单条 ==========
router.get('/:id', resp.asyncHandler(function (req, res) {
    var record = reminders.findById(req.params.id);
    if (!record) return resp.notFound(res, '提醒不存在');
    return resp.success(res, record);
}));

// ========== 新建 ==========
router.post('/', resp.asyncHandler(function (req, res) {
    var body = req.body || {};

    if (!body.title) return resp.error(res, '提醒标题为必填项');
    if (!body.date) return resp.error(res, '提醒日期为必填项');

    var record = reminders.create({
        title: body.title,
        content: body.content || '',
        date: body.date,
        time: body.time || '',
        category: body.category || '其他',
        priority: body.priority || 'normal', // low | normal | high
        completed: body.completed || false,
        repeat: body.repeat || 'none'        // none | daily | weekly | monthly
    });

    return resp.success(res, record, 201);
}));

// ========== 更新 ==========
router.put('/:id', resp.asyncHandler(function (req, res) {
    var updated = reminders.update(req.params.id, req.body || {});
    if (!updated) return resp.notFound(res, '提醒不存在');
    return resp.success(res, updated);
}));

// ========== 切换完成状态 ==========
router.put('/:id/toggle', resp.asyncHandler(function (req, res) {
    var record = reminders.findById(req.params.id);
    if (!record) return resp.notFound(res, '提醒不存在');
    var updated = reminders.update(req.params.id, { completed: !record.completed });
    return resp.success(res, updated);
}));

// ========== 删除 ==========
router.delete('/:id', resp.asyncHandler(function (req, res) {
    var ok = reminders.remove(req.params.id);
    if (!ok) return resp.notFound(res, '提醒不存在');
    return resp.success(res, { id: req.params.id });
}));

module.exports = router;
