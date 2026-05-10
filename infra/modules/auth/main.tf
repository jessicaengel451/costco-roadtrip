variable "name_prefix" {
  type = string
}
variable "google_client_id" {
  type      = string
  sensitive = true
}
variable "google_client_secret" {
  type      = string
  sensitive = true
}
variable "callback_urls" {
  type = list(string)
}
variable "logout_urls" {
  type = list(string)
}

variable "rp_id" {
  type        = string
  description = "WebAuthn relying party id (the public domain users will sign in from). Leave empty to skip WebAuthn config."
  default     = ""
}

resource "aws_cognito_user_pool" "this" {
  name = "${var.name_prefix}-users"

  username_attributes      = ["email"]
  auto_verified_attributes = ["email"]

  password_policy {
    minimum_length    = 10
    require_lowercase = true
    require_numbers   = true
    require_symbols   = false
    require_uppercase = true
  }

  account_recovery_setting {
    recovery_mechanism {
      name     = "verified_email"
      priority = 1
    }
  }

  schema {
    name                = "email"
    attribute_data_type = "String"
    required            = true
    mutable             = true
    string_attribute_constraints {
      min_length = 1
      max_length = 256
    }
  }

  admin_create_user_config {
    allow_admin_create_user_only = false
  }

  # MFA — optional per-user (TOTP authenticator app, e.g. Google Authenticator,
  # Authy, 1Password, Bitwarden TOTP).
  mfa_configuration = "OPTIONAL"
  software_token_mfa_configuration {
    enabled = true
  }

  # WebAuthn / passkeys — Apple Passkeys, Bitwarden, hardware keys, etc.
  # Requires the relying party id to match the production hostname.
  dynamic "web_authn_configuration" {
    for_each = var.rp_id == "" ? [] : [1]
    content {
      relying_party_id  = var.rp_id
      user_verification = "preferred"
    }
  }
}

resource "aws_cognito_identity_provider" "google" {
  count         = var.google_client_id == "" ? 0 : 1
  user_pool_id  = aws_cognito_user_pool.this.id
  provider_name = "Google"
  provider_type = "Google"

  provider_details = {
    client_id        = var.google_client_id
    client_secret    = var.google_client_secret
    authorize_scopes = "openid email profile"
  }

  attribute_mapping = {
    email          = "email"
    email_verified = "email_verified"
    username       = "sub"
  }
}

resource "aws_cognito_user_pool_domain" "this" {
  domain       = "${var.name_prefix}-${random_id.domain_suffix.hex}"
  user_pool_id = aws_cognito_user_pool.this.id
}

resource "random_id" "domain_suffix" {
  byte_length = 4
}

resource "aws_cognito_user_pool_client" "web" {
  name         = "${var.name_prefix}-web"
  user_pool_id = aws_cognito_user_pool.this.id

  generate_secret               = false
  prevent_user_existence_errors = "ENABLED"
  refresh_token_validity        = 30
  access_token_validity         = 60
  id_token_validity             = 60
  token_validity_units {
    access_token  = "minutes"
    id_token      = "minutes"
    refresh_token = "days"
  }

  explicit_auth_flows = [
    "ALLOW_USER_SRP_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH",
  ]

  supported_identity_providers = compact([
    "COGNITO",
    length(aws_cognito_identity_provider.google) > 0 ? "Google" : "",
  ])

  callback_urls                        = var.callback_urls
  logout_urls                          = var.logout_urls
  allowed_oauth_flows_user_pool_client = true
  allowed_oauth_flows                  = ["code"]
  allowed_oauth_scopes                 = ["email", "openid", "profile"]

  depends_on = [aws_cognito_identity_provider.google]
}

output "user_pool_id" { value = aws_cognito_user_pool.this.id }
output "user_pool_client_id" { value = aws_cognito_user_pool_client.web.id }
output "user_pool_arn" { value = aws_cognito_user_pool.this.arn }
output "hosted_ui_domain" { value = aws_cognito_user_pool_domain.this.domain }
