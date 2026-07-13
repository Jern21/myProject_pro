/**
 * 统一 API 封装层
 *
 * 功能：
 *   - 统一 baseURL 配置
 *   - 自动 JSON 序列化/反序列化
 *   - 统一错误处理
 *   - 请求/响应拦截器
 *   - 支持 loading 状态自动管理
 *   - 支持全局错误提示
 *
 * 用法：
 *   api.get('/orders')                    // GET 请求
 *   api.post('/orders', data)             // POST 请求
 *   api.put('/orders/123', data)          // PUT 请求
 *   api.delete('/orders/123')             // DELETE 请求
 *   api.request({ url, method, data })    // 自定义请求
 */
(function () {
    'use strict';

    // ========== 配置 ==========
    var CONFIG = {
        baseURL: '',  // 空表示使用相对路径
        timeout: 30000,  // 30秒超时
        retryCount: 1,   // 失败重试次数
        retryDelay: 1000 // 重试间隔(ms)
    };

    // ========== 拦截器 ==========
    var interceptors = {
        request: [],
        response: [],
        error: []
    };

    // ========== 工具函数 ==========

    /**
     * 合并 URL
     */
    function mergeURL(url) {
        if (url.startsWith('http://') || url.startsWith('https://')) {
            return url;
        }
        var base = CONFIG.baseURL || '';
        if (base && base.endsWith('/')) base = base.slice(0, -1);
        if (url && !url.startsWith('/')) url = '/' + url;
        return base + url;
    }

    /**
     * 延迟函数
     */
    function delay(ms) {
        return new Promise(function (resolve) {
            setTimeout(resolve, ms);
        });
    }

    /**
     * 执行拦截器链
     */
    function runInterceptors(type, data) {
        var chain = interceptors[type];
        var result = data;
        for (var i = 0; i < chain.length; i++) {
            try {
                result = chain[i](result);
                // 支持异步拦截器
                if (result && typeof result.then === 'function') {
                    return result;
                }
            } catch (e) {
                console.error('Interceptor error:', e);
            }
        }
        return result;
    }

    // ========== 核心请求函数 ==========

    /**
     * 发起 HTTP 请求
     */
    function request(config) {
        config = config || {};

        // 标准化配置
        if (typeof config === 'string') {
            config = { url: config, method: 'GET' };
        }

        var url = mergeURL(config.url || '');
        var method = (config.method || 'GET').toUpperCase();
        var data = config.data;
        var options = config.options || {};

        // 请求拦截
        var interceptedConfig = runInterceptors('request', {
            url: url,
            method: method,
            data: data,
            headers: Object.assign({
                'Accept': 'application/json'
            }, options.headers || {})
        });

        // 处理异步拦截器结果
        if (interceptedConfig && typeof interceptedConfig.then === 'function') {
            return interceptedConfig.then(function (cfg) {
                return doRequest(cfg, config.retryCount || CONFIG.retryCount);
            });
        }

        return doRequest(interceptedConfig, config.retryCount || CONFIG.retryCount);
    }

    /**
     * 执行实际请求（支持重试）
     */
    function doRequest(config, retriesLeft) {
        var url = config.url;
        var method = config.method;
        var data = config.data;
        var headers = config.headers;

        // 准备 fetch 选项
        var fetchOptions = {
            method: method,
            headers: headers,
            credentials: 'same-origin'
        };

        // 处理请求体
        if (data !== undefined && data !== null) {
            if (method === 'GET' || method === 'HEAD') {
                // GET 请求将 data 转为 query string
                var params = new URLSearchParams();
                if (typeof data === 'object') {
                    Object.keys(data).forEach(function (key) {
                        params.append(key, data[key]);
                    });
                }
                var qs = params.toString();
                if (qs) url = url + (url.indexOf('?') > -1 ? '&' : '?') + qs;
            } else {
                // POST/PUT/DELETE 请求
                if (typeof data === 'object' && !(data instanceof FormData)) {
                    fetchOptions.body = JSON.stringify(data);
                    headers['Content-Type'] = 'application/json';
                } else {
                    fetchOptions.body = data;
                }
            }
        }

        // 发起请求
        return fetch(url, fetchOptions)
            .then(function (response) {
                // 响应拦截
                return runInterceptors('response', response);
            })
            .then(function (response) {
                // 解析响应
                if (!response.ok) {
                    throw new Error('HTTP ' + response.status + ': ' + response.statusText);
                }

                // 根据 Content-Type 解析
                var contentType = response.headers.get('content-type') || '';
                if (contentType.indexOf('application/json') > -1) {
                    return response.json();
                }
                return response.text();
            })
            .catch(function (error) {
                // 错误拦截
                var interceptedError = runInterceptors('error', error);

                // 重试逻辑
                if (retriesLeft > 0) {
                    return delay(CONFIG.retryDelay).then(function () {
                        return doRequest(config, retriesLeft - 1);
                    });
                }

                throw interceptedError || error;
            });
    }

    // ========== 快捷方法 ==========

    function get(url, params, options) {
        return request({
            url: url,
            method: 'GET',
            data: params,
            options: options
        });
    }

    function post(url, data, options) {
        return request({
            url: url,
            method: 'POST',
            data: data,
            options: options
        });
    }

    function put(url, data, options) {
        return request({
            url: url,
            method: 'PUT',
            data: data,
            options: options
        });
    }

    function del(url, options) {
        return request({
            url: url,
            method: 'DELETE',
            options: options
        });
    }

    // ========== 拦截器注册 ==========

    function addRequestInterceptor(fn) {
        interceptors.request.push(fn);
    }

    function addResponseInterceptor(fn) {
        interceptors.response.push(fn);
    }

    function addErrorInterceptor(fn) {
        interceptors.error.push(fn);
    }

    // ========== 配置 ==========

    function setConfig(newConfig) {
        Object.assign(CONFIG, newConfig);
    }

    // ========== 暴露 API ==========

    window.api = {
        request: request,
        get: get,
        post: post,
        put: put,
        delete: del,
        config: setConfig,
        interceptors: {
            request: addRequestInterceptor,
            response: addResponseInterceptor,
            error: addErrorInterceptor
        }
    };

})();
