# Expense Management Application - Setup Guide

## 🚀 Quick Start

This is a complete expense management application with React frontend and Node.js backend, featuring role-based access control, multi-level approval workflows, and OCR integration.

## 📋 Prerequisites

- Node.js (v16 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

## 🛠️ Installation

### 1. Install Dependencies

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Environment Setup

#### Backend Environment Variables
Create a `.env` file in the `backend` directory:

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/expense-management
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

#### Frontend Environment Variables
Create a `.env` file in the `frontend` directory:

```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_APP_NAME=Expense Management
REACT_APP_VERSION=1.0.0
```

### 3. Database Setup

Make sure MongoDB is running on your system:

```bash
# Start MongoDB (if using local installation)
mongod

# Or if using MongoDB as a service
sudo systemctl start mongod
```

### 4. Start the Application

#### Option 1: Start Both Servers Concurrently
```bash
npm run dev
```

#### Option 2: Start Servers Separately
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm start
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## 🏗️ Project Structure

```
expense-management-app/
├── backend/                 # Node.js API Server
│   ├── models/            # MongoDB models
│   ├── routes/            # API routes
│   ├── middleware/        # Custom middleware
│   ├── uploads/           # File uploads directory
│   └── server.js          # Main server file
├── frontend/              # React Application
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── contexts/      # React contexts
│   │   └── App.js         # Main app component
│   └── public/            # Static files
└── README.md
```

## 🔐 Authentication & Roles

### User Roles
- **Admin**: Full access to all features
- **Manager**: Can approve expenses and manage team
- **Employee**: Can submit and view own expenses

### Default Admin Account
When you first sign up, you'll automatically become the admin of your company.

## 📊 Key Features

### ✅ Implemented Features
- [x] User authentication (signup, login, password reset)
- [x] Role-based access control
- [x] Company creation with country-based currency
- [x] User management (create, update, delete users)
- [x] Expense submission with multi-currency support
- [x] Approval workflow system
- [x] Receipt upload functionality
- [x] Real-time currency conversion
- [x] Responsive UI with modern design
- [x] Dashboard with statistics
- [x] Approval rules configuration

### 🔄 API Endpoints

#### Authentication
- `POST /api/auth/signup` - Company admin signup
- `POST /api/auth/login` - User login
- `POST /api/auth/forgot-password` - Password reset request
- `POST /api/auth/reset-password` - Password reset
- `GET /api/auth/me` - Get current user

#### Users
- `GET /api/users` - Get all users (Admin/Manager)
- `POST /api/users` - Create new user (Admin)
- `PUT /api/users/:id` - Update user (Admin)
- `DELETE /api/users/:id` - Delete user (Admin)

#### Expenses
- `GET /api/expenses` - Get expenses
- `POST /api/expenses` - Create expense
- `PUT /api/expenses/:id/submit` - Submit for approval
- `PUT /api/expenses/:id/approve` - Approve expense
- `PUT /api/expenses/:id/reject` - Reject expense

#### Approval Rules
- `GET /api/approval-rules` - Get approval rules
- `POST /api/approval-rules` - Create approval rule (Admin)
- `PUT /api/approval-rules/:id` - Update approval rule (Admin)

## 🎨 UI Components

The application uses a modern, responsive design with:
- Tailwind CSS for styling
- React Icons for icons
- React Hot Toast for notifications
- Formik + Yup for form handling
- React Router for navigation

## 🔧 Development

### Adding New Features
1. Create API routes in `backend/routes/`
2. Add corresponding models in `backend/models/`
3. Create React components in `frontend/src/components/`
4. Add pages in `frontend/src/pages/`
5. Update routing in `frontend/src/App.js`

### Database Models
- **User**: User accounts with roles and company association
- **Company**: Company information with currency settings
- **Expense**: Expense records with approval workflow
- **ApprovalRule**: Configurable approval workflows

## 🚀 Deployment

### Backend Deployment
1. Set production environment variables
2. Use PM2 for process management
3. Set up MongoDB Atlas or production MongoDB
4. Configure reverse proxy (nginx)

### Frontend Deployment
1. Build the React app: `npm run build`
2. Deploy to static hosting (Vercel, Netlify, etc.)
3. Update API URLs for production

## 🐛 Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Ensure MongoDB is running
   - Check connection string in `.env`

2. **CORS Issues**
   - Verify frontend URL in backend CORS settings
   - Check API base URL in frontend `.env`

3. **Authentication Issues**
   - Clear localStorage and try logging in again
   - Check JWT secret configuration

4. **File Upload Issues**
   - Ensure `uploads/receipts` directory exists
   - Check file size limits and allowed types

## 📝 License

MIT License - feel free to use this project for your own purposes.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📞 Support

For support or questions, please create an issue in the repository.
