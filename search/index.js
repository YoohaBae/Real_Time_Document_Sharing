const express = require('express');
const elasticClient = require("./elasticsearch");
const User = require('./models/user-model');
const Memcached = require('memcached')
const cors = require('cors');
const cookieParser = require('cookie-parser');
const db = require('./db');
const path = require('path');
const memcached = require('./memcached');


const app = express()
const port = 9001;

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

app.get("/index/search", async (req, res) => {
    let query = req.query.q;
    if (!query) {
        res.send({
            "error": true,
            "message": "No query value"
        })
    }
    // await updateDocuments();
    const data = await elasticClient.search({
      index: 'docs',
      query: {
          multi_match: {
              query: query,
              type: "phrase",
              fields: ["name", "content"]
          }
      },
      highlight: {
        order: "score",
        fields: {
            name: {
                fragment_size: 400 + query.length
            },
            content: {
                fragment_size: 400 + query.length
            }
        }
      },
      sort: [
        {
          _score: {
            order: "desc"
          }
        }
      ],
      size: 10,
      fields: ["name", "content"],
  })
  let result = []
  let raw_hits = data["hits"]["hits"]
  for (let i =0; i <raw_hits.length; i++) {
      let hit = raw_hits[i]
      let docid = parseInt(hit["_id"])
      let name = hit["_source"]["name"]
      let highlights = []
      if ("name" in hit["highlight"]) {
          Array.prototype.push.apply(highlights, hit["highlight"]["name"])
      }
      if ("content" in hit["highlight"]) {
          Array.prototype.push.apply(highlights, hit["highlight"]["content"])
      }
      for (let j=0; j<highlights.length; j++) {
          let snippet = highlights[j]
          result.push({docid, name, snippet})
      }
  }
  res.json(result);
    
})

app.get("/index/suggest", async (req, res) => {
    let query = req.query.q;
    const data = await elasticClient.search({
      index: 'docs',
      suggest: {
        mysuggest: {
          prefix: query,
          completion: {
            field: 'suggest',
            skip_duplicates: true,
            size: 5,
          }
        },
      },
    });
    const result = [];
    const options = data["suggest"]["mysuggest"][0]["options"]
    for (let i =0; i< options.length; i++) {
        result.push(options[i]["text"])
    }
    res.send(result)
})

app.listen(port, () => {
    console.log(`server is listening at localhost:${port}`);
});