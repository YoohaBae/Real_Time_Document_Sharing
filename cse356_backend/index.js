const express = require('express');
const cors = require('cors')

const app = express();
const port = 80;

const apiRoutes = require('./routes/api');

app.use(cors());

app.use(express.json());

app.use((req, res, next) => {
    res.setHeader('X-CSE356', '6306d39f58d8bb3ef7f6bc99');
    next();
})

app.use('/api', apiRoutes);

app.listen(port, () => {
    console.log(`server is listening at localhost:80`);
});