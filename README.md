cfduel

to install dependencies (like express, etc...), run
```bash
npm install
```

to run server, copy .env.example and modify, then run
```bash
node --env-file=.env src/server.js
```

make sure postgres is installed and create a .env following .env.example (It is used in db.js to establish connection with your local database)
