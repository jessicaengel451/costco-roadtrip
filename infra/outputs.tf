output "region" { value = var.region }
output "user_pool_id" { value = module.auth.user_pool_id }
output "user_pool_client_id" { value = module.auth.user_pool_client_id }
output "hosted_ui_domain" { value = module.auth.hosted_ui_domain }
output "api_url" { value = module.api.api_url }
output "table_name" { value = module.data.table_name }
output "amplify_default_domain" {
  value = length(module.web) > 0 ? module.web[0].default_domain : null
}
