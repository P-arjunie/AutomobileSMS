import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const setupSocketHandlers = (io) => {
  // Middleware for socket authentication
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key');
      const user = await User.findById(decoded.userId).select('-password');
      
      if (!user || !user.isActive) {
        return next(new Error('Authentication error: Invalid user'));
      }

      socket.userId = user._id.toString();
      socket.userRole = user.role;
      socket.user = user;
      
      next();
    } catch (error) {
      console.error('Socket authentication error:', error);
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 User connected: ${socket.user.firstName} ${socket.user.lastName} (${socket.user.role})`);
    
    // Join user to their personal room
    socket.join(`user:${socket.userId}`);
    
    // Join role-based rooms
    socket.join(`role:${socket.userRole}`);
    
    // Join department room (for employees)
    if (socket.user.department) {
      socket.join(`department:${socket.user.department}`);
    }

    // Handle joining specific appointment rooms
    socket.on('join-appointment', (appointmentId) => {
      console.log(`User ${socket.user.firstName} joined appointment ${appointmentId}`);
      socket.join(`appointment:${appointmentId}`);
      
      // Notify others in the appointment room
      socket.to(`appointment:${appointmentId}`).emit('user-joined-appointment', {
        user: {
          id: socket.user._id,
          firstName: socket.user.firstName,
          lastName: socket.user.lastName,
          role: socket.user.role
        },
        appointmentId
      });
    });

    // Handle joining specific service rooms
    socket.on('join-service', (serviceId) => {
      console.log(`User ${socket.user.firstName} joined service ${serviceId}`);
      socket.join(`service:${serviceId}`);
    });

    // Handle leaving appointment rooms
    socket.on('leave-appointment', (appointmentId) => {
      console.log(`User ${socket.user.firstName} left appointment ${appointmentId}`);
      socket.leave(`appointment:${appointmentId}`);
      
      // Notify others in the appointment room
      socket.to(`appointment:${appointmentId}`).emit('user-left-appointment', {
        user: {
          id: socket.user._id,
          firstName: socket.user.firstName,
          lastName: socket.user.lastName,
          role: socket.user.role
        },
        appointmentId
      });
    });

    // Handle real-time chat messages
    socket.on('send-message', (data) => {
      const { appointmentId, message, type = 'text' } = data;
      
      const messageData = {
        id: Date.now().toString(),
        text: message,
        type,
        author: {
          id: socket.user._id,
          firstName: socket.user.firstName,
          lastName: socket.user.lastName,
          role: socket.user.role
        },
        timestamp: new Date(),
        appointmentId
      };

      // Send to all users in the appointment room
      io.to(`appointment:${appointmentId}`).emit('new-message', messageData);
      
      console.log(`Message sent in appointment ${appointmentId} by ${socket.user.firstName}`);
    });

    // Handle service status updates
    socket.on('update-service-status', (data) => {
      const { appointmentId, status, message } = data;
      
      const statusUpdate = {
        appointmentId,
        status,
        message,
        updatedBy: {
          id: socket.user._id,
          firstName: socket.user.firstName,
          lastName: socket.user.lastName,
          role: socket.user.role
        },
        timestamp: new Date()
      };

      // Notify all users in the appointment room
      io.to(`appointment:${appointmentId}`).emit('service-status-updated', statusUpdate);
      
      // Notify all employees
      io.to('role:employee').emit('appointment-status-changed', statusUpdate);
      
      console.log(`Service status updated for appointment ${appointmentId}: ${status}`);
    });

    // Handle work time logging
    socket.on('log-work-time', (data) => {
      const { appointmentId, duration, description, workType } = data;
      
      const workLog = {
        appointmentId,
        duration,
        description,
        workType,
        employee: {
          id: socket.user._id,
          firstName: socket.user.firstName,
          lastName: socket.user.lastName,
          employeeId: socket.user.employeeId
        },
        timestamp: new Date()
      };

      // Notify appointment participants
      io.to(`appointment:${appointmentId}`).emit('work-time-logged', workLog);
      
      // Notify admins
      io.to('role:admin').emit('employee-work-logged', workLog);
      
      console.log(`Work time logged by ${socket.user.firstName}: ${duration} hours`);
    });

    // Handle typing indicators
    socket.on('typing-start', (data) => {
      const { appointmentId } = data;
      
      socket.to(`appointment:${appointmentId}`).emit('user-typing', {
        user: {
          id: socket.user._id,
          firstName: socket.user.firstName,
          lastName: socket.user.lastName
        },
        appointmentId
      });
    });

    socket.on('typing-stop', (data) => {
      const { appointmentId } = data;
      
      socket.to(`appointment:${appointmentId}`).emit('user-stopped-typing', {
        user: {
          id: socket.user._id,
          firstName: socket.user.firstName,
          lastName: socket.user.lastName
        },
        appointmentId
      });
    });

    // Handle notification acknowledgments
    socket.on('notification-read', (data) => {
      const { notificationId } = data;
      
      console.log(`User ${socket.user.firstName} read notification ${notificationId}`);
      // You can add logic to mark notifications as read in the database
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      console.log(`🔌 User disconnected: ${socket.user.firstName} ${socket.user.lastName} (${reason})`);
      
      // Notify appointment rooms about user disconnection
      socket.rooms.forEach(room => {
        if (room.startsWith('appointment:')) {
          socket.to(room).emit('user-disconnected', {
            user: {
              id: socket.user._id,
              firstName: socket.user.firstName,
              lastName: socket.user.lastName,
              role: socket.user.role
            }
          });
        }
      });
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error(`Socket error for user ${socket.user.firstName}:`, error);
    });

    // Send welcome message
    socket.emit('connected', {
      message: 'Successfully connected to Automobile SMS',
      user: {
        id: socket.user._id,
        firstName: socket.user.firstName,
        lastName: socket.user.lastName,
        role: socket.user.role
      },
      timestamp: new Date()
    });
  });

  // Global event emitters (can be called from routes)
  const emitToUser = (userId, event, data) => {
    io.to(`user:${userId}`).emit(event, data);
  };

  const emitToRole = (role, event, data) => {
    io.to(`role:${role}`).emit(event, data);
  };

  const emitToAppointment = (appointmentId, event, data) => {
    io.to(`appointment:${appointmentId}`).emit(event, data);
  };

  const emitToService = (serviceId, event, data) => {
    io.to(`service:${serviceId}`).emit(event, data);
  };

  const emitToDepartment = (department, event, data) => {
    io.to(`department:${department}`).emit(event, data);
  };

  // Attach emitter functions to io for use in routes
  io.emitToUser = emitToUser;
  io.emitToRole = emitToRole;
  io.emitToAppointment = emitToAppointment;
  io.emitToDepartment = emitToDepartment;
  io.emitToService = emitToService;

  console.log('🚀 Socket.IO handlers setup complete');
};
