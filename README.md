# 🧠 GyaanBikas

<h1 align="center">GyaanBikas</h1>

<p align="center">
  <strong>Personal Learning & Knowledge Management Platform</strong>
</p>

<p align="center">
  Learn • Organize • Practice • Track • Grow
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Status-Active-success?style=for-the-badge"/>
  <img src="https://img.shields.io/badge/Platform-Web-blue?style=for-the-badge"/>
  <img src="https://img.shields.io/badge/Database-Supabase-3ECF8E?style=for-the-badge"/>
  <img src="https://img.shields.io/badge/JavaScript-ES6+-yellow?style=for-the-badge"/>
  <img src="https://img.shields.io/badge/PWA-Ready-purple?style=for-the-badge"/>
</p>

---

## ✨ About GyaanBikas

GyaanBikas is a modern personal learning and knowledge management platform designed to help students capture what they learn, organize their knowledge, practice through quizzes, and track their learning progress.

Instead of keeping notes scattered across notebooks, screenshots, documents, and different apps, GyaanBikas brings everything into one focused learning environment.

> "Learn something today. Remember it tomorrow. Grow every day."

---

## 🚀 What Makes GyaanBikas Special?

GyaanBikas combines:

- 📚 Personal Learning Notes
- 🧠 Interactive Quizzes
- 📊 Learning Progress
- 🏆 Achievements
- ⭐ Favorite Notes
- 🔐 Secure Authentication
- 👑 Admin Portal
- 📱 Responsive UI
- ⚡ PWA Support
- ☁️ Supabase Backend

The platform is designed around a simple idea:

LEARN
  ↓
WRITE
  ↓
PRACTICE
  ↓
TRACK
  ↓
IMPROVE
  ↓
GROW

---

## 🌟 Core Features

### 📚 Smart Learning Notes

Create and manage structured learning notes with:

- Subject
- Topic
- Learning date
- Detailed content
- Tags
- Reference URL
- Pin important notes
- Edit existing notes
- Delete notes
- Search and filter

Notes are stored securely in Supabase and can be accessed after authentication.

---

### 🧠 Quiz System

GyaanBikas includes an interactive quiz environment where users can:

- Explore published quizzes
- Start a quiz
- Answer questions
- Track quiz time
- Submit answers
- Calculate scores
- Store quiz attempts
- Review learning performance

The quiz system turns passive learning into active practice.

---

### 👑 Admin Portal

The Admin Portal provides centralized content management.

The administrator can:

- Create learning notes
- Edit notes
- Delete notes
- Create quizzes
- Add quiz questions
- Publish quizzes
- Update quizzes
- Delete quizzes
- Manage learning content

Admin access is controlled through authenticated user identity.

---

## 🏆 Achievement System

GyaanBikas motivates continuous learning through achievements.

| Achievement | Requirement |
|---|---|
| 📝 First Note | Create your first learning note |
| 📚 Knowledge Builder | Create 10 notes |
| 🧠 First Challenge | Complete your first quiz |
| 🎯 Quiz Explorer | Complete 5 quiz attempts |
| 🏆 Sharp Mind | Reach 90%+ quiz accuracy |
| 🔥 7 Day Streak | Maintain a 7-day learning streak |
| 🚀 Deep Learner | Create 20 notes |
| 🌐 Subject Explorer | Study 3 different subjects |

---

## ⭐ Favorites

Users can save important notes to their personal favorites.

This makes it easier to quickly access:

- Important concepts
- Frequently reviewed topics
- Exam preparation material
- Difficult subjects
- High-priority notes

---

## 📊 Learning Progress

GyaanBikas keeps track of learning activity and quiz performance.

Users can monitor:

- Quiz attempts
- Scores
- Accuracy
- Learning streak
- Achievements
- Subject-wise learning activity

This transforms learning data into meaningful progress.

---

## 🔐 Authentication

GyaanBikas uses Supabase Authentication.

The application supports authenticated user sessions and maintains user-specific information such as:

- Profile
- Name
- Username
- Email
- Avatar
- Learning activity
- Favorites
- Achievements
- Quiz attempts

---

## ☁️ Backend Architecture

GyaanBikas uses Supabase as its backend platform.

### Main Database Entities

profiles
│
├── learning_notes
│
├── note_favorites
│
├── quizzes
│   └── quiz_questions
│
├── quiz_attempts
│
└── user_achievements

