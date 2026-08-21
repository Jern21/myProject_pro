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

function normalizePaymentRecords(value) {
    var raw = Array.isArray(value) ? value : (value && Array.isArray(value.paymentRecords) ? value.paymentRecords : []);
    return raw.map(function (item) {
        item = item || {};
        return {
            date: String(item.date || item.payDate || item.time || '').trim(),
            amount: Math.max(0, parseFloat(item.amount) || 0),
            note: String(item.note || item.remark || '').trim()
        };
    }).filter(function (item) {
        return item.date || item.amount > 0 || item.note;
    });
}

function paymentRecordAmount(order) {
    return normalizePaymentRecords(order).reduce(function (sum, item) {
        return sum + (parseFloat(item.amount) || 0);
    }, 0);
}

function fallbackPaymentDate(order) {
    return (order && (order.payDate || order.orderDate || (order.createdAt ? String(order.createdAt).slice(0, 10) : ''))) || '';
}

function paidRatio(order) {
    if (!order) return 0;
    var amount = parseFloat(order.amount) || 0;
    var recordAmount = paymentRecordAmount(order);
    if (recordAmount > 0 && amount > 0) return Math.min(recordAmount / amount, 1);
    if (order.paymentStatus === '已结清') return 1;
    if (order.paymentStatus === '部分付款') {
        var ratio = parseInt(order.paymentRatio, 10) || 0;
        return Math.min(Math.max(ratio, 0), 100) / 100;
    }
    return 0;
}

function paidAmount(order) {
    var amount = parseFloat(order && order.amount) || 0;
    var recordAmount = paymentRecordAmount(order);
    if (recordAmount > 0) return amount > 0 ? Math.min(recordAmount, amount) : recordAmount;
    return amount * paidRatio(order);
}

function paidCost(order) {
    return (parseFloat(order && order.cost) || 0) * paidRatio(order);
}

function hasPayment(order) {
    return paidAmount(order) > 0;
}

function paymentEntries(order) {
    if (!order) return [];
    var records = normalizePaymentRecords(order).filter(function (item) {
        return (parseFloat(item.amount) || 0) > 0;
    });
    if (records.length) {
        var orderAmount = parseFloat(order.amount) || 0;
        var remaining = orderAmount > 0 ? orderAmount : Infinity;
        return records.map(function (item) {
            var amount = Math.min(parseFloat(item.amount) || 0, remaining);
            remaining -= amount;
            return {
                date: item.date || fallbackPaymentDate(order),
                amount: amount,
                note: item.note || ''
            };
        }).filter(function (item) {
            return item.date && item.amount > 0;
        });
    }

    var amount = paidAmount(order);
    var date = fallbackPaymentDate(order);
    if (!date || amount <= 0) return [];
    return [{ date: date, amount: amount, note: '' }];
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
    normalizePaymentRecords: normalizePaymentRecords,
    paymentRecordAmount: paymentRecordAmount,
    paymentEntries: paymentEntries,
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
