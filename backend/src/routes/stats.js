/**
 * 数据统计路由
 *
 * 聚合各实体数据，为 stats.html 提供图表数据
 *
 * API：
 *   GET    /api/stats/dashboard      - 首页仪表盘统计
 *   GET    /api/stats/revenue        - 收入趋势（按月）
 *   GET    /api/stats/platform       - 平台分布
 *   GET    /api/stats/project-type   - 项目类型分布
 *   GET    /api/stats/orders-monthly - 月度订单量
 *   GET    /api/stats/customer-level - 客户等级分布
 *   GET    /api/stats/funnel         - 转化漏斗
 */
'use strict';

var express = require('express');
var router = express.Router();
var Storage = require('../utils/storage');
var resp = require('../utils/response');

var orders = new Storage('orders');
var customers = new Storage('customers');
var posters = new Storage('posters');
var projects = new Storage('projects');
var posts = new Storage('platform-posts');

// ========== 首页仪表盘统计 ==========
router.get('/dashboard', resp.asyncHandler(function (req, res) {
    var allOrders = orders.findAll();
    var allCustomers = customers.findAll();
    var allProjects = projects.findAll();
    var allPosts = posts.findAll();

    var totalRevenue = 0;
    var totalProfit = 0;
    var activeProjects = 0;

    allOrders.forEach(function (o) {
        totalRevenue += parseFloat(o.amount) || 0;
        totalProfit += (parseFloat(o.amount) || 0) - (parseFloat(o.cost) || 0);
    });

    activeProjects = allProjects.filter(function (p) {
        return p.status === 'in_progress' || p.status === 'todo';
    }).length;

    var publishedPosts = allPosts.filter(function (p) { return p.status === 'published'; }).length;

    return resp.success(res, {
        totalRevenue: totalRevenue,
        totalProfit: totalProfit,
        totalOrders: allOrders.length,
        totalCustomers: allCustomers.length,
        activeProjects: activeProjects,
        totalProjects: allProjects.length,
        publishedPosts: publishedPosts,
        totalPosters: posters.count()
    });
}));

// ========== 收入趋势（按月） ==========
router.get('/revenue', resp.asyncHandler(function (req, res) {
    var allOrders = orders.findAll();
    var months = {};

    allOrders.forEach(function (o) {
        if (o.orderDate) {
            var month = o.orderDate.substring(0, 7); // YYYY-MM
            if (!months[month]) months[month] = { revenue: 0, cost: 0, profit: 0, count: 0 };
            months[month].revenue += parseFloat(o.amount) || 0;
            months[month].cost += parseFloat(o.cost) || 0;
            months[month].profit += (parseFloat(o.amount) || 0) - (parseFloat(o.cost) || 0);
            months[month].count++;
        }
    });

    // 按月份排序
    var sorted = Object.keys(months).sort().map(function (m) {
        return Object.assign({ month: m }, months[m]);
    });

    return resp.success(res, sorted);
}));

// ========== 平台分布 ==========
router.get('/platform', resp.asyncHandler(function (req, res) {
    var allPosts = posts.findAll();
    var platforms = ['xianyu', 'xiaohongshu', 'douyin'];
    var distribution = platforms.map(function (pf) {
        var pfPosts = allPosts.filter(function (p) { return p.platform === pf; });
        var published = pfPosts.filter(function (p) { return p.status === 'published'; });
        var revenue = 0;
        published.forEach(function (p) {
            revenue += parseFloat(p.stats && p.stats.revenue) || 0;
        });
        return {
            platform: pf,
            total: pfPosts.length,
            published: published.length,
            revenue: revenue
        };
    });

    return resp.success(res, distribution);
}));

// ========== 项目类型分布 ==========
router.get('/project-type', resp.asyncHandler(function (req, res) {
    var allOrders = orders.findAll();
    var types = {};

    allOrders.forEach(function (o) {
        var type = o.projectType || '其他';
        if (!types[type]) types[type] = { count: 0, revenue: 0 };
        types[type].count++;
        types[type].revenue += parseFloat(o.amount) || 0;
    });

    var result = Object.keys(types).map(function (t) {
        return Object.assign({ type: t }, types[t]);
    });

    return resp.success(res, result);
}));

// ========== 月度订单量 ==========
router.get('/orders-monthly', resp.asyncHandler(function (req, res) {
    var allOrders = orders.findAll();
    var months = {};

    allOrders.forEach(function (o) {
        if (o.orderDate) {
            var month = o.orderDate.substring(0, 7);
            months[month] = (months[month] || 0) + 1;
        }
    });

    var sorted = Object.keys(months).sort().map(function (m) {
        return { month: m, count: months[m] };
    });

    return resp.success(res, sorted);
}));

// ========== 客户等级分布 ==========
router.get('/customer-level', resp.asyncHandler(function (req, res) {
    var allCustomers = customers.findAll();
    var levels = {};

    allCustomers.forEach(function (c) {
        var level = c.level || '普通';
        levels[level] = (levels[level] || 0) + 1;
    });

    var result = Object.keys(levels).map(function (l) {
        return { level: l, count: levels[l] };
    });

    return resp.success(res, result);
}));

// ========== 转化漏斗 ==========
router.get('/funnel', resp.asyncHandler(function (req, res) {
    var allPosts = posts.findAll();
    var allOrders = orders.findAll();
    var allCustomers = customers.findAll();

    var totalViews = 0;
    var totalInquiries = 0;
    var allPublished = allPosts.filter(function (p) { return p.status === 'published'; });

    allPublished.forEach(function (p) {
        totalViews += parseInt(p.stats && p.stats.views) || 0;
        totalInquiries += parseInt(p.stats && p.stats.inquiries) || 0;
    });

    return resp.success(res, [
        { stage: '浏览量', count: totalViews },
        { stage: '私信咨询', count: totalInquiries },
        { stage: '成交订单', count: allOrders.length },
        { stage: '积累客户', count: allCustomers.length }
    ]);
}));

module.exports = router;
