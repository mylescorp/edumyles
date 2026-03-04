# EduMyles API Documentation

## Overview
The EduMyles API provides comprehensive access to all school management functionalities through RESTful endpoints.

## Base URL
- Production: `https://api.edumyles.com/v1`
- Staging: `https://staging-api.edumyles.com/v1`
- Development: `http://localhost:3000/api/v1`

## Authentication
All API requests require authentication using JWT tokens.

### Login
```bash
curl -X POST https://api.edumyles.com/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

### Using the Token
```bash
curl -X GET https://api.edumyles.com/v1/students \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Rate Limiting
- 1000 requests/minute per user
- 5000 requests/minute per tenant
- 10000 requests/minute globally

## API Endpoints

### Authentication
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout
- `POST /auth/refresh` - Refresh token

### Students
- `GET /students` - List students
- `POST /students` - Create student
- `GET /students/{id}` - Get student
- `PUT /students/{id}` - Update student
- `DELETE /students/{id}` - Delete student

### Teachers
- `GET /teachers` - List teachers
- `POST /teachers` - Create teacher
- `GET /teachers/{id}` - Get teacher
- `PUT /teachers/{id}` - Update teacher

### Assignments
- `GET /assignments` - List assignments
- `POST /assignments` - Create assignment
- `GET /assignments/{id}` - Get assignment
- `PUT /assignments/{id}` - Update assignment

### Grades
- `GET /grades` - List grades
- `POST /grades` - Create grade
- `GET /grades/{id}` - Get grade
- `PUT /grades/{id}` - Update grade

### Payments
- `GET /payments` - List payments
- `POST /payments` - Create payment
- `GET /payments/{id}` - Get payment

## Error Handling
All errors return JSON with:
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {}
}
```

## SDKs and Libraries
- JavaScript/TypeScript
- Python
- PHP
- Java

## Support
- API Documentation: https://docs.edumyles.com/api
- Support Email: api-support@edumyles.com
- Status Page: https://status.edumyles.com
