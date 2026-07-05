/**
 * 订单路由
 *
 * 字段来源：order-form.js collectData()
 *
 * API：
 *   GET    /api/orders              - 查询列表（支持 status/projectType/keyword 筛选）
 *   GET    /api/orders/:id          - 查询单条
 *   POST   /api/orders              - 新建
 *   PUT    /api/orders/:id          - 更新
 *   DELETE /api/orders/:id          - 删除
 *   GET    /api/orders/stats/summary - 统计摘要
 */
'use strict';

var express = require('express');
var router = express.Router();
var Storage = require('../utils/storage');
var resp = require('../utils/response');

var orders = new Storage('orders');

// ========== 统计摘要 ==========
router.get('/stats/summary', resp.asyncHandler(function (req, res) {
    var all = orders.findAll();
    var totalRevenue = 0;
    var totalCost = 0;
    var totalHours = 0;
    var statusCounts = { pending: 0, processing: 0, acceptance: 0, completed: 0, closed: 0 };
    var paymentCounts = { '未付款': 0, '部分付款': 0, '已结清': 0 };

    all.forEach(function (o) {
        totalRevenue += parseFloat(o.amount) || 0;
        totalCost += parseFloat(o.cost) || 0;
        totalHours += parseFloat(o.hours) || 0;
        if (statusCounts[o.orderStatus] !== undefined) statusCounts[o.orderStatus]++;
        if (paymentCounts[o.paymentStatus] !== undefined) paymentCounts[o.paymentStatus]++;
    });

    return resp.success(res, {
        total: all.length,
        totalRevenue: totalRevenue,
        totalCost: totalCost,
        totalProfit: totalRevenue - totalCost,
        totalHours: totalHours,
        avgRate: totalHours > 0 ? (totalRevenue - totalCost) / totalHours : 0,
        statusCounts: statusCounts,
        paymentCounts: paymentCounts
    });
}));

// ========== 查询列表 ==========
router.get('/', resp.asyncHandler(function (req, res) {
    var all = orders.findAll();
    var status = req.query.status;
    var projectType = req.query.projectType;
    var customerSource = req.query.customerSource;
    var keyword = req.query.keyword;
    var page = parseInt(req.query.page) || 1;
    var pageSize = parseInt(req.query.pageSize) || 50;

    var filtered = all;

    if (status) {
        filtered = filtered.filter(function (o) { return o.orderStatus === status; });
    }
    if (projectType) {
        filtered = filtered.filter(function (o) { return o.projectType === projectType; });
    }
    if (customerSource) {
        filtered = filtered.filter(function (o) { return o.customerSource === customerSource; });
    }
    if (keyword) {
        var kw = keyword.toLowerCase();
        filtered = filtered.filter(function (o) {
            return (o.customerNick && o.customerNick.toLowerCase().indexOf(kw) !== -1) ||
                   (o.projectName && o.projectName.toLowerCase().indexOf(kw) !== -1) ||
                   (o.customerName && o.customerName.toLowerCase().indexOf(kw) !== -1);
        });
    }

    // 分页
    var start = (page - 1) * pageSize;
    var paged = filtered.slice(start, start + pageSize);

    return resp.success(res, {
        list: paged,
        total: filtered.length,
        page: page,
        pageSize: pageSize
    });
}));

// ========== 查询单条 ==========
router.get('/:id', resp.asyncHandler(function (req, res) {
    var record = orders.findById(req.params.id);
    if (!record) return resp.notFound(res, '订单不存在');
    return resp.success(res, record);
}));

// ========== 新建 ==========
router.post('/', resp.asyncHandler(function (req, res) {
    var body = req.body || {};

    // 必填校验
    if (!body.customerNick) return resp.error(res, '客户昵称为必填项');
    if (!body.projectType) return resp.error(res, '项目类型为必填项');
    if (!body.projectName) return resp.error(res, '项目名称为必填项');
    if (!body.amount || parseFloat(body.amount) <= 0) return resp.error(res, '成交金额必须大于 0');
    if (!body.orderDate) return resp.error(res, '接单日期为必填项');

    var record = orders.create({
        // 客户信息
        customerNick: body.customerNick,
        customerName: body.customerName || '',
        customerPhone: body.customerPhone || '',
        customerSource: body.customerSource || '其他',
        customerTags: body.customerTags || [],
        // 项目信息
        projectType: body.projectType,
        projectName: body.projectName,
        projectDesc: body.projectDesc || '',
        // 商务信息
        amount: parseFloat(body.amount) || 0,
        cost: parseFloat(body.cost) || 0,
        hours: parseFloat(body.hours) || 0,
        // 时间节点
        orderDate: body.orderDate,
        confirmDate: body.confirmDate || '',
        draftDate: body.draftDate || '',
        finalDate: body.finalDate || '',
        // 状态管理
        orderStatus: body.orderStatus || 'pending',
        paymentStatus: body.paymentStatus || '未付款',
        paymentRatio: parseInt(body.paymentRatio) || 0,
        payDate: body.payDate || '',
        // 附件与关联
        gitUrl: body.gitUrl || '',
        quoteRef: body.quoteRef || '',
        uploadedFiles: body.uploadedFiles || {}
    });

    return resp.success(res, record, 201);
}));

// ========== 更新 ==========
router.put('/:id', resp.asyncHandler(function (req, res) {
    var body = req.body || {};
    var updated = orders.update(req.params.id, body);
    if (!updated) return resp.notFound(res, '订单不存在');
    return resp.success(res, updated);
}));

// ========== 删除 ==========
router.delete('/:id', resp.asyncHandler(function (req, res) {
    var ok = orders.remove(req.params.id);
    if (!ok) return resp.notFound(res, '订单不存在');
    return resp.success(res, { id: req.params.id });
}));

module.exports = router;
