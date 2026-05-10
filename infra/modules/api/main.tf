variable "name_prefix" {
  type = string
}
variable "table_name" {
  type = string
}
variable "table_arn" {
  type = string
}
variable "user_pool_id" {
  type = string
}
variable "user_pool_client_id" {
  type = string
}
variable "region" {
  type = string
}
variable "lambda_artifacts_dir" {
  type        = string
  description = "Path to infra/lambdas relative to root module"
}
variable "allowed_origins" {
  type    = list(string)
  default = ["*"]
}

# ------- IAM -------
data "aws_iam_policy_document" "lambda_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "lambda" {
  name               = "${var.name_prefix}-lambda"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume.json
}

resource "aws_iam_role_policy_attachment" "lambda_basic" {
  role       = aws_iam_role.lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

data "aws_iam_policy_document" "table_rw" {
  statement {
    actions   = ["dynamodb:GetItem", "dynamodb:PutItem", "dynamodb:UpdateItem"]
    resources = [var.table_arn]
  }
}

resource "aws_iam_role_policy" "table_rw" {
  role   = aws_iam_role.lambda.id
  policy = data.aws_iam_policy_document.table_rw.json
}

# ------- Lambdas -------
locals {
  get_zip = "${var.lambda_artifacts_dir}/get-visits/bundle.zip"
  put_zip = "${var.lambda_artifacts_dir}/put-visits/bundle.zip"
}

resource "aws_lambda_function" "get_visits" {
  function_name    = "${var.name_prefix}-get-visits"
  role             = aws_iam_role.lambda.arn
  runtime          = "nodejs20.x"
  handler          = "index.handler"
  filename         = local.get_zip
  source_code_hash = filebase64sha256(local.get_zip)
  timeout          = 5
  memory_size      = 256
  environment {
    variables = {
      TABLE_NAME = var.table_name
    }
  }
}

resource "aws_lambda_function" "put_visits" {
  function_name    = "${var.name_prefix}-put-visits"
  role             = aws_iam_role.lambda.arn
  runtime          = "nodejs20.x"
  handler          = "index.handler"
  filename         = local.put_zip
  source_code_hash = filebase64sha256(local.put_zip)
  timeout          = 5
  memory_size      = 256
  environment {
    variables = {
      TABLE_NAME = var.table_name
    }
  }
}

# ------- HTTP API -------
resource "aws_apigatewayv2_api" "this" {
  name          = "${var.name_prefix}-api"
  protocol_type = "HTTP"
  cors_configuration {
    allow_origins = var.allowed_origins
    allow_methods = ["GET", "PUT", "OPTIONS"]
    allow_headers = ["authorization", "content-type"]
    max_age       = 600
  }
}

resource "aws_apigatewayv2_authorizer" "jwt" {
  api_id           = aws_apigatewayv2_api.this.id
  authorizer_type  = "JWT"
  identity_sources = ["$request.header.Authorization"]
  name             = "cognito-jwt"

  jwt_configuration {
    audience = [var.user_pool_client_id]
    issuer   = "https://cognito-idp.${var.region}.amazonaws.com/${var.user_pool_id}"
  }
}

resource "aws_apigatewayv2_integration" "get_visits" {
  api_id                 = aws_apigatewayv2_api.this.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.get_visits.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_integration" "put_visits" {
  api_id                 = aws_apigatewayv2_api.this.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.put_visits.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "get_visits" {
  api_id             = aws_apigatewayv2_api.this.id
  route_key          = "GET /visits"
  target             = "integrations/${aws_apigatewayv2_integration.get_visits.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.jwt.id
}

resource "aws_apigatewayv2_route" "put_visits" {
  api_id             = aws_apigatewayv2_api.this.id
  route_key          = "PUT /visits"
  target             = "integrations/${aws_apigatewayv2_integration.put_visits.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.jwt.id
}

resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.this.id
  name        = "$default"
  auto_deploy = true
}

resource "aws_lambda_permission" "get_visits" {
  statement_id  = "AllowAPIGW"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.get_visits.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.this.execution_arn}/*/*"
}

resource "aws_lambda_permission" "put_visits" {
  statement_id  = "AllowAPIGW"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.put_visits.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.this.execution_arn}/*/*"
}

output "api_url" { value = aws_apigatewayv2_api.this.api_endpoint }
