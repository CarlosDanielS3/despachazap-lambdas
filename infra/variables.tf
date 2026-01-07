variable "aws_region" {
  description = "AWS region where resources will be created"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name (e.g., production, staging, development)"
  type        = string
  default     = "production"
  
  validation {
    condition     = contains(["production", "staging", "development"], var.environment)
    error_message = "Environment must be production, staging, or development."
  }
}

variable "project_name" {
  description = "Project name used for resource naming"
  type        = string
  default     = "despachazap"
}

# Database Configuration
variable "mongo_url" {
  description = "MongoDB connection URL"
  type        = string
  sensitive   = true
}

variable "api_placas_token" {
  description = "API Placas authentication token for plate lookup"
  type        = string
  sensitive   = true
}

variable "botconversa_token" {
  description = "BotConversa API token for messaging integration"
  type        = string
  sensitive   = true
}

# Woovi API Configuration
variable "woovi_api_url" {
  description = "Woovi API base URL"
  type        = string
}

variable "woovi_api_key" {
  description = "Woovi API authentication key"
  type        = string
  sensitive   = true
}

variable "woovi_api_key_website" {
  description = "Woovi API authentication key for website"
  type        = string
  sensitive   = true
}

variable "plate_research_value" {
  description = "Price value for plate research in cents"
  type        = string
}

# S3 Configuration
variable "pdf_retention_days" {
  description = "Number of days to retain PDF files in S3 before deletion"
  type        = number
  default     = 30
}

# Optional: Lambda Configuration Overrides
variable "lambda_memory_size" {
  description = "Default memory size for lambdas in MB"
  type        = number
  default     = 256
}

variable "lambda_timeout" {
  description = "Default timeout for lambdas in seconds"
  type        = number
  default     = 30
}

# Optional: SQS Configuration
variable "sqs_message_retention_seconds" {
  description = "Number of seconds SQS retains a message (lower = cheaper)"
  type        = number
  default     = 345600 # 4 days (cost-optimized, was 14 days)
}

variable "sqs_max_receive_count" {
  description = "Maximum number of times a message can be received before being sent to DLQ"
  type        = number
  default     = 3
}

# Optional: API Gateway Configuration
variable "enable_api_key" {
  description = "Enable API key authentication for API Gateway"
  type        = bool
  default     = true
}

variable "api_throttling_burst_limit" {
  description = "API Gateway throttling burst limit"
  type        = number
  default     = 5000
}

variable "api_throttling_rate_limit" {
  description = "API Gateway throttling rate limit"
  type        = number
  default     = 10000
}

# Optional: CloudWatch Logs Retention
variable "log_retention_days" {
  description = "Number of days to retain CloudWatch logs"
  type        = number
  default     = 7
  
  validation {
    condition     = contains([1, 3, 5, 7, 14, 30, 60, 90, 120, 150, 180, 365, 400, 545, 731, 1827, 3653], var.log_retention_days)
    error_message = "Log retention days must be a valid CloudWatch retention period."
  }
}

# Cost Monitoring Variables
variable "cost_alert_email" {
  description = "Email address to receive cost alerts"
  type        = string
}

variable "monthly_budget_limit" {
  description = "Monthly budget limit in USD for backend (Lambda + API Gateway)"
  type        = string
  default     = "20"
}

variable "daily_budget_limit" {
  description = "Daily budget limit in USD for backend"
  type        = string
  default     = "2"
}

variable "lambda_invocation_threshold" {
  description = "Threshold for Lambda invocations per hour before triggering alarm"
  type        = number
  default     = 1000
}

variable "api_request_threshold" {
  description = "Threshold for API Gateway requests per hour before triggering alarm"
  type        = number
  default     = 500
}

