
# Automobile Service Management System (SMS)

A comprehensive automobile service management system built with modern web technologies, featuring real-time communication, role-based access control, and containerized deployment.

## 🏗️ Architecture Overview

This system follows a **layered architecture** pattern with clear separation of concerns:

### 📋 System Layers

1. **Presentation Layer (Frontend)**
   - React.js with modern UI/UX
   - Real-time updates via WebSocket
   - Responsive design with Tailwind CSS

2. **Business Logic Layer (Backend)**
   - Node.js with Express.js framework
   - RESTful API endpoints
   - WebSocket for real-time communication
   - JWT-based authentication
   - Role-based authorization

3. **Data Layer (Database)**
   - MongoDB for document storage
   - Mongoose ODM for data modeling
   - Optimized indexes for performance

## 🚀 Features

### 👥 User Management
- **Customer Registration & Login**
- **Employee Management**
- **Role-based Access Control** (Customer, Employee, Admin)
- **Profile Management**

### 📅 Appointment Management
- **Service Booking**
- **Appointment Scheduling**
- **Status Tracking** (Pending, Confirmed, In-Progress, Completed)
- **Modification Requests**
- **Real-time Status Updates**

### 🔧 Service Management
- **Service Logging**
- **Time Tracking**
- **Work Progress Monitoring**
- **Parts and Labor Cost Tracking**

### 💬 Real-time Communication
- **Live Status Updates**
- **WebSocket Integration**
- **Instant Notifications**
- **Real-time Chat** (in appointment rooms)

### 🔐 Security Features
- **JWT Authentication**
- **Password Hashing** (bcrypt)
- **Role-based Authorization**
- **Rate Limiting**
- **HTTPS Support**
- **CORS Configuration**

## 🛠️ Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | React.js 18, Vite, Tailwind CSS | Modern UI development |
| **Backend** | Node.js, Express.js, Socket.IO | Server-side logic and real-time communication |
| **Database** | MongoDB, Mongoose | Document-based data storage |
| **Authentication** | JWT, bcrypt | Secure user authentication |
| **Containerization** | Docker, Docker Compose | Consistent deployment environments |
| **Security** | Helmet, CORS, Rate Limiting | Application security |

## 📁 Project Structure

```
AutomobileSMS/
├── frontend/          # React.js frontend application
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── contexts/        # React contexts (Auth, etc.)
│   │   ├── utils/          # API calls and utilities
│   │   └── main.jsx        # Application entry point
│   ├── public/
│   ├── Dockerfile          # Frontend container config
│   └── package.json
│
├── backend/           # Node.js + Express backend 
│   ├── models/             # MongoDB/Mongoose models
│   ├── routes/             # API route handlers
│   ├── middleware/         # Authentication & authorization
│   ├── socket/             # WebSocket handlers
│   ├── config/             # Database configuration
│   ├── scripts/            # Database initialization scripts
│   ├── Dockerfile          # Backend container config
│   ├── server.js           # Application entry point
│   └── package.json
│
├── docker-compose.yml      # Multi-container orchestration
└── README.md              # Project documentation
```

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v18 or higher)
- **MongoDB** (v6 or higher)
- **Docker & Docker Compose** (for containerized deployment)

### Option 1: Docker Deployment (Recommended)

1. **Clone the repository**
```bash
git clone <repository-url>
cd AutomobileSMS
```

2. **Start with Docker Compose**
```bash
docker-compose up -d
```

3. **Access the application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- MongoDB: localhost:27017

### Option 2: Local Development

#### Backend Setup

1. **Navigate to backend directory**
```bash
cd backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env with your configurations
```

4. **Start MongoDB locally**
```bash
# Install and start MongoDB service
mongod
```

5. **Start the backend server**
```bash
npm run dev
```

#### Frontend Setup

1. **Navigate to frontend directory**
```bash
cd frontend
```

2. **Install dependencies**
```bash
npm install
```

3. **Start the development server**
```bash
npm run dev
```

4. **Access the application**
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/automobile_sms
JWT_SECRET=your-super-secret-jwt-key
FRONTEND_URL=http://localhost:5173
```

#### Frontend
```env
VITE_API_URL=http://localhost:5000/api
VITE_SERVER_URL=http://localhost:5000
```

## 👤 User Roles & Permissions

### 🧑‍💼 Customer
- Register and login
- Book service appointments
- View appointment status
- Request appointment modifications
- Real-time status updates

### 👨‍🔧 Employee
- Login with employee credentials
- View assigned appointments
- Update service status
- Log work time and activities
- Access real-time communications

### 👨‍💻 Admin
- All employee permissions
- Manage employees
- Assign appointments to employees
- View system-wide statistics
- Approve/reject modification requests

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Appointments
- `GET /api/appointments` - Get appointments
- `POST /api/appointments` - Create appointment
- `GET /api/appointments/:id` - Get specific appointment
- `PATCH /api/appointments/:id/status` - Update appointment status
- `POST /api/appointments/:id/notes` - Add appointment note

### Services
- `GET /api/services` - Get service logs
- `POST /api/services` - Create service log
- `PUT /api/services/:id` - Update service log
- `PATCH /api/services/:id/complete` - Complete service

### Employees
- `GET /api/employees` - Get employees (admin only)
- `GET /api/employees/:id/workload` - Get employee workload
- `GET /api/employees/:id/time-summary` - Get time summary

## 🌐 WebSocket Events

### Client → Server
- `join-appointment` - Join appointment room
- `send-message` - Send chat message
- `update-service-status` - Update service status
- `log-work-time` - Log work time

### Server → Client
- `new-appointment` - New appointment created
- `appointment-status-changed` - Status updated
- `service-log-created` - New service log
- `new-message` - New chat message

## 🚀 Deployment

### Production Deployment with Docker

1. **Update environment variables**
```bash
# Update docker-compose.yml with production values
# Change JWT_SECRET to a secure random string
# Update MONGODB_URI for production database
```

2. **Deploy with Docker Compose**
```bash
docker-compose -f docker-compose.yml up -d
```

3. **Set up reverse proxy** (Nginx/Apache)
4. **Configure SSL certificates**
5. **Set up monitoring and logging**

### Kubernetes Deployment

```yaml
# Example Kubernetes manifests available in k8s/ directory
# kubectl apply -f k8s/
```

## 🧪 Testing

### Backend Testing
```bash
cd backend
npm test
```

### Frontend Testing
```bash
cd frontend
npm test
```

## 📊 Monitoring

- Health check endpoint: `GET /api/health`
- Application logs via Docker containers
- MongoDB monitoring tools
- Real-time WebSocket connection monitoring

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

- **Project Lead**: [Your Name]
- **Frontend Developer**: [Name]
- **Backend Developer**: [Name]
- **DevOps Engineer**: [Name]

## 📞 Support

For support and questions:
- Email: support@automobile-sms.com
- Documentation: [Project Wiki]
- Issues: [GitHub Issues]

---

## 🎯 Roadmap

### Phase 1 (Current) ✅
- ✅ User authentication and authorization
- ✅ Basic appointment management
- ✅ Real-time updates via WebSocket
- ✅ Docker containerization

### Phase 2 🚧
- 📧 Email notifications
- 📱 Mobile application
- 💳 Payment integration
- 📊 Advanced analytics dashboard

### Phase 3 🔮
- 🤖 AI-powered service recommendations
- 📈 Predictive maintenance alerts
- 🔗 Third-party integrations
- 🌍 Multi-language support

---

**Built with ❤️ using modern web technologies**

