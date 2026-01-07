output "api_gateway_url" {
  description = "API Gateway endpoint URL"
  value       = "${aws_api_gateway_stage.main.invoke_url}"
}
# Lambda Layer Outputs
output "lambda_layer_arn" {
  description = "ARN of the shared Lambda layer"
  value       = aws_lambda_layer_version.shared.arn
}

output "lambda_layer_version" {
  description = "Version of the shared Lambda layer"
  value       = aws_lambda_layer_version.shared.version
}
output "api_gateway_routes" {
  description = "Full URLs for all API Gateway routes (sync routes return real responses)"
  value = {
    for k, v in local.lambdas : k => {
      url     = "${aws_api_gateway_stage.main.invoke_url}/${v.name}"
      is_sync = v.is_sync
    }
  }
}

output "sqs_queue_urls" {
  description = "SQS Queue URLs (async routes only)"
  value = {
    for k, v in aws_sqs_queue.lambda_queues : k => v.url
  }
}

output "sqs_dlq_urls" {
  description = "SQS Dead Letter Queue URLs (async routes only)"
  value = {
    for k, v in aws_sqs_queue.lambda_dlqs : k => v.url
  }
}

output "lambda_function_arns" {
  description = "Lambda Function ARNs"
  value = {
    for k, v in aws_lambda_function.lambdas : k => v.arn
  }
}

output "lambda_function_names" {
  description = "Lambda Function Names"
  value = {
    for k, v in aws_lambda_function.lambdas : k => v.function_name
  }
}

output "cloudwatch_log_groups" {
  description = "CloudWatch Log Group Names"
  value = {
    api_gateway = aws_cloudwatch_log_group.api_gateway.name
    lambdas = {
      for k, v in aws_cloudwatch_log_group.lambda_logs : k => v.name
    }
  }
}

