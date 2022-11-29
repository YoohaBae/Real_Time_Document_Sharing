const amqp = require("amqplib");

async function initialize() {
    try {
        const connection = await amqp.connect("amqp://localhost:5672");
        const channel = await connection.createChannel();
        return [connection, channel];
    } catch (ex) {
        console.error(ex);
    }
}


module.exports = initialize;