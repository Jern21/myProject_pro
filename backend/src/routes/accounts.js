/**
 * 账号管理路由
 *
 * 字段来源：accounts.html 账号管理页面
 *
 * API：
 *   GET    /api/accounts           - 获取所有账号
 *   POST   /api/accounts           - 创建新账号
 *   PUT    /api/accounts/:id       - 更新账号
 *   DELETE /api/accounts/:id       - 删除账号
 *   GET    /api/accounts/platforms  - 获取平台列表
 */
'use strict';

var express = require('express');
var router = express.Router();
var fs = require('fs');
var path = require('path');
var resp = require('../utils/response');

var DATA_DIR = path.join(__dirname, '..', '..', 'data');
var ACCOUNTS_FILE = path.join(DATA_DIR, 'accounts.json');

// 默认平台列表
var DEFAULT_PLATFORMS = [
    { id: 'github', name: 'GitHub', color: 'github' },
    { id: 'gitee', name: 'Gitee', color: 'gitee' },
    { id: 'coding', name: 'Coding', color: 'coding' },
    { id: 'leetcode', name: 'LeetCode', color: 'leetcode' },
    { id: 'juejin', name: '掘金', color: 'juejin' },
    { id: 'csdn', name: 'CSDN', color: 'csdn' },
    { id: 'zhihu', name: '知乎', color: 'zhihu' },
    { id: 'other', name: '其他', color: 'other' }
];

// Mock 数据
var MOCK_ACCOUNTS = [
    {
        id: '1',
        platform: 'github',
        accountName: 'wen_dev',
        email: 'wen@example.com',
        password: '',
        remark: '主要开发账号',
        createdAt: '2024-01-15T08:30:00Z',
        updatedAt: '2024-06-20T14:22:00Z'
    },
    {
        id: '2',
        platform: 'gitee',
        accountName: 'wen_gitee',
        email: 'wen@gitee.com',
        password: '',
        remark: '国内代码托管',
        createdAt: '2024-02-10T10:15:00Z',
        updatedAt: '2024-05-18T09:45:00Z'
    },
    {
        id: '3',
        platform: 'juejin',
        accountName: 'wen_tech',
        email: 'wen@juejin.cn',
        password: '',
        remark: '技术博客账号',
        createdAt: '2024-03-05T16:20:00Z',
        updatedAt: '2024-07-01T11:30:00Z'
    },
    {
        id: '4',
        platform: 'leetcode',
        accountName: 'wen_algo',
        email: 'wen@leetcode.com',
        password: '',
        remark: '刷题专用',
        createdAt: '2024-01-20T09:00:00Z',
        updatedAt: '2024-04-12T15:10:00Z'
    },
    {
        id: '5',
        platform: 'csdn',
        accountName: 'wen_coder',
        email: 'wen@csdn.net',
        password: '',
        remark: '备用博客',
        createdAt: '2023-12-01T14:30:00Z',
        updatedAt: '2024-03-20T10:00:00Z'
    }
];

// 确保数据文件存在
function ensureDataFile() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(ACCOUNTS_FILE)) {
        fs.writeFileSync(ACCOUNTS_FILE, JSON.stringify(MOCK_ACCOUNTS, null, 2), 'utf-8');
    }
}

// 读取账号数据
function readAccounts() {
    ensureDataFile();
    try {
        var raw = fs.readFileSync(ACCOUNTS_FILE, 'utf-8');
        return JSON.parse(raw);
    } catch (e) {
        return MOCK_ACCOUNTS;
    }
}

// 保存账号数据
function saveAccounts(accounts) {
    ensureDataFile();
    fs.writeFileSync(ACCOUNTS_FILE, JSON.stringify(accounts, null, 2), 'utf-8');
}

// ========== 获取所有账号 ==========
router.get('/', resp.asyncHandler(function (req, res) {
    var accounts = readAccounts();
    var platform = req.query.platform;
    var keyword = req.query.keyword;

    // 平台筛选
    if (platform && platform !== 'all') {
        accounts = accounts.filter(function (a) { return a.platform === platform; });
    }

    // 关键词搜索
    if (keyword) {
        var lowerKeyword = keyword.toLowerCase();
        accounts = accounts.filter(function (a) {
            return (a.accountName && a.accountName.toLowerCase().includes(lowerKeyword)) ||
                   (a.email && a.email.toLowerCase().includes(lowerKeyword)) ||
                   (a.remark && a.remark.toLowerCase().includes(lowerKeyword));
        });
    }

    return resp.success(res, accounts);
}));

// ========== 获取平台列表 ==========
router.get('/platforms', resp.asyncHandler(function (req, res) {
    return resp.success(res, DEFAULT_PLATFORMS);
}));

// ========== 创建新账号 ==========
router.post('/', resp.asyncHandler(function (req, res) {
    var data = req.body;

    if (!data.platform || !data.accountName) {
        return resp.error(res, '平台类型和账号名称不能为空', 400);
    }

    var accounts = readAccounts();

    var newAccount = {
        id: Date.now().toString(),
        platform: data.platform,
        accountName: data.accountName,
        email: data.email || '',
        password: data.password || '',
        remark: data.remark || '',
        icon: data.icon || null,
        useTextIcon: data.useTextIcon || false,
        customPlatform: data.customPlatform || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    accounts.push(newAccount);
    saveAccounts(accounts);

    return resp.success(res, newAccount);
}));

// ========== 更新账号 ==========
router.put('/:id', resp.asyncHandler(function (req, res) {
    var id = req.params.id;
    var data = req.body;
    var accounts = readAccounts();

    var index = accounts.findIndex(function (a) { return a.id === id; });
    if (index === -1) {
        return resp.error(res, '账号不存在', 404);
    }

    accounts[index] = {
        ...accounts[index],
        platform: data.platform || accounts[index].platform,
        accountName: data.accountName || accounts[index].accountName,
        email: data.email !== undefined ? data.email : accounts[index].email,
        password: data.password !== undefined ? data.password : accounts[index].password,
        remark: data.remark !== undefined ? data.remark : accounts[index].remark,
        icon: data.icon !== undefined ? data.icon : accounts[index].icon,
        useTextIcon: data.useTextIcon !== undefined ? data.useTextIcon : accounts[index].useTextIcon,
        customPlatform: data.customPlatform !== undefined ? data.customPlatform : accounts[index].customPlatform,
        updatedAt: new Date().toISOString()
    };

    saveAccounts(accounts);
    return resp.success(res, accounts[index]);
}));

// ========== 删除账号 ==========
router.delete('/:id', resp.asyncHandler(function (req, res) {
    var id = req.params.id;
    var accounts = readAccounts();

    var index = accounts.findIndex(function (a) { return a.id === id; });
    if (index === -1) {
        return resp.error(res, '账号不存在', 404);
    }

    accounts.splice(index, 1);
    saveAccounts(accounts);

    return resp.success(res, null);
}));

module.exports = router;
