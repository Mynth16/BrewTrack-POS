========================================================
SETUP
1. git clone
2. cd BrewTrack-POS - npm install
3. cd server - npm install
4. cd ..
5. open MySQL Workbench
6. execute brewtrackDB_schema.sql then brewtrackDB_data.sql
7. inside server folder, make an .env file and copy contents from .env.example, adjust values if needed
8. open terminal - cd server - npm run dev
9. open a new terminal - npm run dev


========================================================
TROUBLESHOOT
'connect ECONNREFUSED 127.0.0.1:3306'
- MySQL is not running

'ER_ACCESS_DENIED_FOR_USER'
- update server/.env with your correct credentials

'Cannot connect to localhost'
- make sure frontend and backend are running in two different terminals


===========================================================
AUTHENTICATION FLOW
User Login Form

POST /api/auth/login (username, password)

Backend verifies password against database with bcrypt

Returns JWT token + user object

Frontend stores token in localStorage

Redirects to dashboard

Token persists even after page refresh


=============================================================
PRODUCTION DEPLOYMENT
1. Change JWT_SECRET to random key, use this:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

2. Update database credentials

3. Hash existing passwords