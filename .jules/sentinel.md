## 2024-03-07 - Pagination Limit DoS
**Vulnerability:** Pagination endpoints lacked constraints on `req.query.limit` and negative values for `req.query.page`. Mongoose accepts arbitrarily large limit integers or negative integers which can cause DoS or DB exhaustion.
**Learning:** `limit` and `page` derived from `req.query` should always be constrained to min and max boundaries. Negative numbers, zeros or huge numbers cause unintended consequences. Mongoose's `.limit()` processes all provided numbers.
**Prevention:** Always use `Math.max(1, parseInt(req.query.page, 10) || 1)` and `Math.max(1, Math.min(parseInt(req.query.limit, 10) || DEFAULT, 100))` on numeric query parameters prior to passing them into a database query.
