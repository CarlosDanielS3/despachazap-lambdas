import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

export async function uploadPdfToS3(
  fileBuffer: ArrayBuffer,
  placa: string,
  modelo: string,
  marca: string
): Promise<string> {
  const client = new S3Client();

  const fileName = `${modelo} ${marca} - ${placa}.pdf`;
  const command = new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: fileName,
    Expires: new Date(Date.now() + 60 * 60 * 1000), // 1 hour expiration
    Body: Buffer.from(fileBuffer),
    ContentType: "application/pdf",
  });

  await client.send(command);

  // Wait for S3 eventual consistency
  await new Promise((resolve) => setTimeout(resolve, 1500));

  const bucketName = process.env.AWS_S3_BUCKET_NAME;
  return `https://${bucketName}.s3.us-east-1.amazonaws.com/${encodeURIComponent(fileName)}`;
}
