/**
 * 网址收藏路由
 *
 * 字段来源：bookmarks.html 网址收藏页面
 *
 * API：
 *   GET    /api/bookmarks           - 获取所有收藏
 *   POST   /api/bookmarks           - 创建新收藏
 *   PUT    /api/bookmarks/:id       - 更新收藏
 *   DELETE /api/bookmarks/:id       - 删除收藏
 *   GET    /api/bookmarks/categories - 获取分类列表
 */
'use strict';

var express = require('express');
var router = express.Router();
var fs = require('fs');
var path = require('path');
var resp = require('../utils/response');

var DATA_DIR = path.join(__dirname, '..', '..', 'data');
var BOOKMARKS_FILE = path.join(DATA_DIR, 'bookmarks.json');

// 默认分类列表
var DEFAULT_CATEGORIES = [
    { id: 'docs', name: '技术文档', color: 'docs' },
    { id: 'tools', name: '开发工具', color: 'tools' },
    { id: 'learning', name: '学习资源', color: 'learning' },
    { id: 'design', name: '设计资源', color: 'design' },
    { id: 'community', name: '技术社区', color: 'community' },
    { id: 'other', name: '其他', color: 'other' }
];

// Mock 数据
var MOCK_BOOKMARKS = [
    {
        id: '1',
        title: 'MDN Web Docs',
        url: 'https://developer.mozilla.org',
        category: 'docs',
        description: 'Web 开发权威文档',
        favicon: 'https://developer.mozilla.org/favicon.ico',
        clickCount: 45,
        createdAt: '2024-01-10T08:30:00Z',
        updatedAt: '2024-06-15T14:22:00Z'
    },
    {
        id: '2',
        title: 'GitHub',
        url: 'https://github.com',
        category: 'tools',
        description: '代码托管平台',
        favicon: 'https://github.com/favicon.ico',
        clickCount: 128,
        createdAt: '2023-12-05T10:15:00Z',
        updatedAt: '2024-07-10T09:45:00Z'
    },
    {
        id: '3',
        title: 'Stack Overflow',
        url: 'https://stackoverflow.com',
        category: 'community',
        description: '程序员问答社区',
        favicon: 'https://stackoverflow.com/favicon.ico',
        clickCount: 67,
        createdAt: '2024-02-20T16:20:00Z',
        updatedAt: '2024-05-28T11:30:00Z'
    },
    {
        id: '4',
        title: 'Vue.js 官方文档',
        url: 'https://vuejs.org',
        category: 'docs',
        description: 'Vue 框架文档',
        favicon: 'https://vuejs.org/favicon.ico',
        clickCount: 32,
        createdAt: '2024-03-12T09:00:00Z',
        updatedAt: '2024-04-22T15:10:00Z'
    },
    {
        id: '5',
        title: 'Figma',
        url: 'https://figma.com',
        category: 'design',
        description: '在线设计工具',
        favicon: 'https://figma.com/favicon.ico',
        clickCount: 23,
        createdAt: '2024-01-25T14:30:00Z',
        updatedAt: '2024-06-08T10:00:00Z'
    },
    {
        id: '6',
        title: 'freeCodeCamp',
        url: 'https://www.freecodecamp.org',
        category: 'learning',
        description: '免费编程学习平台',
        favicon: 'https://www.freecodecamp.org/favicon.ico',
        clickCount: 15,
        createdAt: '2024-04-05T11:20:00Z',
        updatedAt: '2024-05-15T16:45:00Z'
    },
    {
        id: '7',
        title: 'Dribbble',
        url: 'https://dribbble.com',
        category: 'design',
        description: '设计师作品展示平台',
        favicon: 'https://dribbble.com/favicon.ico',
        clickCount: 8,
        createdAt: '2024-02-28T13:10:00Z',
        updatedAt: '2024-03-20T09:30:00Z'
    },
    {
        id: '8',
        title: 'V2EX',
        url: 'https://www.v2ex.com',
        category: 'community',
        description: '创意工作者社区',
        favicon: 'https://www.v2ex.com/favicon.ico',
        clickCount: 56,
        createdAt: '2023-11-15T15:40:00Z',
        updatedAt: '2024-07-05T11:20:00Z'
    }
];

