# Remote state — bootstrapped once before first apply.
# Uncomment after creating the S3 bucket + DynamoDB lock table out-of-band
# (see scripts/bootstrap-tf-backend.sh, written in Phase 3).
#
# terraform {
#   backend "s3" {
#     bucket         = "costco-roadtrip-tfstate"
#     key            = "env/dev/terraform.tfstate"
#     region         = "us-east-1"
#     dynamodb_table = "costco-roadtrip-tflock"
#     encrypt        = true
#   }
# }
