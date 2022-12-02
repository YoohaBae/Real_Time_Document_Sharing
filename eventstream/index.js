const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const db = require('./db');
const path = require('path');
const cluster = require('cluster');


const app = express();
const port = 8001;

const apiRoutes = require('./routes/api');


app.use(cors({
    credentials: true,
    origin: ['http://localhost:3000', "http://iwomm.cse356.compas.cs.stonybrook.edu", "http://209.151.155.172/"]
}));
const directory = path.join(__dirname, '../');

const numCPUs = require('os').cpus().length;
if (cluster.isMaster) {
    // Fork workers.
    for (let i = 0; i < numCPUs; i++) {
      cluster.fork();
    }
   
    // This event is firs when worker died
    cluster.on('exit', (worker, code, signal) => {
      console.log(`worker ${worker.process.pid} died`);
    });
  } else{
    app.use(express.json({limit: '100mb'}));
    app.use(express.urlencoded({limit: '100mb', extended: true}));
    app.use(cookieParser());
    
    app.use((req, res, next) => {
        res.setHeader('X-CSE356', '6306d39f58d8bb3ef7f6bc99');
        next();
    });
    
    app.use('/api', apiRoutes);
    
    app.listen(port, () => {
        console.log(`server is listening at localhost:${port}`);
    });
  }
