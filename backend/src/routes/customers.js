/**
 * 客户路由
 *
 * 字段来源：customer.html 表单
 *
 * API：
 *   GET    /api/customers           - 查询列表（支持 keyword/level/source 筛选）
 *   GET    /api/customers/:id       - 查询单条
 *   POST   /api/customers           - 新建
 *   PUT    /api/customers/:id       - 更新
 *   DELETE /api/customers/:id       - 删除
 */
'use strict';

var express = require('express');
var router = express.Router();
var Storage = require('../utils/storage');
var resp = require('../utils/response');

var customers = new Storage('customers');

// ========== 查询列表 ==========
router.get('/', resp.asyncHandler(function (req, res) {
    var all = customers.findAll();
    var keyword = req.query.keyword;
    var level = req.query.level;
    var source = req.query.source;

    if (level) {
        all = all.filter(function (c) { return c.level === level; });
    }
    if (source) {
        all = all.filter(function (c) { return c.source === source; });
    }
    if (keyword) {
        var kw = keyword.toLowerCase();
        all = all.filter(function (c) {
            return (c.nick && c.nick.toLowerCase().indexOf(kw) !== -1) ||
                   (c.name && c.name.toLowerCase().indexOf(kw) !== -1) ||
                   (c.phone && c.phone.indexOf(kw) !== -1);
        });
    }

    return resp.success(res, all);
}));

// ========== 查询单条 ==========
router.get('/:id', resp.asyncHandler(function (req, res) {
    var record = customers.findById(req.params.id);
    if (!record) return resp.notFound(res, '客户不存在');
    return resp.success(res, record);
}));

// ========== 新建 ==========
router.post('/', resp.asyncHandler(function (req, res) {
    var body = req.body || {};

    if (!body.nick) return resp.error(res, '客户昵称为必填项');

    var record = customers.create({
        nick: body.nick,
        name: body.name || '',
        phone: body.phone || '',
        email: body.email || '',
        source: body.source || '其他',
        level: body.level || '普通',
        tags: body.tags || [],
        remark: body.remark || '',
        avatar: body.avatar || ''
    });

    return resp.success(res, record, 201);
}));

// ========== 更新 ==========
router.put('/:id', resp.asyncHandler(function (req, res) {
    var updated = customers.update(req.params.id, req.body || {});
    if (!updated) return resp.notFound(res, '客户不存在');
    return resp.success(res, updated);
}));

// ========== 删除 ==========
router.delete('/:id', resp.asyncHandler(function (req, res) {
    var ok = customers.remove(req.params.id);
    if (!ok) return resp.notFound(res, '客户不存在');
    return resp.success(res, { id: req.params.id });
}));

module.exports = router;
