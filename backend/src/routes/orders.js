/**
 * 订单路由
 *
 * 字段来源：order-form.js collectData()
 *
 * API：
 *   GET    /api/orders              - 查询列表（支持 status/projectType/customerSource/paymentStatus/customerTag/keyword/overdue 筛选）
 *   GET    /api/orders/:id          - 查询单条
 *   POST   /api/orders              - 新建（自动生成 orderNo）
 *   PUT    /api/orders/:id          - 更新
 *   DELETE /api/orders/:id          - 删除
 *   POST   /api/orders/batch        - 批量删除
 *   GET    /api/orders/stats/summary - 统计摘要（含逾期、今日到期）
 */
'use strict';

var express = require('express');
var router = express.Router();
var Storage = require('../utils/storage');
var resp = require('../utils/response');

var orders = new Storage('orders');

// ========== 辅助函数 ==========

/**
 * 生成订单编号: DD + YYYYMMDD + 3位序号
 * 序号基于当天已有订单数量递增
 */
function generateOrderNo() {
    var now = new Date();
    var y = now.getFullYear();
    var m = String(now.getMonth() + 1).padStart(2, '0');
    var d = String(now.getDate()).padStart(2, '0');
    var dateStr = y + m + d;

    var all = orders.findAll();
    var prefix = 'DD' + dateStr;
    var count = 0;
    all.forEach(function (o) {
        if (o.orderNo && o.orderNo.indexOf(prefix) === 0) count++;
    });
    var seq = String(count + 1).padStart(3, '0');
    return prefix + seq;
}

/**
 * 判断订单是否逾期：终稿交付日已过，且状态未完成/未关闭
 */
function isOverdue(order) {
    if (!order.finalDate) return false;
    if (order.orderStatus === 'completed' || order.orderStatus === 'closed') return false;
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    var final = new Date(order.finalDate);
    if (isNaN(final)) return false;
    final.setHours(0, 0, 0, 0);
    return final < today;
}

/**
 * 判断订单是否今日到期
 */
function isDueToday(order) {
    if (!order.finalDate) return false;
    if (order.orderStatus === 'completed' || order.orderStatus === 'closed') return false;
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    var final = new Date(order.finalDate);
    if (isNaN(final)) return false;
    final.setHours(0, 0, 0, 0);
    return final.getTime() === today.getTime();
}

// ========== 统计摘要 ==========
router.get('/stats/summary', resp.asyncHandler(function (req, res) {
    var all = orders.findAll();
    var totalRevenue = 0;
    var totalCost = 0;
    var totalHours = 0;
    var statusCounts = { pending: 0, processing: 0, acceptance: 0, completed: 0, closed: 0 };
    var paymentCounts = { '未付款': 0, '部分付款': 0, '已结清': 0 };
    var overdueCount = 0;
    var dueTodayCount = 0;

    all.forEach(function (o) {
        var ratio = 0;
        if (o.paymentStatus === '已结清') {
            ratio = 1;
        } else if (o.paymentStatus === '部分付款') {
            ratio = Math.min(Math.max(parseInt(o.paymentRatio, 10) || 0, 0), 100) / 100;
        }
        if (ratio > 0) {
            totalRevenue += (parseFloat(o.amount) || 0) * ratio;
            totalCost += (parseFloat(o.cost) || 0) * ratio;
        }
        totalHours += parseFloat(o.hours) || 0;
        if (statusCounts[o.orderStatus] !== undefined) statusCounts[o.orderStatus]++;
        if (paymentCounts[o.paymentStatus] !== undefined) paymentCounts[o.paymentStatus]++;
        if (isOverdue(o)) overdueCount++;
        if (isDueToday(o)) dueTodayCount++;
    });

    var processingCount = statusCounts.processing;
    var acceptanceCount = statusCounts.acceptance;
    var completedCount = statusCounts.completed;

    return resp.success(res, {
        total: all.length,
        totalRevenue: totalRevenue,
        totalCost: totalCost,
        totalProfit: totalRevenue - totalCost,
        totalHours: totalHours,
        avgRate: totalHours > 0 ? (totalRevenue - totalCost) / totalHours : 0,
        statusCounts: statusCounts,
        paymentCounts: paymentCounts,
        // 概览卡片
        processing: processingCount,
        acceptance: acceptanceCount,
        completed: completedCount,
        // 特殊状态
        overdue: overdueCount,
        dueToday: dueTodayCount,
        // 百分比
        processingRate: all.length > 0 ? +(processingCount / all.length * 100).toFixed(1) : 0,
        acceptanceRate: all.length > 0 ? +(acceptanceCount / all.length * 100).toFixed(1) : 0,
        completedRate: all.length > 0 ? +(completedCount / all.length * 100).toFixed(1) : 0
    });
}));

