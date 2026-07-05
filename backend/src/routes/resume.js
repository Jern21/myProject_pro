/**
 * 简历路由
 *
 * 字段来源：resume.html + pdf-importer.js parseResumeText()
 *
 * API：
 *   GET    /api/resume             - 查询简历列表
 *   GET    /api/resume/:id         - 查询单条
 *   POST   /api/resume             - 新建简历版本
 *   PUT    /api/resume/:id         - 更新简历
 *   DELETE /api/resume/:id         - 删除简历版本
 *   PUT    /api/resume/:id/activate - 设为当前激活简历
 */
'use strict';

var express = require('express');
var router = express.Router();
var Storage = require('../utils/storage');
var resp = require('../utils/response');

var resumes = new Storage('resume');

// ========== 查询列表 ==========
router.get('/', resp.asyncHandler(function (req, res) {
    var all = resumes.findAll();
    // 激活的排在最前面
    all.sort(function (a, b) {
        if (a.active && !b.active) return -1;
        if (!a.active && b.active) return 1;
        return new Date(b.updatedAt) - new Date(a.updatedAt);
    });
    return resp.success(res, all);
}));

// ========== 查询单条 ==========
router.get('/:id', resp.asyncHandler(function (req, res) {
    var record = resumes.findById(req.params.id);
    if (!record) return resp.notFound(res, '简历不存在');
    return resp.success(res, record);
}));

// ========== 新建 ==========
router.post('/', resp.asyncHandler(function (req, res) {
    var body = req.body || {};

    if (!body.name) return resp.error(res, '姓名为必填项');

    var record = resumes.create({
        // 基本信息
        name: body.name,
        title: body.title || '',
        phone: body.phone || '',
        email: body.email || '',
        location: body.location || '',
        github: body.github || '',
        // 个人简介
        summary: body.summary || '',
        // 技能栈
        skills: body.skills || [],
        // 项目经验
        projects: body.projects || [],
        // 工作经验
        workExperience: body.workExperience || [],
        // 教育背景
        education: body.education || { school: '', major: '', year: '' },
        // 版本管理
        versionLabel: body.versionLabel || '未命名版本',
        active: body.active || false
    });

    // 如果设为激活，取消其他简历的激活
    if (record.active) {
        _deactivateOthers(record.id);
    }

    return resp.success(res, record, 201);
}));

// ========== 更新 ==========
router.put('/:id', resp.asyncHandler(function (req, res) {
    var updated = resumes.update(req.params.id, req.body || {});
    if (!updated) return resp.notFound(res, '简历不存在');

    // 如果设为激活，取消其他简历的激活
    if (req.body.active) {
        _deactivateOthers(req.params.id);
    }

    return resp.success(res, updated);
}));

// ========== 设为当前激活简历 ==========
router.put('/:id/activate', resp.asyncHandler(function (req, res) {
    var record = resumes.findById(req.params.id);
    if (!record) return resp.notFound(res, '简历不存在');

    _deactivateOthers(req.params.id);
    var updated = resumes.update(req.params.id, { active: true });
    return resp.success(res, updated);
}));

// ========== 删除 ==========
router.delete('/:id', resp.asyncHandler(function (req, res) {
    var ok = resumes.remove(req.params.id);
    if (!ok) return resp.notFound(res, '简历不存在');
    return resp.success(res, { id: req.params.id });
}));

// ========== 私有：取消其他简历的激活状态 ==========
function _deactivateOthers(activeId) {
    var all = resumes.findAll();
    all.forEach(function (r) {
        if (r.id !== activeId && r.active) {
            resumes.update(r.id, { active: false });
        }
    });
}

module.exports = router;
