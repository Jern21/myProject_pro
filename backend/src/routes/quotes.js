/**
 * 报价单路由
 *
 * 字段来源：quote.html 报价编辑器 collectQuoteData()
 *
 * API：
 *   GET    /api/quotes              - 查询列表（支持 keyword 搜索）
 *   GET    /api/quotes/:id          - 查询单条
 *   POST   /api/quotes              - 新建（保存报价单）
 *   PUT    /api/quotes/:id          - 更新
 *   DELETE /api/quotes/:id          - 删除
 */
'use strict';

var express = require('express');
var router = express.Router();
var Storage = require('../utils/storage');
var resp = require('../utils/response');

var quotes = new Storage('quotes');

/**
 * 计算报价单总金额
 */
function calcTotal(data) {
    var subtotal = (data.items || []).reduce(function (sum, item) {
        return sum + (parseFloat(item.qty) || 0) * (parseFloat(item.price) || 0);
    }, 0);
    var discount = parseFloat(data.discount) || 0;
    return subtotal - discount;
}

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
    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
        return resp.error(res, '报价明细不能为空');
    }

    var record = quotes.create({
        projectName: body.projectName,
        customerName: body.customerName || '',
        quoteDate: body.quoteDate || '',
        cycle: body.cycle || '',
        // 报价明细项数组：{ name, desc, qty, price }
        items: body.items,
        // 附加条款
        discount: parseFloat(body.discount) || 0,
        paymentMethod: body.paymentMethod || '',
        notes: body.notes || '',
        // 计算字段
        totalAmount: calcTotal(body),
        // 状态：draft / sent / accepted / rejected
        status: body.status || 'draft'
    });

    return resp.success(res, record, 201);
}));

// ========== 更新 ==========
router.put('/:id', resp.asyncHandler(function (req, res) {
    var body = req.body || {};

    if (!body.projectName) return resp.error(res, '项目名称为必填项');
    if (body.items !== undefined && (!Array.isArray(body.items) || body.items.length === 0)) {
        return resp.error(res, '报价明细不能为空');
    }

    var patch = {
        projectName: body.projectName,
        customerName: body.customerName || '',
        quoteDate: body.quoteDate || '',
        cycle: body.cycle || '',
        items: body.items || undefined,
        discount: parseFloat(body.discount) || 0,
        paymentMethod: body.paymentMethod || '',
        notes: body.notes || '',
        totalAmount: calcTotal(body),
        status: body.status || 'draft'
    };

    // 移除 undefined 字段
    Object.keys(patch).forEach(function (key) {
        if (patch[key] === undefined) delete patch[key];
    });

    var updated = quotes.update(req.params.id, patch);
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
