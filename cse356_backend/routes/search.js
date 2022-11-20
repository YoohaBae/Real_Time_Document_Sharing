const express = require('express');
const { keyEncoding } = require('y-leveldb');
const router = express.Router();
const elasticClient = require("../elasticsearch");
const User = require('../models/user-model');
const yDocs = require("../ydocs");
const updatedDocIds = require("../updatedDocIds");
const { raw } = require('body-parser');

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
  
  router.use(auth);

function updateDocuments() {
    updatedDocIds.forEach(async docId => {
        let ydoc = yDocs[docId];
        let content = ydoc.getText('test2').toString();
        try {
            await elasticClient.update({
                index: 'docs',
                refresh: 'wait_for',
                id: docId,
                doc: {
                    content: content,
                    suggest: {
                        input: content.split(/[\r\n\s]+/)
                    }
                },
            })
            updatedDocIds.delete(docId);
        }
        catch (err){
            console.log(err);
        }
    })
}

setInterval(updateDocuments, 1000);

router.get("/search", async (req, res) => {
    let query = req.query.q;
    // console.log(query);
    console.log("search")
    console.log(query)
    if (!query) {
        res.send({
            "error": true,
            "message": "No query value"
        })
    }
    //await updateDocuments();
    const data = await elasticClient.search({
        index: 'docs',
        query: {
            multi_match: {
                query: query,
                fields: ["name", "content"]
            }
        },
        highlight: {
            fields: {
                name: {
                    order: 'score',
                    fragment_size: 150
                },
                content: {
                    order: 'score',
                    fragment_size: 150
                }
            }
        },
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

router.get("/suggest", async (req, res) => {
    let query = req.query.q;
    console.log("suggest")
    console.log(query)
    //await updateDocuments();
    // const result = await elasticClient.search({
    //     index: 'docs',
    //     query: {
    //         term: {
    //             content: {
    //                 va: query,
    //                 analyzer: "suggest_analyzer"
    //             }
    //         }
    //     }

    // });
    // console.log(result)
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

module.exports = router;