/**
 * 数据统计路由
 *
 * 聚合各实体数据，为首页与 stats.html 提供图表数据
 *
 * API：
 *   GET    /api/stats/home-metrics   - 首页顶部指标（含真实环比）
 *   GET    /api/stats/dashboard      - 首页仪表盘统计
 *   GET    /api/stats/monthly-overview - 本月数据概览（含真实环比）
 *   GET    /api/stats/revenue        - 收入趋势（按月）
 *   GET    /api/stats/revenue/daily  - 订单趋势（按日，?days=7|30）
 *   GET    /api/stats/platform       - 平台分布
 *   GET    /api/stats/project-type   - 项目类型分布
 *   GET    /api/stats/orders-monthly - 月度订单量
 *   GET    /api/stats/customer-level - 客户等级分布
 *   GET    /api/stats/funnel         - 转化漏斗
 *   GET    /api/stats/todos          - 首页待办统计
 *   GET    /api/stats/monthly-detail - 月度明细
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
var reminders = new Storage('reminders');

/** 本地日期 YYYY-MM-DD（避免 toISOString 的 UTC 偏移） */
function localDateStr(d) {
    var y = d.getFullYear();
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + day;
}

/** 环比增长率；基准为 0 时：当前>0 视为 100，否则 0 */
function calcGrowth(current, previous) {
    if (previous > 0) return Math.round((current - previous) / previous * 100);
    if (current > 0) return 100;
    return 0;
}

/** 付款比例：已结清=1，部分付款=ratio%，未付款=0 */
function paidRatio(o) {
    if (!o) return 0;
    if (o.paymentStatus === '已结清') return 1;
    if (o.paymentStatus === '部分付款') {
        var ratio = parseInt(o.paymentRatio, 10) || 0;
        return Math.min(Math.max(ratio, 0), 100) / 100;
    }
    return 0;
}

/** 单笔已收成交额（按付款状态） */
function paidAmount(o) {
    return (parseFloat(o && o.amount) || 0) * paidRatio(o);
}

/** 单笔按付款比例分摊的成本 */
function paidCost(o) {
    return (parseFloat(o && o.cost) || 0) * paidRatio(o);
}

function hasPayment(o) {
    return paidRatio(o) > 0;
}

function sumAmount(list) {
    return list.reduce(function (sum, o) {
        return sum + (parseFloat(o.amount) || 0);
    }, 0);
}

/** 成交金额合计：按付款状态折算 */
function sumPaidAmount(list) {
    return list.reduce(function (sum, o) {
        return sum + paidAmount(o);
    }, 0);
}

function sumPaidCost(list) {
    return list.reduce(function (sum, o) {
        return sum + paidCost(o);
    }, 0);
}

function ordersCreatedOnDate(allOrders, dateStr) {
    return allOrders.filter(function (o) {
        return o.createdAt && o.createdAt.startsWith(dateStr);
    });
}

function goodRateOf(list) {
    var rated = list.filter(function (o) { return o.rating && o.rating > 0; });
    if (!rated.length) return 0;
    var good = rated.filter(function (o) { return o.rating >= 4; }).length;
    return Math.round(good / rated.length * 100);
}

function repeatRateOf(list) {
    var counts = {};
    list.forEach(function (o) {
        var key = o.customerId || o.customerNick || o.customer;
        if (!key) return;
        counts[key] = (counts[key] || 0) + 1;
    });
    var keys = Object.keys(counts);
    if (!keys.length) return 0;
    var repeat = keys.filter(function (k) { return counts[k] >= 2; }).length;
    return Math.round(repeat / keys.length * 100);
}

