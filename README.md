\# HomeServe – Home Services Booking SaaS Platform



\## 1. Project Overview



HomeServe is a Home Services Booking SaaS Platform that connects customers with service providers and technicians. Customers can explore available services, book appointments, track bookings, and provide reviews.



The platform provides role-based access for Super Admin, Customers, Service Providers, and Technicians.



\## 2. Project Objectives



\- Provide an online platform for booking home services.

\- Allow customers to register and manage their profiles.

\- Enable service providers to manage their services.

\- Allow technicians to manage assigned work.

\- Manage bookings and appointments.

\- Provide payment and invoice management.

\- Support customer feedback, ratings, and complaints.

\- Provide analytics and reporting.



\## 3. Technology Stack



\### Frontend

\- React.js

\- Vite

\- JavaScript

\- CSS



\### Backend

\- Python

\- FastAPI

\- SQLAlchemy

\- REST APIs

\- JWT Authentication



\### Database

\- MySQL



\### Tools and Deployment

\- Visual Studio Code

\- Git and GitHub

\- Render – Backend Deployment

\- Vercel – Frontend Deployment



\## 4. User Roles



The application supports four user roles:



1\. \*\*Super Admin\*\* – Manages platform operations and overall administration.

2\. \*\*Customer\*\* – Browses services, books appointments, and submits reviews.

3\. \*\*Service Provider\*\* – Manages services and booking requests.

4\. \*\*Technician\*\* – Handles assigned service requests.



\## 5. Main Project Modules



1\. Authentication and Authorization

2\. Customer Management

3\. Service Category and Management

4\. Service Provider Management

5\. Booking and Appointment Management

6\. Technician Management

7\. Payment and Invoice Management

8\. Notification and Communication

9\. Rating, Review and Complaint

10\. Analytics and Reporting



\## 6. Project Folder Structure



```text

HomeServe/

│

├── Phase-1/

│   ├── README.md

│   ├── AI\_Prompt\_Log.md

│   └── Project Documentation

│

├── backend/

│   ├── main.py

│   ├── database.py

│   ├── models.py

│   ├── schemas.py

│   ├── requirements.txt

│   ├── create\_admin.py

│   ├── tests/

│   └── uploads/

│

├── frontend/

│   ├── src/

│   ├── public/

│   ├── package.json

│   └── index.html

│

└── README.md

```



\## 7. Local Installation and Setup



\### Prerequisites



\- Python installed

\- Node.js and npm installed

\- MySQL Server installed

\- Git installed



\### Step 1: Clone Repository



```bash

git clone https://github.com/shefalipatel485/HomeServe.git

```



```bash

cd HomeServe

```



\### Step 2: Backend Setup



```bash

cd backend

```



Create a virtual environment:



```bash

python -m venv .venv

```



Activate the environment on Windows:



```bash

.venv\\Scripts\\activate

```



Install dependencies:



```bash

pip install -r requirements.txt

```



Configure your database connection in the `.env` file.



Example:



```env

DATABASE\_URL=mysql+pymysql://root:@localhost:3306/homeserve\_db

```



Start the backend server:



```bash

uvicorn main:app --reload

```



Backend runs locally at:



```text

http://127.0.0.1:8000

```



Swagger API Documentation:



```text

http://127.0.0.1:8000/docs

```



\### Step 3: Frontend Setup



Open another terminal:



```bash

cd frontend

```



Install dependencies:



```bash

npm install

```



Start the frontend:



```bash

npm run dev

```



The frontend runs at the local URL displayed in the terminal.



\## 8. Live Deployment



\### Frontend URL



https://home-serve-pearl.vercel.app/



\### Backend API URL



https://homeserve-uprh.onrender.com



\### Backend API Documentation (Swagger)



https://homeserve-uprh.onrender.com/docs



\## 9. GitHub Repository



\*\*Project Repository:\*\*



https://github.com/shefalipatel485/HomeServe



\## 10. Testing



The backend project includes automated API testing using:



\- Pytest

\- FastAPI TestClient



Test files are maintained in the backend `tests/` directory.



Run tests from the backend directory:



```bash

pytest

```



\## 11. AI Usage Documentation



AI assistance was used during project development for:



\- Project planning

\- Code generation assistance

\- Debugging

\- API development guidance

\- Database design assistance

\- Documentation preparation

\- Deployment guidance



Refer to:



`Phase-1/AI\_Prompt\_Log.md`



\## 12. Future Enhancements



\- Payment gateway integration.

\- Advanced notification system.

\- Enhanced analytics dashboard.

\- Improved user experience.

\- Additional security enhancements.

\- Further performance optimization.



\## 13. Conclusion



HomeServe provides a centralized platform for managing home service bookings and connecting customers with service providers and technicians.



The project demonstrates frontend development, backend REST API development, database management, authentication, testing, version control, and cloud deployment.

