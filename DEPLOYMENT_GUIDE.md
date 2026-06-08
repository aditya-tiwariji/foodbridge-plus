# FoodBridge Production Deployment Guide

This guide provides step-by-step instructions for deploying the FoodBridge application to production. We recommend deploying the backend API to **Render** and the frontend application to **Vercel**.

---

## 1. Backend Deployment (Render)

### Steps
1. Log in to [Render](https://render.com) and click **New > Web Service**.
2. Connect your Git repository.
3. Configure the following settings:
   - **Name**: `foodbridge-backend` (or your preferred name)
   - **Environment**: `Node`
   - **Region**: Select a region close to your target users (e.g. `Oregon (US West)` or `Frankfurt (EU Central)`)
   - **Branch**: `main` (or your production branch)
   - **Root Directory**: `backend` (Important: Set this so Render only builds and runs the backend subfolder)
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Plan**: `Free` (or any paid tier)

4. Add the following **Environment Variables** under the **Environment** tab:

| Variable Name | Description | Example / Recommended Value |
| :--- | :--- | :--- |
| `PORT` | The port Render binds to (automatically set by Render, but can default) | `10000` (handled by Render) |
| `NODE_ENV` | Mode of execution | `production` |
| `CLIENT_URL` | URL of your deployed frontend (Vercel) | `https://foodbridge.vercel.app` |
| `MONGO_URI` | MongoDB Connection String (Atlas recommended) | `mongodb+srv://...` |
| `JWT_SECRET` | Secret key for signing JWTs | A secure random string (64+ chars) |
| `JWT_EXPIRE` | Token expiry duration | `30d` |
| `JWT_COOKIE_EXPIRE` | Cookie lifetime (days) | `30` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary name (for image uploads) | From your Cloudinary Dashboard |
| `CLOUDINARY_API_KEY` | Cloudinary API Key | From your Cloudinary Dashboard |
| `CLOUDINARY_API_SECRET` | Cloudinary API Secret | From your Cloudinary Dashboard |
| `EMAIL_HOST` | SMTP server host (for notifications) | e.g. `smtp.sendgrid.net` or `smtp.gmail.com` |
| `EMAIL_PORT` | SMTP port | `587` or `465` |
| `EMAIL_USER` | SMTP username | Your provider's username |
| `EMAIL_PASS` | SMTP password / App Password | Your provider's password |
| `EMAIL_FROM` | Sender address for system emails | `noreply@yourdomain.org` |

5. Click **Create Web Service**.

---

## 2. Frontend Deployment (Vercel)

### Steps
1. Log in to [Vercel](https://vercel.com) and click **Add New > Project**.
2. Import your Git repository.
3. Configure the Project settings:
   - **Framework Preset**: `Vite` (Vercel auto-detects this)
   - **Root Directory**: `frontend` (Important: Select this so Vercel builds the React app)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

4. Expand the **Environment Variables** section and add:

| Variable Name | Description | Recommended Value |
| :--- | :--- | :--- |
| `VITE_API_URL` | The deployed Render backend API endpoint (include `/api/v1`) | `https://foodbridge-backend.onrender.com/api/v1` |
| `VITE_SOCKET_URL` | The base URL of the socket server | `https://foodbridge-backend.onrender.com` |

5. Click **Deploy**.
6. Note the deployed URL (e.g. `https://foodbridge.vercel.app`).
7. **Important**: Go back to your Render backend configuration and update the `CLIENT_URL` environment variable with this URL to allow proper CORS and Cookie handling.

---

## 3. Production Features Enabled

- **Graceful Shutdown**: The backend server is configured to catch system signals (`SIGINT`, `SIGTERM`) to cleanly close database connections and Socket.io clients before exiting.
- **Secure Cookies**: In production (`NODE_ENV=production`), authentication cookies are automatically secured with the `Secure` and `SameSite=None` attributes, permitting secure cross-origin sessions between Vercel and Render.
- **CORS Optimization**: CORS policies are dynamically resolved based on the configured `CLIENT_URL` list to prevent unauthorized domain connections.
