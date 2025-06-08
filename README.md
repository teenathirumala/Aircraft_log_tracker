# Aircraft Maintenance Log Analyzer

A full-stack web application to analyze aircraft maintenance logs, visualize failure trends, and predict maintenance needs. Built as part of my internship portfolio for Boeing, this project demonstrates skills in full-stack development, UI/UX design, data visualization, containerization, and deployment.

## Features
- **User Authentication**: Secure signup/login with JWT and bcrypt.
- **Log Upload**: Upload maintenance logs in JSON format, stored in MongoDB Atlas.
- **Failure Trends**: Visualize component failures over time using Chart.js, including months with 0 failures (e.g., March 2025).
- **Maintenance Predictions**: Predict maintenance needs based on historical data (e.g., components exceeding 1.5x average hours since last maintenance).
- **Classy UI**
- **Containerization**: Dockerized for consistent deployment across environments.
- **Deployment**: Hosted on Render with MongoDB Atlas for data storage.

## Tech Stack
- **Frontend**: HTML, Tailwind CSS, Chart.js
- **Backend**: Node.js, Express
- **Database**: MongoDB Atlas
- **Containerization**: Docker
- **Deployment**: Render

## Setup Instructions

### Prerequisites
- Node.js (v18.x recommended)
- Docker (optional, for Docker setup)
- MongoDB Atlas account
- Git

### Local Setup (Without Docker)
1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/aircraft_log_tracker.git
   cd aircraft_log_tracker
   