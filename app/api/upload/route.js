import path from "path";
import fs from "fs/promises";
import { randomUUID } from "crypto";
import { publishJob } from "../../lib/rabbitmq";

export async function POST(request) {
    const formData = await request.formData();
    const file = formData.get("image");

    const tempDir = path.join(process.cwd(), "temp");
    await fs.mkdir(tempDir, { recursive: true });
    
    const tempFilePath = path.join(tempDir, file.name);
    await fs.writeFile(tempFilePath, Buffer.from(await file.arrayBuffer()));

    const jobId = `${file.name} - ${randomUUID()}`;

    await publishJob({ jobId, filePath: tempFilePath });
    console.log("Temp File path is : ", tempFilePath);
    
    return Response.json({ jobId })
}