// ========== 首页顶部指标（含真实环比） ==========
router.get('/home-metrics', resp.asyncHandler(function (req, res) {
    var allOrders = orders.findAll();
    var today = new Date();
    var todayStr = localDateStr(today);

    var yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    var yesterdayStr = localDateStr(yesterday);

    var thisMonth = todayStr.substring(0, 7);
    var lastMonthDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    var lastMonth = localDateStr(lastMonthDate).substring(0, 7);
    var thisYear = String(today.getFullYear());
    var lastYear = String(today.getFullYear() - 1);

    var todayCreated = ordersCreatedOnDate(allOrders, todayStr);
    var yesterdayCreated = ordersCreatedOnDate(allOrders, yesterdayStr);

    var todayRevenueOrders = allOrders.filter(function (o) {
        return hasPayment(o) && o.orderDate === todayStr;
    });
    var yesterdayRevenueOrders = allOrders.filter(function (o) {
        return hasPayment(o) && o.orderDate === yesterdayStr;
    });

    var todayOrders = todayCreated.length;
    var yesterdayOrders = yesterdayCreated.length;
    var todayRevenue = sumPaidAmount(todayRevenueOrders);
    var yesterdayRevenue = sumPaidAmount(yesterdayRevenueOrders);

    var activeOrders = allOrders.filter(function (o) {
        return o.orderStatus === 'processing' || o.orderStatus === 'acceptance';
    }).length;

    var monthPaidOrders = allOrders.filter(function (o) {
        return hasPayment(o) && o.orderDate && o.orderDate.startsWith(thisMonth);
    });
    var lastMonthPaidOrders = allOrders.filter(function (o) {
        return hasPayment(o) && o.orderDate && o.orderDate.startsWith(lastMonth);
    });
    var monthRevenue = sumPaidAmount(monthPaidOrders);
    var lastMonthRevenue = sumPaidAmount(lastMonthPaidOrders);

    var yearPaidOrders = allOrders.filter(function (o) {
        return hasPayment(o) && o.orderDate && o.orderDate.startsWith(thisYear);
    });
    var lastYearPaidOrders = allOrders.filter(function (o) {
        return hasPayment(o) && o.orderDate && o.orderDate.startsWith(lastYear);
    });
    var yearRevenue = sumPaidAmount(yearPaidOrders);
    var lastYearRevenue = sumPaidAmount(lastYearPaidOrders);

    return resp.success(res, {
        todayOrders: todayOrders,
        todayOrdersGrowth: calcGrowth(todayOrders, yesterdayOrders),
        activeOrders: activeOrders,
        todayRevenue: todayRevenue,
        todayRevenueGrowth: calcGrowth(todayRevenue, yesterdayRevenue),
        monthRevenue: monthRevenue,
        monthRevenueGrowth: calcGrowth(monthRevenue, lastMonthRevenue),
        yearRevenue: yearRevenue,
        yearRevenueGrowth: calcGrowth(yearRevenue, lastYearRevenue)
    });
}));

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
        if (!hasPayment(o)) return;
        totalRevenue += paidAmount(o);
        totalProfit += paidAmount(o) - paidCost(o);
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

