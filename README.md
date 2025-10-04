# Expense Management Application

A comprehensive expense management system with role-based access control, multi-level approval workflows, and OCR integration.

## Features

- **Authentication & User Management**: Company creation, user roles (Admin, Manager, Employee)
- **Expense Submission**: Multi-currency support, OCR receipt scanning
- **Approval Workflows**: Configurable approval rules, sequential and percentage-based approvals
- **Role-based Access**: Different interfaces for Admin, Manager, and Employee roles
- **Real-time Currency Conversion**: Automatic conversion to company base currency

## Tech Stack

### Backend
- Node.js with Express
- MongoDB with Mongoose
- JWT Authentication
- Joi Validation
- Multer for file uploads

### Frontend
- React.js
- Yup for form validation
- Modern UI with responsive design
- Context API for state management

## Project Structure

```
expense-management-app/
├── backend/          # Node.js API server
├── frontend/         # React application
└── README.md
```

## Getting Started

1. Install dependencies:
```bash
npm run install-all
```

2. Start development servers:
```bash
npm run dev
```

This will start both backend (port 5000) and frontend (port 3000) servers concurrently.

## API Endpoints

### Authentication
- POST /api/auth/signup - Company admin signup
- POST /api/auth/login - User login
- POST /api/auth/forgot-password - Password reset

### User Management
- GET /api/users - Get all users (Admin)
- POST /api/users - Create new user (Admin)
- PUT /api/users/:id - Update user (Admin)

### Expenses
- GET /api/expenses - Get user expenses
- POST /api/expenses - Submit new expense
- PUT /api/expenses/:id/approve - Approve expense
- PUT /api/expenses/:id/reject - Reject expense

### Approval Rules
- GET /api/approval-rules - Get approval rules
- POST /api/approval-rules - Create approval rules (Admin)
- PUT /api/approval-rules/:id - Update approval rules (Admin)

## Environment Variables

### Backend (.env)
```
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/expense-management
JWT_SECRET=your-jwt-secret
JWT_EXPIRE=7d
```

### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:5000/api
```
