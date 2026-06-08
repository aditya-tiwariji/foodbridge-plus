import { Server } from 'socket.io';
import mongoose from 'mongoose';
import { registerSocket, removeSocket } from './socketRegistry.js';
import { initSocketEvents } from './socketEvents.js';

let io = null;

/**
 * Configure and initialize Socket.io Server listener
 */
export const initSocketServer = (server) => {
  io = new Server(server, {
    cors: {
      origin: true,
      credentials: true,
    },
  });

  initSocketEvents(io);

  io.on('connection', (socket) => {
    console.log(`[Socket.io] Client connected: socketId ${socket.id}`);

    // Registration event containing user details on login/connect
    socket.on('authenticate', (data) => {
      const { userId, role } = data;
      if (userId && role) {
        registerSocket(userId, role, socket.id);
        console.log(`[Socket.io] Authenticated userId: ${userId} (${role}) with socketId: ${socket.id}`);
        socket.emit('authenticated', { success: true });
      }
    });

    socket.on('join_donation_track', (data) => {
      const { donationId } = data;
      if (donationId) {
        socket.join(`donation_${donationId}`);
        console.log(`[Socket.io] Socket ${socket.id} joined tracking room: donation_${donationId}`);
      }
    });

    socket.on('leave_donation_track', (data) => {
      const { donationId } = data;
      if (donationId) {
        socket.leave(`donation_${donationId}`);
        console.log(`[Socket.io] Socket ${socket.id} left tracking room: donation_${donationId}`);
      }
    });

    socket.on('ngo_location_update', async (data) => {
      const { donationId, latitude, longitude } = data;
      if (donationId && latitude && longitude) {
        try {
          const Donation = mongoose.model('Donation');
          await Donation.findByIdAndUpdate(donationId, {
            $set: {
              'liveTracking.ngoLatitude': latitude,
              'liveTracking.ngoLongitude': longitude,
              'liveTracking.lastUpdated': new Date()
            }
          });

          io.to(`donation_${donationId}`).emit('donation_location_updated', {
            donationId,
            latitude,
            longitude,
            lastUpdated: new Date()
          });
        } catch (err) {
          console.error('[Socket.io] Error updating live location:', err.message);
        }
      }
    });

    socket.on('disconnect', () => {
      console.log(`[Socket.io] Client disconnected: socketId ${socket.id}`);
      removeSocket(socket.id);
    });
  });

  return io;
};

/**
 * Get active Server instance
 */
export const getIO = () => io;
