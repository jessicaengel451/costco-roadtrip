variable "name_prefix" { type = string }

resource "aws_dynamodb_table" "visits" {
  name         = "${var.name_prefix}-visits"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "pk"

  attribute {
    name = "pk"
    type = "S"
  }

  point_in_time_recovery {
    enabled = true
  }

  server_side_encryption {
    enabled = true
  }

  tags = {
    Project = var.name_prefix
  }
}

output "table_name" { value = aws_dynamodb_table.visits.name }
output "table_arn" { value = aws_dynamodb_table.visits.arn }
