# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Elementary school Scratch learning support system - a university graduation research project. The system provides 4 types of programming problems to teach elementary students computational thinking through Scratch:
- **fill_blank**: Fill in missing program parts
- **predict**: Predict code execution results
- **find_error**: Find and fix bugs
- **mission**: Apply knowledge creatively

Students download Scratch projects from https://scratch.mit.edu/, work on them, then upload .sb3 files for automatic grading.

## Tech Stack

**Backend**: Node.js + Express, PostgreSQL, JWT auth, Multer (file uploads), JSZip (SB3 parsing)
**Frontend**: React 18 + TypeScript, Tailwind CSS, React Router v6
**Infrastructure**: Docker Compose

## Development Commands

### Initial Setup
```bash
# Start all services
docker-compose up --build -d

# Run database migrations
docker-compose exec backend npm run migrate

# Seed initial data (creates admin user)
docker-compose exec backend node src/db/seed.js
```

### Daily Development
```bash
# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Restart services
docker-compose restart

# Stop all services
docker-compose down

# Reset database
docker-compose down -v
docker-compose up -d
docker-compose exec backend npm run migrate
docker-compose exec backend node src/db/seed.js
```

### Database Access
```bash
docker-compose exec postgres psql -U postgres -d scratch_learning
```

## Application URLs
- Frontend: http://localhost:3000
- Backend: http://localhost:5000
- PostgreSQL: localhost:5432
- Default admin credentials: `admin` / `admin123`

## Architecture

### Backend Structure
- **src/server.js**: Express app entry point with route mounting
- **src/config/database.js**: PostgreSQL connection pool
- **src/middleware/auth.js**: JWT authentication (authMiddleware for students, adminAuthMiddleware for admins)
- **src/controllers/**: Business logic layer
  - authController: User/admin registration and login
  - problemController: Chapters, problems, hints retrieval
  - submissionController: SB3 file parsing and grading logic
  - adminController: Analytics and statistics
- **src/routes/**: API endpoint definitions
- **src/db/**: Database migrations and seed scripts
- **src/utils/logger.js**: Automatic logging to `logs/` directory

### Frontend Structure
- **src/App.tsx**: Router setup with ProtectedRoute wrapper
- **src/contexts/AuthContext.tsx**: Global auth state (user/admin, localStorage token management)
- **src/services/api.ts**: Axios instance with JWT interceptor, all API calls
- **src/pages/**: Route components
- **src/components/**: Reusable UI components (Header, Footer, HintBubble, Loading)
- **src/types/**: TypeScript definitions

### Authentication Flow
1. Frontend stores JWT token in localStorage with userType ('student' or 'admin')
2. api.ts interceptor attaches `Authorization: Bearer <token>` to all requests
3. Backend middleware validates JWT and injects `req.user` or `req.admin`
4. Different middleware used: `authMiddleware` vs `adminAuthMiddleware`

### Submission Flow
1. User uploads .sb3 file via multipart/form-data
2. Backend parses SB3 (ZIP containing project.json) using JSZip
3. compareScratchPrograms() compares submitted vs correct JSON structures
4. Records both final submission (submissions table) and all attempts (submission_attempts table) for research

### Database Schema
- **users**: Students (username, password_hash, nickname, level, exp, grade 1-6)
- **admins**: Admin accounts
- **chapters**: Learning units with order_number
- **problems**: 4 types (fill_blank, predict, find_error, mission), stores initial_sb3_data and correct_sb3_data as JSONB
- **hints**: Grade-specific hints (grade 1-6) for adaptive learning
- **submissions**: Final submission record per user-problem pair (UNIQUE constraint)
- **submission_attempts**: All attempts for research analysis

Key relationships: problems → chapter_id, hints → problem_id + grade, submissions → user_id + problem_id

### Logging
All development activity is automatically logged to `logs/YYYYMMDD_HHMMSS_server.log` via backend/src/utils/logger.js. This is critical for the graduation research documentation.

## Key Implementation Notes

- SB3 grading logic in backend/src/controllers/submissionController.js uses simplified JSON comparison. Production version should implement block-by-block semantic comparison.
- Frontend uses AuthContext to manage dual authentication (students vs admins) with different localStorage keys.
- Database triggers automatically update updated_at timestamps.
- All error messages and UI text are in Japanese for elementary school students.
