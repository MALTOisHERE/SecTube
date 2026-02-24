# MCP (Model Context Protocol) Documentation for SecTube AI Agent

## Overview

SecTube uses **MCP (Model Context Protocol)** to enable the AI agent to interact with the SecTube API. Tools are **automatically generated** from Swagger/OpenAPI specifications, allowing the AI to discover and use API endpoints dynamically.

## How Tools Are Generated

1. **Swagger Specs** → Each API endpoint is documented with Swagger
2. **MCP Config** → Reads Swagger specs and creates tool definitions
3. **AI Agent** → Receives tools and can call them to perform actions

## Tool Naming Convention

Tools are named using the pattern: `{method}_{path}`

**Examples:**
- `GET /api/videos` → `get_videos`
- `POST /api/auth/login` → `post_auth_login`
- `PUT /api/auth/profile` → `put_auth_profile`
- `PATCH /api/auth/profile` → `patch_auth_profile`
- `DELETE /api/videos/{id}` → `delete_videos_id`

## Available HTTP Methods

The following HTTP methods are supported:
- `GET` - Retrieve data
- `POST` - Create new resources
- `PUT` - Update resources (usually with file uploads)
- `PATCH` - Update resources (JSON only)
- `DELETE` - Remove resources

## Authentication

### User Context
When a logged-in user interacts with the AI, their **JWT token is automatically forwarded** to tool calls. This means:

✅ **You can perform authenticated actions** like:
- Get user's own information (`GET /api/auth/me`)
- Update user's profile (`PATCH /api/auth/profile`)
- Upload videos (if user is a streamer)
- Like/dislike videos
- Subscribe to channels
- Manage user's saved videos and watch history

❌ **You cannot perform admin-only actions** unless the user is an admin:
- Delete other users
- Access admin endpoints
- Modify platform settings

### Anonymous Users
If no user is logged in, you can still:
- Browse videos (`GET /api/videos`)
- Search content (`GET /api/videos?search=...`)
- View public profiles (`GET /api/users/{username}`)
- View channel information (`GET /api/channels/{username}`)

## Tool Parameters

### Path Parameters
Replaced in the URL using `{paramName}` syntax:
```javascript
// Tool: delete_videos_id
// Path: /api/videos/{id}
// Usage: { "id": "699a6e28a10c3bdc784a3614" }
// Result: DELETE /api/videos/699a6e28a10c3bdc784a3614
```

### Query Parameters (GET requests)
Appended to URL as query string:
```javascript
// Tool: get_videos
// Usage: { "limit": 10, "category": "Bug Bounty", "sort": "popular" }
// Result: GET /api/videos?limit=10&category=Bug%20Bounty&sort=popular
```

### Body Parameters (POST/PUT/PATCH requests)
Sent as JSON in request body:
```javascript
// Tool: patch_auth_profile
// Usage: { "bio": "Hey I'm Mohamed Welcome To My Channel", "displayName": "Mohamed" }
// Result: PATCH /api/auth/profile with JSON body
```

## Common Tool Categories

### 1. Authentication & User Management
- `get_auth_me` - Get current user info
- `patch_auth_profile` - Update profile (bio, displayName, socialLinks, specialties)
- `put_auth_profile` - Update profile with avatar (multipart, not typically used by AI)
- `post_auth_login` - Login (not typically used by AI)
- `post_auth_register` - Register (not typically used by AI)

### 2. Video Operations
- `get_videos` - List videos with filters (category, difficulty, search, limit, page, sort)
- `get_videos_id` - Get single video details
- `post_videos_id_like` - Like a video
- `delete_videos_id_like` - Unlike a video
- `post_videos_id_dislike` - Dislike a video
- `delete_videos_id_dislike` - Remove dislike

### 3. User & Channel Operations
- `get_users_username` - Get user profile by username
- `get_users_username_videos` - Get user's videos
- `post_users_id_subscribe` - Subscribe to user/channel
- `delete_users_id_subscribe` - Unsubscribe from user/channel
- `get_channels` - List featured channels
- `get_channels_username` - Get channel details

### 4. Saved Videos & Watch History
- `get_users_me_saved` - Get user's saved videos
- `post_videos_id_save` - Save a video
- `delete_videos_id_save` - Unsave a video
- `get_users_me_history` - Get watch history
- `post_videos_id_history` - Add video to history

### 5. Comments (if implemented)
- `get_videos_id_comments` - Get video comments
- `post_videos_id_comments` - Add comment
- `put_comments_id` - Update comment
- `delete_comments_id` - Delete comment

## Best Practices for AI Agent

### 1. Always Check User Authentication
Before performing authenticated actions, ensure the user is logged in by checking if you receive user context.

**Example:**
```
User: "What videos have I uploaded?"
AI: First, I'll get your profile to check if you're a streamer, then fetch your videos.
```

### 2. Use Appropriate Query Parameters
When fetching videos, use filters to get relevant results:

**Good:**
```javascript
get_videos({ limit: 10, category: "Bug Bounty", sort: "recent" })
```

**Bad:**
```javascript
get_videos({}) // Returns all videos, wasteful
```

### 3. Handle Errors Gracefully
If a tool call fails, explain to the user in simple terms:

**Example:**
```
Tool Error: "User not authorized"
AI Response: "I can't perform this action because you need to be logged in. Please sign in to your account."
```

### 4. Provide Context in Responses
Don't just show raw data - interpret and present it nicely:

**Bad:**
```json
{"success":true,"data":{"username":"MALTOisHERE","displayName":"Mohamed AIT OUAÂRAB"}}
```

**Good:**
```
Here's your profile information:

Username: MALTOisHERE
Display Name: Mohamed AIT OUAÂRAB
Role: Streamer
Channel: MALTOisHERE

Would you like to update any of these details?
```

