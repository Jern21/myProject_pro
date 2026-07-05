/**
 * 项目路由
 *
 * 字段来源：project.html 看板 + project-form.html 编辑表单
 *
 * API：
 *   GET    /api/projects            - 查询列表（支持 status 筛选，看板分组）
 *   GET    /api/projects/:id        - 查询单条
 *   POST   /api/projects            - 新建
 *   PUT    /api/projects/:id        - 更新（含拖拽改状态）
 *   DELETE /api/projects/:id        - 删除
 *   GET    /api/projects/board      - 看板视图（按 status 分组）
 */
'use strict';

var express = require('express');
var router = express.Router();
var Storage = require('../utils/storage');
var resp = require('../utils/response');

var projects = new Storage('projects');

// 看板列定义
var BOARD_COLUMNS = [
    { key: 'todo', label: '待开始' },
    { key: 'in_progress', label: '进行中' },
    { key: 'review', label: '待验收' },
    { key: 'completed', label: '已完成' },
    { key: 'archived', label: '已归档' }
];

// ========== 看板视图 ==========
router.get('/board', resp.asyncHandler(function (req, res) {
    var all = projects.findAll();
    var board = {};

    BOARD_COLUMNS.forEach(function (col) {
        board[col.key] = {
            label: col.label,
            items: all.filter(function (p) { return p.status === col.key; })
        };
    });

    return resp.success(res, board);
}));

// ========== 查询列表 ==========
router.get('/', resp.asyncHandler(function (req, res) {
    var all = projects.findAll();
    var status = req.query.status;
    var keyword = req.query.keyword;

    if (status) {
        all = all.filter(function (p) { return p.status === status; });
    }
    if (keyword) {
        var kw = keyword.toLowerCase();
        all = all.filter(function (p) {
            return (p.name && p.name.toLowerCase().indexOf(kw) !== -1) ||
                   (p.customer && p.customer.toLowerCase().indexOf(kw) !== -1);
        });
    }

    return resp.success(res, all);
}));

// ========== 查询单条 ==========
router.get('/:id', resp.asyncHandler(function (req, res) {
    var record = projects.findById(req.params.id);
    if (!record) return resp.notFound(res, '项目不存在');
    return resp.success(res, record);
}));

// ========== 新建 ==========
router.post('/', resp.asyncHandler(function (req, res) {
    var body = req.body || {};

    if (!body.name) return resp.error(res, '项目名称为必填项');

    var record = projects.create({
        name: body.name,
        customer: body.customer || '',
        projectType: body.projectType || '网站开发',
        description: body.description || '',
        status: body.status || 'todo',
        priority: body.priority || 'medium',
        // 项目条目
        items: body.items || [],
        // 条款设置
        terms: body.terms || {},
        // 服务器配置
        serverType: body.serverType || 'cloud', // cloud | self
        serverConfig: body.serverConfig || {},
        // 时间节点
        startDate: body.startDate || '',
        dueDate: body.dueDate || '',
        completedDate: body.completedDate || '',
        // 关联
        orderId: body.orderId || '',
        gitUrl: body.gitUrl || '',
        // 标签
        tags: body.tags || []
    });

    return resp.success(res, record, 201);
}));

// ========== 更新 ==========
router.put('/:id', resp.asyncHandler(function (req, res) {
    var updated = projects.update(req.params.id, req.body || {});
    if (!updated) return resp.notFound(res, '项目不存在');
    return resp.success(res, updated);
}));

// ========== 删除 ==========
router.delete('/:id', resp.asyncHandler(function (req, res) {
    var ok = projects.remove(req.params.id);
    if (!ok) return resp.notFound(res, '项目不存在');
    return resp.success(res, { id: req.params.id });
}));

module.exports = router;
