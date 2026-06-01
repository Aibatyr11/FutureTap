<div align="center">
  <h1>🌟 FutureTap / TalentTap</h1>
  <p><strong>A Modern Platform for Educational Clubs and Activities</strong></p>
</div>

<br/>

## 📖 About the Project

**FutureTap (TalentTap)** is a comprehensive web platform designed to seamlessly connect students, parents, and coaches through educational clubs and extracurricular activities. The platform simplifies the process of finding the right activity, managing enrollments, and providing smart tracking of progress.

Whether you are looking for STEM classes, art workshops, or sports clubs, our platform uses advanced algorithms to recommend the best activities tailored to each student's profile.

## ✨ Key Features

- **Smart Recommendations:** Get personalized club recommendations based on age, interests, and schedule preferences.
- **Audio Lesson Processing:** Integrated system to transcribe and summarize recorded lessons for easier review and feedback.
- **Interactive Coach Profiles:** Detailed profiles for coaches with their specializations, ratings, and active clubs.
- **Seamless Enrollment:** Easy-to-use interface for parents and students to join clubs and manage their schedule.
- **Progress Tracking:** Automatic generation of lesson summaries and action items to keep students on track.

## 🚀 Technologies Used

### Backend
- **Framework:** Django 5.2 & Django REST Framework
- **Database:** PostgreSQL (with SQLite for local development)
- **Authentication:** JWT (JSON Web Tokens)
- **Task Processing & Audio Analysis:** Python-based advanced processing pipelines

### Frontend
- **Framework:** React (Vite)
- **Styling:** Tailwind CSS (or similar modern utility frameworks)
- **State Management & Routing:** Modern React ecosystem practices

## 🛠 Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/Aibatyr11/FutureTap.git
cd FutureTap
```

### 2. Backend Setup
Navigate to the `backend` folder and set up your Python environment:
```bash
cd backend
python -m venv .venv
# Activate the environment
.venv\Scripts\activate  # Windows
# Install dependencies
pip install -r requirements.txt
```

Run database migrations and populate seed data:
```bash
cd project
python manage.py migrate
python manage.py seed_data
```

Start the backend server:
```bash
python manage.py runserver 0.0.0.0:8000
```

### 3. Frontend Setup
Navigate to the frontend directory:
```bash
cd frontend/talantap-frontend
npm install
npm run dev
```

The application will be available at `http://localhost:5173`.

## 🛡 License
This project is proprietary and built for educational purposes. All rights reserved.
