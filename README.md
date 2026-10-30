# 🛣️ PotholeFix
### Smarter Roads. Safer Journeys.

**PotholeFix** is an AI-ready, web-based road infrastructure management platform designed to simplify pothole reporting, detection, repair coordination, and resolution tracking.

The platform connects **Citizens, Municipal Authorities, and Field Repair Crews** through a centralized system, improving transparency, accountability, and efficiency in road maintenance.

## 🎯 Problem Statement

Potholes are a major road safety concern, contributing to accidents, vehicle damage, traffic congestion, and infrastructure deterioration.

Traditional pothole reporting systems often suffer from:

- Delayed reporting and repairs
- Lack of accurate location information
- Poor coordination between citizens and authorities
- Limited transparency in complaint resolution
- Inefficient prioritization of damaged roads

PotholeFix addresses these challenges through a digital reporting and repair management platform.

## 💡 Our Solution

PotholeFix provides an end-to-end pothole management workflow.

1. Citizens report potholes with photographs and GPS locations.
2. Reports are stored in a centralized database.
3. Municipal authorities review and verify reported damage.
4. Potholes are prioritized according to severity.
5. Authorities assign repair tasks to field crews.
6. Repair crews upload photographs after completing repairs.
7. Authorities verify the repair evidence and approve completion.
8. Citizens track the status of their complaints.

The platform is designed to support automated pothole detection using YOLO computer vision.

## 🚀 Key Features

### 👤 Citizen Portal
- Citizen authentication
- Submit pothole reports
- Upload road damage photographs
- GPS-based location reporting
- Interactive map integration
- Track complaint status
- View report history
- View repair completion evidence

### 🏛️ Municipal Authority Portal
- Centralized reporting dashboard
- Review incoming pothole complaints
- Verify reported road damage
- Assess and modify severity levels
- Assign repair tasks to field teams
- Monitor ongoing repair activities
- Review before-and-after repair photographs
- Approve completed repairs or request rework
- Access report history and activity timelines

### 👷 Field Repair Crew Portal
- Dedicated repair team dashboard
- View assigned work orders
- Access pothole locations
- View original damage photographs
- Start and update repair tasks
- Upload post-repair evidence
- Submit completed work for authority approval
- Track assigned task history

### 🤖 AI-Based Pothole Detection (Integration in Progress)

PotholeFix is designed to integrate a YOLO-based object detection model for:

- Detecting potholes in uploaded road images
- Identifying damaged road regions
- Generating bounding boxes
- Supporting severity assessment
- Assisting authorities with report prioritization

**Current status:** The application has a prepared AI integration interface. Model training and deployment are planned; live YOLO detection should not be considered operational until trained weights are integrated and verified.

## 🛠️ Technology Stack

| Component | Technology |
|---|---|
| Frontend | React, TypeScript, Vite |
| Styling | CSS |
| Backend | Python, FastAPI |
| Database | SQLite |
| Mapping | Leaflet |
| AI / Computer Vision | YOLO (planned integration) |
| API Communication | REST APIs |
| Authentication | JWT-based authentication |
| Version Control | Git and GitHub |
| Development Environment | VS Code / Antigravity |

## 🏗️ System Architecture

```text
                   POTHOLEFIX
                       |
                React Frontend
                       |
                REST API Requests
                       |
                FastAPI Backend
                       |
          +------------+------------+
          |            |            |
      Database     Authentication   AI Service
       SQLite           JWT          YOLO
          |                            |
      Reports                      Detection
      Users                        Severity Support
      Work Orders
      Timelines
          |
     Role Dashboards
          |
    +-----+------+------+
    |            |      |
 Citizen     Authority  Repair Crew
```

The FastAPI backend handles application logic, API communication, authentication, report management, and repair workflows.

SQLite currently provides persistent storage. The architecture can be extended to PostgreSQL or Supabase in the future.

## 🔄 Complete Project Workflow

### Step 1: Pothole Reporting
A citizen uploads a photograph, provides the location, and submits a pothole complaint.

### Step 2: Severity Assessment
The report receives a severity classification. Until the AI model is integrated, severity assessment uses the existing manual/demo workflow.

### Step 3: Authority Verification
The municipal authority reviews the photograph, location, description, and severity.

### Step 4: Repair Assignment
After verification, the authority assigns the complaint to an available repair crew.

### Step 5: Repair Execution
The assigned crew receives the work order and begins the repair process.

### Step 6: Repair Evidence
After completing the repair, the crew uploads a photograph of the repaired road.

