<div align="center">
  <h1>FutureTap</h1>
  <p><strong>A Modern Platform for Educational Clubs and Activities</strong></p>
</div>

<br/>

## About the Project

**FutureTap** is a comprehensive web platform designed to seamlessly connect students, parents, and coaches through educational clubs and extracurricular activities. The platform simplifies the process of finding the right activity, managing enrollments, and providing intelligent tracking of educational progress.

Whether you are looking for STEM classes, art workshops, or sports clubs, our platform uses advanced machine learning algorithms to recommend the best activities tailored to each student's profile, while our integrated AI chatbot assists users throughout their educational journey.

## Key Features

- **Machine Learning Recommendations:** Personalized club recommendations generated using an internal ML engine (TF-IDF based) that analyzes age, interests, and schedule preferences.
- **Smart Chatbot Assistant:** An intelligent assistant powered by the Grok API, utilizing Retrieval-Augmented Generation (RAG) to answer questions based on the student's lesson history.
- **Audio Lesson Processing:** Integrated system leveraging OpenAI Whisper to transcribe recorded lessons, which are then summarized via Grok LLM to generate action items and tags.
- **Interactive Coach Profiles:** Detailed profiles for coaches with their specializations, ratings, and active clubs.
- **Seamless Enrollment:** Easy-to-use interface for parents and students to join clubs and manage their schedule.
- **Hybrid Data Storage:** Relational data stored in PostgreSQL for robust transactions, and unstructured AI lesson reports stored in MongoDB.

## Project Architecture

The system is built on a modern, decoupled architecture integrating web frameworks, machine learning, and external AI APIs.

| Component | Technology | Description |
|-----------|------------|-------------|
| **Frontend** | React, Vite, Tailwind CSS | The client-side application offering a responsive and interactive user interface for students, parents, and coaches. |
| **Backend API** | Django 5.2, Django REST Framework | The core server handling business logic, authentication (JWT), and API routing. |
| **Relational DB** | PostgreSQL (SQLite for local) | Primary database storing users, profiles, enrollments, and club structures. |
| **Document DB** | MongoDB | Stores unstructured, dynamically generated AI reports, lesson summaries, and transcriptions. |
| **Machine Learning** | Scikit-Learn (TF-IDF Vectorizer) | An internal recommendation engine that calculates vector similarities to match students with the most suitable clubs. |
| **AI Assistant / NLP** | Grok API (xAI) | Powers the intelligent chatbot and analyzes text to generate brief summaries and action items from transcripts. |
| **Speech-to-Text** | OpenAI Whisper (Local) | Processes audio recordings of classes to produce accurate text transcripts. |

## Getting Started

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

## License
This project is proprietary and built for educational purposes. All rights reserved.
