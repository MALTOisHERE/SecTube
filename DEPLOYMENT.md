# SecTube - Free Deployment Guide

This guide will help you deploy SecTube for free using modern cloud platforms.

## 🎯 Deployment Stack

- **Frontend**: Vercel (Free tier)
- **Backend**: Render (Free tier)
- **Database**: MongoDB Atlas (Free tier - 512MB)
- **File Storage**: Cloudinary (Free tier - 25GB)

---

## 📋 Prerequisites

1. GitHub account
2. Accounts on:
   - [Vercel](https://vercel.com)
   - [Render](https://render.com)
   - [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - [Cloudinary](https://cloudinary.com)

---

## 1️⃣ Database Setup (MongoDB Atlas)

### Step 1: Create a Free Cluster

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
2. Sign up / Log in
3. Click **"Build a Database"**
4. Select **"M0 Free"** tier
5. Choose a cloud provider and region (closest to your users)
6. Click **"Create Cluster"**

### Step 2: Configure Database Access

1. Go to **"Database Access"** in the left sidebar
2. Click **"Add New Database User"**
3. Create username and strong password (save these!)
4. Select **"Read and write to any database"**
5. Click **"Add User"**

### Step 3: Configure Network Access

1. Go to **"Network Access"** in the left sidebar
2. Click **"Add IP Address"**
3. Click **"Allow Access from Anywhere"** (0.0.0.0/0)
4. Click **"Confirm"**

### Step 4: Get Connection String

1. Go to **"Database"** → Click **"Connect"**
2. Choose **"Connect your application"**
3. Copy the connection string (looks like):
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
4. Replace `<username>` and `<password>` with your credentials
5. Add database name: `mongodb+srv://...mongodb.net/sectube?retryWrites=true&w=majority`

---

## 2️⃣ File Storage Setup (Cloudinary)

### Step 1: Create Account

1. Go to [Cloudinary](https://cloudinary.com/users/register/free)
2. Sign up for free account
3. Verify your email

### Step 2: Get API Credentials

1. Go to Dashboard
2. Note down:
   - **Cloud Name**
   - **API Key**
   - **API Secret**

### Step 3: Create Upload Presets (Optional)

1. Go to **Settings** → **Upload**
2. Scroll to **Upload presets**
3. Create presets for videos, thumbnails, and avatars

---

## 3️⃣ Backend Deployment (Render)

### Step 1: Prepare Backend

1. Create `backend/.env.production` file (DON'T commit this!):
   ```env
   NODE_ENV=production
   PORT=5000
   MONGO_URI=your_mongodb_atlas_connection_string
   JWT_SECRET=your_super_secret_jwt_key_min_32_chars
   JWT_EXPIRE=7d
   FRONTEND_URL=https://your-app.vercel.app

   # Cloudinary (if using)
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```

2. Ensure `backend/package.json` has start script:
   ```json
   {
     "scripts": {
       "start": "node src/server.js",
       "dev": "nodemon src/server.js"
     }
   }
   ```

### Step 2: Push to GitHub

```bash
git add .
git commit -m "Prepare for deployment"
git push origin main
```

### Step 3: Deploy on Render

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Configure:
   - **Name**: `sectube-backend`
   - **Environment**: `Node`
   - **Region**: Choose closest to you
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`

5. Click **"Advanced"** → **"Add Environment Variables"**:
   ```
   NODE_ENV=production
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   JWT_EXPIRE=7d
   FRONTEND_URL=https://your-app.vercel.app
   ```

6. Click **"Create Web Service"**
7. Wait for deployment (5-10 minutes)
8. Note your backend URL: `https://sectube-backend.onrender.com`

⚠️ **Important**: Free tier spins down after 15 minutes of inactivity. First request after inactivity takes ~30 seconds.

---

## 4️⃣ Frontend Deployment (Vercel)

### Step 1: Update API URL

1. Create `frontend/.env.production`:
   ```env
   VITE_API_URL=https://sectube-backend.onrender.com/api
   ```

2. Update `frontend/src/services/api.js` to use environment variable:
   ```javascript
   const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
   ```

### Step 2: Create `vercel.json`

Create `frontend/vercel.json`:
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### Step 3: Deploy on Vercel

**Option A: Via CLI**
```bash
cd frontend
npm install -g vercel
vercel login
vercel
```

**Option B: Via Dashboard**
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New"** → **"Project"**
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Add Environment Variables:
   ```
   VITE_API_URL=https://sectube-backend.onrender.com/api
   ```
6. Click **"Deploy"**
7. Your app will be live at: `https://your-app.vercel.app`

### Step 4: Update Backend CORS

Update `backend/.env` on Render with your Vercel URL:
```
FRONTEND_URL=https://your-app.vercel.app
```

Redeploy backend on Render.

---

## 5️⃣ Alternative Free Options

### Backend Alternatives

1. **Railway** (500 hours/month free)
   - Similar to Render
   - Better for databases
   - [Railway](https://railway.app)

2. **Fly.io** (Free tier available)
   - Better performance than Render
   - More complex setup
   - [Fly.io](https://fly.io)

3. **Cyclic** (Serverless, always free)
   - Serverless deployment
   - No cold starts
   - [Cyclic](https://cyclic.sh)

### Frontend Alternatives

1. **Netlify**
   - Similar to Vercel
   - 100GB bandwidth/month
   - [Netlify](https://netlify.com)

2. **Cloudflare Pages**
   - Unlimited bandwidth
   - Great CDN
   - [Cloudflare Pages](https://pages.cloudflare.com)

### Database Alternatives

1. **Railway PostgreSQL** (if switching to PostgreSQL)
2. **Supabase** (PostgreSQL + Auth)
3. **PlanetScale** (MySQL)

---

## 🔧 Post-Deployment Steps

### 1. Test Your Deployment

- Visit your frontend URL
- Try registering an account
- Upload a test video
- Post a comment
- Check all features work

### 2. Set Up Custom Domain (Optional)

**Vercel:**
1. Go to Project Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed

**Render:**
1. Go to Service Settings → Custom Domain
2. Add your custom domain
3. Update DNS records

### 3. Monitor Your App

- **Render**: Check logs in dashboard
- **Vercel**: Check deployment logs and analytics
- **MongoDB Atlas**: Monitor database usage

### 4. Set Up GitHub Actions (Optional)

Auto-deploy on push to main:

Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          working-directory: ./frontend
```

---

## ⚠️ Important Notes

### Free Tier Limitations

**Render:**
- App spins down after 15 min inactivity
- Cold start takes ~30 seconds
- 750 hours/month (shared across services)

**Vercel:**
- 100GB bandwidth/month
- 100GB-hours serverless function execution
- No custom domains on free tier for commercial use

**MongoDB Atlas:**
- 512MB storage
- Shared cluster
- No backups

**Cloudinary:**
- 25GB storage
- 25GB bandwidth/month

### Video Storage Consideration

For a video platform, you'll quickly exceed free storage limits. Consider:

1. **Cloudinary** - Limited free tier, may need paid plan
2. **AWS S3** - Pay as you go (very cheap)
3. **Bunny CDN** - Cheap storage ($0.01/GB)
4. **Azure Blob Storage** - Cheap alternative

---

## 🚀 Scaling Beyond Free Tier

When you're ready to scale:

1. **Backend**: Upgrade Render to paid tier ($7/mo) for no cold starts
2. **Database**: Upgrade MongoDB Atlas to M10 ($0.08/hr)
3. **Storage**: Move to AWS S3 or Cloudinary paid tier
4. **CDN**: Add Cloudflare for caching and DDoS protection

---

## 🆘 Troubleshooting

### Backend won't start
- Check Render logs
- Verify environment variables
- Test MongoDB connection string locally

### CORS errors
- Verify FRONTEND_URL in backend env
- Check CORS middleware configuration

### Frontend can't reach backend
- Verify VITE_API_URL is correct
- Check network tab in browser dev tools
- Ensure backend is deployed and running

### Videos not uploading
- Check Cloudinary credentials
- Verify file size limits
- Check backend logs for errors

---

## 📚 Additional Resources

- [Render Documentation](https://render.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com)
- [Cloudinary Documentation](https://cloudinary.com/documentation)

---

## 💡 Tips for Production

1. **Use environment variables** for all secrets
2. **Enable HTTPS** (automatic on Vercel/Render)
3. **Set up monitoring** (UptimeRobot, Better Stack)
4. **Implement rate limiting** on backend
5. **Add logging** (Winston, Pino)
6. **Set up error tracking** (Sentry)
7. **Add analytics** (Plausible, Umami)

---

Good luck with your deployment! 🚀
