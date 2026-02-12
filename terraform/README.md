# EKS Cluster Terraform Configuration

This directory contains Terraform configurations to provision an Amazon EKS cluster for the CICD-DEMO project.

## Architecture

The Terraform configuration creates:

- **EKS Cluster**: Kubernetes 1.31 cluster (`cicd-demo-cluster`) in existing VPC
- **Managed Node Group**: 3 x t3.medium instances in public subnets
- **IAM Roles**: 
  - EKS cluster service role
  - Node group worker role
  - GitHub Actions deployment role with OIDC authentication
- **Kubernetes Namespaces**: `dev`, `stage`, `prod`
- **EKS Access Entries**: Namespace-scoped permissions for GitHub Actions

## Prerequisites

1. **AWS CLI** configured with credentials
2. **Terraform** >= 1.5.0
3. **Existing VPC and Subnets** in `us-east-1`
4. **AWS Account ID** (12-digit)

## Configuration

1. Copy the example variables file:
   ```powershell
   Copy-Item terraform.tfvars.example terraform.tfvars
   ```

2. Review and update `terraform.tfvars` if needed (default values should work)

## Usage

### Initialize Terraform

```powershell
terraform init
```

### Review the Plan

```powershell
terraform plan
```

### Apply the Configuration

```powershell
terraform apply
```

This will create:
- EKS cluster (takes ~10-15 minutes)
- Managed node group (takes ~5 minutes)
- IAM roles and policies
- Kubernetes namespaces

### Configure kubectl Access

After the cluster is created, configure kubectl:

```powershell
aws eks update-kubeconfig --region us-east-1 --name cicd-demo-cluster
```

Verify access:

```powershell
kubectl get nodes
kubectl get namespaces
```

## Outputs

After applying, Terraform will output:

- `cluster_endpoint`: EKS API server endpoint
- `cluster_name`: Name of the EKS cluster
- `deploy_role_arn`: ARN of the GitHub Actions deployment role
- `kubeconfig_command`: Command to configure kubectl

## Infrastructure Components

### Networking
- Uses existing VPC (configured via `terraform.tfvars`)
- Uses existing public subnets (tagged for EKS/LoadBalancer discovery)
- Public endpoint access enabled

### Compute
- Node Group: `pool1`
- Instance Type: `t3.medium`
- Scaling: Min 2, Desired 3, Max 5
- AMI: Latest EKS-optimized Amazon Linux 2

### Security
- GitHub Actions OIDC authentication (no long-term credentials)
- Least-privilege IAM policies
- Namespace-scoped EKS access (AmazonEKSEditPolicy)

## GitHub Actions Integration

The IAM role `cicd-demo-deploy-role` is configured for:
- **Repository**: `shanawazisalive/cicd-demo`
- **Authentication**: OIDC (keyless)
- **Permissions**: 
  - EKS describe cluster
  - VPC read-only access
  - Namespace-level edit access (dev/stage/prod)

Add this role ARN to your GitHub Actions workflow:

```yaml
- name: Configure AWS credentials
  uses: aws-actions/configure-aws-credentials@v4
  with:
    role-to-assume: arn:aws:iam::<YOUR_AWS_ACCOUNT_ID>:role/cicd-demo-deploy-role
    aws-region: us-east-1
```

## Cleanup

To destroy all resources:

```powershell
terraform destroy
```

**Warning**: This will delete the EKS cluster and all associated resources.

## State Management

Currently using local state backend. For production use, consider:

1. Create S3 bucket for state storage
2. Create DynamoDB table for state locking
3. Add backend configuration to `main.tf`

## Troubleshooting

### Cluster creation takes too long
- EKS cluster creation typically takes 10-15 minutes
- Node group provisioning takes additional 5 minutes

### kubectl connection fails
- Ensure AWS CLI is configured with correct credentials
- Run the kubeconfig command from outputs
- Verify your IAM user/role has EKS access

### Nodes not joining cluster
- Check node group status: `aws eks describe-nodegroup --cluster-name cicd-demo-cluster --nodegroup-name pool1`
- Verify subnet tags are applied correctly

## Cost Considerations

Estimated monthly costs (us-east-1):
- EKS cluster: ~$73/month
- 3 x t3.medium nodes: ~$90/month
- Data transfer: Variable
- **Total**: ~$163/month + data transfer

## Support

For issues or questions, refer to:
- [AWS EKS Documentation](https://docs.aws.amazon.com/eks/)
- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
