# Main Terraform Configuration for DespachAzap Lambdas
# This file contains the core infrastructure resources

provider "aws" {
  region = var.aws_region
}

# Locals
locals {
  common_tags = {
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "Terraform"
  }
  
  lambdas = {
    plate_validator = {
      name            = "plate-validator"
      source_dir      = "${path.module}/../lambdas/plate_validator/dist"
      handler         = "index.handler"
      runtime         = "nodejs22.x"
      timeout         = 30
      memory_size     = 256
      architecture    = ["x86_64"]  # Use "arm64" for 20% cost savings
      environment_vars = {}
      is_sync         = true  # Synchronous API response
    }
    retrieve_plate = {
      name            = "retrieve-plate"
      source_dir      = "${path.module}/../lambdas/retrieve_plate/dist"
      handler         = "index.handler"
      runtime         = "nodejs22.x"
      timeout         = 60
      memory_size     = 512
      architecture    = ["x86_64"]  # Use "arm64" for 20% cost savings
      environment_vars = {
        MONGO_URL = var.mongo_url
        API_PLACAS_TOKEN = var.api_placas_token
      }
      is_sync         = true  # Synchronous API response
    }
    plate_preview = {
      name            = "plate-preview"
      source_dir      = "${path.module}/../lambdas/plate_preview/dist"
      handler         = "index.handler"
      runtime         = "nodejs22.x"
      timeout         = 30
      memory_size     = 256
      architecture    = ["x86_64"]  # Use "arm64" for 20% cost savings
      environment_vars = {
        MONGO_URL = var.mongo_url
      }
      is_sync         = true  # Synchronous API response
    }
    payment_status_check = {
      name            = "payment-status-check"
      source_dir      = "${path.module}/../lambdas/payment_status_check/dist"
      handler         = "index.handler"
      runtime         = "nodejs22.x"
      timeout         = 10
      memory_size     = 128
      architecture    = ["x86_64"]  # Use "arm64" for 20% cost savings
      environment_vars = {
        MONGO_URL = var.mongo_url
      }
      is_sync         = true  # Synchronous API response
      http_methods    = ["GET"]  # Only GET method
    }
    payment_status_create = {
      name            = "payment-status-create"
      source_dir      = "${path.module}/../lambdas/payment_status_create/dist"
      handler         = "index.handler"
      runtime         = "nodejs22.x"
      timeout         = 60
      memory_size     = 512
      architecture    = ["x86_64"]  # Use "arm64" for 20% cost savings
      environment_vars = {
        MONGO_URL = var.mongo_url
        AWS_S3_BUCKET_NAME = "${var.project_name}-pdfs"
      }
      is_sync         = false  # Async with SQS
      http_methods    = ["POST"]  # Only POST method
    }
    woovi_pix_invoice = {
      name            = "woovi-pix-invoice"
      source_dir      = "${path.module}/../lambdas/woovi_pix_invoice/dist"
      handler         = "index.handler"
      runtime         = "nodejs22.x"
      timeout         = 30
      memory_size     = 256
      architecture    = ["x86_64"]  # Use "arm64" for 20% cost savings
      environment_vars = {
        WOOVI_API_URL          = var.woovi_api_url
        WOOVI_API_KEY          = var.woovi_api_key
        PLATE_RESEARCH_VALUE   = var.plate_research_value
      }
      is_sync         = true  # Synchronous API response
    }
    woovi_pix_invoice_website = {
      name            = "woovi-pix-invoice-website"
      source_dir      = "${path.module}/../lambdas/woovi_pix_invoice_website/dist"
      handler         = "index.handler"
      runtime         = "nodejs22.x"
      timeout         = 30
      memory_size     = 256
      architecture    = ["x86_64"]  # Use "arm64" for 20% cost savings
      environment_vars = {
        WOOVI_API_URL          = var.woovi_api_url
        WOOVI_API_KEY          = var.woovi_api_key_website
        PLATE_RESEARCH_VALUE   = var.plate_research_value
      }
      is_sync         = true  # Synchronous API response
    }
    woovi_pix_paid_webhook = {
      name            = "woovi-pix-paid-webhook"
      source_dir      = "${path.module}/../lambdas/woovi_pix_paid_webhook/dist"
      handler         = "index.handler"
      runtime         = "nodejs22.x"
      timeout         = 120
      memory_size     = 1024
      architecture    = ["x86_64"]  # Use "arm64" for 20% cost savings
      environment_vars = {
        MONGO_URL = var.mongo_url
        BOTCONVERSA_TOKEN = var.botconversa_token
        AWS_S3_BUCKET_NAME = "${var.project_name}-pdfs"
      }
      is_sync         = false  # Asynchronous via SQS
    }
  }
  
  sync_lambdas = {
    for k, v in local.lambdas : k => v if v.is_sync
  }
  
  async_lambdas = {
    for k, v in local.lambdas : k => v if !v.is_sync
  }
  
  # Lambdas that should have POST methods (excludes payment_status_check which only has GET)
  post_lambdas = {
    for k, v in local.lambdas : k => v if k != "payment_status_check"
  }
}

