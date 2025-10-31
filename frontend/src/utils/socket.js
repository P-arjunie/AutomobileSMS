import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
  }

  connect(token) {
    if (this.socket) {
      this.disconnect();
    }

    const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';

    this.socket = io(SERVER_URL, {
      auth: {
        token: token
      },
      autoConnect: true,
    });

    this.socket.on('connect', () => {
      console.log('Connected to server');
      this.isConnected = true;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Disconnected from server:', reason);
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      this.isConnected = false;
    });

    this.socket.on('connected', (data) => {
      console.log('Welcome message:', data);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // Appointment related events
  joinAppointment(appointmentId) {
    if (this.socket) {
      this.socket.emit('join-appointment', appointmentId);
    }
  }

  leaveAppointment(appointmentId) {
    if (this.socket) {
      this.socket.emit('leave-appointment', appointmentId);
    }
  }

  sendMessage(appointmentId, message, type = 'text') {
    if (this.socket) {
      this.socket.emit('send-message', {
        appointmentId,
        message,
        type
      });
    }
  }

  updateServiceStatus(appointmentId, status, message) {
    if (this.socket) {
      this.socket.emit('update-service-status', {
        appointmentId,
        status,
        message
      });
    }
  }

  logWorkTime(appointmentId, duration, description, workType) {
    if (this.socket) {
      this.socket.emit('log-work-time', {
        appointmentId,
        duration,
        description,
        workType
      });
    }
  }

  startTyping(appointmentId) {
    if (this.socket) {
      this.socket.emit('typing-start', { appointmentId });
    }
  }

  stopTyping(appointmentId) {
    if (this.socket) {
      this.socket.emit('typing-stop', { appointmentId });
    }
  }

  markNotificationAsRead(notificationId) {
    if (this.socket) {
      this.socket.emit('notification-read', { notificationId });
    }
  }

  // Event listeners
  onNewMessage(callback) {
    if (this.socket) {
      this.socket.on('new-message', callback);
    }
  }

  onServiceStatusUpdated(callback) {
    if (this.socket) {
      this.socket.on('service-status-updated', callback);
    }
  }

  onAppointmentStatusChanged(callback) {
    if (this.socket) {
      this.socket.on('appointment-status-changed', callback);
    }
  }

  onWorkTimeLogged(callback) {
    if (this.socket) {
      this.socket.on('work-time-logged', callback);
    }
  }

  onUserJoinedAppointment(callback) {
    if (this.socket) {
      this.socket.on('user-joined-appointment', callback);
    }
  }

  onUserLeftAppointment(callback) {
    if (this.socket) {
      this.socket.on('user-left-appointment', callback);
    }
  }

  onUserTyping(callback) {
    if (this.socket) {
      this.socket.on('user-typing', callback);
    }
  }

  onUserStoppedTyping(callback) {
    if (this.socket) {
      this.socket.on('user-stopped-typing', callback);
    }
  }

  onUserDisconnected(callback) {
    if (this.socket) {
      this.socket.on('user-disconnected', callback);
    }
  }

  // Global events
  onNewAppointment(callback) {
    if (this.socket) {
      this.socket.on('new-appointment', callback);
    }
  }

  onAppointmentAssigned(callback) {
    if (this.socket) {
      this.socket.on('appointment-assigned', callback);
    }
  }

  onModificationRequest(callback) {
    if (this.socket) {
      this.socket.on('modification-request', callback);
    }
  }

  onServiceLogCreated(callback) {
    if (this.socket) {
      this.socket.on('service-log-created', callback);
    }
  }

  onServiceLogUpdated(callback) {
    if (this.socket) {
      this.socket.on('service-log-updated', callback);
    }
  }

  onServiceLogCompleted(callback) {
    if (this.socket) {
      this.socket.on('service-log-completed', callback);
    }
  }

  // Remove event listeners
  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  // Get connection status
  getConnectionStatus() {
    return this.isConnected;
  }
}

// Create singleton instance
const socketService = new SocketService();

export default socketService;
