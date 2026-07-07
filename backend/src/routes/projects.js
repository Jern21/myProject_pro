/**
 * 项目路由
 *
 * 字段来源：project.html 看板 + project-form.html 编辑表单
 *
 * API：
 *   GET    /api/projects            - 查询列表（支持 status / scope 筛选，keyword 搜索）
 *   GET    /api/projects/:id        - 查询单条
 *   POST   /api/projects            - 新建
 *   PUT    /api/projects/:id        - 更新（含拖拽改状态）
 *   DELETE /api/projects/:id        - 删除
 *   GET    /api/projects/board      - 看板视图（按 status 分组）
 *   GET    /api/projects/stats      - 统计摘要（按 scope 分组）
 *   POST   /api/projects/seed       - 灌入 Mock 种子数据
 */
'use strict';

var express = require('express');
var router = express.Router();
var Storage = require('../utils/storage');
var resp = require('../utils/response');

var projects = new Storage('projects');

// 看板列定义（与前端 status 值完全一致）
var BOARD_COLUMNS = [
    { key: '待确认需求', label: '待确认需求', color: 'gray' },
    { key: '开发/设计中', label: '开发/设计中', color: 'green' },
    { key: '待验收', label: '待验收', color: 'orange' },
    { key: '已完成', label: '已完成', color: 'purple' },
    { key: '已关闭', label: '已关闭', color: 'gray' }
];

// ========== 统计摘要 ==========
router.get('/stats', resp.asyncHandler(function (req, res) {
    var all = projects.findAll();
    var scope = req.query.scope;

    if (scope) {
        all = all.filter(function (p) { return p.scope === scope; });
    }

    var today = new Date().toISOString().slice(0, 10);
    var stats = {
        total: all.length,
        inProgress: all.filter(function (p) { return p.status === '开发/设计中'; }).length,
        review: all.filter(function (p) { return p.status === '待验收'; }).length,
        completed: all.filter(function (p) { return p.status === '已完成'; }).length,
        overdue: all.filter(function (p) {
            return p.deadline && p.deadline < today && p.status !== '已完成' && p.status !== '已关闭';
        }).length
    };

    return resp.success(res, stats);
}));

// ========== 看板视图 ==========
router.get('/board', resp.asyncHandler(function (req, res) {
    var all = projects.findAll();
    var scope = req.query.scope;

    if (scope) {
        all = all.filter(function (p) { return p.scope === scope; });
    }

    var board = {};
    BOARD_COLUMNS.forEach(function (col) {
        board[col.key] = {
            label: col.label,
            color: col.color,
            items: all.filter(function (p) { return p.status === col.key; })
        };
    });

    return resp.success(res, board);
}));

// ========== 种子数据 ==========
router.post('/seed', resp.asyncHandler(function (req, res) {
    var force = req.query.force === 'true';
    var existing = projects.findAll();

    if (existing.length > 0 && !force) {
        return resp.success(res, { seeded: false, message: '数据已存在，如需重置请加 ?force=true', count: existing.length });
    }

    if (force) {
        projects.clear();
    }

    var seedData = require('../data/seed-projects');
    var records = projects.createMany(seedData);
    return resp.success(res, { seeded: true, count: records.length }, 201);
}));

// ========== 查询列表 ==========
router.get('/', resp.asyncHandler(function (req, res) {
    var all = projects.findAll();
    var status = req.query.status;
    var scope = req.query.scope;
    var keyword = req.query.keyword;

    if (status) {
        all = all.filter(function (p) { return p.status === status; });
    }
    if (scope) {
        all = all.filter(function (p) { return p.scope === scope; });
    }
    if (keyword) {
        var kw = keyword.toLowerCase();
        all = all.filter(function (p) {
            return (p.name && p.name.toLowerCase().indexOf(kw) !== -1) ||
                   (p.customer && p.customer.toLowerCase().indexOf(kw) !== -1) ||
                   (p.code && p.code.toLowerCase().indexOf(kw) !== -1);
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
        code: body.code || '',
        customer: body.customer || '',
        type: body.type || '网站开发',
        scope: body.scope || 'enterprise',
        description: body.description || body.desc || '',
        status: body.status || '待确认需求',
        priority: body.priority || '中',
        progress: body.progress || 0,
        amount: body.amount || '',
        deadline: body.deadline || '',
        // 存放地址
        localPath: body.localPath || '',
        cloudEnabled: body.cloudEnabled || false,
        cloudPath: body.cloudPath || '',
        cloudType: body.cloudType || 'baidu',
        // 服务器配置
        serverEnabled: body.serverEnabled || false,
        serverAddr: body.serverAddr || '',
        serverSpec: body.serverSpec || '',
        nginxConfigs: body.nginxConfigs || [],
        // 其他
        tags: body.tags || '',
        notes: body.notes || '',
        gitUrl: body.gitUrl || body.cloudPath || ''
    });

    return resp.success(res, record, 201);
}));

// ========== 更新 ==========
router.put('/:id', resp.asyncHandler(function (req, res) {
    var body = req.body || {};
    // 只更新传入的字段，不覆盖未传字段
    var patch = {};
    var allowedFields = [
        'name', 'code', 'customer', 'type', 'scope', 'description', 'desc',
        'status', 'priority', 'progress', 'amount', 'deadline',
        'localPath', 'cloudEnabled', 'cloudPath', 'cloudType',
        'serverEnabled', 'serverAddr', 'serverSpec', 'nginxConfigs',
        'tags', 'notes', 'gitUrl'
    ];
    allowedFields.forEach(function (key) {
        if (body[key] !== undefined) {
            // desc → description 别名
            if (key === 'desc') {
                patch.description = body[key];
            } else {
                patch[key] = body[key];
            }
        }
    });

    var updated = projects.update(req.params.id, patch);
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
