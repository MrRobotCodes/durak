# Durak Research Data Collection App

This app is a lightweight research data collection system. It uses Node.js/Express with a SQLite database and a plain HTML/JS frontend served from the `public` folder. Researchers can build custom forms and submit data to those forms.

## Getting Started

Install dependencies:

```bash
npm install
```

Run the server:

```bash
npm start
```

Open your browser to `http://localhost:3000` to submit and view data.
Visit `http://localhost:3000/forms.html` to create new forms. After a form is
created, it will appear in the dropdown on the main page so you can collect
entries for it.

The form builder accepts a JSON array describing fields, e.g.

```
[
  { "name": "age", "type": "number" },
  { "name": "notes", "type": "text" }
]
```
