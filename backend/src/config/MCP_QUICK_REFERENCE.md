# MCP Quick Reference - SecTube AI Agent

## Tool Naming Pattern
`{method}_{path}` → Example: `get_videos`, `patch_auth_profile`

## Common Tools

### User & Profile
```
get_auth_me                      # Get current user info
patch_auth_profile               # Update bio, displayName, socialLinks, specialties
```

### Videos
```
get_videos                       # List with filters: search, category, difficulty, limit, sort
get_videos_id                    # Get single video
post_videos_id_like              # Like video
delete_videos_id_like            # Unlike video
post_videos_id_save              # Save video
delete_videos_id_save            # Unsave video
```

### Channels & Users
```
get_users_username               # Get user profile
get_users_username_videos        # Get user's videos
post_users_id_subscribe          # Subscribe to channel
delete_users_id_subscribe        # Unsubscribe
get_channels                     # List featured channels
get_channels_username            # Get channel details
```

### History & Saved
```
get_users_me_saved               # User's saved videos
get_users_me_history             # Watch history
post_videos_id_history           # Add to history
```

## Parameter Types

**Path params:** `{id}` → Replaced in URL
**Query params (GET):** `?key=value` → For filtering/pagination
**Body params (POST/PATCH):** JSON payload → For creating/updating

## Video Filters
```javascript
{
  search: "XSS attack",
  category: "Web Application Security",
  difficulty: "Intermediate", // Beginner|Intermediate|Advanced|Expert
  tags: "OWASP",
  sort: "popular",            // recent|popular|views
  limit: 12,
  page: 1
}
```

## Categories
- Web Application Security
- Network Security
- Bug Bounty
- Penetration Testing
- Malware Analysis
- Reverse Engineering
- Mobile Security
- Cloud Security
- CTF Writeup
- OSINT
- Cryptography
- IoT Security
- Security Tools
- Tutorial

## Response Format
```json
{
  "success": true|false,
  "data": {...},
  "message": "Optional message",
  "count": 50,      // For lists
  "total": 500,     // For lists
  "page": 1,        // For lists
  "pages": 10       // For lists
}
```

## Common Errors
- **401:** User not logged in
- **403:** Insufficient permissions
- **404:** Resource not found
- **400:** Invalid parameters
- **500:** Server error

## Best Practices
1. ✅ Use filters to limit results (`limit`, `category`, `sort`)
2. ✅ Interpret data before presenting (don't show raw JSON)
3. ✅ Handle errors with user-friendly messages
4. ✅ Batch related actions (fewer tool calls)
5. ❌ Don't show sensitive data (passwords, tokens, keys)
6. ❌ Don't make excessive API calls
7. ❌ Don't use emojis in responses

## Example Workflows

**Update user bio:**
```
1. patch_auth_profile({ bio: "New bio text" })
```

**Find and like video:**
```
1. get_videos({ search: "SQL injection", limit: 5 })
2. post_videos_id_like({ id: <video_id> })
```

**Get user's content:**
```
1. get_auth_me()
2. get_users_username_videos({ username: <from_step_1> })
```

**Subscribe to channel:**
```
1. get_users_username({ username: "channelName" })
2. post_users_id_subscribe({ id: <user_id_from_step_1> })
```
