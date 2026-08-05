// const redis = require("redis");

// const client = redis.createClient();

// const LIMIT = 5;
// const WINDOW = 60;

// async function rateLimiter(req, res, next) {

//     const userId = req.user.id;

//     const key = `rate_limit:${userId}`;

//     const count = await client.incr(key);

//     if (count === 1) {
//         await client.expire(key, WINDOW);
//     }

//     if (count > LIMIT) {
//         return res.status(429).json({
//             success: false,
//             message: "Rate limit exceeded"
//         });
//     }

//     next();
// }

class TokenBucket {

    constructor(capacity, refillRate) {
        this.capacity = capacity;
        this.tokens = capacity;
        this.refillRate = refillRate;
        this.lastRefill = Date.now();
    }

    allowRequest () {

        const now = Date.now();

        const elapsed =
            (now - this.lastRefill) / 1000;

        const refillTokens =
            elapsed * this.refillRate;

        this.tokens = Math.min(
            this.capacity,
            this.tokens + refillTokens
        );

        this.lastRefill = now;

        if (this.tokens >= 1) {
            this.tokens--;
            return true;
        }

        return false;
    }
}