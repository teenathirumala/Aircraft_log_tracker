# Aircraft Maintenance Log Analyzer

A full-stack web application to analyze aircraft maintenance logs, visualize failure trends, and predict maintenance needs. Built this project demonstrates skills in full-stack development, UI/UX design, data visualization, containerization, and deployment.

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
<<<<<<< HEAD
   
=======
   ```
2. **Backend Setup**:
   ```bash
   cd server
   npm install
   # Create a .env file and add MONGO_URI, JWT_SECRET, PORT
   cp .env.example .env 
   npm start
   ```
3. **Frontend Setup**:
   - Open the `client/index.html` file in your browser.

### Running with Docker (Recommended)
This is the easiest way to get the entire application running.

**Prerequisites**:
- Docker and Docker Compose installed.

**Instructions**:
1. Clone the repository and navigate into the project directory.
2. Create the server environment file:
   ```bash
   # In the project root directory
   cp server/.env.example server/.env
   ```
3. **Important**: Edit the `server/.env` file and add your actual `MONGO_URI` and a unique `JWT_SECRET`.
4. Build and run the application using Docker Compose:
   ```bash
   docker-compose up --build
   ```
5. The application will be available at:
   - **Frontend**: [http://localhost:5500](http://localhost:5500)
   - **Backend API**: [http://localhost:5001](http://localhost:5001)
6. To stop the application, press `Ctrl+C` in the terminal where Docker Compose is running, and then run:
   ```bash
   docker-compose down
   ```
>>>>>>> 300fe84 (added rbac, dockerized whole project)
