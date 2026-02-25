# Contributing to SecTube

Thank you for considering contributing to SecTube! This document provides guidelines and instructions for contributing to the platform.

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
   You can fork the repository using the GitHub UI or via the GitHub CLI:
   ```bash
   gh repo fork MALTOisHERE/SecTube
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
   Currently, we are in the process of implementing a full test suite. Please ensure your changes:
   - Don't break the build (`npm run build`)
   - Are lint-free (`npm run lint` in the frontend)
   - Function as expected in the dev environment

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
- Use ES6+ features (ES Modules)
- Follow async/await pattern
- Use meaningful variable names
- Handle errors properly using the centralized error handler

```javascript
// Good
export const getUserVideos = async (userId, options = {}) => {
  try {
    const videos = await Video.find({ uploader: userId })
      .limit(options.limit || 10)
      .sort('-createdAt');
    return videos;
  } catch (error) {
    throw new Error(`Failed to fetch videos: ${error.message}`);
  }
}
```

#### Frontend (React)
- Use functional components with hooks
- Follow TailwindCSS for all styling
- Use Zustand for state management
- Use React Query (TanStack Query) for data fetching

```jsx
// Good
const VideoCard = ({ video }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/video/${video._id}`);
  };

  return (
    <div onClick={handleClick} className="bg-dark-900 rounded-lg overflow-hidden border border-dark-800 hover:border-primary-500 transition-all cursor-pointer">
      <h3 className="text-white font-medium p-3">{video.title}</h3>
    </div>
  );
};
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

## Project Structure

When adding new files, follow this structure:

### Backend
```
backend/src/
├── controllers/      # Route handlers
├── models/          # Database schemas
├── routes/          # API routes
├── middleware/      # Custom middleware
├── services/       # Business logic (AI, email, etc.)
├── utils/           # Helper functions (video processor, etc.)
└── config/          # Configuration files
```

### Frontend
```
frontend/src/
├── components/      # Reusable components
├── pages/          # Page components
├── services/       # API clients (axios instance)
├── store/          # State management (Zustand)
├── hooks/          # Custom hooks
└── config/          # Theme, constants, z-index
```

## Areas for Contribution

### High Priority
- [ ] Live streaming functionality (RTMP/WebRTC)
- [ ] Real-time user-to-user chat (Socket.io)
- [ ] Mobile responsive improvements
- [ ] Performance optimizations & Caching (Redis)

### Medium Priority
- [ ] User notifications system
- [ ] Playlist and collections feature
- [ ] Advanced search filters
- [ ] Analytics dashboard for streamers

### Documentation & Quality
- [ ] Comprehensive Test Suite (Jest/Cypress)
- [ ] API Documentation (Swagger)
- [ ] Deployment guides for different platforms

## Security Contributions

If you find a security vulnerability:

1. **DO NOT** open a public issue
2. Report security concerns to the maintainer via GitHub Private Vulnerability Reporting or contact the development team directly.
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

## Review Process

1. **Automated Checks**
   - Linting
   - Build process

2. **Code Review**
   - At least one maintainer review required
   - Address feedback
   - Ensure UI matches the "Cyber UI" aesthetic

3. **Merge**
   - Squash commits
   - Update changelog (if applicable)

## Getting Help

- **Issues**: Tag with "question" or "help wanted"
- **Discussions**: Use GitHub Discussions for general questions

## License

By contributing, you agree that your contributions will be licensed under the same terms as the project's [LICENSE](./LICENSE) (All Rights Reserved).

---

Thank you for contributing to SecTube! 🎉
