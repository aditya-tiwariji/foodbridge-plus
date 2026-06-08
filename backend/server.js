import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import net from 'net';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import compression from 'compression';
import morgan from 'morgan';
import connectDB from './config/db.js';
import { errorHandler, notFound } from './middleware/errorMiddleware.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import donationRoutes from './routes/donationRoutes.js';
import locationRoutes from './routes/locationRoutes.js';
import ngoRoutes from './routes/ngoRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import { xssSanitizer } from './middleware/xssMiddleware.js';
import { initSocketServer, getIO } from './socket/socketServer.js';

// Load environment variables
dotenv.config();

// Establish connection to MongoDB Atlas
connectDB();

const app = express();

// Secure HTTP Headers
app.use(helmet());

// Enable Gzip Compression
app.use(compression());

// Prevent NoSQL query injection
app.use(mongoSanitize());

// HTTP request logger
if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined'));
} else {
  app.use(morgan('dev'));
}

// Request body and cookie parsing middlewares
app.use(express.json());
app.use(cookieParser());

// Apply XSS input sanitization
app.use(xssSanitizer);

// Enable CORS with support for authorization credentials
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

// Rate Limiting Rules
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Limit each IP to 500 requests per 15 minutes
  message: {
    success: false,
    message: 'Too many requests from this IP. Please try again after 15 minutes.'
  }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limit each IP to 50 authentication attempts per 15 minutes
  message: {
    success: false,
    message: 'Too many login or registration attempts. Please try again after 15 minutes.'
  }
});

// Apply rate limiters
app.use('/api/v1', globalLimiter);
app.use('/api/v1/auth/login', authLimiter);
app.use('/api/v1/auth/register', authLimiter);

// Health check endpoint
app.get('/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  let dbStatus = 'disconnected';
  if (dbState === 1) dbStatus = 'connected';
  else if (dbState === 2) dbStatus = 'connecting';
  else if (dbState === 3) dbStatus = 'disconnecting';

  res.status(200).json({
    success: true,
    status: 'healthy',
    database: dbStatus,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/v1/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  let dbStatus = 'connected';
  if (dbState !== 1) dbStatus = 'disconnected';

  res.status(200).json({
    success: true,
    status: 'healthy',
    database: dbStatus,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Route mount points
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/donations', donationRoutes);
app.use('/api/v1/location', locationRoutes);
app.use('/api/v1/ngos', ngoRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/analytics', analyticsRoutes);

// Fallback middlewares for handling unknown paths and server errors
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5001;

const server = app.listen(PORT, () => {
  console.log(
    `Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`
  );
});

server.on('error', (err) => {
  console.error('Server error:', err);
  process.exit(1);
});

// Initialize Socket.io Server
initSocketServer(server);

// Graceful shutdown handler
const gracefulShutdown = (signal) => {
  console.log(`[Graceful Shutdown] Received ${signal}. Closing active HTTP/Socket server connections...`);
  
  // 1. Explicitly close Socket.io server to release sockets and connections
  try {
    const io = getIO();
    if (io) {
      console.log('[Graceful Shutdown] Closing Socket.io server...');
      io.close();
    }
  } catch (err) {
    console.error('[Graceful Shutdown] Error closing Socket.io:', err);
  }

  // 2. Force close all active keep-alive HTTP connections immediately
  if (server && server.closeAllConnections) {
    server.closeAllConnections();
  }

  // 3. Close the HTTP server
  server.close(() => {
    console.log('[Graceful Shutdown] HTTP server closed. Closing database connections...');
    mongoose.connection.close(false)
      .then(() => {
        console.log('[Graceful Shutdown] Mongoose database connection closed. Server exited cleanly.');
        process.exit(0);
      })
      .catch((err) => {
        console.error('[Graceful Shutdown] Error closing database connections:', err);
        process.exit(1);
      });
  });

  // Force exit if hanging
  setTimeout(() => {
    console.error('[Graceful Shutdown] Shutdown timeout exceeded. Forcing exit.');
    process.exit(1);
  }, 2000);
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2'));

// Handle unhandled promise rejections globally
process.on('unhandledRejection', (err, promise) => {
  console.error(`Unhandled Rejection Error: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});
