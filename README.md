# FoodBridge+ 🍲

FoodBridge+ is a modern, real-time surplus food redistribution platform designed to bridge the gap between food donors (restaurants, caterers, grocery stores, hotels) and non-governmental organizations (NGOs). By streamlining the donation lifecycle, FoodBridge+ minimizes food waste, automates collection routes, and supports local communities efficiently.

---

## 🚀 Key Features

### 👥 Multi-Role User Portals
*   **Donors**: Create surplus food listings with details on quantity, expiration time, food type, dietary tags, and images. Track contributions and review NGO feedback.
*   **NGOs**: View available donations in real-time, claim listings, navigate collections, and submit ratings and reviews upon successful pickups.
*   **Administrators**: Access system-wide metrics, manage user verification, moderate active listings, and audit platform performance.

### 🔄 End-to-End Donation Lifecycle
*   **Interactive Status Progression**: Listings progress cleanly from **Pending** ➡️ **Claimed** ➡️ **On The Way** ➡️ **Picked Up** (Completed).
*   **Graceful Cancellations**: Expiration timers and manual cancellation handlers prevent stale listing logs.

### ⚡ Real-Time Notifications (Socket.io)
*   Instant dashboard alerts notify NGOs of new local donations.
*   Donors receive live push notifications when an NGO claims, travels to, or completes a pickup of their listing.
*   Includes automated fallback reconnection logic for maximum reliability.

### 📊 Advanced Data Analytics
*   **Donor Dashboard**: Visualizes *Meals Contributed* (calculating quantities of successfully rescued food only) and *Completion Success Rates*.
*   **NGO Dashboard**: Tracks *Total Claims*, *Meals Distributed*, and *Success Rates* using interactive charts built with Recharts.

### 🌟 Feedback & Rating System
*   Once a donation status is marked as `picked_up`, NGOs can leave a rating (1-5 stars) and comments.
*   Reviews are saved directly within the database records and rendered dynamically on the donor’s page.

---

## 🛠️ Technology Stack

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | React (Vite) | Fast component-driven single-page application (SPA) |
| **Frontend Styling** | TailwindCSS | Modern, fully responsive visual layout design |
| **Backend API** | Node.js / Express | Robust REST API with modular MVC architecture |
| **Database** | MongoDB / Mongoose | Scalable Document Database for listings, reviews, and users |
| **WebSockets** | Socket.io | Bi-directional communication channel for real-time sync |
| **File Storage** | Cloudinary | Cloud service for managing food donation listing images |
| **Email Service** | Nodemailer | Automated transaction/verification notification emails |

---

## 📁 Repository Structure

```text
FoodBridge+/
├── backend/                  # Express REST API & WebSocket Server
│   ├── config/               # Database and integration config
│   ├── controllers/          # Business logic handlers
│   ├── middleware/           # Auth, validation, and rate limit rules
│   ├── models/               # MongoDB Schemas (User, Donation, Notification)
│   ├── routes/               # API endpoints (/auth, /donations, /ngos, etc.)
│   ├── services/             # Analytics and mail delivery utilities
│   ├── socket/               # Socket.io connection handlers
│   └── server.js             # Main server entrypoint
│
├── frontend/                 # Vite + React Client Application
│   ├── public/               # Static web assets
│   ├── src/
│   │   ├── components/       # Reusable layout and UI components
│   │   ├── context/          # State managers (AuthContext, SocketContext)
│   │   ├── pages/            # View pages (Home, Dashboard, Login, NGO)
│   │   ├── routes/           # Protected and public route guards
│   │   └── services/         # Axios API interceptor configurations
│   ├── vercel.json           # Vercel SPA routing rewrites
│   └── tailwind.config.js    # Utility classes configuration
│
├── package.json              # Workspace runner commands
└── DEPLOYMENT_GUIDE.md       # Production hosting walkthrough
```

---

## 💻 Local Development Setup

### Prerequisites
*   [Node.js](https://nodejs.org/) (v18 or higher recommended)
*   [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) or a running local MongoDB instance
*   [Cloudinary Account](https://cloudinary.com/) (free tier sufficient for images)
*   SMTP Server details (e.g. Gmail App Passwords, SendGrid, Mailgun)

### 1. Installation
Clone the repository, then install dependencies for the root workspace, frontend, and backend:
```bash
# Install root tools (concurrently)
npm install

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

### 2. Configure Environment Variables
Create `.env` files in both subdirectories based on the provided examples:

*   **Backend Environment Configurations** (`backend/.env`):
    ```env
    PORT=5001
    NODE_ENV=development
    MONGO_URI=your_mongodb_connection_string
    JWT_SECRET=your_jwt_signing_secret
    JWT_EXPIRE=30d
    CLIENT_URL=http://localhost:5173
    CLOUDINARY_CLOUD_NAME=your_cloudinary_name
    CLOUDINARY_API_KEY=your_cloudinary_key
    CLOUDINARY_API_SECRET=your_cloudinary_secret
    EMAIL_HOST=your_smtp_host
    EMAIL_PORT=587
    EMAIL_USER=your_smtp_username
    EMAIL_PASS=your_smtp_password
    EMAIL_FROM=noreply@foodbridge.org
    ```

*   **Frontend Environment Configurations** (`frontend/.env`):
    ```env
    VITE_API_URL=http://localhost:5001/api/v1
    VITE_SOCKET_URL=http://localhost:5001
    ```

### 3. Run Locally
Execute the following script from the project root directory to spin up the frontend (Vite) and backend (nodemon) concurrently:
```bash
npm run dev
```
*   **Frontend**: `http://localhost:5173`
*   **Backend API**: `http://localhost:5001`

---

## 🌐 Production Deployment

For deploying the production stack:
1. Deploy the **Backend REST API** to [Render](https://render.com) using the `/backend` root directory.
2. Deploy the **Frontend SPA** to [Vercel](https://vercel.com) using the `/frontend` root directory.
3. Review the complete deployment guide in [DEPLOYMENT_GUIDE.md](file:///c:/Users/st108/OneDrive/Desktop/FoodBridge+/DEPLOYMENT_GUIDE.md) for full environmental values and configurations.

---

## 🔒 Security and Optimization Details
*   **Rate Limiting**: Native protection prevents API brute forcing on authentication endpoints (50 requests/15 mins) and general paths (500 requests/15 mins).
*   **Authentication State Persistence**: Handles browser refreshes securely with token expiration checking and handles cookie authentication correctly across domains.
*   **SPA Vercel Rewrites**: Configured `vercel.json` rewrites redirect all dynamic routes back to `index.html` to avoid 404 browser reload errors.
