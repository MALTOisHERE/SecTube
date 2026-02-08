# Contributing to CyberStream

Thank you for considering contributing to CyberStream! This document provides guidelines and instructions for contributing.

## Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Follow responsible disclosure for security issues
- Respect the educational nature of the platform

## How to Contribute

### Reporting Bugs

1. Check if the bug has already been reported in Issues
2. Create a new issue with:
   - Clear title and description
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots if applicable
   - Environment details (OS, Node version, etc.)

### Suggesting Features

1. Check existing feature requests
2. Create an issue with:
   - Clear use case
   - Proposed solution
   - Alternative approaches considered
   - Impact on existing features

### Submitting Code

1. **Fork the repository**
   ```bash
   git fork https://github.com/yourusername/cyberstream
   ```

2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```

3. **Make your changes**
   - Follow existing code style
   - Write clear commit messages
   - Add tests if applicable
   - Update documentation

4. **Test your changes**
   ```bash
   # Backend tests
   cd backend
   npm test

   # Frontend tests
   cd frontend
   npm test
   ```

5. **Commit your changes**
   ```bash
   git commit -m "Add amazing feature"
   ```

6. **Push to your fork**
   ```bash
   git push origin feature/amazing-feature
   ```

7. **Open a Pull Request**
   - Provide clear description
   - Reference related issues
   - Include screenshots for UI changes

## Development Guidelines

### Code Style

#### Backend (Node.js)
- Use ES6+ features
- Follow async/await pattern
- Use meaningful variable names
- Add JSDoc comments for functions
- Handle errors properly

```javascript
// Good
async function getUserVideos(userId, options = {}) {
  try {
    const videos = await Video.find({ uploader: userId })
      .limit(options.limit || 10)
      .sort('-createdAt');
    return videos;
  } catch (error) {
    throw new Error(`Failed to fetch videos: ${error.message}`);
  }
}

// Avoid
function getVids(id) {
  return Video.find({uploader: id}).then(v => v).catch(e => console.log(e));
}
```

#### Frontend (React)
- Use functional components with hooks
- Follow React best practices
- Use meaningful component names
- Keep components focused and reusable
- Use proper prop types

```jsx
// Good
const VideoCard = ({ video }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/video/${video._id}`);
  };

  return (
    <div onClick={handleClick}>
      <h3>{video.title}</h3>
    </div>
  );
};

// Avoid
const Card = (props) => {
  return <div onClick={() => window.location = '/video/' + props.v.id}>{props.v.t}</div>
}
```

### Commit Messages

Follow conventional commits:

```
feat: add live streaming support
fix: resolve video upload timeout issue
docs: update API documentation
style: format code with prettier
refactor: simplify video processing logic
test: add unit tests for auth controller
chore: update dependencies
```

### Testing

- Write tests for new features
- Ensure existing tests pass
- Aim for good code coverage

```javascript
// Example test
describe('Video Upload', () => {
  it('should upload video successfully', async () => {
    const response = await request(app)
      .post('/api/videos/upload')
      .attach('video', 'test/fixtures/sample.mp4')
      .field('title', 'Test Video')
      .expect(201);

    expect(response.body.success).toBe(true);
  });
});
```

## Project Structure

When adding new files, follow this structure:

### Backend
```
backend/src/
├── controllers/      # Route handlers
├── models/          # Database schemas
├── routes/          # API routes
├── middleware/      # Custom middleware
├── utils/           # Helper functions
└── config/          # Configuration files
```

### Frontend
```
frontend/src/
├── components/      # Reusable components
├── pages/          # Page components
├── services/       # API clients
├── store/          # State management
├── hooks/          # Custom hooks
└── utils/          # Helper functions
```

## Areas for Contribution

### High Priority
- [ ] Live streaming functionality
- [ ] Real-time chat
- [ ] Improved video player with quality selector
- [ ] Mobile responsive improvements
- [ ] Performance optimizations

### Medium Priority
- [ ] User notifications system
- [ ] Playlist feature
- [ ] Advanced search filters
- [ ] Video recommendations
- [ ] Analytics dashboard

### Documentation
- [ ] API documentation
- [ ] Component documentation
- [ ] Tutorial videos
- [ ] Deployment guides

### Testing
- [ ] Unit tests
- [ ] Integration tests
- [ ] E2E tests
- [ ] Performance tests

## Security Contributions

If you find a security vulnerability:

1. **DO NOT** open a public issue
2. Email security concerns to: security@cyberstream.example
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

We will:
- Acknowledge within 48 hours
- Investigate and develop a fix
- Credit you in the security advisory (if desired)

## Review Process

1. **Automated Checks**
   - Code formatting
   - Linting
   - Tests
   - Build process

2. **Code Review**
   - At least one maintainer review required
   - Address feedback
   - Ensure CI passes

3. **Merge**
   - Squash commits
   - Update changelog
   - Deploy to staging (if applicable)

## Getting Help

- **Discord**: Join our community server
- **Issues**: Tag with "question" or "help wanted"
- **Discussions**: Use GitHub Discussions for general questions

## Recognition

Contributors will be:
- Listed in CONTRIBUTORS.md
- Mentioned in release notes
- Featured on the website (for significant contributions)

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to CyberStream! 🎉
