import { v2 as cloudinary } from "cloudinary";
import amqp from "amqplib";
import sharp from "sharp";
import dotenv from "dotenv";
import fs from "fs/promises";
import path from "path";
import io from "../websockets.js";

dotenv.config();

cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUD_NAME || "",
    api_key: process.env.NEXT_PUBLIC_API_KEY || "",
    api_secret: process.env.NEXT_PUBLIC_API_SECRETS || "",
});

async function worker() {
    try {
        const conn = await amqp.connect("amqp://localhost");
        const channel = await conn.createChannel();
        console.log("✅ RabbitMQ Channel created successfully!");

        await channel.assertQueue("compression_queue", { durable: true });
        console.log("🎯 Worker started. Listening for jobs...");

        channel.consume("compression_queue", async (msg) => {
            if (!msg) return;

            const job = JSON.parse(msg.content.toString());
            const { jobId, filePath } = job;

            io.emit("Job Queued", { jobId, status: "Job is queued..." });

            try {
                io.emit("Job Processing", { jobId, status: "Processing image..." });

                // Ensure the 'compressed' directory exists
                const compressedDir = path.join(process.cwd(), "compressed");
                await fs.mkdir(compressedDir, { recursive: true });

                // Define compressed file path
                const compressedFilePath = filePath.replace("temp", "compressed");

                // Compress the image
                await sharp(filePath)
                    .resize(800)
                    .jpeg({ quality: 50 })
                    .toFile(compressedFilePath);

                io.emit("Job Compressed", { jobId, status: "Image compressed successfully!" });

                // Upload to Cloudinary
                const result = await cloudinary.uploader.upload(compressedFilePath, {
                    folder: "compressed",
                });

                console.log(`✅ Job ${jobId} completed: ${result.secure_url}`);
                io.emit("Job Uploaded", {
                    jobId,
                    status: "Upload successful!",
                    url: result.secure_url,
                });

                // Clean up temporary files
                await fs.unlink(filePath);
                await fs.unlink(compressedFilePath);

            } catch (error) {
                console.error(`❌ Error in processing job ${jobId}:`, error);
                io.emit("Job Failed", {
                    jobId,
                    status: `Failed to process job ${jobId}`,
                    error: error.message,
                });
            } finally {
                channel.ack(msg); // Acknowledge the message
            }
        });
    } catch (err) {
        console.error("❌ Worker failed to start:", err);
    }
}

worker();
