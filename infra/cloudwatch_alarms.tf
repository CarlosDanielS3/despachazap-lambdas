# CloudWatch Alarms for monitoring Lambda failures and DLQ messages

# Alarm for DLQ messages (indicates failed processing)
resource "aws_cloudwatch_metric_alarm" "dlq_messages" {
  for_each = local.async_lambdas
  
  alarm_name          = "${var.project_name}-${each.value.name}-dlq-alarm"
  alarm_description   = "Alert when messages arrive in DLQ for ${each.value.name}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "ApproximateNumberOfMessagesVisible"
  namespace           = "AWS/SQS"
  period              = 300  # 5 minutes
  statistic           = "Sum"
  threshold           = 0
  treat_missing_data  = "notBreaching"
  
  dimensions = {
    QueueName = aws_sqs_queue.lambda_dlqs[each.key].name
  }
  
  tags = merge(local.common_tags, {
    Lambda = each.value.name
  })
}

# Alarm for Lambda errors
resource "aws_cloudwatch_metric_alarm" "lambda_errors" {
  for_each = local.async_lambdas
  
  alarm_name          = "${var.project_name}-${each.value.name}-error-alarm"
  alarm_description   = "Alert when Lambda ${each.value.name} has errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = 300  # 5 minutes
  statistic           = "Sum"
  threshold           = 5
  treat_missing_data  = "notBreaching"
  
  dimensions = {
    FunctionName = aws_lambda_function.lambdas[each.key].function_name
  }
  
  tags = merge(local.common_tags, {
    Lambda = each.value.name
  })
}

# Alarm for Lambda throttles
resource "aws_cloudwatch_metric_alarm" "lambda_throttles" {
  for_each = local.async_lambdas
  
  alarm_name          = "${var.project_name}-${each.value.name}-throttle-alarm"
  alarm_description   = "Alert when Lambda ${each.value.name} is throttled"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "Throttles"
  namespace           = "AWS/Lambda"
  period              = 300  # 5 minutes
  statistic           = "Sum"
  threshold           = 0
  treat_missing_data  = "notBreaching"
  
  dimensions = {
    FunctionName = aws_lambda_function.lambdas[each.key].function_name
  }
  
  tags = merge(local.common_tags, {
    Lambda = each.value.name
  })
}
