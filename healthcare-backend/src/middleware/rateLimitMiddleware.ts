import rateLimit from 'express-rate-limit';

export const rateLimitAuth = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 requests per windowMs
    message: 'Too many requests from this IP, please try again after 15 minutes'
});

export const rateLimitFiles = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // Limit each IP to 10 requests per windowMs
    message: 'Too many file uploads from this IP, please try again after an hour'
});

export const rateLimitPayments = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 20, // Limit each IP to 20 requests per windowMs
    message: 'Too many payment requests from this IP, please try again after an hour'
});
