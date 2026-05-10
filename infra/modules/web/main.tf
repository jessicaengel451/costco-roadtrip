variable "name_prefix" {
  type = string
}
variable "github_repo" {
  type = string
}
variable "github_oauth_token" {
  type      = string
  sensitive = true
}
variable "branch" {
  type    = string
  default = "main"
}
variable "env_vars" {
  type    = map(string)
  default = {}
}

resource "aws_amplify_app" "this" {
  name       = var.name_prefix
  repository = var.github_repo

  # Personal access token with `repo` scope.
  access_token = var.github_oauth_token

  platform = "WEB"

  build_spec = <<-YAML
    version: 1
    applications:
      - frontend:
          phases:
            preBuild:
              commands:
                - cd web && npm ci
            build:
              commands:
                - cd web && npm run build
          artifacts:
            baseDirectory: web/dist
            files:
              - '**/*'
          cache:
            paths:
              - web/node_modules/**/*
        appRoot: web
  YAML

  environment_variables = var.env_vars

  custom_rule {
    source = "/<*>"
    target = "/index.html"
    status = "404-200"
  }
}

resource "aws_amplify_branch" "main" {
  app_id      = aws_amplify_app.this.id
  branch_name = var.branch
  stage       = "PRODUCTION"

  enable_auto_build = true
}

output "app_id" { value = aws_amplify_app.this.id }
output "default_domain" {
  value = "${aws_amplify_branch.main.branch_name}.${aws_amplify_app.this.default_domain}"
}
