const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const db = require('./db');
const path = require('path');

const app = express();
const port = 8002;

const mediaRoutes = require('./routes/media');

app.use(cors({
    credentials: true,
    origin: ['http://localhost:3000', "http://iwomm.cse356.compas.cs.stonybrook.edu", "http://209.151.155.172/"]
}));
const directory = path.join(__dirname, '../');

// app.use(express.static('public'))


app.use(express.json({limit: '100mb'}));
app.use(express.urlencoded({limit: '100mb', extended: true}));
app.use(cookieParser());

app.use((req, res, next) => {
    res.setHeader('X-CSE356', '6306d39f58d8bb3ef7f6bc99');
    next();
});


app.use('/media', mediaRoutes);

app.listen(port, () => {
    console.log(`server is listening at localhost:${port}`);
});
