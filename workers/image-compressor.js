import { v2 as cloudinary } from "cloudinary";
import amqp from "amqplib";
import sharp from "sharp";
import dotenv from "dotenv";
import fs from "fs/promises";
import path from "path";

dotenv.config();

cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUD_NAME || "",
    api_key: process.env.NEXT_PUBLIC_API_KEY || "",
    api_secret: process.env.NEXT_PUBLIC_API_SECRETS || "",
});

async function worker() {
    const conn = await amqp.connect("amqp://localhost");
    const channel = await conn.createChannel();
    console.log("Channel created successfully!!!");

    await channel.assertQueue("compression_queue", { durable: true });

    console.log("Worker started. Waiting for jobs...");
    channel.consume("compression_queue", async (msg) => {
        const job = JSON.parse(msg.content.toString());
        const { jobId, filePath } = job;

        try {
            // Ensure the 'compressed' directory exists
            const compressedDir = path.join(process.cwd(), "compressed");
            await fs.mkdir(compressedDir, { recursive: true });

            // Compress the image
            const compressedFilePath = filePath.replace("temp", "compressed");
            console.log("Compressed File Path:", compressedFilePath);

            await sharp(filePath)
                .resize(800)
                .jpeg({ quality: 50 })
                .toFile(compressedFilePath);

            // Upload to Cloudinary
            const result = await cloudinary.uploader.upload(compressedFilePath, {
                folder: "compressed",
            });

            console.log(`Processed job ${jobId}: ${result.secure_url}`);

            // Clean up files
            await fs.unlink(filePath);
            await fs.unlink(compressedFilePath);

        } catch (error) {
            console.error(`Error in compressing or uploading the file with job-id-${jobId}`, error);
        } finally {
            channel.ack(msg); // Acknowledge the message
        }
    });
}

worker();