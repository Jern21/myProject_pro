'use strict';

var fs = require('fs');
var path = require('path');
var test = require('node:test');
var assert = require('node:assert/strict');
var dataBackups = require('../src/utils/data-backups');

var TEST_FILE = '__codex_test_backups';
var TEST_PATH = dataBackups.getDataFilePath(TEST_FILE);
var TEST_BACKUP_DIR = path.join(dataBackups.BACKUP_DIR, TEST_FILE);

function cleanup() {
    if (path.basename(TEST_PATH) !== TEST_FILE + '.json') {
        throw new Error('unsafe test data path');
    }
    if (path.basename(TEST_BACKUP_DIR) !== TEST_FILE) {
        throw new Error('unsafe test backup path');
    }
    if (fs.existsSync(TEST_PATH)) fs.unlinkSync(TEST_PATH);
    if (fs.existsSync(TEST_BACKUP_DIR)) fs.rmSync(TEST_BACKUP_DIR, { recursive: true, force: true });
}

test('data backups create snapshots and restore a single file', function (t) {
    cleanup();
    t.after(cleanup);

    dataBackups.writeJsonFile(TEST_FILE, [{ id: 'original', value: 1 }], { backup: false });
    dataBackups.writeJsonFile(TEST_FILE, [{ id: 'changed', value: 2 }]);

    var backups = dataBackups.listBackups(TEST_FILE);
    assert.equal(backups.length, 1);
    assert.equal(backups[0].itemCount, 1);
    assert.equal(dataBackups.readJsonFile(TEST_FILE, [])[0].id, 'changed');

    dataBackups.restoreBackup(TEST_FILE, backups[0].name);
    assert.equal(dataBackups.readJsonFile(TEST_FILE, [])[0].id, 'original');
});

test('data backup paths reject unsafe names', function () {
    assert.throws(function () {
        dataBackups.getDataFilePath('../orders');
    }, /非法数据文件名/);

    assert.throws(function () {
        dataBackups.getBackupPath('orders', 'customers-2026.json');
    }, /备份文件与数据文件不匹配/);
});
