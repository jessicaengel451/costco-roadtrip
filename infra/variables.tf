variable "region" {
  type    = string
  default = "us-east-1"
}

variable "project" {
  type    = string
  default = "costco-roadtrip"
}

variable "env" {
  type        = string
  description = "Environment name (dev, prod)"
}

variable "google_client_id" {
  type      = string
  sensitive = true
  default   = ""
}

variable "google_client_secret" {
  type      = string
  sensitive = true
  default   = ""
}

variable "github_repo" {
  type        = string
  description = "GitHub repo for Amplify Hosting (e.g. https://github.com/jessicaengel/costco-roadtrip)"
  default     = ""
}

variable "github_oauth_token" {
  type      = string
  sensitive = true
  default   = ""
}

variable "rp_id" {
  type        = string
  description = "WebAuthn relying party id (your production hostname, e.g. costco-roadtrip.example.com). Leave empty to disable passkeys."
  default     = ""
}
