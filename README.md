# ⚡ DespachAzap Lambdas

Production-ready serverless AWS Lambda infrastructure for Brazilian vehicle plate validation and payment processing. Built with **TypeScript**, **Terraform**, and following **SOLID principles** for maintainability and scalability.

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)
![AWS Lambda](https://img.shields.io/badge/AWS_Lambda-FF9900?style=flat&logo=aws-lambda&logoColor=white)
![Terraform](https://img.shields.io/badge/Terraform-7B42BC?style=flat&logo=terraform&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=node.js&logoColor=white)

## 🏗️ Architecture

This project deploys a fully serverless, cost-optimized AWS infrastructure:

```
Partner API Request
        ↓
API Gateway (REST API with API Keys)
        ↓
    ┌──────┴──────────┐
    ↓ (sync)    ↓ (async via SQS)
Lambda Functions
        ↓
MongoDB / Woovi API / S3
```

### Components

| Component                 | Count | Purpose                                                          |
| ------------------------- | ----- | ---------------------------------------------------------------- |
| **API Gateway REST API**  | 1     | Exposes 4 POST endpoints with AWS-managed API keys               |
| **Lambda Functions**      | 4     | All TypeScript with shared layer                                 |
| **Lambda Layer**          | 1     | Shared utilities (mongoose, validators, types, response helpers) |
| **SQS Queue**             | 1     | Async webhook processing with DLQ                                |
| **S3 Bucket**             | 1     | PDF storage with 30-day lifecycle                                |
| **CloudWatch Log Groups** | 5     | 7-day retention for all services                                 |
| **IAM Roles**             | 4     | Least-privilege access control                                   |

### Lambda Functions (TypeScript)

| Function                      | Memory | Timeout | Purpose                         | Key Features                           |
| ----------------------------- | ------ | ------- | ------------------------------- | -------------------------------------- |
| **plate-validator**           | 256MB  | 30s     | Validate Brazilian plate format | Regex validation, shared validators    |
| **retrieve-plate**            | 512MB  | 60s     | Fetch plate data                | MongoDB caching, external API fallback |
| **plate-preview**             | 256MB  | 30s     | Get free vehicle preview        | Limited data for marketing             |
| **payment-status-check**      | 256MB  | 30s     | Verify payment status           | Woovi integration                      |
| **payment-status-create**     | 256MB  | 30s     | Create payment record           | MongoDB persistence                    |
| **woovi-pix-invoice**         | 256MB  | 30s     | Generate PIX invoice            | Woovi API integration                  |
| **woovi-pix-invoice-website** | 256MB  | 30s     | Generate invoice (website)      | Frontend integration                   |
| **woovi-pix-paid-webhook**    | 1024MB | 120s    | Process paid webhooks           | SQS async, PDF generation, S3 upload   |

### API Endpoints

| Endpoint                     | Method | Auth    | Purpose                      | Response Time |
| ---------------------------- | ------ | ------- | ---------------------------- | ------------- |
| `/plate-validator`           | POST   | API Key | Validate plate format        | < 100ms       |
| `/plate-preview`             | POST   | API Key | Get free preview data        | < 500ms       |
| `/retrieve-plate-full`       | POST   | API Key | Get complete vehicle data    | < 2s          |
| `/woovi-pix-invoice`         | POST   | API Key | Create PIX payment           | < 500ms       |
| `/woovi-pix-invoice-website` | POST   | API Key | Create PIX (website)         | < 500ms       |
| `/check-payment-status`      | GET    | API Key | Verify payment status        | < 300ms       |
| `/payment-webhook`           | POST   | Webhook | Process paid invoice (async) | < 30s         |

## 💰 Monthly Costs

Cost-optimized for self-hosting with the following settings:

- 7-day CloudWatch log retention
- 4-day SQS message retention
- HTTP API (70% cheaper than REST API)
- ARM64 Lambda architecture (optional, 20% savings)

### Cost Estimates

| Monthly Requests | API Gateway | SQS   | Lambda         | CloudWatch | **Total**   |
| ---------------- | ----------- | ----- | -------------- | ---------- | ----------- |
| **10,000**       | $0.01       | Free  | Free + $0.10   | $0.30      | **~$0.41**  |
| **100,000**      | $0.10       | $0.04 | $0.02 + $1.50  | $2.80      | **~$4.46**  |
| **1,000,000**    | $1.00       | $0.40 | $0.20 + $15.00 | $26.50     | **~$43.10** |

**AWS Free Tier Benefits** (first 12 months):

- Lambda: 1M requests + 400k GB-seconds/month
- SQS: 1M requests/month
- CloudWatch: 5GB ingestion + 5GB storage
- API Gateway: 1M HTTP API requests/month

**Expected cost for typical usage: $2-5/month**

### Cost Optimization Options

Reduce costs further by adjusting `terraform.tfvars`:

```hcl
log_retention_days = 3                    # Instead of 7 (saves ~40%)
sqs_message_retention_seconds = 86400     # 1 day instead of 4
```

## 🚀 Quick Start

### Prerequisites

- AWS Account with credentials configured
- Terraform >= 1.0
- Node.js >= 18
- AWS CLI

### 1. Install Dependencies

```bash
# Install Lambda dependencies
cd lambdas && npm install

# Install Lambda Layer dependencies
cd ../layers/shared/nodejs && npm install
```

### 2. Build Lambda Layer

```bash
cd layers/shared/nodejs && npm run build
```

### 3. Build Lambda Functions

```bash
cd lambdas && npm run build
# Or build individually:
# npm run build:plate-validator
# npm run build:retrieve-plate
# npm run build:woovi-pix-invoice
# npm run build:woovi-pix-paid-webhook
```

### 4. Configure Terraform

```bash
# Copy example configuration
cd infra
cp terraform.tfvars.example terraform.tfvars

# Edit with your values
vim terraform.tfvars
```

Required configuration:

````hcl
aws_region  = "us-east-1"
mongo_url   = "mongodb+srv://..."
api_placas_token = "your-api-placas-token"
botconversa_token = "your-botconversa-token"
woovi_api_url = "https://api.openpix.com.br"
woNavigate to infra directory
cd infra

# Get your API URL and API Key
API_URL=$(terraform output -raw api_gateway_url)
API_KEY=$(aws apigateway get-api-keys --include-values --query 'items[0].value' --output text

### 5. Deploy Infrastructure

```bash
cd infra

# Initialize Terraform
terraform init

# Preview changes
terraform plan

# Deploy to AWS
terraform apply
````

### 6. Get API URLs and Keys

```bash
terraform output
```

## 🧪 Testing

```bash
# Get your API URL and API Key
API_URL=$(terraform output -raw api_gateway_url)
API_KEY=$(terraform output -raw api_key)

# Test plate validator
curl -X POST "$API_URL/plate-validator" \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -d '{"plate":"ABC1D23"}'

# Test retrieve plate
curl -X POST "$API_URL/retrieve-plate" \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -d '{"plate":"ABC1D23"}'

# Test payment invoice
curl -X POST "$API_URL/woovi-pix-invoice" \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -d '{"plate":"ABC1D23","name":"John Doe","phone":"5511999999999"}'
```

### Rebuild and Deploy

```bash
# Rebuild all lambdas
cd lambdas && npm run build

# Or rebuild specific lambda
npm run build:plate-validator
npm run build:retrieve-plate
npm run build:woovi-pix-invoice
npm run build:woovi-pix-paid-webhook

# Deploy updates
cd ../infra && terraform apply
```

## 📁 Project Structure

```
despachazap-lambdas/
├── infra/                              # Terraform infrastructure
│   ├── main.tf                         # Main resources (API Gateway, Lambda, Layer)
│   ├── variables.tf                    # Input variables
│   ├── outputs.tf                      # Output values
│   ├── s3.tf                           # S3 bucket for PDFs
│   ├── cloudwatch_alarms.tf            # Monitoring alarms
│   ├── budget.tf                       # AWS budget alerts
│   ├── versions.tf                     # Terraform version constraints
│   ├── terraform.tfvars                # Your configuration (gitignored)
│   ├── terraform.tfvars.example        # Example configuration
│   └── archives/                       # Built lambda ZIPs (gitignored)
├── lambdas/                            # Lambda functions (all TypeScript)
│   ├── package.json                    # Shared dependencies
│   ├── tsconfig.json                   # TypeScript config
│   ├── esbuild-lambda-layer-plugin.mjs # Build plugin for layer imports
│   ├── plate_validator/
│   │   ├── index.ts                    # Handler
│   │   └── layer.d.ts                  # Layer type declarations
│   ├── retrieve_plate/
│   ├── plate_preview/
│   ├── payment_status/
│   ├── payment_status_check/
│   ├── payment_status_create/
│   ├── woovi_pix_invoice/
│   ├── woovi_pix_invoice_website/
│   └── woovi_pix_paid_webhook/
│       ├── index.ts
│       ├── index_old.ts                # Legacy handler
│       └── services/                   # Service layer (SOLID)
│           ├── botconversa.ts
│           ├── pdf.ts
│           └── s3.ts
├── layers/                             # Lambda layers
│   └── shared/
│       └── nodejs/
│           ├── types/                  # Shared types
│           │   └── car-plate.ts
│           ├── models/                 # MongoDB models
│           │   └── payment-status.ts
│           ├── utils/                  # Shared utilities
│           │   ├── env.ts
│           │   ├── mongodb.ts
│           │   ├── response.ts
│           │   ├── s3.ts
│           │   └── validators.ts
│           ├── package.json
│           └── tsconfig.json
├── .github/
│   └── workflows/
│       └── deploy.yml                  # CI/CD pipeline
├── Makefile                            # Development commands
└── README.md
```

## 🛠️ Tech Stack

- **Language**: TypeScript
- **Runtime**: Node.js 22.x
- **Infrastructure as Code**: Terraform >= 1.0
- **Build Tool**: esbuild
- **Cloud Provider**: AWS
  - API Gateway (REST API)
  - Lambda + Lambda Layers
  - SQS
  - S3
  - CloudWatch
- **Database**: MongoDB
- **External APIs**: Woovi/OpenPix, BotConversa, API Placas
- **TypeScript**: All lambdas use TypeScript for type safety
- **DRY Principle**: Shared code in Lambda layer
- **SOLID Principles**: Service layer separation in webhook
- **KISS Principle**: Simple, focused functions
- **Low Complexity**: Cyclomatic complexity < 8

### Path Aliases

All lambdas use path aliases for cleaner imports:

```typescript
// Instead of: import { validators } from "/opt/nodejs/utils/validators"
import { validators } from "@utils/validators"
import { CarPlateData } from "@types/car-plate"
# Using Make
make logs LAMBDA=plate-validator

# Using AWS CLI
aws logs tail /aws/lambda/despachazap-plate-validator --follow
```

### Check Queue Status

```bash
# Get queue URLs
terraform output sqs_queue_urls

# Check messages in queue
aws sqs get-queue-attributes \
  --queue-url <QUEUE_URL> \
  --attribute-names ApproximateNumberOfMessages
```

## 🔄 Updating Lambda Code

When you modify lambda code:

```bash
# For TypeScript lambda, rebuild first
cd woovi_pix_paid_webhook && npm run build && cd ..

# Deploy updates
make update
```

## 📚 Documentation

- **[README_TERRAFORM.md](README_TERRAFORM.md)** - Complete Terraform documentation
- **[QUICK_START.md](QUICK_START.md)** - 5-minute setup guide

## 🛠️ Available Commands

```bash
make help           # Show all available commands
make setup          # Initial setup (install + build + init)
make plan           # Preview infrastructure changes
make apply          # Deploy infrastructure
make update         # Update lambda code only
make logs           # View lambda logs
make output         # Show deployment outputs
make destroy        # Destroy all infrastructure
```

## 🔐 Security Features

- ✅ **Native API Key authentication** on all endpoints
- ✅ Least privilege IAM roles
- ✅ SQS encryption at rest
- ✅ CloudWatch logging enabled
- ✅ Dead Letter Queues for error handling
- ✅ No hardcoded credentials (uses environment variables)
- ✅ Usage plan with request quotas (10k/day)
- ✅ Throttling protection (100 burst, 50 sustained req/s)

### Production Recommendations

- [x] Add API Gateway authentication (API keys) - ✅ Implemented
- [ ] Enable AWS WAF for API Gateway
- [ ] Enable AWS WAF for API Gateway
- [ ] Use AWS Secrets Manager for credentials
- [ ] Configure VPC for Lambda (if accessing private resources)
- [ ] Set up CloudWatch alarms
- [ ] Enable AWS CloudTrail

## ⚡ Architecture Benefits

- **Async Processing**: API responds immediately, Lambda processes in background
- **Auto-Scaling**: Handles traffic spikes automatically
- **Cost-Efficient**: Pay only for actual usage
- **Reliable**: Message retention and DLQ for failures
- **Observable**: Comprehensive logging and monitoring

## 🎯 Technology Stack

- **Infrastructure**: Terraform
- **Runtime**: Node.js 22.x
- **Cloud**: AWS (API Gateway, Lambda, SQS, CloudWatch)
- **Database**: MongoDB
- **Payment**: Woovi API
- **Storage**: AWS S3

## 🧪 Code Quality

This project follows software engineering best practices:

- ✅ **SOLID Principles**: Service layer separation, single responsibility
- ✅ **DRY**: Shared utilities in Lambda Layer
- ✅ **KISS**: Simple, focused functions with clear purposes
- ✅ **YAGNI**: No unnecessary features or abstractions
- ✅ **Type Safety**: Full TypeScript coverage
- ✅ **Error Handling**: Comprehensive try-catch with proper logging
- ✅ **Separation of Concerns**: Services, utilities, and handlers separated

### Code Organization Example

```typescript
// ✅ Good: Separated concerns (SOLID)
class PDFService {
  async generateVehiclePDF(data: CarPlateData): Promise<Buffer> {}
}

class S3Service {
  async uploadPDF(buffer: Buffer, key: string): Promise<string> {}
}

// Handler delegates to services
export const handler = async (event) => {
  const pdf = await pdfService.generateVehiclePDF(data);
  const url = await s3Service.uploadPDF(pdf, key);
};
```

## 👨‍💻 Author

**Carlos Santos**

- GitHub: [@carlosdaniels3](https://github.com/carlosdaniels3)
- LinkedIn: [Carlos Santos Engineer](https://www.linkedin.com/in/carlos-santos-engineer/)
- Website: [DespachAzap](https://despachazap.com/)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Follow code standards**:
   - Use TypeScript
   - Follow SOLID principles
   - Add proper error handling
   - Include JSDoc comments
4. **Test thoroughly**
   - Manual testing with curl/Postman
   - Check CloudWatch logs
5. **Commit with clear messages** (`git commit -m 'Add amazing feature'`)
6. **Push to branch** (`git push origin feature/amazing-feature`)
7. **Open a Pull Request**

## 🔗 Related Projects

- [despacha-zap-frontend](https://github.com/CarlosDanielS3/despacha-zap-frontend) - Frontend React application

## 📞 Support

For issues or questions:

- 🐛 **Bugs**: Open an issue with the `bug` label
- 💡 **Features**: Open an issue with the `enhancement` label
- 📖 **Documentation**: Open an issue with the `documentation` label

---

**Note**: This is a portfolio project demonstrating serverless architecture, Infrastructure as Code, and modern TypeScript development practices. The system integrates with Brazilian vehicle databases and payment processors.
