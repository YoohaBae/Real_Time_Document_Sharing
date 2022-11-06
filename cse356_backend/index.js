const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const app = express();
const port = 80;

const apiRoutes = require('./routes/api');
const userRoutes = require('./routes/user');
const mediaRoutes = require('./routes/media');
const collectionRoutes = require('./routes/collection');
const db = require('./db');

app.use(cors());

// app.use(express.static('public'))

app.use(express.json());
app.use(cookieParser());

app.use((req, res, next) => {
  res.setHeader('X-CSE356', '6306d39f58d8bb3ef7f6bc99');
  next();
});

app.use('/api', apiRoutes);
app.use('/users', userRoutes);
app.use('/collection', collectionRoutes);

app.get('/library/crdt.js', (req, res) => {
  res.sendFile('/root/CSE356_Milestones/cse356_backend/public/library/crdt.js');
});

app.get('/index.html', (req, res) => {
  res.sendFile('/root/CSE356_Milestones/cse356_backend/index.html');
});
app.get('/', (req, res) => {
  res.sendFile('/root/CSE356_Milestones/cse356_backend/start.html');
});

app.post('/log', (req, res) => {
  console.log(req.body);
  res.send('Received');
});

app.listen(port, () => {
  console.log(`server is listening at localhost:80`);
});
