import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

export async function uploadPdfToS3(
  fileName: string,
  fileBuffer: Buffer
): Promise<string> {
  const bucketName = process.env.AWS_S3_BUCKET_NAME;
  if (!bucketName) {
    throw new Error("AWS_S3_BUCKET_NAME environment variable is not set");
  }

  const client = new S3Client();
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: fileName,
    Body: fileBuffer,
    ContentType: "application/pdf",
  });

  await client.send(command);
  await new Promise((resolve) => setTimeout(resolve, 1500));

  return `https://${bucketName}.s3.us-east-1.amazonaws.com/${encodeURIComponent(fileName)}`;
}
