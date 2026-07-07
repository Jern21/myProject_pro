/**
 * 备忘录路由
 *
 * 字段来源：memo-form.js collectData()
 *
 * API：
 *   GET    /api/memos              - 查询列表（支持 category/keyword 筛选，置顶优先）
 *   GET    /api/memos/:id          - 查询单条
 *   POST   /api/memos              - 新建
 *   PUT    /api/memos/:id          - 更新
 *   DELETE /api/memos/:id          - 删除
 *   PUT    /api/memos/:id/pin      - 切换置顶
 */
'use strict';

var express = require('express');
var router = express.Router();
var Storage = require('../utils/storage');
var resp = require('../utils/response');

var memos = new Storage('memos');

// ========== 灌入种子数据 ==========

router.post('/seed', resp.asyncHandler(function (req, res) {
    var seedData = require('../data/seed-memos');
    memos.clear();
    var records = memos.createMany(seedData);
    return resp.success(res, { count: records.length });
}));

// ========== 查询列表 ==========
router.get('/', resp.asyncHandler(function (req, res) {
    var all = memos.findAll();
    var category = req.query.category;
    var keyword = req.query.keyword;
    var sortBy = req.query.sortBy || 'updated'; // updated | created

    if (category) {
        all = all.filter(function (m) { return m.category === category; });
    }
    if (keyword) {
        var kw = keyword.toLowerCase();
        all = all.filter(function (m) {
            return (m.title && m.title.toLowerCase().indexOf(kw) !== -1) ||
                   (m.content && m.content.toLowerCase().indexOf(kw) !== -1);
        });
    }

    // 排序：置顶优先，然后按更新时间/创建时间降序
    all.sort(function (a, b) {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        var aTime = sortBy === 'created' ? a.createdAt : a.updatedAt;
        var bTime = sortBy === 'created' ? b.createdAt : b.updatedAt;
        return new Date(bTime) - new Date(aTime);
    });

    return resp.success(res, all);
}));

// ========== 查询单条 ==========
router.get('/:id', resp.asyncHandler(function (req, res) {
    var record = memos.findById(req.params.id);
    if (!record) return resp.notFound(res, '备忘录不存在');
    return resp.success(res, record);
}));

// ========== 新建 ==========
router.post('/', resp.asyncHandler(function (req, res) {
    var body = req.body || {};

    if (!body.title) return resp.error(res, '标题为必填项');
    if (!body.content) return resp.error(res, '内容为必填项');

    var record = memos.create({
        title: body.title,
        category: body.category || '其他',
        tags: body.tags || [],
        content: body.content,
        pinned: body.pinned || false
    });

    return resp.success(res, record, 201);
}));

// ========== 更新 ==========
router.put('/:id', resp.asyncHandler(function (req, res) {
    var updated = memos.update(req.params.id, req.body || {});
    if (!updated) return resp.notFound(res, '备忘录不存在');
    return resp.success(res, updated);
}));

// ========== 切换置顶 ==========
router.put('/:id/pin', resp.asyncHandler(function (req, res) {
    var record = memos.findById(req.params.id);
    if (!record) return resp.notFound(res, '备忘录不存在');
    var updated = memos.update(req.params.id, { pinned: !record.pinned });
    return resp.success(res, updated);
}));

// ========== 删除 ==========
router.delete('/:id', resp.asyncHandler(function (req, res) {
    var ok = memos.remove(req.params.id);
    if (!ok) return resp.notFound(res, '备忘录不存在');
    return resp.success(res, { id: req.params.id });
}));

module.exports = router;