// ========== 本月数据概览 ==========
router.get('/monthly-overview', resp.asyncHandler(function (req, res) {
    var allOrders = orders.findAll();
    var allCustomers = customers.findAll();
    var today = new Date();
    var thisMonth = localDateStr(today).substring(0, 7);
    var lastMonth = localDateStr(new Date(today.getFullYear(), today.getMonth() - 1, 1)).substring(0, 7);
    var thisYear = String(today.getFullYear());
    var lastYear = String(today.getFullYear() - 1);

    var monthOrders = allOrders.filter(function (o) {
        return o.orderDate && o.orderDate.startsWith(thisMonth);
    });
    var lastMonthOrders = allOrders.filter(function (o) {
        return o.orderDate && o.orderDate.startsWith(lastMonth);
    });
    var monthPaid = monthOrders.filter(hasPayment);
    var lastMonthPaid = lastMonthOrders.filter(hasPayment);

    var monthRevenue = sumPaidAmount(monthPaid);
    var lastMonthRevenue = sumPaidAmount(lastMonthPaid);
    var monthCost = sumPaidCost(monthPaid);
    var monthProfit = monthRevenue - monthCost;

    var revenueGrowth = calcGrowth(monthRevenue, lastMonthRevenue);
    var orderCountGrowth = calcGrowth(monthOrders.length, lastMonthOrders.length);

    var avgOrderValue = monthPaid.length > 0
        ? Math.round(monthRevenue / monthPaid.length)
        : 0;

    var monthNewCustomers = allCustomers.filter(function (c) {
        return c.createdAt && c.createdAt.startsWith(thisMonth);
    }).length;
    var lastMonthNewCustomers = allCustomers.filter(function (c) {
        return c.createdAt && c.createdAt.startsWith(lastMonth);
    }).length;

    var yearPaid = allOrders.filter(function (o) {
        return hasPayment(o) && o.orderDate && o.orderDate.startsWith(thisYear);
    });
    var lastYearPaid = allOrders.filter(function (o) {
        return hasPayment(o) && o.orderDate && o.orderDate.startsWith(lastYear);
    });
    var yearRevenue = sumPaidAmount(yearPaid);
    var lastYearRevenue = sumPaidAmount(lastYearPaid);
    var yearGrowth = calcGrowth(yearRevenue, lastYearRevenue);

    var totalCustomers = allCustomers.length;
    var customerGrowth = calcGrowth(monthNewCustomers, lastMonthNewCustomers);

    // 好评率：本月有评价订单 vs 上月
    var goodRate = goodRateOf(monthOrders.length ? monthOrders : allOrders);
    var lastMonthGoodRate = goodRateOf(lastMonthOrders);
    var goodRateGrowth = calcGrowth(goodRate, lastMonthGoodRate);

    // 复购率：截至本月末 vs 截至上月末
    var ordersUntilThisMonth = allOrders.filter(function (o) {
        return o.orderDate && o.orderDate.substring(0, 7) <= thisMonth;
    });
    var ordersUntilLastMonth = allOrders.filter(function (o) {
        return o.orderDate && o.orderDate.substring(0, 7) <= lastMonth;
    });
    var repeatRate = repeatRateOf(ordersUntilThisMonth);
    var lastMonthRepeatRate = repeatRateOf(ordersUntilLastMonth);
    var repeatRateGrowth = calcGrowth(repeatRate, lastMonthRepeatRate);

    return resp.success(res, {
        month: thisMonth,
        orderCount: monthOrders.length,
        orderCountGrowth: orderCountGrowth,
        revenue: monthRevenue,
        cost: monthCost,
        profit: monthProfit,
        avgOrderValue: avgOrderValue,
        newCustomers: monthNewCustomers,
        revenueGrowth: revenueGrowth,
        lastMonthRevenue: lastMonthRevenue,
        yearRevenue: yearRevenue,
        yearGrowth: yearGrowth,
        totalCustomers: totalCustomers,
        customerGrowth: customerGrowth,
        goodRate: goodRate,
        goodRateGrowth: goodRateGrowth,
        repeatRate: repeatRate,
        repeatRateGrowth: repeatRateGrowth
    });
}));

// ========== 收入趋势（按月） ==========
router.get('/revenue', resp.asyncHandler(function (req, res) {
    var allOrders = orders.findAll();
    var months = {};

    allOrders.forEach(function (o) {
        if (!hasPayment(o) || !o.orderDate) return;
        var month = o.orderDate.substring(0, 7); // YYYY-MM
        if (!months[month]) months[month] = { revenue: 0, cost: 0, profit: 0, count: 0 };
        var rev = paidAmount(o);
        var cost = paidCost(o);
        months[month].revenue += rev;
        months[month].cost += cost;
        months[month].profit += rev - cost;
        months[month].count++;
    });

    // 按月份排序
    var sorted = Object.keys(months).sort().map(function (m) {
        return Object.assign({ month: m }, months[m]);
    });

    return resp.success(res, sorted);
}));

