.PHONY: help install build build-layer setup init plan apply update destroy output logs clean

# Colors
YELLOW := \033[1;33m
GREEN := \033[0;32m
RED := \033[0;31m
NC := \033[0m

help: ## Show this help message
	@echo "$(GREEN)DespachAzap Lambda Infrastructure$(NC)"
	@echo ""
	@echo "Available targets:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(YELLOW)%-15s$(NC) %s\n", $$1, $$2}'

install: ## Install all dependencies (lambdas + layer)
	@echo "$(YELLOW)Installing Lambda dependencies...$(NC)"
	@cd lambdas && npm install
	@echo "$(YELLOW)Installing Layer dependencies...$(NC)"
	@cd layers/shared/nodejs && npm install
	@echo "$(GREEN)✓ Dependencies installed$(NC)"

build-layer: ## Build Lambda layer
	@echo "$(YELLOW)Building Lambda layer...$(NC)"
	@cd layers/shared/nodejs && npm run build
	@echo "$(GREEN)✓ Layer built$(NC)"

build: build-layer ## Build all Lambda functions and layer
	@echo "$(YELLOW)Building Lambda functions...$(NC)"
	@cd lambdas && npm run build
	@echo "$(GREEN)✓ All builds completed$(NC)"

setup: install build init ## Full setup (install + build + init)
	@echo ""
	@echo "$(GREEN)✓ Setup completed!$(NC)"
	@echo ""
	@echo "Next steps:"
	@echo "  1. cd infra && cp terraform.tfvars.example terraform.tfvars"
	@echo "  2. Edit terraform.tfvars with your configuration"
	@echo "  3. make plan"
	@echo "  4. make apply"

init: ## Initialize Terraform
	@echo "$(YELLOW)Initializing Terraform...$(NC)"
	@cd infra && terraform init
	@echo "$(GREEN)✓ Terraform initialized$(NC)"

validate: ## Validate Terraform configuration
	@echo "$(YELLOW)Validating Terraform configuration...$(NC)"
	@cd infra && terraform validate
	@echo "$(GREEN)✓ Configuration is valid$(NC)"

format: ## Format Terraform files
	@echo "$(YELLOW)Formatting Terraform files...$(NC)"
	@cd infra && terraform fmt -recursive
	@echo "$(GREEN)✓ Files formatted$(NC)"

plan: ## Show Terraform execution plan
	@if [ ! -f "infra/terraform.tfvars" ]; then \
		echo "$(RED)❌ terraform.tfvars not found!$(NC)"; \
		echo "Please copy infra/terraform.tfvars.example to infra/terraform.tfvars"; \
		exit 1; \
	fi
	@echo "$(YELLOW)Planning Terraform changes...$(NC)"
	@cd infra && terraform plan

apply: build ## Build and deploy infrastructure to AWS
	@if [ ! -f "infra/terraform.tfvars" ]; then \
		echo "$(RED)❌ terraform.tfvars not found!$(NC)"; \
		echo "Please copy infra/terraform.tfvars.example to infra/terraform.tfvars"; \
		exit 1; \
	fi
	@echo "$(YELLOW)Deploying infrastructure...$(NC)"
	@cd infra && terraform apply
	@echo ""
	@echo "$(GREEN)✓ Deployment successful!$(NC)"

update: build ## Rebuild and update all lambdas
	@echo "$(YELLOW)Updating lambda code...$(NC)"
	@cd infra && terraform apply
	@echo "$(GREEN)✓ Lambdas updated$(NC)"

destroy: ## Destroy all infrastructure
	@echo "$(RED)⚠️  WARNING: This will destroy all resources!$(NC)"
	@read -p "Are you sure? (yes/no): " answer; \
	if [ "$$answer" = "yes" ]; then \
		cd infra && terraform destroy; \
	else \
		echo "Destroy cancelled."; \
	fi

output: ## Show Terraform outputs
	@cd infra && terraform output

logs: ## Tail lambda logs (usage: make logs LAMBDA=plate-validator)
	@LAMBDA=$${LAMBDA:-plate-validator}; \
	echo "$(YELLOW)Tailing logs for despachazap-$$LAMBDA...$(NC)"; \
	aws logs tail "/aws/lambda/despachazap-$$LAMBDA" --follow

clean: ## Clean build artifacts and caches
	@echo "$(YELLOW)Cleaning build artifacts...$(NC)"
	@rm -rf infra/archives
	@rm -rf lambdas/*/dist
	@rm -rf layers/shared/nodejs/dist
	@rm -rf layers/shared/dist
	@echo "$(GREEN)✓ Cleaned$(NC)"

# Quick deploy workflow
quick-deploy: build apply ## Quick deploy (build + apply)

# Development workflow
dev: setup plan ## Development setup and plan
	@echo ""
	@echo "$(GREEN)Ready for development!$(NC)"
	@echo "Run 'make apply' to deploy"
