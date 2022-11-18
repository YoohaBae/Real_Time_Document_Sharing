const elasticClient = require("./index");
const createIndex = async (indexName) => {
    await elasticClient.indices.create(
        {
            index: indexName,
            body: {
                "settings": {
                    "analysis": {
                        "analyzer": {
                            "custom_analyzer": {
                                "type": "custom",
                                "tokenizer": "whitespace",
                                "filter": ["lowercase", "stop", "stemmer"]
                            }
                        }
                    }
                }
            }
        });
}

createIndex("docs").then(r => console.log("index created"));