// ========== 收入/订单趋势（按日，支持 days=7|30） ==========
router.get('/revenue/daily', resp.asyncHandler(function (req, res) {
    var allOrders = orders.findAll();
    var dayCount = parseInt(req.query.days, 10);
    if (dayCount !== 30) dayCount = 7;

    var days = {};
    var orderKeys = [];
    var today = new Date();

    for (var i = dayCount - 1; i >= 0; i--) {
        var d = new Date(today);
        d.setDate(d.getDate() - i);
        var dateStr = localDateStr(d);
        var label = dayCount === 7 ? dateStr.substring(5) : dateStr.substring(5);
        orderKeys.push(dateStr);
        days[dateStr] = { date: label, fullDate: dateStr, revenue: 0, count: 0 };
    }

    allOrders.forEach(function (o) {
        if (!o.orderDate) return;
        if (days[o.orderDate]) {
            days[o.orderDate].count++;
            days[o.orderDate].revenue += paidAmount(o);
        }
    });

    var sorted = orderKeys.map(function (k) { return days[k]; });
    return resp.success(res, sorted);
}));

// ========== 平台分布（客源平台分布）==========
router.get('/platform', resp.asyncHandler(function (req, res) {
    var allCustomers = customers.findAll();
    var sourceMap = {};

    // 统计各来源平台的客户数量
    allCustomers.forEach(function (c) {
        var source = c.source || '其他';
        if (!sourceMap[source]) {
            sourceMap[source] = { platform: source, count: 0 };
        }
        sourceMap[source].count++;
    });

    // 转换为数组并按数量降序排序
    var distribution = Object.values(sourceMap).sort(function (a, b) {
        return b.count - a.count;
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
        types[type].revenue += paidAmount(o);
    });

    var result = Object.keys(types).map(function (t) {
        return Object.assign({ type: t }, types[t]);
    });

    return resp.success(res, result);
}));

// ========== 订单量统计（支持总/年度/月度切换）==========
router.get('/orders-monthly', resp.asyncHandler(function (req, res) {
    var allOrders = orders.findAll();
    var type = req.query.type || 'total'; // total, annual, monthly

    // 按状态分类订单
    var completedOrders = allOrders.filter(function (o) {
        return o.orderStatus === 'completed' || o.orderStatus === 'processing' || o.orderStatus === 'acceptance';
    });
    var cancelledOrders = allOrders.filter(function (o) {
        return o.orderStatus === 'closed';
    });

    if (type === 'total') {
        // 总订单量 - 按项目类型统计
        var typeStats = {};
        allOrders.forEach(function (o) {
            var pt = o.projectType || '其他';
            if (!typeStats[pt]) {
                typeStats[pt] = { completed: 0, cancelled: 0 };
            }
            if (o.orderStatus === 'closed') {
                typeStats[pt].cancelled++;
            } else {
                typeStats[pt].completed++;
            }
        });

        var result = Object.keys(typeStats).map(function (t) {
            return { name: t, completed: typeStats[t].completed, cancelled: typeStats[t].cancelled };
        }).sort(function (a, b) {
            return (b.completed + b.cancelled) - (a.completed + a.cancelled);
        });

        return resp.success(res, { type: 'total', data: result });

    } else if (type === 'annual') {
        // 年度订单量
        var years = {};
        allOrders.forEach(function (o) {
            if (o.orderDate) {
                var year = o.orderDate.substring(0, 4);
                if (!years[year]) {
                    years[year] = { completed: 0, cancelled: 0 };
                }
                if (o.orderStatus === 'closed') {
                    years[year].cancelled++;
                } else {
                    years[year].completed++;
                }
            }
        });

        var sorted = Object.keys(years).sort().map(function (y) {
            return { name: y + '年', completed: years[y].completed, cancelled: years[y].cancelled };
        });

        return resp.success(res, { type: 'annual', data: sorted });

    } else {
        // 月度订单量（默认）
        var months = {};
        allOrders.forEach(function (o) {
            if (o.orderDate) {
                var month = o.orderDate.substring(0, 7);
                if (!months[month]) {
                    months[month] = { completed: 0, cancelled: 0 };
                }
                if (o.orderStatus === 'closed') {
                    months[month].cancelled++;
                } else {
                    months[month].completed++;
                }
            }
        });

        var sorted = Object.keys(months).sort().map(function (m) {
            return { name: m, completed: months[m].completed, cancelled: months[m].cancelled };
        });

        return resp.success(res, { type: 'monthly', data: sorted });
    }
}));

