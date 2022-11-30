const express = require('express');
const elasticClient = require("../elasticsearch");
const User = require('../models/user-model');

const app = express()
const port = 9001;

const auth = async (req, res, next) => {
    const key = req.cookies.key;
    if (!key) {
      res.send({
        error: true,
        message: 'User is not authenticated',
      });
    } else {
      try {
        const user = await User.findOne({ key });
        if (!user) {
        //   console.log("user not found")
          res.send({
            error: true,
            message: 'User is not authenticated',
          });
        } else {
          next();
        }
      } catch (err){
        console.log(err)
        res.send({
          error: true,
          message: 'User is not authenticated',
        });
      }
    }
  };
  
  app.use(auth);

app.get("/search", async (req, res) => {
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

app.get("/suggest", async (req, res) => {
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