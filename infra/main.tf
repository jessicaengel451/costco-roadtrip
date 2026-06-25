terraform {
  required_version = ">= 1.6"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.52"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
  }
}

provider "aws" {
  region = var.region
}

locals {
  name_prefix = "${var.project}-${var.env}"

  prod_domain = "https://costcoquest.com"

  callback_urls = concat(
    [
      "http://localhost:5173/",
      "http://localhost:4173/",
    ],
    var.env == "prod" ? ["${local.prod_domain}/"] : [],
  )
  logout_urls = concat(
    [
      "http://localhost:5173/",
      "http://localhost:4173/",
    ],
    var.env == "prod" ? ["${local.prod_domain}/"] : [],
  )
  allowed_origins = concat(
    ["http://localhost:5173", "http://localhost:4173"],
    var.env == "prod" ? [local.prod_domain] : [],
  )
}

module "data" {
  source      = "./modules/data"
  name_prefix = local.name_prefix
}

module "auth" {
  source               = "./modules/auth"
  name_prefix          = local.name_prefix
  google_client_id     = var.google_client_id
  google_client_secret = var.google_client_secret
  callback_urls        = local.callback_urls
  logout_urls          = local.logout_urls
  rp_id                = var.rp_id
}

module "api" {
  source               = "./modules/api"
  name_prefix          = local.name_prefix
  region               = var.region
  table_name           = module.data.table_name
  table_arn            = module.data.table_arn
  user_pool_id         = module.auth.user_pool_id
  user_pool_client_id  = module.auth.user_pool_client_id
  lambda_artifacts_dir = "${path.module}/lambdas"
  allowed_origins      = local.allowed_origins
}

module "web" {
  count              = var.github_repo == "" ? 0 : 1
  source             = "./modules/web"
  name_prefix        = local.name_prefix
  github_repo        = var.github_repo
  github_oauth_token = var.github_oauth_token
}
