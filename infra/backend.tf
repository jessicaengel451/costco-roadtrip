# Remote state — S3 bucket + native S3 locking (use_lockfile, replaces the
# old DynamoDB lock table). Created by scripts/bootstrap-aws.sh.
terraform {
  backend "s3" {
    bucket       = "costco-roadtrip-tfstate-047126042882"
    key          = "env/dev/terraform.tfstate"
    region       = "us-east-1"
    encrypt      = true
    use_lockfile = true
  }
}