// ========== 客户等级分布 ==========
router.get('/customer-level', resp.asyncHandler(function (req, res) {
    var allCustomers = customers.findAll();

    // 等级映射：将后端存储的格式映射为前端显示的格式
    var levelMap = {
        'A 高价值': '高价值客户',
        'B 普通客户': '普通客户',
        'C 潜在客户': '潜在客户'
    };

    // 初始化所有等级为0
    var levels = {
        '高价值客户': 0,
        '普通客户': 0,
        '潜在客户': 0,
        '流失客户': 0
    };

    allCustomers.forEach(function (c) {
        var level = c.level || 'B 普通客户';
        var mappedLevel = levelMap[level];

        if (mappedLevel) {
            levels[mappedLevel]++;
        } else {
            // 如果等级不在映射表中，尝试根据类型判断
            if (c.type === '流失客户' || c.status === '已流失') {
                levels['流失客户']++;
            } else if (c.type === '潜在客户') {
                levels['潜在客户']++;
            } else {
                levels['普通客户']++;
            }
        }
    });

    // 转换为数组格式
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

    // 返回前端期望的格式：{ name: '阶段名', value: 数量 }
    return resp.success(res, [
        { name: '浏览量', value: totalViews },
        { name: '私信咨询', value: totalInquiries },
        { name: '成交订单', value: allOrders.filter(hasPayment).length },
        { name: '积累客户', value: allCustomers.length }
    ]);
}));

// ========== 首页待办事项统计 ==========
router.get('/todos', resp.asyncHandler(function (req, res) {
    var allOrders = orders.findAll();
    var allPosts = posts.findAll();
    var allCustomers = customers.findAll();
    var allReminders = reminders.findAll();
    var allProjects = projects.findAll();

    var today = new Date();
    var todayStr = localDateStr(today);
    var sevenDaysLater = new Date(today);
    sevenDaysLater.setDate(today.getDate() + 7);

    // 待回复客户消息（跟进中 / 潜在客户）
    var pendingReply = allCustomers.filter(function (c) {
        return c.followStatus === '跟进中' || c.type === '潜在客户';
    }).length;

    // 待报价订单
    var pendingQuote = allOrders.filter(function (o) {
        return o.orderStatus === 'pending';
    }).length;

    // 平台审核中
    var platformReviewing = allPosts.filter(function (p) {
        return p.status === 'pending' || p.status === 'reviewing';
    }).length;

    // 即将到期订单（7天内）
    var expiringSoon = allOrders.filter(function (o) {
        if (!o.finalDate || o.orderStatus === 'completed' || o.orderStatus === 'closed') return false;
        var finalDate = new Date(o.finalDate);
        return finalDate >= today && finalDate <= sevenDaysLater;
    }).length;

    // 待验收订单
    var pendingAcceptance = allOrders.filter(function (o) {
        return o.orderStatus === 'acceptance';
    }).length;

    // 逾期订单（截止日期已过且未完成）
    var overdueOrders = allOrders.filter(function (o) {
        if (!o.finalDate || o.orderStatus === 'completed' || o.orderStatus === 'closed') return false;
        return new Date(o.finalDate) < today;
    }).length;

    // 今日提醒（未完成）
    var todayReminders = allReminders.filter(function (r) {
        return r.date === todayStr && !r.done;
    }).length;

    // 进行中项目
    var activeProjects = allProjects.filter(function (p) {
        return p.status === 'in_progress' || p.status === 'todo' || p.status === 'doing';
    }).length;

    return resp.success(res, {
        pendingReply: pendingReply,
        pendingQuote: pendingQuote,
        platformReviewing: platformReviewing,
        expiringSoon: expiringSoon,
        pendingAcceptance: pendingAcceptance,
        overdueOrders: overdueOrders,
        todayReminders: todayReminders,
        activeProjects: activeProjects
    });
}));

