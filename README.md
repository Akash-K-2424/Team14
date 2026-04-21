# Team 14 Project Submission

This repository contains a full-stack MERN application with:
- AI Resume Builder module
- Student Team Members Management module (CT2 task)

The app uses React + Vite on the frontend and Node.js + Express + MongoDB on the backend.

## Project Description

This project provides:
- User authentication (signup/login)
- Resume creation and editing features
- Team member management with image upload
- Member listing and member details pages

CT2-required pages are included:
- Home Page (`/team`)
- Add Member Page (`/team/add-member`)
- View Members Page (`/team/members`)
- Member Details Page (`/team/members/:id`)

## Installation Steps

1. Clone the repository:
```bash
git clone <your-repo-url>
cd Team-14
```

2. Install backend dependencies:
```bash
cd server
npm install
```

3. Install frontend dependencies:
```bash
cd ../client
npm install
```

4. Configure environment variables:
- Create `server/.env`
- Add required variables such as:
  - `PORT=5001`
  - `MONGO_URI=<your_mongodb_connection_string>`
  - `JWT_SECRET=<your_secret>`
  - `CLIENT_URL=http://localhost:5173`
  - `OPENAI_API_KEY=<your_key_if_used>`

## API Endpoints

### Team Members APIs (CT2)
- `POST /api/members` -> Add a new member (multipart form-data with `image`)
- `GET /api/members` -> Get all members
- `GET /api/members/:id` -> Get one member by ID
- `PUT /api/members/:id` -> Update member/photo

### Existing APIs
- `GET /api/health` -> Health check
- `POST /api/auth/signup` -> Register user
- `POST /api/auth/login` -> Login user
- Resume and AI routes are available under:
  - `/api/resumes`
  - `/api/ai`

## How To Run The App

Open 2 terminals:

Terminal 1 (Backend):
```bash
cd server
npm run dev
```

Terminal 2 (Frontend):
```bash
cd client
npm run dev
```

Then open:
- Frontend: `http://localhost:5173` (or the port shown by Vite)
- Backend: `http://localhost:5001`

## Folder Structure

```text
Team-14/
├── client/
├── server/
├── .gitignore
└── README.md
```
