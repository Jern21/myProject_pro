/**
 * 海报路由
 *
 * 字段来源：poster-form.js collectData()
 *
 * API：
 *   GET    /api/posters             - 查询列表（支持 platform/keyword 筛选）
 *   GET    /api/posters/:id         - 查询单条
 *   POST   /api/posters             - 新建
 *   PUT    /api/posters/:id         - 更新
 *   DELETE /api/posters/:id         - 删除
 *   POST   /api/posters/batch       - 批量删除
 */
'use strict';

var express = require('express');
var router = express.Router();
var Storage = require('../utils/storage');
var resp = require('../utils/response');

var posters = new Storage('posters');

// ========== 批量删除 ==========
router.post('/batch', resp.asyncHandler(function (req, res) {
    var ids = req.body.ids || [];
    if (!ids.length) return resp.error(res, '请选择要删除的海报');
    var removed = posters.removeMany(ids);
    return resp.success(res, { removed: removed });
}));

// ========== 查询列表 ==========
router.get('/', resp.asyncHandler(function (req, res) {
    var all = posters.findAll();
    var platform = req.query.platform;
    var keyword = req.query.keyword;

    if (platform) {
        all = all.filter(function (p) { return p.platform === platform; });
    }
    if (keyword) {
        var kw = keyword.toLowerCase();
        all = all.filter(function (p) {
            return (p.title && p.title.toLowerCase().indexOf(kw) !== -1) ||
                   (p.tags && p.tags.some(function (t) { return t.toLowerCase().indexOf(kw) !== -1; }));
        });
    }

    // 按 sortOrder 降序排列
    all.sort(function (a, b) {
        return (b.sortOrder || 0) - (a.sortOrder || 0);
    });

    return resp.success(res, all);
}));

// ========== 查询单条 ==========
router.get('/:id', resp.asyncHandler(function (req, res) {
    var record = posters.findById(req.params.id);
    if (!record) return resp.notFound(res, '海报不存在');
    return resp.success(res, record);
}));

// ========== 新建 ==========
router.post('/', resp.asyncHandler(function (req, res) {
    var body = req.body || {};

    if (!body.title) return resp.error(res, '海报标题为必填项');
    if (!body.platform) return resp.error(res, '发布平台为必填项');

    var record = posters.create({
        title: body.title,
        platform: body.platform,
        labelText: body.labelText || '自定义标签',
        labelColor: body.labelColor || '#10b981',
        ratio: body.ratio || '3/4',
        sortOrder: parseInt(body.sortOrder) || 0,
        tags: body.tags || [],
        onlineDate: body.onlineDate || '',
        offlineDate: body.offlineDate || '',
        target: body.target || '',
        effect: body.effect || '',
        remark: body.remark || '',
        sourceUrl: body.sourceUrl || '',
        projectRef: body.projectRef || '',
        image: body.image || null,
        imageHtml: body.imageHtml || null
    });

    return resp.success(res, record, 201);
}));

// ========== 更新 ==========
router.put('/:id', resp.asyncHandler(function (req, res) {
    var updated = posters.update(req.params.id, req.body || {});
    if (!updated) return resp.notFound(res, '海报不存在');
    return resp.success(res, updated);
}));

// ========== 删除 ==========
router.delete('/:id', resp.asyncHandler(function (req, res) {
    var ok = posters.remove(req.params.id);
    if (!ok) return resp.notFound(res, '海报不存在');
    return resp.success(res, { id: req.params.id });
}));

module.exports = router;
