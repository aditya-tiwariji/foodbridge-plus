// Map to track user connections: userId -> Set of socketId
const userSockets = new Map();

// Map to track reverse lookup: socketId -> { userId, role }
const activeConnections = new Map();

/**
 * Register a user socket connection
 */
export const registerSocket = (userId, role, socketId) => {
  if (!userSockets.has(userId)) {
    userSockets.set(userId, new Set());
  }
  userSockets.get(userId).add(socketId);
  activeConnections.set(socketId, { userId, role });
};

/**
 * Remove a user socket connection on disconnect
 */
export const removeSocket = (socketId) => {
  const connection = activeConnections.get(socketId);
  if (connection) {
    const { userId } = connection;
    const sockets = userSockets.get(userId);
    if (sockets) {
      sockets.delete(socketId);
      if (sockets.size === 0) {
        userSockets.delete(userId);
      }
    }
    activeConnections.delete(socketId);
  }
};

/**
 * Retrieve all active socket IDs associated with a user ID
 */
export const getSocketsByUserId = (userId) => {
  const sockets = userSockets.get(userId);
  return sockets ? Array.from(sockets) : [];
};

/**
 * Retrieve all active socket IDs matching a specific user role
 */
export const getSocketsByRole = (role) => {
  const sockets = [];
  for (const [socketId, connection] of activeConnections.entries()) {
    if (connection.role === role) {
      sockets.push(socketId);
    }
  }
  return sockets;
};

/**
 * Get raw active connections
 */
export const getActiveConnections = () => activeConnections;
