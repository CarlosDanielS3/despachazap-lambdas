# Budget and Cost Alarms for Backend (Lambda + API Gateway + DynamoDB)

# SNS Topic for cost alerts
resource "aws_sns_topic" "cost_alerts" {
  name         = "${var.project_name}-backend-cost-alerts"
  display_name = "DespachAzap Backend Cost Alerts"

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-backend-cost-alerts"
  })
}

# SNS Topic Subscription - Email notification
resource "aws_sns_topic_subscription" "cost_alerts_email" {
  topic_arn = aws_sns_topic.cost_alerts.arn
  protocol  = "email"
  endpoint  = var.cost_alert_email
}

# AWS Budget for monthly costs
resource "aws_budgets_budget" "monthly_cost" {
  name              = "${var.project_name}-backend-monthly-budget"
  budget_type       = "COST"
  limit_amount      = var.monthly_budget_limit
  limit_unit        = "USD"
  time_unit         = "MONTHLY"
  time_period_start = "2026-01-01_00:00"

  cost_filter {
    name = "Service"
    values = [
      "AWS Lambda",
      "Amazon API Gateway",
      "Amazon DynamoDB",
      "Amazon Simple Queue Service",
      "Amazon CloudWatch"
    ]
  }

  # Alert at 80% of budget
  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 80
    threshold_type             = "PERCENTAGE"
    notification_type          = "ACTUAL"
    subscriber_email_addresses = [var.cost_alert_email]
    subscriber_sns_topic_arns  = [aws_sns_topic.cost_alerts.arn]
  }

  # Alert at 100% of budget
  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 100
    threshold_type             = "PERCENTAGE"
    notification_type          = "ACTUAL"
    subscriber_email_addresses = [var.cost_alert_email]
    subscriber_sns_topic_arns  = [aws_sns_topic.cost_alerts.arn]
  }

  # Forecasted alert at 100%
  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 100
    threshold_type             = "PERCENTAGE"
    notification_type          = "FORECASTED"
    subscriber_email_addresses = [var.cost_alert_email]
    subscriber_sns_topic_arns  = [aws_sns_topic.cost_alerts.arn]
  }

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-backend-monthly-budget"
  })
}

# Daily budget to catch anomalies quickly
resource "aws_budgets_budget" "daily_cost" {
  name              = "${var.project_name}-backend-daily-budget"
  budget_type       = "COST"
  limit_amount      = var.daily_budget_limit
  limit_unit        = "USD"
  time_unit         = "DAILY"
  time_period_start = "2026-01-01_00:00"

  cost_filter {
    name = "Service"
    values = [
      "AWS Lambda",
      "Amazon API Gateway",
      "Amazon DynamoDB",
      "Amazon Simple Queue Service",
      "Amazon CloudWatch"
    ]
  }

  # Alert when daily cost exceeds threshold
  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 100
    threshold_type             = "PERCENTAGE"
    notification_type          = "ACTUAL"
    subscriber_email_addresses = [var.cost_alert_email]
    subscriber_sns_topic_arns  = [aws_sns_topic.cost_alerts.arn]
  }

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-backend-daily-budget"
  })
}

# API Gateway request count alarm
resource "aws_cloudwatch_metric_alarm" "high_api_requests" {
  alarm_name          = "${var.project_name}-high-api-requests"
  alarm_description   = "Alert when API Gateway requests are unusually high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "Count"
  namespace           = "AWS/ApiGateway"
  period              = 3600  # 1 hour
  statistic           = "Sum"
  threshold           = var.api_request_threshold
  treat_missing_data  = "notBreaching"
  
  alarm_actions = [aws_sns_topic.cost_alerts.arn]

  dimensions = {
    ApiName = aws_api_gateway_rest_api.main.name
  }

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-high-api-requests"
  })
}

# Lambda invocation count alarms per function (to catch unusual spikes)
resource "aws_cloudwatch_metric_alarm" "high_lambda_invocations" {
  for_each = local.lambdas
  
  alarm_name          = "${var.project_name}-${each.value.name}-high-invocations"
  alarm_description   = "Alert when Lambda ${each.value.name} invocations are unusually high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "Invocations"
  namespace           = "AWS/Lambda"
  period              = 3600  # 1 hour
  statistic           = "Sum"
  threshold           = var.lambda_invocation_threshold
  treat_missing_data  = "notBreaching"
  
  alarm_actions = [aws_sns_topic.cost_alerts.arn]

  dimensions = {
    FunctionName = aws_lambda_function.lambdas[each.key].function_name
  }

  tags = merge(local.common_tags, {
    Name   = "${var.project_name}-${each.value.name}-high-invocations"
    Lambda = each.value.name
  })
}
