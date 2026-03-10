## 2024-05-18 - Content Security Policy Disabled for Swagger UI
**Vulnerability:** Content Security Policy (CSP) was fully disabled (`contentSecurityPolicy: false`) via helmet in `backend/src/server.js` globally.
**Learning:** This was likely done to accommodate `swagger-ui-express` which uses inline scripts and styles. However, completely disabling CSP leaves the entire API vulnerable to XSS.
**Prevention:** Instead of completely disabling CSP, configure it to allow `'unsafe-inline'` for `scriptSrc` and `styleSrc` directives while enforcing domain restrictions for other sources (e.g., `imgSrc` restricted to known image hosts like cloudinary, github/google avatars, etc.).
