
import amqp from "amqplib";

let channel;

async function connectQueue(queueName) {
    const conn = await amqp.connect("amqp://localhost");
    channel = await conn.createChannel();
    await channel.assertQueue(queueName, { durable: true });
}

export async function publishJob(job) {
    if (!channel) await connectQueue("compression_queue");
    channel.sendToQueue("compression_queue", Buffer.from(JSON.stringify(job)), {
        persistent: true,
    });
}