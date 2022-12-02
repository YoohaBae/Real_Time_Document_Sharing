const cors = require('cors');
const cookieParser = require('cookie-parser');
const express = require('express');
const initialize = require('./rabbitmq');
const db = require("./db");
const cluster = require('cluster');

const numCPUs = require('os').cpus().length;

if (cluster.isMaster) {
  // Fork workers.
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('listening', function(worker, code, signal) {
    setTimeout(function() {
        worker.kill();
    })
})
 
  // This event is firs when worker died
  cluster.on('exit', (worker, code, signal) => {
    console.log(`worker ${worker.process.pid} died`);
  });
} else{
  let connection, channel;
initialize().then(([conn, chan]) => {
  connection = conn;
  channel = chan;
})

const User = require('./models/user-model');
const memcached = require('./memcached');

const queue = 'updates'

const app = express();
const port = 9000;

app.use(cors({
  credentials: true,
  origin: ['http://localhost:3000', "http://iwomm.cse356.compas.cs.stonybrook.edu", "http://209.151.155.172/"]
}));


app.use(express.json({limit: '100mb'}));
app.use(express.urlencoded({limit: '100mb', extended: true}));
app.use(cookieParser());

app.use((req, res, next) => {
  res.setHeader('X-CSE356', '6306d39f58d8bb3ef7f6bc99');
  next();
});


function getCache(key) {
  memcached.get(key, function(err, data) {
    if (err) {
      console.log("error setting cache");
      console.log(err);
      return false;
    }
    else {
      if (data) {
        return true;
      }
    }
  })
}

function setCache(key) {
  memcached.set(key, 'true', 600, function(err) {
    if (err) {
      console.log("error setting cache");
      console.log(err);
    }
  })
}

const auth = async (req, res, next) => {
  const key = req.cookies.key;
  if (!key) {
    console.log("no key")
    res.send({
      error: true,
      message: 'User is not authenticated',
    });
  } else {
    if (!getCache(key)) {
      try {
        const user = await User.findOne({ key });
        if (!user) {
          console.log("user not auth")
          res.send({
            error: true,
            message: 'User is not authenticated',
          });
        } else {
          setCache(key);
          next();
        }
      } catch {
        console.log("user not auth2")
        res.send({
          error: true,
          message: 'User is not authenticated',
        });
      }
    }
    else {
      console.log("cache login")
    }
  }
};

app.use(auth);

app.post('/api/op/:id', async (req, res) => {
  res.json({});
  const docId = req.params.id.toString();
  const clientID = req.body.clientID;
  const update = req.body.update;
  const queue_data = {
      update: update,
      clientID: clientID,
      editTime: Date.now(),
      docId: docId
  };
  await channel.assertQueue(queue, {
      durable: true
    });
    channel.sendToQueue(queue, Buffer.from(JSON.stringify(queue_data)), {
      persistent: true
    });
});

app.listen(port, () => {
    console.log(`server is listening at localhost:${port}`);
});
}
