## 2026-03-14 - Prevent DoS and NoSQLi via query object parsing
**Vulnerability:** Express's qs query parser allows attackers to pass objects via URL brackets (e.g., `?tags[$ne]=1`). In `videos.js`, this object was directly split (`req.query.tags.split(',')`), causing a server crash (DoS). In other cases, passing these objects directly into MongoDB queries could lead to NoSQL injection.
**Learning:** Always explicitly validate that request query parameters expected to be strings are actually strings (`typeof === 'string'`) before using them in string operations or database queries, especially when using the default `qs` parser.
**Prevention:** Implement strict type validation (`typeof req.query.field === 'string'`) for all query parameters expected to be strings.
