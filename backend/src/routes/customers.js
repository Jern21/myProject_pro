/**
 * 客户路由
 *
 * 字段来源：customer.html 表单 + 详情面板
 *
 * 数据模型：
 *   - name          客户姓名（必填）
 *   - phone         联系电话
 *   - source        客户来源（闲鱼/小红书/抖音/微信/淘宝/朋友推荐）
 *   - type          客户类型（成交客户/潜在客户/流失客户/黑名单）
 *   - level         客户等级（A 高价值/B 普通客户/C 潜在客户）
 *   - followStatus  跟进状态（跟进中/已成交/待跟进/已流失）
 *   - desc          需求描述
 *   - tags          客户标签（数组）
 *   - amount        成交金额（显示用字符串）
 *   - orderCount    订单数
 *   - followTime    最近跟进时间
 *   - addTime       添加时间
 *   - totalAmount   累计消费
 *   - firstDeal     首次成交日期
 *   - status        最近状态（正常/已流失）
 *   - notes         客户备注
 *   - avatar        头像 URL
 *
 * API：
 *   GET    /api/customers           - 查询列表（支持 keyword/type/source/level 筛选）
 *   GET    /api/customers/:id       - 查询单条
 *   POST   /api/customers           - 新建
 *   POST   /api/customers/seed      - 灌入种子数据
 *   PUT    /api/customers/:id       - 更新
 *   DELETE /api/customers/:id       - 删除
 */
'use strict';

var express = require('express');
var router = express.Router();
var Storage = require('../utils/storage');
var resp = require('../utils/response');

var customers = new Storage('customers');

// ========== 灌入种子数据 ==========

router.post('/seed', resp.asyncHandler(function (req, res) {
    var seedData = require('../data/seed-customers');
    customers.clear();
    var records = customers.createMany(seedData);
    return resp.success(res, { count: records.length });
}));

// ========== 查询列表 ==========

router.get('/', resp.asyncHandler(function (req, res) {
    var all = customers.findAll();
    var keyword = req.query.keyword;
    var type = req.query.type;
    var source = req.query.source;
    var level = req.query.level;

    if (type) {
        all = all.filter(function (c) { return c.type === type; });
    }
    if (source) {
        all = all.filter(function (c) { return c.source === source; });
    }
    if (level) {
        all = all.filter(function (c) { return c.level === level; });
    }
    if (keyword) {
        var kw = keyword.toLowerCase();
        all = all.filter(function (c) {
            return (c.name && c.name.toLowerCase().indexOf(kw) !== -1) ||
                   (c.phone && c.phone.indexOf(kw) !== -1) ||
                   (c.desc && c.desc.toLowerCase().indexOf(kw) !== -1);
        });
    }

    // 按创建时间降序
    all.sort(function (a, b) {
        return new Date(b.createdAt) - new Date(a.createdAt);
    });

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

    if (!body.name) return resp.error(res, '客户姓名为必填项');

    var record = customers.create({
        name: body.name,
        phone: body.phone || '',
        source: body.source || '闲鱼',
        type: body.type || '潜在客户',
        level: body.level || 'B 普通客户',
        followStatus: body.followStatus || '待跟进',
        desc: body.desc || '',
        tags: body.tags || [],
        amount: body.amount || '-',
        orderCount: parseInt(body.orderCount) || 0,
        followTime: body.followTime || '',
        addTime: body.addTime || '',
        totalAmount: body.totalAmount || '-',
        firstDeal: body.firstDeal || '—',
        status: body.status || '正常',
        notes: body.notes || '',
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
