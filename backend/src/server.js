const app = require('./app');
const port = 3000;

app.listen(port, () => {
    console.log(`Express app listening at http://localhost:${port}`);
});
