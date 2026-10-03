import rateLimit from 'express-rate-limit';
import { config } from '../config/env.js';

const windowMs = config.rateLimitWindowMinutes * 60 * 1000;
const dummyMiddleware = (req, res, next) => next();

export const apiRateLimiter = config.rateLimitEnabled === false
    ? dummyMiddleware
    : rateLimit({
        windowMs,
        max: config.rateLimitMaxRequests,
        standardHeaders: true,
        legacyHeaders: false,
        message: {
            success: false,
            message: 'Too many requests, please try again later.'
        }
    });

const authWindowMs = config.authRateLimitWindowMinutes * 60 * 1000;

export const authRateLimiter = config.rateLimitEnabled === false
    ? dummyMiddleware
    : rateLimit({
        windowMs: authWindowMs,
        max: config.authRateLimitMax,
        standardHeaders: true,
        legacyHeaders: false,
        message: {
            success: false,
            message: 'Too many authentication attempts. Please try again later.'
        }
    });

