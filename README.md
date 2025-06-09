# Durak Research Data Collection App

This app is a lightweight research data collection system. It uses Node.js/Express with a SQLite database and a small HTML/JS frontend served from the `public` folder. Researchers can register, log in, build custom forms and submit data to those forms. Authentication uses JSON Web Tokens stored in `localStorage`.

## Getting Started

Install dependencies:

```bash
npm install
```

Run the server:

```bash
npm start
```

1. Open your browser to `http://localhost:3000/login.html` and create an account.
2. After logging in you will be redirected to `http://localhost:3000/` to submit and view data.
3. Visit `http://localhost:3000/forms.html` to create new forms. After a form is created, it will appear in the dropdown on the main page so you can collect entries for it.

The form builder accepts a JSON array describing fields, e.g.

```
[
  { "name": "age", "type": "number" },
  { "name": "notes", "type": "text" }
]
```