// ========== 月度明细数据（用于统计页表格）==========
router.get('/monthly-detail', resp.asyncHandler(function (req, res) {
    var allOrders = orders.findAll();
    var allCustomers = customers.findAll();

    // 按月份聚合数据
    var monthStats = {};

    // 初始化最近6个月
    var today = new Date();
    for (var i = 5; i >= 0; i--) {
        var d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        var monthKey = d.toISOString().substring(0, 7);
        monthStats[monthKey] = {
            month: monthKey,
            orderCount: 0,
            paidCount: 0,
            revenue: 0,
            newCustomers: 0,
            totalOrders: 0 // 用于计算环比
        };
    }

    // 统计订单数据（成交额按付款状态折算）
    allOrders.forEach(function (o) {
        if (o.orderDate) {
            var month = o.orderDate.substring(0, 7);
            if (monthStats[month]) {
                monthStats[month].orderCount++;
                var rev = paidAmount(o);
                if (rev > 0) {
                    monthStats[month].revenue += rev;
                    monthStats[month].paidCount = (monthStats[month].paidCount || 0) + 1;
                }
            }
        }
    });

    // 统计新增客户
    allCustomers.forEach(function (c) {
        if (c.createdAt) {
            var month = c.createdAt.substring(0, 7);
            if (monthStats[month]) {
                monthStats[month].newCustomers++;
            }
        }
    });

    // 计算复购率（有2次及以上订单的客户占比）
    var customerOrderCounts = {};
    allOrders.forEach(function (o) {
        if (o.customerId) {
            customerOrderCounts[o.customerId] = (customerOrderCounts[o.customerId] || 0) + 1;
        }
    });
    var repeatCustomers = Object.values(customerOrderCounts).filter(function (count) { return count >= 2; }).length;
    var totalOrderingCustomers = Object.keys(customerOrderCounts).length;
    var repeatRate = totalOrderingCustomers > 0 ? Math.round(repeatCustomers / totalOrderingCustomers * 100) : 0;

    // 好评率（基于有评价的订单）
    var ratedOrders = allOrders.filter(function (o) { return o.rating && o.rating > 0; });
    var goodRatingCount = ratedOrders.filter(function (o) { return o.rating >= 4; }).length;
    var goodRate = ratedOrders.length > 0 ? Math.round(goodRatingCount / ratedOrders.length * 100) : 98;

    // 转换为数组并计算派生指标
    var result = Object.keys(monthStats).sort().reverse().map(function (month, index, arr) {
        var stat = monthStats[month];
        var paidCount = stat.paidCount || 0;
        var avgOrderValue = paidCount > 0 ? Math.round(stat.revenue / paidCount) : 0;

        // 计算环比（与上月比较）
        var prevMonth = arr[index + 1];
        var growth = 0;
        if (prevMonth && monthStats[prevMonth]) {
            var prevRevenue = monthStats[prevMonth].revenue;
            growth = prevRevenue > 0 ? Math.round((stat.revenue - prevRevenue) / prevRevenue * 100) : 0;
        }

        return {
            month: month,
            orderCount: stat.orderCount,
            revenue: stat.revenue,
            newCustomers: stat.newCustomers,
            avgOrderValue: avgOrderValue,
            repeatRate: repeatRate,
            goodRate: goodRate,
            growth: growth
        };
    });

    return resp.success(res, result);
}));

module.exports = router;