# API Gateway REST API (supports native API keys)
resource "aws_api_gateway_rest_api" "main" {
  name        = "${var.project_name}-api"
  description = "REST API Gateway for ${var.project_name} lambdas"
  
  endpoint_configuration {
    types = ["REGIONAL"]
  }
  
  tags = local.common_tags
}

# IAM Role for API Gateway CloudWatch Logging (account-level)
resource "aws_iam_role" "api_gateway_cloudwatch" {
  name = "${var.project_name}-api-gateway-cloudwatch-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "apigateway.amazonaws.com"
      }
    }]
  })
  
  tags = local.common_tags
}

# Attach managed policy for CloudWatch Logs
resource "aws_iam_role_policy_attachment" "api_gateway_cloudwatch" {
  role       = aws_iam_role.api_gateway_cloudwatch.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonAPIGatewayPushToCloudWatchLogs"
}

# API Gateway Account settings (required for CloudWatch logging)
resource "aws_api_gateway_account" "main" {
  cloudwatch_role_arn = aws_iam_role.api_gateway_cloudwatch.arn
}

# API Gateway Deployment
resource "aws_api_gateway_deployment" "main" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  
  triggers = {
    redeployment = sha1(jsonencode([
      aws_api_gateway_resource.routes,
      aws_api_gateway_method.routes,
      aws_api_gateway_method.options,
      aws_api_gateway_integration.lambda_sync,
      aws_api_gateway_integration.sqs_async,
      aws_api_gateway_integration.options,
    ]))
  }
  
  lifecycle {
    create_before_destroy = true
  }
}

# API Gateway Stage
resource "aws_api_gateway_stage" "main" {
  deployment_id = aws_api_gateway_deployment.main.id
  rest_api_id   = aws_api_gateway_rest_api.main.id
  stage_name    = var.environment
  
  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_gateway.arn
    format = jsonencode({
      requestId      = "$context.requestId"
      ip             = "$context.identity.sourceIp"
      requestTime    = "$context.requestTime"
      httpMethod     = "$context.httpMethod"
      resourcePath   = "$context.resourcePath"
      status         = "$context.status"
      protocol       = "$context.protocol"
      responseLength = "$context.responseLength"
    })
  }
  
  tags = local.common_tags
  
  depends_on = [aws_api_gateway_account.main]
}

# API Gateway Method Settings
resource "aws_api_gateway_method_settings" "main" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  stage_name  = aws_api_gateway_stage.main.stage_name
  method_path = "*/*"
  
  settings {
    throttling_burst_limit = var.api_throttling_burst_limit
    throttling_rate_limit  = var.api_throttling_rate_limit
    logging_level          = "INFO"
    data_trace_enabled     = false
    metrics_enabled        = true
  }
}

# CloudWatch Log Group for API Gateway
resource "aws_cloudwatch_log_group" "api_gateway" {
  name              = "/aws/apigateway/${var.project_name}"
  retention_in_days = var.log_retention_days
  tags              = local.common_tags
}

# IAM Role for API Gateway to write to SQS
resource "aws_iam_role" "api_gateway_sqs" {
  name = "${var.project_name}-api-gateway-sqs-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "apigateway.amazonaws.com"
      }
    }]
  })
  
  tags = local.common_tags
}

# IAM Policy for API Gateway to send messages to SQS
resource "aws_iam_role_policy" "api_gateway_sqs" {
  name = "${var.project_name}-api-gateway-sqs-policy"
  role = aws_iam_role.api_gateway_sqs.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "sqs:SendMessage"
      ]
      Resource = [for k, q in aws_sqs_queue.lambda_queues : q.arn]
    }]
  })
}

