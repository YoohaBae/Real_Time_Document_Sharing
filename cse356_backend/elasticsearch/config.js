const elasticClient = require("./index");
const createIndex = async (indexName) => {
    await elasticClient.indices.create(
        {
            index: indexName,
            body: 
            //{
                // "settings": {
                //     "analysis": {
                //         "analyzer": {
                //             "custom_analyzer": {
                //                 "type": "custom",
                //                 "tokenizer": "whitespace",
                //                 "filter": ["lowercase", "stop", "stemmer"]
                //             },
                //         }
                //     }
                // }, 
                {
                    "settings": {
                      "analysis": {
                        "filter": {
                          "english_stop": {
                            "type":       "stop",
                            "stopwords":  "_english_" 
                          },
                          "english_stemmer": {
                            "type":       "stemmer",
                            "language":   "english"
                          },
                          "english_possessive_stemmer": {
                            "type":       "stemmer",
                            "language":   "possessive_english"
                          }
                        },
                        "analyzer": {
                          "rebuilt_english": {
                            "tokenizer":  "standard",
                            "filter": [
                              "english_possessive_stemmer",
                              "lowercase",
                              "english_stop",
                              "english_stemmer"
                            ]
                          },
                        }
                      }
                    }
                  },
                "mappings": {
                    "properties": {
                      "suggest": {
                        "type": "completion"
                      },
                      "content": {
                        "type": "text",
                        "search_analyzer": "rebuilt_english",
                        "analyzer": "rebuilt_english",
                        "search_quote_analyzer": "rebuilt_english",
                        "term_vector": "with_positions_offsets",
                      },
                      "name": {
                        "type": "text",
                        "search_analyzer": "rebuilt_english",
                        "analyzer": "rebuilt_english",
                        "search_quote_analyzer": "rebuilt_english",
                        "term_vector": "with_positions_offsets",
                      }
                    }
                  }
        });
    }

createIndex("docs").then(r => console.log("index created"));
