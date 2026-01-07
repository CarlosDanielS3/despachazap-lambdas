# S3 Bucket for PDF storage
resource "aws_s3_bucket" "pdf_storage" {
  bucket = "${var.project_name}-pdfs"
  
  tags = local.common_tags
}

# Block public access
resource "aws_s3_bucket_public_access_block" "pdf_storage" {
  bucket = aws_s3_bucket.pdf_storage.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

# Bucket policy for public read access to PDFs
resource "aws_s3_bucket_policy" "pdf_storage" {
  bucket = aws_s3_bucket.pdf_storage.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "PublicReadGetObject"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.pdf_storage.arn}/*"
      }
    ]
  })
  
  depends_on = [aws_s3_bucket_public_access_block.pdf_storage]
}

# Lifecycle policy to delete old PDFs
resource "aws_s3_bucket_lifecycle_configuration" "pdf_storage" {
  bucket = aws_s3_bucket.pdf_storage.id

  rule {
    id     = "delete-old-pdfs"
    status = "Enabled"

    filter {} # Apply to all objects
    
    expiration {
      days = var.pdf_retention_days
    }
  }
}

# Enable versioning (optional, for data protection)
resource "aws_s3_bucket_versioning" "pdf_storage" {
  bucket = aws_s3_bucket.pdf_storage.id
  
  versioning_configuration {
    status = "Disabled"  # Enable if you need version history
  }
}

# CORS configuration for browser access
resource "aws_s3_bucket_cors_configuration" "pdf_storage" {
  bucket = aws_s3_bucket.pdf_storage.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "HEAD"]
    allowed_origins = ["*"]
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}
