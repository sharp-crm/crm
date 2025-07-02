# Sharp CRM - Complete Business Management Solution

A modern, full-stack Customer Relationship Management (CRM) system built with React and Node.js, designed for comprehensive business management and sales pipeline tracking.

## 🏗️ Project Structure

```
sharp-crm-aws/
├── frontend/           # React + TypeScript frontend
│   ├── src/
│   │   ├── components/ # Reusable UI components
│   │   ├── pages/      # Application pages
│   │   ├── store/      # State management (Zustand)
│   │   ├── types/      # TypeScript type definitions
│   │   ├── api/        # API client functions
│   │   └── utils/      # Utility functions
│   └── package.json
├── backend/            # Node.js + TypeScript backend
│   ├── src/
│   │   ├── routes/     # API route handlers
│   │   ├── middlewares/ # Express middlewares
│   │   ├── services/   # Business logic & external services
│   │   └── utils/      # Utility functions
│   └── package.json
└── README.md
```

## 🚀 Features Overview

### 📊 Core CRM Functionality
- **Lead Management**: Track and convert prospects through sales funnel
- **Contact Management**: Comprehensive customer database
- **Deal Pipeline**: Visual sales pipeline with stage tracking
- **Task Management**: Assign and track activities with deadlines
- **Account Management**: Company/organization profiles
- **Subsidiaries & Dealers**: Partner and subsidiary management

### 📈 Analytics & Reporting
- **Dashboard Overview**: Real-time KPIs and business metrics
- **Sales Analytics**: Revenue trends, conversion rates, pipeline analysis
- **Activity Tracking**: Task completion rates and team performance
- **Custom Reports**: Configurable reports with filters and scheduling
- **Data Visualization**: Charts and graphs for business insights

### 👥 User Management & Security
- **Role-Based Access**: Admin, Sales Manager, Sales Rep roles
- **User Profiles**: Personal settings and information management
- **Tenant Isolation**: Multi-tenant architecture by email domain
- **Secure Authentication**: JWT-based auth with refresh tokens

### 🔔 Advanced Features
- **Notifications System**: Real-time alerts and updates
- **Calendar Integration**: Meeting scheduling and management
- **Email Integration**: Connect with email providers
- **Team Collaboration**: Shared workspaces and communication
- **Mobile Responsive**: Works seamlessly on all devices

## 💻 Technology Stack

### Frontend
- **React 18** - Modern UI library with hooks
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Zustand** - Lightweight state management
- **React Router** - Client-side routing
- **Lucide React** - Beautiful icons
- **Recharts** - Data visualization
- **Axios** - HTTP client

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **TypeScript** - Type-safe development
- **AWS DynamoDB** - NoSQL database
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing
- **AWS SDK** - Cloud integration

## 🛠️ Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- AWS Account (or DynamoDB Local for development)

### 1. Clone Repository
```bash
git clone <repository-url>
cd sharp-crm-aws
```

### 2. Backend Setup
```bash
cd backend
npm install

# Copy and configure environment
cp .env.example .env
# Edit .env with your configuration

# Initialize database tables
npm run init-db

# Start backend server
npm run dev
```

The backend will run on `http://localhost:8080`

### 3. Frontend Setup
```bash
cd frontend
npm install

# Start frontend development server
npm run dev
```

The frontend will run on `http://localhost:5173`

### 4. Access Application
- Open your browser to `http://localhost:5173`
- Register a new account or use existing credentials
- Start managing your CRM data!

## 📱 Application Screenshots & Features

### Dashboard Overview
- Real-time business metrics and KPIs
- Revenue trends and sales performance
- Quick access to leads, deals, and tasks
- Recent activity and notifications

### Lead Management
- Lead capture and qualification
- Source tracking and attribution
- Status progression (New → Contacted → Qualified → Lost)
- Lead scoring and prioritization

### Deal Pipeline
- Visual pipeline with drag-and-drop stages
- Probability tracking and forecasting
- Deal value and close date management
- Sales cycle analysis

### Task Management
- Task creation with priorities and deadlines
- Assignment to team members
- Task types (Call, Email, Meeting, Follow-up, Demo)
- Progress tracking and completion

### Analytics & Reporting
- Interactive charts and graphs
- Custom report builder
- Scheduled report delivery
- Export capabilities
- Team performance metrics

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```env
PORT=8080
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
JWT_SECRET=your-jwt-secret
JWT_REFRESH_SECRET=your-refresh-secret
AWS_REGION=us-west-2
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
DYNAMODB_ENDPOINT=http://localhost:8000  # For local development
```

#### Frontend
The frontend automatically connects to the backend on `http://localhost:8080` in development.

## 🚀 Deployment

### Backend Deployment (AWS)
1. Deploy to AWS EC2, ECS, or Lambda
2. Set up DynamoDB tables in production
3. Configure proper environment variables
4. Set up SSL/TLS certificates

### Frontend Deployment
1. Build the frontend: `npm run build`
2. Deploy to AWS S3 + CloudFront, Netlify, or Vercel
3. Update API endpoints for production

## 📚 API Documentation

The backend provides a comprehensive REST API with the following endpoints:

### Core Modules
- `/api/auth` - Authentication and user management
- `/api/users` - User administration
- `/api/contacts` - Contact management
- `/api/leads` - Lead tracking
- `/api/deals` - Deal pipeline
- `/api/tasks` - Task management
- `/api/accounts` - Account/company management

### Advanced Features
- `/api/analytics` - Business analytics and metrics
- `/api/notifications` - Notification system
- `/api/meetings` - Calendar and meetings
- `/api/reports` - Custom reporting

See [Backend README](./backend/README.md) for detailed API documentation.

## 🔒 Security Features

- JWT-based authentication with refresh tokens
- Role-based access control (RBAC)
- Password hashing with bcrypt
- CORS protection
- Input validation and sanitization
- Secure headers and middleware
- Multi-tenant data isolation

## 🧪 Testing

### Frontend Testing
```bash
cd frontend
npm run test
```

### Backend Testing
```bash
cd backend
npm run test
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to the branch: `git push origin feature/new-feature`
5. Submit a pull request

### Development Guidelines
- Follow TypeScript best practices
- Use ESLint and Prettier for code formatting
- Write meaningful commit messages
- Add tests for new features
- Update documentation when needed

## 📄 License

This project is licensed under the [MIT License](LICENSE).

## 🆘 Support

For support, email support@sharpcrm.com or create an issue on GitHub.

## 🗂️ Project Roadmap

### Phase 1 (Current)
- ✅ Core CRM functionality
- ✅ User management and authentication
- ✅ Basic analytics and reporting
- ✅ Responsive UI design

### Phase 2 (Planned)
- 📧 Advanced email integration
- 📱 Mobile app development
- 🔗 Third-party integrations (Salesforce, HubSpot)
- 🤖 AI-powered insights and recommendations

### Phase 3 (Future)
- 📞 VoIP integration
- 📊 Advanced business intelligence
- 🌐 Multi-language support
- 🔄 Workflow automation

---

Built with ❤️ by the Sharp CRM Team 