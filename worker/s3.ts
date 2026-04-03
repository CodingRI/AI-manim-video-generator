import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs"

const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY!,
        secretAccessKey: process.env.AWS_SECRET_KEY!
    },
})

export async function uploadToS3(
    filePath: string,
    fileName: string
  ): Promise<string> {
    const fileStream = fs.createReadStream(filePath);
  
    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.S3_BUCKET!,
        Key: fileName,
        Body: fileStream,
        ContentType: "video/mp4",
      })
    );
  
    return `https://${process.env.S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;
  }