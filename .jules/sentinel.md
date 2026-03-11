
## 2024-05-20 - [MEDIUM] Fix insecure random generation for file uploads
**Vulnerability:** Found uses of `Math.random()` to generate parts of file names for user uploaded video/thumbnails (`backend/src/middleware/upload.js`) and avatars (`backend/src/middleware/avatarUpload.js`). `Math.random()` is not cryptographically secure, and its outputs can be predictable.
**Learning:** In the context of a video platform with user uploads, predictable filenames can lead to file enumeration, potentially allowing attackers to discover or overwrite other users' files if they can predict the name. Cryptographically secure random generation is strictly enforced over `Math.random()` for generating sensitive data such as uploaded file names.
**Prevention:** Use `crypto.randomBytes(n).toString('hex')` instead of `Math.round(Math.random() * max_val)` whenever generating random identifiers, file names, or tokens to prevent predictable outputs.