# Data source for account ID
data "aws_caller_identity" "current" {}

# API Gateway Resources (one per lambda)
resource "aws_api_gateway_resource" "routes" {
  for_each = local.lambdas
  
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_rest_api.main.root_resource_id
  path_part   = each.value.name
}

# API Gateway Methods
resource "aws_api_gateway_method" "routes" {
  for_each = local.post_lambdas
  
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.routes[each.key].id
  http_method   = "POST"
  authorization = "NONE"
  api_key_required = var.enable_api_key
}

# API Gateway Integrations - Direct Lambda (sync)
resource "aws_api_gateway_integration" "lambda_sync" {
  for_each = {
    for k, v in local.sync_lambdas : k => v if k != "payment_status_check"
  }
  
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.routes[each.key].id
  http_method = aws_api_gateway_method.routes[each.key].http_method
  
  type                    = "AWS_PROXY"
  integration_http_method = "POST"
  uri                     = aws_lambda_function.lambdas[each.key].invoke_arn
}

# API Gateway Integrations - SQS (async)
resource "aws_api_gateway_integration" "sqs_async" {
  for_each = local.async_lambdas
  
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.routes[each.key].id
  http_method = aws_api_gateway_method.routes[each.key].http_method
  
  type                    = "AWS"
  integration_http_method = "POST"
  uri                     = "arn:aws:apigateway:${var.aws_region}:sqs:path/${data.aws_caller_identity.current.account_id}/${aws_sqs_queue.lambda_queues[each.key].name}"
  credentials             = aws_iam_role.api_gateway_sqs.arn
  
  request_parameters = {
    "integration.request.header.Content-Type" = "'application/x-www-form-urlencoded'"
  }
  
  request_templates = {
    "application/json" = "Action=SendMessage&MessageBody=$input.body"
  }
}

# CORS OPTIONS method for all routes
resource "aws_api_gateway_method" "options" {
  for_each = local.lambdas
  
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.routes[each.key].id
  http_method   = "OPTIONS"
  authorization = "NONE"
  api_key_required = false
}

# CORS OPTIONS integration
resource "aws_api_gateway_integration" "options" {
  for_each = local.lambdas
  
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.routes[each.key].id
  http_method = aws_api_gateway_method.options[each.key].http_method
  type        = "MOCK"
  
  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

# CORS OPTIONS method response
resource "aws_api_gateway_method_response" "options" {
  for_each = local.lambdas
  
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.routes[each.key].id
  http_method = aws_api_gateway_method.options[each.key].http_method
  status_code = "200"
  
  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
  
  response_models = {
    "application/json" = "Empty"
  }
}

# CORS OPTIONS integration response
resource "aws_api_gateway_integration_response" "options" {
  for_each = local.lambdas
  
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.routes[each.key].id
  http_method = aws_api_gateway_method.options[each.key].http_method
  status_code = aws_api_gateway_method_response.options[each.key].status_code
  
  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
    "method.response.header.Access-Control-Allow-Methods" = "'OPTIONS,POST,GET'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }
  
  depends_on = [
    aws_api_gateway_integration.options
  ]
}

# Additional GET method for payment_status_check lambda
resource "aws_api_gateway_method" "payment_status_get" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.routes["payment_status_check"].id
  http_method   = "GET"
  authorization = "NONE"
  api_key_required = var.enable_api_key
  
  request_parameters = {
    "method.request.querystring.id" = true
  }
}

# Integration for payment_status_check GET method
resource "aws_api_gateway_integration" "payment_status_get" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.routes["payment_status_check"].id
  http_method = aws_api_gateway_method.payment_status_get.http_method
  
  type                    = "AWS_PROXY"
  integration_http_method = "POST"
  uri                     = aws_lambda_function.lambdas["payment_status_check"].invoke_arn
}

