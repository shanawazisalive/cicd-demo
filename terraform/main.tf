provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "cicd-demo"
      ManagedBy   = "Terraform"
      Environment = "shared"
    }
  }
}
