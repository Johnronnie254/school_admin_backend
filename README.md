# **EduSphere - School Management System Backend**

## **Live Demo**
The API is live at: https://school-admin-backend-x5e5.onrender.com/

You can test the API endpoints using this base URL. For example:
- View API documentation: https://school-admin-backend-x5e5.onrender.com/
- Register: https://school-admin-backend-x5e5.onrender.com/api/register/
- Login: https://school-admin-backend-x5e5.onrender.com/api/login/

Note: The live demo is hosted on Render's free tier, so the first request might take a few seconds to wake up the server.

## **Overview**
EduSphere is a comprehensive **school management system** built with **Django REST Framework**. It provides a **robust API** for managing various aspects of school administration, including **students, teachers, parents, exam results, fee payments, and more**.

## **Features**

### **1. User Management**
- Role-based authentication (Admin, Teacher, Parent)
- JWT-based authentication
- User registration & login
- Password management

### **2. Academic Management**
- Student enrollment & records
- Teacher management
- Class assignments
- Subject management
- Exam results tracking
- Attendance tracking

### **3. Financial Management**
- School fee management
- Payment tracking & transaction history
- Payment status monitoring

### **4. Communication**
- Notifications system
- Targeted messaging (teachers, students, or both)
- Document management & file uploads

### **5. Administrative Tools**
- Bulk data upload
- Excel/CSV import support
- Statistical reports
- Data export capabilities

---

## **Technology Stack**

| **Component**         | **Technology** |
|----------------------|------------------|
| **Backend**          | Django 4.2.7 |
| **API Framework**    | Django REST Framework 3.14.0 |
| **Database**         | PostgreSQL |
| **Authentication**   | JWT (djangorestframework-simplejwt) |
| **File Handling**    | openpyxl, pandas |
| **Testing**         | pytest, coverage |

---

## **Installation Guide**

### **1. Clone the Repository**
```bash
git clone https://github.com/yourusername/edusphere-backend.git
cd edusphere-backend
```

### **2. Set Up Virtual Environment**
```bash
python -m venv venv
# Activate virtual environment
source venv/bin/activate   # On Windows: venv\Scripts\activate
```

### **3. Install Dependencies**
```bash
pip install -r requirements.txt
```

### **4. Configure Environment Variables**
```bash
cp .env.example .env
```
Edit the `.env` file to include the necessary environment variables.

### **5. Run Database Migrations**
```bash
python manage.py migrate
```

### **6. Start Development Server**
```bash
python manage.py runserver
```
The API will now be accessible at `http://127.0.0.1:8000/`.

---

## **API Endpoints**

### **Authentication**
- `POST /api/register/` → Register new user  
- `POST /api/login/` → User login  
- `POST /api/logout/` → User logout  

### **Users**
- `GET /api/users/` → List all users  
- `GET /api/users/{id}/` → Retrieve user details  
- `PUT /api/users/{id}/` → Update user  
- `DELETE /api/users/{id}/` → Delete user  

### **Teachers**
- `GET /api/teachers/` → List all teachers  
- `POST /api/teachers/` → Create a new teacher  
- `GET /api/teachers/{id}/` → Retrieve teacher details  
- `PUT /api/teachers/{id}/` → Update teacher  
- `DELETE /api/teachers/{id}/` → Delete teacher  
- `POST /api/teachers/bulk_upload/` → Bulk upload teachers  

### **Students**
- `GET /api/students/` → List all students  
- `POST /api/students/` → Create a new student  
- `GET /api/students/{id}/` → Retrieve student details  
- `PUT /api/students/{id}/` → Update student  
- `DELETE /api/students/{id}/` → Delete student  

### **Exam Results**
- `GET /api/exam-results/` → List all exam results  
- `POST /api/exam-results/` → Record exam results  
- `GET /api/students/{id}/exam-results/` → Get a student's exam results  

### **School Fees**
- `POST /api/fees/initiate/` → Initiate fee payment  
- `POST /api/fees/confirm/` → Confirm fee payment  
- `GET /api/students/{id}/fees/` → Retrieve a student's fee records  

### **Notifications**
- `GET /api/notifications/` → List all notifications  
- `POST /api/notifications/` → Create a new notification  
- `GET /api/notifications/{id}/` → Retrieve notification details  

---

## **Running Tests**
To run unit tests, use:  
```bash
python manage.py test admin_interface
```

---

## **Environment Variables**
The application uses the following environment variables:
```bash
# Django configuration
DEBUG=False  # Set to False in production
DJANGO_SECRET_KEY=your_secret_key
ALLOWED_HOSTS=localhost,127.0.0.1,school-admin-backend-x5e5.onrender.com

# Database configuration
DATABASE_URL=your_database_url

# CORS settings
CORS_ALLOWED_ORIGINS=http://localhost:3000,https://your-frontend-domain.com
```

## **Deployment**
The application is currently deployed on Render. For local deployment, follow the installation steps above.

### **Production Deployment**
1. Create an account on [Render](https://render.com)
2. Connect your GitHub repository
3. Create a new Web Service
4. Configure the environment variables
5. Deploy!

---
