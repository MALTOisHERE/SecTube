import passport from 'passport';
import { Strategy as GitHubStrategy } from 'passport-github2';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/User.js';
import dotenv from 'dotenv';

dotenv.config();

// Status flags
export const isGithubEnabled = !!(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET);
export const isGoogleEnabled = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

// GitHub Strategy
if (isGithubEnabled) {
  passport.use(
    new GitHubStrategy(
      {
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL: `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/auth/github/callback`,
        scope: ['user:email'],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          let user = await User.findOne({ githubId: profile.id });

          if (!user) {
            const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
            if (email) {
              user = await User.findOne({ email });
            }

            if (user) {
              user.githubId = profile.id;
              await user.save();
            } else {
              let username = profile.username || `user_${profile.id}`;
              const usernameExists = await User.findOne({ username });
              if (usernameExists) {
                username = `${username}_${profile.id.slice(-4)}`;
              }

              user = await User.create({
                username,
                email: email || `${profile.id}@github.com`,
                githubId: profile.id,
                displayName: profile.displayName || profile.username || username,
                avatar: 'default-avatar.svg',
                password: Math.random().toString(36).slice(-12),
                isVerified: true
              });
            }
          }
          return done(null, user);
        } catch (error) {
          return done(error, null);
        }
      }
    )
  );
}

// Google Strategy
if (isGoogleEnabled) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/auth/google/callback`,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          let user = await User.findOne({ googleId: profile.id });

          if (!user) {
            const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
            if (email) {
              user = await User.findOne({ email });
            }

            if (user) {
              user.googleId = profile.id;
              await user.save();
            } else {
              let username = profile.emails[0].value.split('@')[0];
              const usernameExists = await User.findOne({ username });
              if (usernameExists) {
                username = `${username}_${profile.id.slice(-4)}`;
              }

              user = await User.create({
                username,
                email: email,
                googleId: profile.id,
                displayName: profile.displayName || username,
                avatar: 'default-avatar.svg',
                password: Math.random().toString(36).slice(-12),
                isVerified: true
              });
            }
          }
          return done(null, user);
        } catch (error) {
          return done(error, null);
        }
      }
    )
  );
}

export default passport;
