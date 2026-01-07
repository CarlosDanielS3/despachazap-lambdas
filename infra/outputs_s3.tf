# S3 Outputs
output "s3_bucket_name" {
  description = "S3 bucket name for PDF storage"
  value       = aws_s3_bucket.pdf_storage.id
}

output "s3_bucket_arn" {
  description = "S3 bucket ARN"
  value       = aws_s3_bucket.pdf_storage.arn
}

output "s3_bucket_url" {
  description = "S3 bucket public URL"
  value       = "https://${aws_s3_bucket.pdf_storage.bucket}.s3.${var.aws_region}.amazonaws.com"
}
