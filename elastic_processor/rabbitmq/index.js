const amqp = require("amqplib");

async function initialize() {
    try {
        const connection = await amqp.connect("amqp://cse356:1234@209.151.155.172:5672");
        const channel = await connection.createChannel();
        return [connection, channel];
    } catch (ex) {
        console.error(ex);
    }
}


module.exports = initialize;