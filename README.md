# PotholeFix

### AI-Powered Pothole Detection, Reporting & Road Maintenance Management System

PotholeFix is a web-based road maintenance platform designed to improve pothole detection, citizen reporting, municipal response, and road repair tracking.

The platform connects citizens, municipal authorities, and field repair crews through dedicated dashboards. It combines AI-based pothole detection, location mapping, report management, and repair status tracking.

## Key Features

### 1. Citizen Dashboard
- Report potholes by uploading images and providing locations.
- View submitted reports and track their progress.
- See reported potholes on an interactive map.
- Receive updates as reports move through the repair process.

### 2. Municipal Authority Dashboard
- View and manage incoming pothole reports.
- Verify reported potholes.
- Assign repair tasks to field crews.
- Monitor pending and ongoing repairs.
- Access resolved and closed reports organized by date.
- View dashboard statistics and analytics.

### 3. Field Repair Crew Dashboard
- View assigned repair tasks.
- Access pothole locations through maps.
- Update repair progress.
- Submit repair completion information.
- Track assigned and completed work.

### 4. AI-Powered Pothole Detection
- Uses YOLO for image-based pothole detection.
- Identifies potholes in uploaded road images.
- Supports severity assessment through image-based risk scoring.
- Integrates AI detection results with backend APIs.

### 5. Interactive Mapping
- Displays reported pothole locations.
- Uses geographic coordinates to identify repair sites.
- Helps repair crews locate assigned tasks.
- Supports map-based monitoring of reported road damage.

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React.js, TypeScript |
| Build Tool | Vite |
| Styling | CSS |
| Backend | Python, FastAPI |
| Database | Supabase (PostgreSQL) |
| AI/ML | YOLO, OpenCV |
| Maps | Leaflet |
| Version Control | Git, GitHub |

## System Architecture

```text
             PotholeFix
                 |
          React Frontend
                 |
            FastAPI
                 |
        -----------------
        |               |
     Supabase        YOLO Model
        |               |
   PostgreSQL      Detection &
   and Storage     Severity Analysis
        |
   Report Management
        |
   Authority Dashboard
        |
   Repair Crew Dashboard
        |
   Repair Completion
```

## Installation and Setup

### Prerequisites

Ensure the following are installed:

- Node.js and npm
- Python 3.10 or newer
- Git

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd PotholeFix
```

Replace `<repository-url>` with the actual GitHub repository URL.

### Step 2: Install Frontend Dependencies

Navigate to the frontend directory containing `package.json`.

```bash
cd frontend
npm install
```

### Step 3: Start the Frontend

```bash
npm run dev
```

Open the local URL displayed in the terminal, typically:

```text
http://localhost:5173
```

### Step 4: Configure the Backend

Navigate to the backend directory:

```bash
cd backend
```

Create a virtual environment:

```bash
python -m venv venv
```

Activate it on Windows PowerShell:

```powershell
.\venv\Scripts\Activate.ps1
```

Install backend dependencies:

```bash
pip install -r requirements.txt
```

### Step 5: Configure Environment Variables

Create the appropriate `.env` file for the backend configuration.

Configure the Supabase database connection and any required service credentials.

Never commit API keys, database passwords, or secret credentials to GitHub.

### Step 6: Start FastAPI

If the FastAPI application is defined in `app/main.py` as `app`, run:

```bash
uvicorn app.main:app --reload
```

Backend API:

```text
http://127.0.0.1:8000
```

Interactive API documentation:

```text
http://127.0.0.1:8000/docs
```

## Project Workflow

1. A citizen submits a pothole report with an image and location.
2. The backend receives and processes the report.
3. The YOLO model detects potholes in the uploaded image.
4. Severity analysis estimates the road damage level.
5. The report and detection results are stored in the database.
6. The municipal authority reviews and verifies the report.
7. A repair task is assigned to a field crew.
8. The crew accesses the location and performs the repair.
9. The report is marked as resolved after verification.
10. Completed reports become available in historical records and analytics.

## Development Roadmap

- [x] Frontend interface development
- [x] Dedicated role-based dashboard designs
- [ ] Complete FastAPI and Supabase integration
- [ ] Implement and validate authentication and authorization
- [ ] Train and integrate the YOLO detection model
- [ ] Implement pothole severity assessment
- [ ] Connect live report data to maps and dashboards
- [ ] Complete end-to-end testing
- [ ] Deploy the application

## Future Enhancements

- Predictive pothole risk mapping
- Automated road condition analysis
- Advanced municipal performance analytics
- Repair prioritization based on severity and location
- Automated notifications and reporting

## Project Objective

PotholeFix aims to create a transparent, efficient, and data-driven road maintenance system by combining artificial intelligence, geographic mapping, and digital repair management.

The goal is to help citizens report road damage easily, enable authorities to respond effectively, and improve the accountability of road maintenance operations.

---

**PotholeFix | AI-Powered Smart Road Maintenance Platform**

*Note: This README describes the intended project architecture. Features listed in the roadmap should be marked complete only after implementation and testing.*
