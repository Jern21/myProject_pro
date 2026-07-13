/**
 * JSON 文件存储工具
 *
 * 提供对 data/ 目录下 JSON 文件的通用 CRUD 操作。
 * 所有数据文件都以 { id: string, ...fields } 的数组形式存储。
 *
 * 用法：
 *   const Storage = require('./storage');
 *   const orders = new Storage('orders');
 *   const all = orders.findAll();
 *   const one = orders.findById('123');
 *   const created = orders.create({ name: 'test' });
 *   const updated = orders.update('123', { name: 'new' });
 *   orders.remove('123');
 */
'use strict';

const fs = require('fs');
const dataBackups = require('./data-backups');

/**
 * 生成唯一 ID（时间戳 + 随机串）
 */
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

class Storage {
    /**
     * @param {string} fileName - 文件名（不含 .json 后缀）
     */
    constructor(fileName) {
        this.fileName = fileName;
        this.filePath = dataBackups.getDataFilePath(fileName);
        this._ensureFile();
    }

    /**
     * 确保数据文件存在，不存在则创建空数组
     */
    _ensureFile() {
        dataBackups.ensureDir(dataBackups.DATA_DIR);
        if (!fs.existsSync(this.filePath)) {
            this._write([], { backup: false });
        }
    }

    /**
     * 读取整个 JSON 数组
     * @returns {Array}
     */
    _read() {
        try {
            const raw = fs.readFileSync(this.filePath, 'utf-8');
            const data = JSON.parse(raw);
            return Array.isArray(data) ? data : [];
        } catch (e) {
            console.error('[Storage] 读取文件失败:', this.filePath, e.message);
            return [];
        }
    }

    /**
     * 写入 JSON 数组
     * @param {Array} data
     */
    _write(data, options) {
        options = options || {};
        if (!Array.isArray(data)) {
            throw new Error('Storage 只能写入数组数据: ' + this.fileName);
        }

        try {
            dataBackups.writeJsonFile(this.fileName, data, options);
        } catch (e) {
            console.error('[Storage] 写入文件失败:', this.filePath, e.message);
            throw e;
        }
    }

    /**
     * 写入前备份当前数据文件，并保留最近 MAX_BACKUPS_PER_FILE 份。
     */
    _backupCurrentFile() {
        return dataBackups.createBackup(this.fileName);
    }

    /**
     * 手动列出备份，便于后续恢复工具使用。
     */
    listBackups() {
        return dataBackups.listBackups(this.fileName);
    }

    /**
     * 查询全部数据
     * @param {Object} [filter] - 可选的过滤条件（简易键值匹配）
     * @returns {Array}
     */
    findAll(filter) {
        let data = this._read();
        if (filter && typeof filter === 'object') {
            data = data.filter(function (item) {
                return Object.keys(filter).every(function (key) {
                    return item[key] === filter[key];
                });
            });
        }
        return data;
    }

    /**
     * 按 ID 查找
     * @param {string} id
     * @returns {Object|null}
     */
    findById(id) {
        return this._read().find(function (item) {
            return item.id === id;
        }) || null;
    }

    /**
     * 创建新记录
     * @param {Object} data - 不含 id 和时间戳
     * @returns {Object} 创建后的完整记录
     */
    create(data) {
        var all = this._read();
        var now = new Date().toISOString();
        var record = Object.assign({}, data, {
            id: generateId(),
            createdAt: now,
            updatedAt: now
        });
        all.unshift(record); // 最新的排在前面
        this._write(all);
        return record;
    }

    /**
     * 批量创建
     * @param {Array} items
     * @returns {Array}
     */
    createMany(items) {
        var all = this._read();
        var now = new Date().toISOString();
        var records = items.map(function (item) {
            return Object.assign({}, item, {
                id: generateId(),
                createdAt: now,
                updatedAt: now
            });
        });
        all = records.concat(all);
        this._write(all);
        return records;
    }

    /**
     * 按 ID 更新（部分更新，merge 模式）
     * @param {string} id
     * @param {Object} patch - 要更新的字段
     * @returns {Object|null} 更新后的完整记录，不存在返回 null
     */
    update(id, patch) {
        var all = this._read();
        var idx = all.findIndex(function (item) {
            return item.id === id;
        });
        if (idx === -1) return null;

        all[idx] = Object.assign({}, all[idx], patch, {
            updatedAt: new Date().toISOString()
        });
        this._write(all);
        return all[idx];
    }

    /**
     * 按 ID 删除
     * @param {string} id
     * @returns {boolean} 是否删除成功
     */
    remove(id) {
        var all = this._read();
        var before = all.length;
        var filtered = all.filter(function (item) {
            return item.id !== id;
        });
        if (filtered.length === before) return false;
        this._write(filtered);
        return true;
    }

    /**
     * 批量删除
     * @param {Array<string>} ids
     * @returns {number} 删除的数量
     */
    removeMany(ids) {
        var all = this._read();
        var idSet = new Set(ids);
        var filtered = all.filter(function (item) {
            return !idSet.has(item.id);
        });
        var removed = all.length - filtered.length;
        if (removed > 0) this._write(filtered);
        return removed;
    }

    /**
     * 清空所有数据
     */
    clear() {
        this._write([]);
    }

    /**
     * 统计总数
     * @returns {number}
     */
    count() {
        return this._read().length;
    }
}

module.exports = Storage;
module.exports.generateId = generateId;
