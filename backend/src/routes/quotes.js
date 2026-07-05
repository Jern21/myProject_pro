/**
 * 报价单路由
 *
 * 字段来源：quote.html 报价编辑器
 *
 * API：
 *   GET    /api/quotes              - 查询列表
 *   GET    /api/quotes/:id          - 查询单条
 *   POST   /api/quotes              - 新建
 *   PUT    /api/quotes/:id          - 更新
 *   DELETE /api/quotes/:id          - 删除
 */
'use strict';

var express = require('express');
var router = express.Router();
var Storage = require('../utils/storage');
var resp = require('../utils/response');

var quotes = new Storage('quotes');

// ========== 查询列表 ==========
router.get('/', resp.asyncHandler(function (req, res) {
    var all = quotes.findAll();
    var keyword = req.query.keyword;

    if (keyword) {
        var kw = keyword.toLowerCase();
        all = all.filter(function (q) {
            return (q.projectName && q.projectName.toLowerCase().indexOf(kw) !== -1) ||
                   (q.customerName && q.customerName.toLowerCase().indexOf(kw) !== -1);
        });
    }

    return resp.success(res, all);
}));

// ========== 查询单条 ==========
router.get('/:id', resp.asyncHandler(function (req, res) {
    var record = quotes.findById(req.params.id);
    if (!record) return resp.notFound(res, '报价单不存在');
    return resp.success(res, record);
}));

// ========== 新建 ==========
router.post('/', resp.asyncHandler(function (req, res) {
    var body = req.body || {};

    if (!body.projectName) return resp.error(res, '项目名称为必填项');

    var record = quotes.create({
        projectName: body.projectName,
        customerName: body.customerName || '',
        projectType: body.projectType || '网站开发',
        techStack: body.techStack || [],
        // 报价明细项数组：{ name, desc, hours, unitPrice, amount }
        items: body.items || [],
        // 付款条款
        paymentTerms: body.paymentTerms || {
            depositRatio: 30,
            milestones: [],
            finalRatio: 70
        },
        additionalTerms: body.additionalTerms || '',
        validDate: body.validDate || '',
        totalAmount: body.totalAmount || 0,
        status: body.status || 'draft'
    });

    return resp.success(res, record, 201);
}));

// ========== 更新 ==========
router.put('/:id', resp.asyncHandler(function (req, res) {
    var updated = quotes.update(req.params.id, req.body || {});
    if (!updated) return resp.notFound(res, '报价单不存在');
    return resp.success(res, updated);
}));

// ========== 删除 ==========
router.delete('/:id', resp.asyncHandler(function (req, res) {
    var ok = quotes.remove(req.params.id);
    if (!ok) return resp.notFound(res, '报价单不存在');
    return resp.success(res, { id: req.params.id });
}));

module.exports = router;
