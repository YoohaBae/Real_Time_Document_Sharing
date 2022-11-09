const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const db = require('./db');
const sessions = require('express-session');
const path = require('path');

const app = express();
const port = 80;

const apiRoutes = require('./routes/api');
const userRoutes = require('./routes/user');
const mediaRoutes = require('./routes/media');
const collectionRoutes = require('./routes/collection');

const directory = path.join(__dirname, '../');
app.use(cors());

// app.use(express.static('public'))

app.use(express.json());
app.use(cookieParser());

app.use(
  sessions({
    secret: '6306d39f58d8bb3ef7f6bc99',
    saveUninitialized: true,
    cookie: { httpOnly: true },
    resave: false,
  })
);

app.use((req, res, next) => {
  res.setHeader('X-CSE356', '6306d39f58d8bb3ef7f6bc99');
  next();
});

app.use('/api', apiRoutes);
app.use('/users', userRoutes);
app.use('/collection', collectionRoutes);
app.use('/media', mediaRoutes);

app.get('/library/crdt.js', (req, res) => {
  res.sendFile(directory + 'cse356_backend/public/library/crdt.js');
});

app.get('/index.html', (req, res) => {
  res.sendFile(directory + 'cse356_backend/index.html');
});

app.get('/', (req, res) => {
  res.sendFile(directory + 'cse356_backend/start.html');
});

app.get('/home', (req, res) => {
  res.sendFile(directory + 'cse356_backend/public/home.html');
});

app.get('/edit/:id', (req, res) => {
  res.sendFile(directory + 'cse356_backend/public/edit.html');
});

app.post('/log', (req, res) => {
  console.log(req.body);
  res.send('Received');
});

app.listen(port, () => {
  console.log(`server is listening at localhost:80`);
});
