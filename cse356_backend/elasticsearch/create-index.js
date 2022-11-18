const elasticClient = require("./index");
const createIndex = async (indexName) => {
    await elasticClient.indices.create({index: indexName});
}

createIndex("docs").then(r => console.log("index created"));