// ========== 批量删除 ==========
router.post('/batch', resp.asyncHandler(function (req, res) {
    var ids = req.body.ids || [];
    if (!ids.length) return resp.error(res, '请选择要删除的订单');
    var removed = orders.removeMany(ids);
    return resp.success(res, { removed: removed });
}));

// ========== 查询列表 ==========
router.get('/', resp.asyncHandler(function (req, res) {
    var all = orders.findAll();
    var status = req.query.status;
    var projectType = req.query.projectType;
    var customerSource = req.query.customerSource;
    var paymentStatus = req.query.paymentStatus;
    var customerTag = req.query.customerTag;
    var customerId = req.query.customerId;
    var keyword = req.query.keyword;
    var overdue = req.query.overdue;
    var dueToday = req.query.dueToday;
    var dateFrom = req.query.dateFrom;
    var dateTo = req.query.dateTo;
    var sort = req.query.sort || 'orderDate_desc'; // orderDate_desc | orderDate_asc | amount_desc | amount_asc
    var page = parseInt(req.query.page) || 1;
    var pageSize = parseInt(req.query.pageSize) || 50;

    var filtered = all;

    // 状态筛选
    if (status) {
        filtered = filtered.filter(function (o) { return o.orderStatus === status; });
    }
    // 项目类型筛选
    if (projectType && projectType !== '全部类型') {
        filtered = filtered.filter(function (o) { return o.projectType === projectType; });
    }
    // 客户来源筛选
    if (customerSource && customerSource !== '全部来源') {
        filtered = filtered.filter(function (o) { return o.customerSource === customerSource; });
    }
    // 付款状态筛选
    if (paymentStatus && paymentStatus !== '全部付款状态') {
        filtered = filtered.filter(function (o) { return o.paymentStatus === paymentStatus; });
    }
    // 客户标签筛选
    if (customerTag && customerTag !== '全部标签') {
        filtered = filtered.filter(function (o) {
            return Array.isArray(o.customerTags) && o.customerTags.indexOf(customerTag) !== -1;
        });
    }
    // 客户详情关联筛选
    if (customerId) {
        filtered = filtered.filter(function (o) { return o.customerId === customerId; });
    }
    // 时间范围筛选
    if (dateFrom) {
        filtered = filtered.filter(function (o) {
            return o.orderDate && o.orderDate >= dateFrom;
        });
    }
    if (dateTo) {
        filtered = filtered.filter(function (o) {
            return o.orderDate && o.orderDate <= dateTo;
        });
    }
    // 关键词搜索
    if (keyword) {
        var kw = keyword.toLowerCase();
        filtered = filtered.filter(function (o) {
            return (o.customerNick && o.customerNick.toLowerCase().indexOf(kw) !== -1) ||
                   (o.projectName && o.projectName.toLowerCase().indexOf(kw) !== -1) ||
                   (o.customerName && o.customerName.toLowerCase().indexOf(kw) !== -1) ||
                   (o.orderNo && o.orderNo.toLowerCase().indexOf(kw) !== -1);
        });
    }
    // 逾期筛选
    if (overdue === '1' || overdue === 'true') {
        filtered = filtered.filter(function (o) { return isOverdue(o); });
    }
    // 今日到期筛选
    if (dueToday === '1' || dueToday === 'true') {
        filtered = filtered.filter(function (o) { return isDueToday(o); });
    }

    // 排序
    if (sort === 'orderDate_asc') {
        filtered.sort(function (a, b) {
            return (a.orderDate || '').localeCompare(b.orderDate || '');
        });
    } else if (sort === 'amount_desc') {
        filtered.sort(function (a, b) {
            return (parseFloat(b.amount) || 0) - (parseFloat(a.amount) || 0);
        });
    } else if (sort === 'amount_asc') {
        filtered.sort(function (a, b) {
            return (parseFloat(a.amount) || 0) - (parseFloat(b.amount) || 0);
        });
    } else {
        // 默认: orderDate_desc
        filtered.sort(function (a, b) {
            return (b.orderDate || '').localeCompare(a.orderDate || '');
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
        // 订单编号（自动生成）
        orderNo: body.orderNo || generateOrderNo(),
        // 客户信息
        customerId: body.customerId || '',
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
