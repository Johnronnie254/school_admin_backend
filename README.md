# **EduCite - School Management System**

## **Live Demo**
Backend API: https://educitebackend.co.ke/
Frontend Admin Dashboard: [Coming Soon]

## **Overview**
EduCite is a modern school management system built with Django REST Framework for the backend and Next.js for the frontend admin dashboard. It provides a comprehensive solution for managing school operations, including student records, teacher management, exam results, fee payments, and communication.

## **Project Structure**

The project consists of two main components:

### **1. Backend (Django REST Framework)**
- Core application logic and API endpoints
- Database management
- Authentication and authorization
- Real-time notifications using WebSockets
- File handling and data exports

### **2. Admin Dashboard (Next.js)**
- Modern, responsive user interface
- Real-time data updates
- Role-based access control
- Interactive data visualization
- Secure API integration

## **Features**

### **1. User Management**
- Multi-role authentication (Admin, Teacher, Parent)
- JWT-based secure authentication
- Role-based access control
- Password management

### **2. Academic Management**
- Student enrollment and records
- Teacher management
- Class assignments
- Subject management
- Exam results tracking

### **3. Financial Management**
- School fee management
- Payment tracking
- Transaction history
- Fee status monitoring

### **4. Communication**
- Real-time notifications
- Messaging system between teachers and parents
- Document sharing
- Announcements

### **5. Administrative Tools**
- Statistical reports
- Data export capabilities
- User activity monitoring
- System settings management

## **Technology Stack**

### **Backend**
- Django 4.2.7
- Django REST Framework 3.14.0
- PostgreSQL
- Redis (for WebSocket)
- JWT Authentication

### **Frontend**
- Next.js 14
- TypeScript
- Tailwind CSS
- Axios
- React Hook Form
- React Hot Toast

## **Installation Guide**

### **1. Backend Setup**

```bash
# Clone the repository
git clone [repository-url]
cd school_admin_backend

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Edit .env with your configuration

# Run migrations
python manage.py migrate

# Start development server
python manage.py runserver
```

### **2. Frontend Setup**

```bash
# Navigate to admin dashboard directory
cd admin-dashboard

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

# Run development server
npm run dev
```

## **Environment Variables**

### **Backend (.env)**
```bash
DEBUG=True
DJANGO_SECRET_KEY=your_secret_key
ALLOWED_HOSTS=localhost,127.0.0.1,educitebackend.co.ke
DATABASE_URL=your_database_url
CORS_ALLOWED_ORIGINS=http://localhost:3000
```

### **Frontend (.env.local)**
```bash
NEXT_PUBLIC_API_URL=https://educitebackend.co.ke/api
```

## **API Documentation**

### **Authentication Endpoints**
- `POST /api/auth/register/` - Register new user
- `POST /api/auth/login/` - User login
- `POST /api/auth/logout/` - User logout
- `POST /api/auth/refresh/` - Refresh JWT token

### **Core Endpoints**
- `/api/students/` - Student management
- `/api/teachers/` - Teacher management
- `/api/parents/` - Parent management
- `/api/exam-results/` - Exam results
- `/api/school-fees/` - School fees
- `/api/notifications/` - Notifications
- `/api/messages/` - Messaging system

## **Contributing**
Please read our contributing guidelines before submitting pull requests.

## **License**
[MIT License](LICENSE)

## **Support**
For support and queries, please contact [support email]
