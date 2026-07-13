'use strict';

var test = require('node:test');
var assert = require('node:assert/strict');
var rules = require('../src/utils/order-rules');

test('order payment helpers calculate paid amount and cost consistently', function () {
    assert.equal(rules.paidAmount({ amount: 1000, paymentStatus: '未付款' }), 0);
    assert.equal(rules.paidAmount({ amount: 1000, paymentStatus: '部分付款', paymentRatio: 50 }), 500);
    assert.equal(rules.paidCost({ cost: 300, paymentStatus: '部分付款', paymentRatio: 50 }), 150);
    assert.equal(rules.paidAmount({ amount: 1000, paymentStatus: '部分付款', paymentRatio: 150 }), 1000);
    assert.equal(rules.paidAmount({ amount: 1000, paymentStatus: '已结清' }), 1000);
    assert.equal(rules.sumPaidAmount([
        { amount: 1000, paymentStatus: '部分付款', paymentRatio: 50 },
        { amount: 300, paymentStatus: '未付款' },
        { amount: 200, paymentStatus: '已结清' }
    ]), 700);
});

test('active processing excludes overdue and terminal orders', function () {
    var today = new Date(2026, 6, 13);

    assert.equal(rules.isActiveProcessing({
        orderStatus: 'processing',
        finalDate: '2026-07-14'
    }, today), true);

    assert.equal(rules.isActiveProcessing({
        orderStatus: 'processing',
        finalDate: '2026-07-12'
    }, today), false);

    assert.equal(rules.isOverdue({
        orderStatus: 'completed',
        finalDate: '2026-07-12'
    }, today), false);

    assert.equal(rules.isDueToday({
        orderStatus: 'processing',
        finalDate: '2026-07-13'
    }, today), true);
});
