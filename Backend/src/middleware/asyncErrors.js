import Layer from 'express/lib/router/layer.js';

// Express 4 does not catch rejected promises from async handlers: the request never gets a
// response (client/nginx times out) and the rejection surfaces as an unhandledRejection.
// Forward them to next(err) so they end up in errorHandler as a normal 500.
Layer.prototype.handle_request = function handleRequest(req, res, next) {
    const fn = this.handle;
    if (fn.length > 3) return next();

    try {
        const result = fn(req, res, next);
        if (result && typeof result.catch === 'function') result.catch(next);
    } catch (err) {
        next(err);
    }
};