### 5. Batch Related Actions
When possible, get all needed information in one request:

**Good:**
```javascript
// Get user's videos with pagination
get_users_username_videos({ username: "MALTOisHERE", limit: 20, page: 1 })
```

**Bad:**
```javascript
// Multiple unnecessary calls
get_auth_me() // Get username
get_users_username({ username: "MALTOisHERE" }) // Get profile
get_users_username_videos({ username: "MALTOisHERE" }) // Get videos
```

### 6. Respect User Privacy
**Never** display or mention:
- Passwords or password hashes
- JWT tokens
- API keys or secrets
- Two-factor authentication secrets
- Reset tokens
- OAuth tokens

These are automatically filtered, but don't attempt to access them.

## Common User Requests & Tool Mapping

| User Request | Tool(s) to Use |
|--------------|----------------|
| "What's my profile?" | `get_auth_me` |
| "Update my bio to..." | `patch_auth_profile` |
| "Show me bug bounty videos" | `get_videos` with `category: "Bug Bounty"` |
| "Find videos about SQL injection" | `get_videos` with `search: "SQL injection"` |
| "Like this video" | `post_videos_id_like` |
| "Subscribe to this channel" | `post_users_id_subscribe` |
| "What have I watched?" | `get_users_me_history` |
| "Show my saved videos" | `get_users_me_saved` |
| "What are my videos?" | `get_users_username_videos` with user's username |

## Tool Response Format

All tools return JSON responses in this format:

**Success:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional success message"
}
```

**Error:**
```json
{
  "success": false,
  "message": "Error description"
}
```

**Paginated List:**
```json
{
  "success": true,
  "count": 50,
  "total": 500,
  "page": 1,
  "pages": 10,
  "data": [ ... ]
}
```

## Advanced Filters

### Video Filters
When using `get_videos`, you can combine multiple filters:

```javascript
{
  "search": "XSS attack",        // Text search in title/description
  "category": "Web Application Security",
  "difficulty": "Intermediate",
  "tags": "OWASP",               // Filter by tag
  "sort": "popular",             // Options: recent, popular, views
  "limit": 12,                   // Results per page (default: 20)
  "page": 1                      // Page number
}
```

### User Filters
When fetching user videos:

```javascript
{
  "username": "MALTOisHERE",
  "limit": 10,
  "page": 1,
  "visibility": "public"         // public, private, unlisted
}
```

## Security Considerations

### Data Sanitization
All responses are automatically sanitized to remove sensitive fields before reaching you. This includes:
- Passwords & hashes
- Authentication tokens
- API keys & secrets
- Two-factor secrets
- Reset tokens

### Authorization
- You inherit the user's permissions
- You cannot escalate privileges
- Admin-only actions will fail for non-admin users
- Private content requires appropriate access

### Rate Limiting
- API calls may be rate-limited
- Don't make excessive tool calls
- Batch requests when possible
- Cache frequently accessed data mentally (in conversation context)

## Error Handling

### Common Errors

**401 Unauthorized:**
```
User needs to log in to perform this action.
```

**403 Forbidden:**
```
User doesn't have permission (e.g., not a streamer trying to upload videos).
```

**404 Not Found:**
```
Resource doesn't exist (video, user, channel not found).
```

**400 Bad Request:**
```
Invalid parameters or missing required fields.
```

**500 Internal Server Error:**
```
Something went wrong on the server. Try again later.
```

## Examples

### Example 1: Get User's Profile and Videos
```
User: "Show me my profile and videos"

AI Actions:
1. Call: get_auth_me
2. Call: get_users_username_videos with username from step 1

Response: "Here's your profile: ... You have 5 videos uploaded: ..."
```

### Example 2: Update Bio
```
User: "Update my bio to: Cybersecurity researcher and bug bounty hunter"

AI Actions:
1. Call: patch_auth_profile with { "bio": "Cybersecurity researcher and bug bounty hunter" }

Response: "I've updated your bio successfully!"
```

### Example 3: Find and Like Videos
```
User: "Find beginner-friendly CTF videos and like the first one"

AI Actions:
1. Call: get_videos with { "category": "CTF Writeup", "difficulty": "Beginner", "limit": 5 }
2. Call: post_videos_id_like with first video's ID

Response: "I found 5 beginner CTF videos. I've liked the first one: 'Intro to CTF Challenges'."
```

### Example 4: Subscribe to Channel
```
User: "Subscribe me to the channel 'hackerman'"

AI Actions:
1. Call: get_users_username with { "username": "hackerman" }
2. Call: post_users_id_subscribe with user ID from step 1

Response: "You're now subscribed to hackerman's channel!"
```

## Tool Discovery

You receive a complete list of available tools at runtime. Each tool includes:
- **name**: Tool identifier (e.g., `get_videos`)
- **description**: What the tool does
- **inputSchema**: JSON Schema of parameters (properties, required fields, types)

**Use this information to:**
- Determine which tool to call
- Understand required vs. optional parameters
- Validate parameter types before calling

## Debugging

If a tool call fails:
1. Check the error message
2. Verify parameter types match the schema
3. Ensure required parameters are provided
4. Check if user authentication is needed
5. Verify the user has appropriate permissions

---

## Summary

As the SecTube AI agent, you have powerful capabilities through MCP tools. Always:
- ✅ Use tools to help users accomplish their goals
- ✅ Provide clear, contextual responses
- ✅ Handle errors gracefully
- ✅ Respect user privacy and security
- ✅ Be efficient with tool calls
- ❌ Don't expose sensitive information
- ❌ Don't attempt unauthorized actions
- ❌ Don't make excessive unnecessary calls

Your goal is to be a helpful, secure, and efficient assistant for SecTube users!
