/**
 * 统一响应格式工具
 *
 * 成功：{ success: true, data: ... }
 * 失败：{ success: false, error: "...", code: ... }
 */
'use strict';

function success(res, data, status) {
    return res.status(status || 200).json({
        success: true,
        data: data
    });
}

function error(res, message, status) {
    return res.status(status || 400).json({
        success: false,
        error: message
    });
}

function notFound(res, message) {
    return res.status(404).json({
        success: false,
        error: message || '资源不存在'
    });
}

/**
 * 包装异步路由处理函数，自动捕获异常
 */
function asyncHandler(fn) {
    return function (req, res, next) {
        Promise.resolve(fn(req, res, next)).catch(function (err) {
            console.error('[API Error]', err);
            res.status(500).json({
                success: false,
                error: err.message || '服务器内部错误'
            });
        });
    };
}

module.exports = {
    success: success,
    error: error,
    notFound: notFound,
    asyncHandler: asyncHandler
};
