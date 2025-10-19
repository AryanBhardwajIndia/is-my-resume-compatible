#Is My Resume Compatible?

A resume-job compatibility checker which parses the job description and resume for similar keywords and return the compatibility score based off the keywords.

##Technology Used

React.js, Node.js, Express.js

##Divisons

1. Frontend
2. Backend

##Structure

is-my-resume-compatible?
|
|-backend/resume-checker-backend
|
|_frontend/resume-checker-frontend

##Working

1. API call is executed when both the fields are filled and then backend API is called.
2. Backend API then fetches the keywords from the link.
3. Resume is saved in react state, not stored in the database, which is converted to text.
4. Keyword pairs are formed and the compatibility is returned as a score.

##Installation

1. Clone the GitHub repository
```bash
git clone https://github.com/AryanBhardwajIndia/is-my-resume-compatible
```
2. Install NPM in the folder
```bash
npm install
```
3. Open the frontend and backend using separate terminals.

4. Run both of them using:
```bash
npm start
```