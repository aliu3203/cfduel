cfduel

to install dependencies (like express, etc...), run
```bash
npm install
```

to run server, copy .env.example and modify, then run
```bash
npm start
```

to install postgresql with homebrew, run
```bash
brew install postgresql
```

make sure postgres is installed and create a .env following .env.example (It is used in db.js to establish connection with your local database)


## Running Tests
Ensure that postgres is enabled. I recommend using homebrew. Once it is installed,

Run
```bash
brew services start postgresql@16
```
to start postgres. (with homebrew)

In command line, create a test db with
```bash
createdb cfduel_test
```
then create `.env.test` with content:
```
DATABASE_URL=postgres://USER@localhost:5432/cfduel_test
NODE_ENV=test
```

Now, you can run tests with
```bash
npm test    # run all unit + integration tests
npm run test:unit   # run all unit tests
npm run test:integration    # run all integration tests
```