### Step 7: Authority Approval
The authority reviews the before-and-after evidence and approves the repair or requests rework.

### Step 8: Citizen Notification
The complaint status is updated to Resolved, allowing the citizen to review the final outcome.

## 📊 Severity Classification

PotholeFix supports four severity levels:

| Severity | Description |
|---|---|
| Critical | Major road hazard requiring urgent attention |
| High | Significant road damage requiring priority repair |
| Medium | Moderate road damage |
| Low | Minor damage requiring monitoring or scheduled maintenance |

Severity can be reviewed and updated by the municipal authority.

## 📁 Project Structure

```text
potholefix/
|
|-- src/
|   |-- components/
|   |-- pages/
|   |-- services/
|
|-- public/
|   |-- photos/
|
|-- backend/
|   |-- app/
|   |   |-- main.py
|   |   |-- routes/
|   |   |-- models/
|   |   |-- services/
|   |
|   |-- tests/
|   |-- weights/
|
|-- ai/
|   |-- scripts/
|   |-- PotholeFix_YOLO_Training.ipynb
|
|-- package.json
|-- README.md
```

*The structure above highlights the main project components.*

## 💻 Installation and Setup

### Prerequisites

Install the following:

- Python 3
- Node.js and npm
- Git
- A modern web browser

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/PotholeFix.git
cd PotholeFix
```

Replace `YOUR_USERNAME` with the actual GitHub username.

### 2. Install Frontend Dependencies

```bash
npm install
```

### 3. Set Up the Backend

Open PowerShell in the project directory:

```powershell
cd backend
```

Create a Python virtual environment if one does not already exist:

```powershell
python -m venv .venv
```

Install backend dependencies:

```powershell
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

### 4. Start the FastAPI Backend

From the `backend` directory:

```powershell
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000
```

Backend URL:

http://localhost:8000

FastAPI documentation:

http://localhost:8000/docs

### 5. Start the React Frontend

Open another PowerShell terminal in the project root:

```powershell
npm run dev
```

Frontend URL:

http://localhost:5173

**Important:** Keep both the backend and frontend terminals running.

## 🧪 Hackathon Demo

The application includes three seeded demonstration reports:

| Report ID | Location | Severity |
|---|---|---|
| PF-101 | Sector 17, Chandigarh | Critical |
| PF-102 | Madhya Marg, Chandigarh | High |
| PF-103 | Kharar, Punjab | Medium |

### Demo Accounts

**Citizen**
- Email: `akshit@potholefix.in`

**Municipal Authority**
- Email: `alice@potholefix.gov.in`

**Field Repair Crew**
- Email: `gurpreet@pwd.punjab.gov.in`

Use the configured local demo credentials to access these accounts. Demo credentials should not be used in production.

### Demonstration Flow

Citizen → Municipal Authority → Field Repair Crew → Municipal Authority → Citizen

This demonstrates the complete complaint reporting, repair assignment, evidence submission, and approval lifecycle.

## 🧠 Future Enhancements

- Train and integrate a YOLO pothole detection model
- Automate pothole severity estimation
- Migrate from SQLite to PostgreSQL/Supabase
- Introduce predictive road damage analysis
- Add automated citizen notifications
- Implement advanced geospatial hotspot analytics
- Improve mobile accessibility
- Support municipal-scale deployment

## 🌍 Expected Impact

PotholeFix aims to:

- Reduce delays in pothole reporting
- Improve road maintenance coordination
- Increase accountability in repair operations
- Help authorities prioritize dangerous road defects
- Improve transparency for citizens
- Support safer and better-maintained roads

## 🔐 Security

The application uses role-based access control and JWT authentication to separate Citizen, Authority, and Repair Crew functionality.

Production deployments should use secure environment variables, strong credentials, HTTPS, appropriate data protection controls, and a production-ready database configuration.

## 📌 Project Status

**Hackathon Prototype / Active Development**

- Frontend: Implemented
- FastAPI backend: Implemented
- SQLite database: Integrated
- Role-based dashboards: Implemented
- Report and repair workflow: Implemented for demonstration
- YOLO integration interface: Prepared
- YOLO model training: Pending
- Supabase migration: Planned

## 🏁 Conclusion

PotholeFix combines civic technology, geospatial reporting, backend automation, and computer vision readiness to create a more transparent and efficient road maintenance ecosystem.

By connecting citizens, municipal authorities, and repair crews through a unified platform, PotholeFix aims to transform pothole reporting into a structured, trackable, and accountable repair process.

**PotholeFix | Smarter Roads. Safer Journeys.**
