/**
 * 订单业务规则工具
 *
 * 把付款、成交额、逾期、进行中等核心口径集中到这里，
 * 避免首页、订单页、统计页各算各的。
 */
'use strict';

function localDateStr(d) {
    var y = d.getFullYear();
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + day;
}

function startOfLocalDay(d) {
    var date = d ? new Date(d) : new Date();
    date.setHours(0, 0, 0, 0);
    return date;
}

function parseLocalDate(value) {
    if (!value) return null;
    if (value instanceof Date) return isNaN(value) ? null : value;

    var text = String(value).trim();
    var match = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
        return new Date(
            parseInt(match[1], 10),
            parseInt(match[2], 10) - 1,
            parseInt(match[3], 10)
        );
    }

    var parsed = new Date(text);
    return isNaN(parsed) ? null : parsed;
}

function paidRatio(order) {
    if (!order) return 0;
    if (order.paymentStatus === '已结清') return 1;
    if (order.paymentStatus === '部分付款') {
        var ratio = parseInt(order.paymentRatio, 10) || 0;
        return Math.min(Math.max(ratio, 0), 100) / 100;
    }
    return 0;
}

function paidAmount(order) {
    return (parseFloat(order && order.amount) || 0) * paidRatio(order);
}

function paidCost(order) {
    return (parseFloat(order && order.cost) || 0) * paidRatio(order);
}

function hasPayment(order) {
    return paidRatio(order) > 0;
}

function sumAmount(list) {
    return (list || []).reduce(function (sum, order) {
        return sum + (parseFloat(order && order.amount) || 0);
    }, 0);
}

function sumPaidAmount(list) {
    return (list || []).reduce(function (sum, order) {
        return sum + paidAmount(order);
    }, 0);
}

function sumPaidCost(list) {
    return (list || []).reduce(function (sum, order) {
        return sum + paidCost(order);
    }, 0);
}

function isTerminalStatus(order) {
    return order && (order.orderStatus === 'completed' || order.orderStatus === 'closed');
}

function isOverdue(order, referenceDate) {
    if (!order || !order.finalDate) return false;
    if (isTerminalStatus(order)) return false;

    var today = startOfLocalDay(referenceDate);
    var final = parseLocalDate(order.finalDate);
    if (!final) return false;
    final = startOfLocalDay(final);

    return final < today;
}

function isDueToday(order, referenceDate) {
    if (!order || !order.finalDate) return false;
    if (isTerminalStatus(order)) return false;

    var today = startOfLocalDay(referenceDate);
    var final = parseLocalDate(order.finalDate);
    if (!final) return false;
    final = startOfLocalDay(final);

    return final.getTime() === today.getTime();
}

function isActiveProcessing(order, referenceDate) {
    return !!order && order.orderStatus === 'processing' && !isOverdue(order, referenceDate);
}

module.exports = {
    localDateStr: localDateStr,
    parseLocalDate: parseLocalDate,
    paidRatio: paidRatio,
    paidAmount: paidAmount,
    paidCost: paidCost,
    hasPayment: hasPayment,
    sumAmount: sumAmount,
    sumPaidAmount: sumPaidAmount,
    sumPaidCost: sumPaidCost,
    isTerminalStatus: isTerminalStatus,
    isOverdue: isOverdue,
    isDueToday: isDueToday,
    isActiveProcessing: isActiveProcessing
};