---

## 🏗️ Project Architecture

GyaanBikas/
│
├── index.html
├── icon.svg
├── manifest.webmanifest
├── sw.js
├── README.md
│
├── css/
│   └── app.css
│
└── js/
    ├── app.js
    └── supabase.js

---

## ⚙️ Technology Stack

### Frontend

- HTML5
- CSS3
- JavaScript ES6+
- Responsive UI
- PWA

### Backend

- Supabase
- PostgreSQL
- Supabase Authentication
- Row Level Security

### Application Architecture

User
 │
 ▼
GyaanBikas UI
 │
 ▼
JavaScript Application Engine
 │
 ▼
Supabase Client
 │
 ├──────────────► Authentication
 │
 └──────────────► PostgreSQL
                       │
                       ├── Profiles
                       ├── Learning Notes
                       ├── Quizzes
                       ├── Quiz Questions
                       ├── Quiz Attempts
                       ├── Favorites
                       └── Achievements

---

## 🎨 User Experience

GyaanBikas is designed with a modern dashboard experience featuring:

- Smooth navigation
- Animated transitions
- Responsive layouts
- Dark/Light appearance support
- Interactive cards
- Modal interfaces
- Search experience
- Mobile-friendly navigation
- PWA support

The goal is to make learning feel less like managing data and more like using a personal knowledge workspace.

---

## 📱 Progressive Web App

GyaanBikas includes PWA functionality through:

manifest.webmanifest
        +
service worker
        +
application shell

This allows the application to behave more like an installable application on supported platforms.

---

## 🧑‍💻 Local Development

Clone the repository:

git clone https://github.com/Arijit07-tech7/GyaanBikas.git

Move into the project:

cd GyaanBikas

Run a local static server:

npx http-server .

Or use VS Code Live Server.

---

## 🔑 Supabase Configuration

The application uses a Supabase client configuration through:

js/supabase.js

Make sure the project contains the correct:

SUPABASE_URL
SUPABASE_PUBLISHABLE_KEY

Never expose a Supabase service-role key in frontend code.

---

## 🔒 Security

GyaanBikas uses Row Level Security (RLS) to control database access.

The application separates:

Authenticated User
        │
        ├── Personal Data
        │
        └── Shared Learning Content

Administrator
        │
        └── Content Management

Database permissions should always be configured together with appropriate RLS policies.

---

## 🧩 Supported Subjects

The current application includes learning categories such as:

- ✦ Machine Learning
- ⌘ Python
- ◇ Java
- ◒ Data Science
- ◎ Web Development

The architecture can be extended with additional subjects.

---

## 🛣️ Future Roadmap

- [ ] AI-powered note summarization
- [ ] AI-generated quizzes
- [ ] Flashcards
- [ ] Spaced repetition
- [ ] Advanced analytics
- [ ] Subject-wise progress charts
- [ ] PDF note export
- [ ] Markdown editor
- [ ] Offline-first learning
- [ ] Cloud file attachments
- [ ] Collaborative study rooms
- [ ] Leaderboards
- [ ] Smart learning recommendations
- [ ] AI learning assistant

---

## 🎯 Vision

The vision behind GyaanBikas is simple:

> Knowledge should not disappear after a class ends.

Every lecture, concept, experiment, mistake, quiz, and discovery can become part of a student's personal knowledge system.

GyaanBikas aims to turn everyday learning into a structured, searchable, measurable, and continuously growing knowledge base.

---

## 💡 Why "GyaanBikas"?

Gyaan → Knowledge

Bikas → Growth / Development

Together:

GYAANBIKAS
     ↓
Knowledge + Growth

The name represents the core philosophy of the project:

> Build knowledge. Build yourself.

---

## 👨‍💻 Developer

### Arijit Gupta

Engineering Student • Developer • Builder

---

## ⭐ Support the Project

If you find GyaanBikas useful:

⭐ Star the repository
🍴 Fork the project
🐛 Report issues
💡 Suggest improvements
🚀 Contribute new features

---

<p align="center">

## 🧠 GyaanBikas

### Learn. Practice. Remember. Grow.

Made with ❤️ for better learning.

</p>

---

<p align="center">
  © 2026 GyaanBikas • Built for learners
</p>
