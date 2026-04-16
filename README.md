# DiagnoAI - Digital Health Application

A comprehensive digital health application built with Spring Boot backend and React frontend.

## Tech Stack

- **Backend**: Java 17, Spring Boot 3.1.0, MySQL, JWT Authentication
- **Frontend**: React 18, Axios for API calls
- **Architecture**: Clean Architecture with DTO pattern

## Features

- Patient registration and authentication
- Symptom tracking
- Medication management
- Appointment scheduling
- AI-powered symptom analysis (simulated)

## Project Structure

```
diagnoai/
├── backend/                 # Spring Boot application
│   ├── src/main/java/com/diagnoai/
│   │   ├── controller/      # REST controllers
│   │   ├── service/         # Business logic
│   │   ├── repository/      # Data access layer
│   │   ├── model/           # JPA entities
│   │   ├── dto/             # Data transfer objects
│   │   ├── security/        # JWT authentication
│   │   ├── config/          # Configuration classes
│   │   └── ai/              # AI integration
│   └── pom.xml
└── frontend/                # React application
    ├── src/
    │   ├── components/      # Reusable components
    │   ├── pages/           # Page components
    │   └── services/        # API service
    └── package.json
```

## Prerequisites

- Java 17
- Node.js 16+
- MySQL Server

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Configure MySQL database in `src/main/resources/application.properties`:
   ```properties
   spring.datasource.url=jdbc:mysql://localhost:3306/diagnoai_db?useSSL=false&serverTimezone=UTC
   spring.datasource.username=root
   spring.datasource.password=your_password
   spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver
   spring.jpa.hibernate.ddl-auto=update
   spring.jpa.show-sql=true
   spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.MySQL8Dialect
   ```

3. Set JWT secret in `application.properties`:
   ```properties
   jwt.secret=your_jwt_secret_key_here
   ```

4. Run the application:
   ```bash
   mvn spring-boot:run
   ```

The backend will start on http://localhost:8080

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

The frontend will start on http://localhost:3000

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new patient
- `POST /api/auth/login` - Login patient

### Patients
- `GET /api/patients` - Get all patients
- `GET /api/patients/{id}` - Get patient by ID
- `POST /api/patients` - Create patient
- `PUT /api/patients/{id}` - Update patient
- `DELETE /api/patients/{id}` - Delete patient

### Symptoms
- `GET /api/symptoms` - Get all symptoms
- `GET /api/symptoms/patient/{patientId}` - Get symptoms by patient
- `GET /api/symptoms/{id}` - Get symptom by ID
- `POST /api/symptoms` - Create symptom
- `PUT /api/symptoms/{id}` - Update symptom
- `DELETE /api/symptoms/{id}` - Delete symptom

### Medications
- `GET /api/medications` - Get all medications
- `GET /api/medications/patient/{patientId}` - Get medications by patient
- `GET /api/medications/{id}` - Get medication by ID
- `POST /api/medications` - Create medication
- `PUT /api/medications/{id}` - Update medication
- `DELETE /api/medications/{id}` - Delete medication

### Appointments
- `GET /api/appointments` - Get all appointments
- `GET /api/appointments/patient/{patientId}` - Get appointments by patient
- `GET /api/appointments/{id}` - Get appointment by ID
- `POST /api/appointments` - Create appointment
- `PUT /api/appointments/{id}` - Update appointment
- `DELETE /api/appointments/{id}` - Delete appointment

### AI
- `POST /api/ai/analyze?patientId={id}` - Analyze patient symptoms

## Usage

1. Register a new patient account or login with existing credentials
2. Access the dashboard to view your health data
3. Use the symptom tracker to log symptoms and get AI analysis
4. Manage medications and appointments through the dashboard

## Security

- JWT-based authentication
- Password hashing with BCrypt
- Protected API endpoints
- CORS configuration for frontend-backend communication

## Development

- Clean architecture principles
- DTO pattern for data transfer
- Global exception handling
- Comprehensive logging
- Unit and integration tests (to be added)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.