// 确保数据文件存在
function ensureDataFile() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(BOOKMARKS_FILE)) {
        fs.writeFileSync(BOOKMARKS_FILE, JSON.stringify(MOCK_BOOKMARKS, null, 2), 'utf-8');
    }
}

// 读取收藏数据
function readBookmarks() {
    ensureDataFile();
    try {
        var raw = fs.readFileSync(BOOKMARKS_FILE, 'utf-8');
        return JSON.parse(raw);
    } catch (e) {
        return MOCK_BOOKMARKS;
    }
}

// 保存收藏数据
function saveBookmarks(bookmarks) {
    ensureDataFile();
    fs.writeFileSync(BOOKMARKS_FILE, JSON.stringify(bookmarks, null, 2), 'utf-8');
}

// ========== 获取所有收藏 ==========
router.get('/', resp.asyncHandler(function (req, res) {
    var bookmarks = readBookmarks();
    var category = req.query.category;
    var keyword = req.query.keyword;

    // 分类筛选
    if (category && category !== 'all') {
        bookmarks = bookmarks.filter(function (b) { return b.category === category; });
    }

    // 关键词搜索
    if (keyword) {
        var lowerKeyword = keyword.toLowerCase();
        bookmarks = bookmarks.filter(function (b) {
            return (b.title && b.title.toLowerCase().includes(lowerKeyword)) ||
                   (b.url && b.url.toLowerCase().includes(lowerKeyword)) ||
                   (b.description && b.description.toLowerCase().includes(lowerKeyword));
        });
    }

    // 按点击次数排序
    bookmarks.sort(function (a, b) { return b.clickCount - a.clickCount; });

    return resp.success(res, bookmarks);
}));

// ========== 获取分类列表 ==========
router.get('/categories', resp.asyncHandler(function (req, res) {
    return resp.success(res, DEFAULT_CATEGORIES);
}));

// ========== 创建新收藏 ==========
router.post('/', resp.asyncHandler(function (req, res) {
    var data = req.body;

    if (!data.title || !data.url) {
        return resp.error(res, '标题和网址不能为空', 400);
    }

    var bookmarks = readBookmarks();

    var newBookmark = {
        id: Date.now().toString(),
        title: data.title,
        url: data.url,
        category: data.category || 'other',
        description: data.description || '',
        favicon: data.favicon || '',
        clickCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    bookmarks.push(newBookmark);
    saveBookmarks(bookmarks);

    return resp.success(res, newBookmark, '收藏创建成功');
}));

// ========== 更新收藏 ==========
router.put('/:id', resp.asyncHandler(function (req, res) {
    var id = req.params.id;
    var data = req.body;
    var bookmarks = readBookmarks();

    var index = bookmarks.findIndex(function (b) { return b.id === id; });
    if (index === -1) {
        return resp.error(res, '收藏不存在', 404);
    }

    bookmarks[index] = {
        ...bookmarks[index],
        title: data.title || bookmarks[index].title,
        url: data.url || bookmarks[index].url,
        category: data.category || bookmarks[index].category,
        description: data.description !== undefined ? data.description : bookmarks[index].description,
        favicon: data.favicon !== undefined ? data.favicon : bookmarks[index].favicon,
        updatedAt: new Date().toISOString()
    };

    saveBookmarks(bookmarks);
    return resp.success(res, bookmarks[index], '收藏更新成功');
}));

// ========== 删除收藏 ==========
router.delete('/:id', resp.asyncHandler(function (req, res) {
    var id = req.params.id;
    var bookmarks = readBookmarks();

    var index = bookmarks.findIndex(function (b) { return b.id === id; });
    if (index === -1) {
        return resp.error(res, '收藏不存在', 404);
    }

    bookmarks.splice(index, 1);
    saveBookmarks(bookmarks);

    return resp.success(res, null, '收藏删除成功');
}));

// ========== 增加点击次数 ==========
router.post('/:id/click', resp.asyncHandler(function (req, res) {
    var id = req.params.id;
    var bookmarks = readBookmarks();

    var index = bookmarks.findIndex(function (b) { return b.id === id; });
    if (index === -1) {
        return resp.error(res, '收藏不存在', 404);
    }

    bookmarks[index].clickCount = (bookmarks[index].clickCount || 0) + 1;
    bookmarks[index].updatedAt = new Date().toISOString();

    saveBookmarks(bookmarks);
    return resp.success(res, bookmarks[index]);
}));

module.exports = router;
