# SecTube AI Services

This directory contains all AI-powered features for the SecTube platform.

## Architecture

```
services/ai/
├── index.js                      # Central export for all AI services
├── chat.service.js               # Conversational AI chatbot
├── recommendation.service.js     # Video recommendations (TODO)
├── contentAnalysis.service.js    # Content analysis & tagging (TODO)
├── moderation.service.js         # Content moderation (TODO)
├── tools/
│   └── toolExecutor.js          # MCP tool execution
└── utils/
    └── sanitizer.js             # Data sanitization
```

## Services

### 1. **Chat Service** ✅ (Implemented)
Conversational AI assistant that helps users:
- Find cybersecurity videos
- Manage their accounts
- Answer security questions
- Navigate the platform

**Tech Stack:**
- OpenRouter API (model: `arcee-ai/trinity-large-preview:free`)
- MCP (Model Context Protocol) for tool calling
- JWT-based authentication for user actions

**Usage:**
```javascript
import { chatService } from './services/ai/index.js';

const result = await chatService.chat(messages, userToken, availableTools);
```

### 2. **Recommendation Service** 🚧 (Planned)
AI-powered personalized video recommendations:
- Analyze user watch history and preferences
- Collaborative filtering
- Content-based recommendations
- Similar video suggestions

**Future Implementation:**
- User behavior analysis
- Embedding-based similarity
- Real-time recommendation updates

### 3. **Content Analysis Service** 🚧 (Planned)
Automatic content analysis and metadata generation:
- Transcript analysis and summarization
- Automatic tag generation
- Difficulty level suggestion
- Topic extraction
- Security tool identification

**Future Implementation:**
- Video transcript processing
- NLP-based content understanding
- Metadata enrichment

### 4. **Moderation Service** 🚧 (Planned)
AI-powered content moderation:
- Comment spam detection
- Policy violation detection
- Video compliance checking
- Abuse report analysis
- Malicious link detection

**Future Implementation:**
- Multi-stage moderation pipeline
- Automated flagging system
- Community safety features

## Adding New AI Features

### Step 1: Create a new service file
```javascript
// services/ai/newFeature.service.js
export const newFeatureService = {
  async doSomething(params) {
    // Implementation
  }
};
```

### Step 2: Export from index.js
```javascript
// services/ai/index.js
export { newFeatureService } from './newFeature.service.js';
```

### Step 3: Create controller/route
```javascript
// controllers/aiFeature.js
import { newFeatureService } from '../services/ai/index.js';

export const useFeature = async (req, res) => {
  const result = await newFeatureService.doSomething(req.body);
  res.json(result);
};
```

## Environment Variables

```env
# Required for all AI services
OPENROUTER_API_KEY=your_api_key_here
CHAT_MODEL=arcee-ai/trinity-large-preview:free
BACKEND_URL=http://localhost:5000

# Future: Service-specific configs
# RECOMMENDATION_MODEL=...
# MODERATION_THRESHOLD=0.8
```

## Security

All AI services use the **data sanitizer** to remove sensitive information:
- Passwords & tokens
- API keys & secrets
- Authentication credentials
- Two-factor secrets

Sensitive data is **never** sent to AI models.

## Cost Management

Current setup uses **free OpenRouter models**:
- `arcee-ai/trinity-large-preview:free` (chat)
- Future services will also prioritize free/open-source models

For production, consider:
- Rate limiting AI endpoints
- Caching frequent responses
- Monitoring API usage
- Budget alerts

## Testing

```bash
# Test chat service
curl -X POST http://localhost:5000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Hello"}]}'
```

## Roadmap

- [x] Conversational AI chatbot
- [ ] Personalized video recommendations
- [ ] Automatic content tagging
- [ ] Comment moderation
- [ ] Transcript analysis
- [ ] Security assessment suggestions
- [ ] Learning path recommendations
- [ ] Real-time vulnerability alerts
