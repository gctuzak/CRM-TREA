# CRM System

A comprehensive Customer Relationship Management (CRM) system built with Node.js, Express, MySQL, and Next.js.

## Overview

This CRM system provides a complete solution for managing customer relationships, sales opportunities, and tasks. It features a robust backend API with JWT authentication and a modern React-based frontend.

## Features

### Core Functionality
- **Contact Management**: Create, edit, and organize customer contacts with multiple emails and phone numbers
- **Opportunity Tracking**: Manage sales opportunities through customizable pipeline stages
- **Task Management**: Assign and track tasks with priorities, due dates, and status updates
- **User Management**: Role-based access control with Admin, Manager, and User roles
- **Dashboard Analytics**: Real-time insights into sales performance and task completion

### Technical Features
- **RESTful API**: Well-structured API endpoints with comprehensive validation
- **JWT Authentication**: Secure token-based authentication system
- **Role-based Authorization**: Granular permissions based on user roles
- **Data Validation**: Input validation and sanitization at multiple levels
- **Error Handling**: Comprehensive error handling with meaningful messages
- **Pagination**: Efficient data pagination for large datasets
- **Search & Filtering**: Advanced search and filtering capabilities
- **Audit Trail**: Track changes and user activities
- **Responsive Design**: Mobile-friendly interface

## Tech Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MySQL
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: Joi
- **Security**: bcrypt, helmet, cors
- **Environment**: dotenv

### Frontend
- **Framework**: Next.js 14
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Headless UI, Heroicons
- **State Management**: React Query (TanStack Query)
- **Forms**: React Hook Form with Zod validation
- **HTTP Client**: Axios
- **Notifications**: React Hot Toast
- **Charts**: Recharts

## Project Structure

```
CRM-TREA/
├── server/                 # Backend API
│   ├── config/            # Database and app configuration
│   ├── controllers/       # Route controllers
│   ├── middleware/        # Custom middleware
│   ├── models/           # Database models
│   ├── routes/           # API routes
│   ├── utils/            # Utility functions
│   ├── validators/       # Input validation schemas
│   └── server.js         # Main server file
├── client/               # Frontend application
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── hooks/        # Custom hooks
│   │   ├── lib/          # Utilities and API client
│   │   ├── pages/        # Next.js pages
│   │   ├── styles/       # Global styles
│   │   └── types/        # TypeScript definitions
│   └── public/           # Static assets
└── database/             # Database scripts
    └── schema.sql        # Database schema
```

## Prerequisites

- Node.js 18+ and npm
- MySQL 8.0+
- Git

## Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd CRM-TREA
```

### 2. Database Setup
```bash
# Create MySQL database
mysql -u root -p
CREATE DATABASE crm_system;
USE crm_system;
source database/schema.sql;
```

### 3. Backend Setup
```bash
cd server
npm install

# Create environment file
cp .env.example .env

# Update .env with your database credentials
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=crm_system
JWT_SECRET=your_jwt_secret
PORT=3001
```

### 4. Frontend Setup
```bash
cd ../client
npm install

# Create environment file
cp .env.example .env.local

# Update .env.local
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Running the Application

### Development Mode

1. **Start the Backend Server**:
```bash
cd server
npm run dev
# Server runs on http://localhost:3001
```

2. **Start the Frontend Application**:
```bash
cd client
npm run dev
# Application runs on http://localhost:3000
```

### Production Mode

1. **Backend**:
```bash
cd server
npm start
```

2. **Frontend**:
```bash
cd client
npm run build
npm start
```

## API Documentation

### Authentication Endpoints
- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `POST /auth/refresh` - Refresh JWT token
- `POST /auth/logout` - User logout
- `POST /auth/change-password` - Change password

### Contact Endpoints
- `GET /contacts` - Get all contacts (with pagination and filters)
- `GET /contacts/:id` - Get contact by ID
- `POST /contacts` - Create new contact
- `PUT /contacts/:id` - Update contact
- `DELETE /contacts/:id` - Delete contact
- `GET /contacts/search` - Search contacts
- `GET /contacts/stats` - Get contact statistics

### Opportunity Endpoints
- `GET /opportunities` - Get all opportunities
- `GET /opportunities/:id` - Get opportunity by ID
- `POST /opportunities` - Create new opportunity
- `PUT /opportunities/:id` - Update opportunity
- `DELETE /opportunities/:id` - Delete opportunity
- `GET /opportunities/pipeline` - Get sales pipeline data
- `GET /opportunities/stats` - Get opportunity statistics

### Task Endpoints
- `GET /tasks` - Get all tasks
- `GET /tasks/:id` - Get task by ID
- `POST /tasks` - Create new task
- `PUT /tasks/:id` - Update task
- `DELETE /tasks/:id` - Delete task
- `PUT /tasks/:id/complete` - Mark task as completed
- `GET /tasks/my` - Get current user's tasks
- `GET /tasks/stats` - Get task statistics

### User Endpoints (Admin/Manager only)
- `GET /users` - Get all users
- `GET /users/:id` - Get user by ID
- `POST /users` - Create new user
- `PUT /users/:id` - Update user
- `DELETE /users/:id` - Delete user
- `PUT /users/:id/status` - Update user status
- `GET /users/stats` - Get user statistics

### Dashboard Endpoints
- `GET /dashboard/overview` - Get dashboard overview
- `GET /dashboard/sales-pipeline` - Get sales pipeline data
- `GET /dashboard/task-summary` - Get task summary
- `GET /dashboard/revenue-chart` - Get revenue chart data
- `GET /dashboard/recent-activities` - Get recent activities
- `GET /dashboard/upcoming-tasks` - Get upcoming tasks

## User Roles & Permissions

### Admin
- Full access to all features
- User management capabilities
- System configuration access
- View all data across the organization

### Manager
- Access to reports and analytics
- Manage team members' data
- View team performance metrics
- Limited user management

### User
- Manage own contacts, opportunities, and tasks
- View assigned tasks and opportunities
- Basic reporting features

## Database Schema

The system uses the following main tables:
- `users` - User accounts and authentication
- `contacts` - Customer contact information
- `contact_emails` - Multiple email addresses per contact
- `contact_phones` - Multiple phone numbers per contact
- `opportunities` - Sales opportunities
- `tasks` - Task management

## Security Features

- **Password Hashing**: bcrypt with salt rounds
- **JWT Authentication**: Secure token-based auth
- **Input Validation**: Comprehensive validation using Joi
- **SQL Injection Prevention**: Parameterized queries
- **CORS Protection**: Configured for specific origins
- **Rate Limiting**: API rate limiting middleware
- **Helmet Security**: Security headers

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow existing code style and conventions
- Add proper error handling and validation
- Write meaningful commit messages
- Test your changes thoroughly
- Update documentation as needed

## Troubleshooting

### Common Issues

1. **Database Connection Error**:
   - Verify MySQL is running
   - Check database credentials in `.env`
   - Ensure database exists and schema is loaded

2. **Frontend API Connection Error**:
   - Verify backend server is running on port 3001
   - Check `NEXT_PUBLIC_API_URL` in `.env.local`
   - Ensure CORS is properly configured

3. **Authentication Issues**:
   - Check JWT secret configuration
   - Verify token expiration settings
   - Clear browser localStorage if needed

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support and questions, please open an issue in the repository or contact the development team.

---

**Version**: 1.0.0  
**Last Updated**: 2024  
**Maintainer**: CRM Development Team