# Lambda Permissions for API Gateway (sync only)
resource "aws_lambda_permission" "api_gateway_invoke" {
  for_each = local.sync_lambdas
  
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.lambdas[each.key].function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.main.execution_arn}/*/*"
}

# API Gateway Method Responses (async only - sync uses Lambda proxy)
resource "aws_api_gateway_method_response" "async_routes" {
  for_each = local.async_lambdas
  
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.routes[each.key].id
  http_method = aws_api_gateway_method.routes[each.key].http_method
  status_code = "200"
  
  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin" = true
  }
}

# API Gateway Integration Responses (async only)
resource "aws_api_gateway_integration_response" "async_routes" {
  for_each = local.async_lambdas
  
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.routes[each.key].id
  http_method = aws_api_gateway_method.routes[each.key].http_method
  status_code = aws_api_gateway_method_response.async_routes[each.key].status_code
  
  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin" = "'*'"
  }
  
  response_templates = {
    "application/json" = "{\"message\": \"Request accepted for processing\"}"
  }
  
  depends_on = [
    aws_api_gateway_integration.sqs_async
  ]
}

# API Key (AWS managed, auto-generated)
resource "aws_api_gateway_api_key" "main" {
  count = var.enable_api_key ? 1 : 0
  
  name    = "${var.project_name}-api-key"
  enabled = true
  
  tags = local.common_tags
}

# Usage Plan
resource "aws_api_gateway_usage_plan" "main" {
  count = var.enable_api_key ? 1 : 0
  
  name = "${var.project_name}-usage-plan"
  
  api_stages {
    api_id = aws_api_gateway_rest_api.main.id
    stage  = aws_api_gateway_stage.main.stage_name
  }
  
  quota_settings {
    limit  = 10000
    period = "DAY"
  }
  
  throttle_settings {
    burst_limit = var.api_throttling_burst_limit
    rate_limit  = var.api_throttling_rate_limit
  }
  
  tags = local.common_tags
}

# Usage Plan Key (associates API key with usage plan)
resource "aws_api_gateway_usage_plan_key" "main" {
  count = var.enable_api_key ? 1 : 0
  
  key_id        = aws_api_gateway_api_key.main[0].id
  key_type      = "API_KEY"
  usage_plan_id = aws_api_gateway_usage_plan.main[0].id
}

# SQS Queues (async lambdas only)
resource "aws_sqs_queue" "lambda_queues" {
  for_each = local.async_lambdas
  
  name                       = "${var.project_name}-${each.value.name}-queue"
  visibility_timeout_seconds = each.value.timeout * 2  # 2x Lambda timeout (240s for webhook)
  message_retention_seconds  = var.sqs_message_retention_seconds
  receive_wait_time_seconds  = 10
  
  tags = merge(local.common_tags, {
    Lambda = each.value.name
  })
}

# SQS Dead Letter Queues (async lambdas only)
resource "aws_sqs_queue" "lambda_dlqs" {
  for_each = local.async_lambdas
  
  name                       = "${var.project_name}-${each.value.name}-dlq"
  message_retention_seconds  = var.sqs_message_retention_seconds
  
  tags = merge(local.common_tags, {
    Lambda = each.value.name
  })
}

# Redrive Policy for SQS Queues (async only)
resource "aws_sqs_queue_redrive_policy" "lambda_queues" {
  for_each = local.async_lambdas
  
  queue_url = aws_sqs_queue.lambda_queues[each.key].url
  
  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.lambda_dlqs[each.key].arn
    maxReceiveCount     = var.sqs_max_receive_count
  })
}

# IAM Role for Lambda Execution
resource "aws_iam_role" "lambda_execution" {
  for_each = local.lambdas
  
  name = "${var.project_name}-${each.value.name}-lambda-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })
  
  tags = merge(local.common_tags, {
    Lambda = each.value.name
  })
}

# IAM Policy for Lambda Basic Execution
resource "aws_iam_role_policy_attachment" "lambda_basic_execution" {
  for_each = local.lambdas
  
  role       = aws_iam_role.lambda_execution[each.key].name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# IAM Policy for Lambda to consume from SQS (async only)
resource "aws_iam_role_policy" "lambda_sqs" {
  for_each = local.async_lambdas
  
  name = "${var.project_name}-${each.value.name}-sqs-policy"
  role = aws_iam_role.lambda_execution[each.key].id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes"
        ]
        Resource = aws_sqs_queue.lambda_queues[each.key].arn
      },
      {
        Effect = "Allow"
        Action = [
          "sqs:SendMessage"
        ]
        Resource = aws_sqs_queue.lambda_dlqs[each.key].arn
      }
    ]
  })
}

# Additional IAM Policy for woovi_pix_paid_webhook to access S3
resource "aws_iam_role_policy" "lambda_s3_woovi" {
  name = "${var.project_name}-woovi-pix-paid-webhook-s3-policy"
  role = aws_iam_role.lambda_execution["woovi_pix_paid_webhook"].id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "s3:PutObject",
        "s3:GetObject"
      ]
      Resource = "${aws_s3_bucket.pdf_storage.arn}/*"
    }]
  })
}

# Additional IAM Policy for payment_status_create to access S3
resource "aws_iam_role_policy" "lambda_s3_payment_status" {
  name = "${var.project_name}-payment-status-create-s3-policy"
  role = aws_iam_role.lambda_execution["payment_status_create"].id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "s3:PutObject",
        "s3:GetObject"
      ]
      Resource = "${aws_s3_bucket.pdf_storage.arn}/*"
    }]
  })
}

# CloudWatch Log Groups for Lambdas
resource "aws_cloudwatch_log_group" "lambda_logs" {
  for_each = local.lambdas
  
  name              = "/aws/lambda/${var.project_name}-${each.value.name}"
  retention_in_days = var.log_retention_days
  tags              = merge(local.common_tags, {
    Lambda = each.value.name
  })
}

# Archive Lambda Source Code
data "archive_file" "lambda_zip" {
  for_each = {
    for k, v in local.lambdas : k => v
    if k != "woovi_pix_paid_webhook" && k != "payment_status_create"
  }
  
  type        = "zip"
  source_dir  = each.value.source_dir
  output_path = "${path.module}/archives/${each.value.name}.zip"
  excludes    = ["node_modules/.cache", ".serverless", "*.yaml", "*.yml"]
}

# Archive for TypeScript lambdas with sources (uses dist folder with sources)
data "archive_file" "lambda_zip_typescript" {
  for_each = {
    for k, v in local.lambdas : k => v
    if k == "woovi_pix_paid_webhook" || k == "payment_status_create"
  }
  
  type        = "zip"
  source_dir  = each.value.source_dir
  output_path = "${path.module}/archives/${each.value.name}.zip"
}

# Lambda Layer for shared code
data "archive_file" "shared_layer" {
  type        = "zip"
  source_dir  = "${path.module}/../layers/shared/dist"
  output_path = "${path.module}/archives/shared-layer.zip"
}

resource "aws_lambda_layer_version" "shared" {
  filename            = data.archive_file.shared_layer.output_path
  layer_name          = "${var.project_name}-shared"
  source_code_hash    = data.archive_file.shared_layer.output_base64sha256
  compatible_runtimes = ["nodejs22.x"]
  
  description = "Shared utilities and types for DespachAzap Lambda functions"
}

# Lambda Functions
resource "aws_lambda_function" "lambdas" {
  for_each = local.lambdas
  
  function_name = "${var.project_name}-${each.value.name}"
  role          = aws_iam_role.lambda_execution[each.key].arn
  handler       = each.value.handler
  runtime       = each.value.runtime
  timeout       = each.value.timeout
  memory_size   = each.value.memory_size
  architectures = each.value.architecture
  layers        = [aws_lambda_layer_version.shared.arn]
  
  filename         = contains(["woovi_pix_paid_webhook", "payment_status_create"], each.key) ? data.archive_file.lambda_zip_typescript[each.key].output_path : data.archive_file.lambda_zip[each.key].output_path
  source_code_hash = contains(["woovi_pix_paid_webhook", "payment_status_create"], each.key) ? data.archive_file.lambda_zip_typescript[each.key].output_base64sha256 : data.archive_file.lambda_zip[each.key].output_base64sha256
  
  environment {
    variables = merge(
      each.value.environment_vars,
      {
        ENVIRONMENT = var.environment
      }
    )
  }
  
  depends_on = [
    aws_cloudwatch_log_group.lambda_logs,
    aws_lambda_layer_version.shared
  ]
  
  tags = merge(local.common_tags, {
    Lambda = each.value.name
  })
}

# SQS Event Source Mapping for Lambda (async only)
resource "aws_lambda_event_source_mapping" "sqs_trigger" {
  for_each = local.async_lambdas
  
  event_source_arn = aws_sqs_queue.lambda_queues[each.key].arn
  function_name    = aws_lambda_function.lambdas[each.key].arn
  batch_size       = 10
  enabled          = true
  
  # Return failed items to the queue for retry
  function_response_types = ["ReportBatchItemFailures"]
  
  scaling_config {
    maximum_concurrency = 100
  }
  
  # SQS uses queue's redrive policy for DLQ (not destination_config)
  depends_on = [
    aws_sqs_queue_redrive_policy.lambda_queues
  ]
}
