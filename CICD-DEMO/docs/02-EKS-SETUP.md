# EKS Setup Guide

This document provides detailed steps to prepare AWS and Amazon EKS for this CI/CD demo.

## Table of Contents

1. AWS Account Setup
2. Networking Setup
3. Create EKS Cluster
4. Configure kubectl Access
5. Create Namespaces
6. Prepare GitHub Deployment Identity (OIDC)
7. Prepare GitHub Deployment Identity (Access Keys)
8. Configure EKS Access Entries
9. Verify EKS Setup
10. Troubleshooting

---

## 1. AWS Account Setup

1. Create or sign in to your AWS account.
2. Choose a target region (example: `us-east-1`).
3. Enable MFA for the admin account.
4. Create a dedicated IAM admin user for setup work.

Save these values:

- AWS Account ID
- AWS Region
- EKS cluster name (recommended: `cicd-demo-eks`)

---

## 2. Networking Setup

You can either create a dedicated VPC or use an existing EKS-compatible VPC.

Minimum requirements:

- At least 2 public subnets in different AZs
- At least 2 private subnets in different AZs
- Internet/NAT routing so worker nodes can pull images

Recommended CIDR example:

- VPC: `10.0.0.0/16`
- Public subnets: `10.0.0.0/24`, `10.0.1.0/24`
- Private subnets: `10.0.10.0/24`, `10.0.11.0/24`

---

## 3. Create EKS Cluster

### 3.1 Create Cluster (Console)

1. Open AWS Console -> EKS -> Clusters -> Create cluster.
2. Mode: Standard.
3. Cluster name: `cicd-demo-eks`.
4. Kubernetes version: latest stable supported in your region.
5. Select VPC/subnets and security groups.
6. Create cluster IAM role if prompted.

### 3.2 Create Managed Node Group

1. Open the new cluster -> Compute -> Add node group.
2. Node group name: `pool1`.
3. Instance type: `t3.medium` (or equivalent).
4. Desired size: `3` nodes.
5. Use private subnets when possible.

### 3.3 Capture Core Values

Save:

- Cluster name: `cicd-demo-eks`
- Region: for example `us-east-1`

---

## 4. Configure kubectl Access

### 4.1 Install Tooling

Install:

- AWS CLI v2
- kubectl

Verify:

```bash
aws --version
kubectl version --client
```

### 4.2 Configure AWS CLI

```bash
aws configure
```

Provide:

- Access Key ID
- Secret Access Key
- Region
- Output format (`json`)

### 4.3 Build kubeconfig for EKS

```bash
aws eks update-kubeconfig --name cicd-demo-eks --region us-east-1
```

### 4.4 Verify cluster access

```bash
kubectl get nodes
```

Expected: worker nodes in `Ready` state.

---

## 5. Create Namespaces

```bash
kubectl create namespace dev
kubectl create namespace stage
kubectl create namespace prod

kubectl get namespaces
```

Optional labels:

```bash
kubectl label namespace dev environment=development
kubectl label namespace stage environment=staging
kubectl label namespace prod environment=production
```

---

## 6. Prepare GitHub Deployment Identity (OIDC)

OIDC is the recommended mode.

### 6.1 Add GitHub OIDC Provider to IAM

1. Open IAM -> Identity providers -> Add provider.
2. Provider type: OpenID Connect.
3. Provider URL: `https://token.actions.githubusercontent.com`
4. Audience: `sts.amazonaws.com`

### 6.2 Create IAM Role for GitHub Actions

1. Create role -> Web identity.
2. Identity provider: GitHub OIDC provider.
3. Audience: `sts.amazonaws.com`.
4. Add permissions needed for EKS deploy (minimum: EKS describe + cluster access path + Kubernetes access via access entry).
5. Name role: `github-actions-eks-deployer`.

### 6.3 Trust Policy Scope

Restrict trust policy to your repository and branch, for example:

- `repo:<org>/<repo>:ref:refs/heads/main`

Save role ARN for secret `AWS_ROLE_TO_ASSUME`.

---

## 7. Prepare GitHub Deployment Identity (Access Keys)

Use this only if OIDC cannot be used.

1. Create IAM user: `github-actions-eks-deployer`.
2. Attach least-privilege policy for deployment.
3. Create access key pair.
4. Save values for GitHub secrets:
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`
   - `AWS_SESSION_TOKEN` (only if required by your setup)

---

## 8. Configure EKS Access Entries

The deploy principal (role or user) must be authorized on the EKS cluster.

### 8.1 Create access entry

```bash
aws eks create-access-entry \
  --cluster-name cicd-demo-eks \
  --principal-arn <IAM_ROLE_OR_USER_ARN> \
  --type STANDARD \
  --region us-east-1
```

### 8.2 Associate admin policy (demo setup)

```bash
aws eks associate-access-policy \
  --cluster-name cicd-demo-eks \
  --principal-arn <IAM_ROLE_OR_USER_ARN> \
  --policy-arn arn:aws:eks::aws:cluster-access-policy/AmazonEKSClusterAdminPolicy \
  --access-scope type=cluster \
  --region us-east-1
```

For production, replace admin-level access with a narrower policy.

---

## 9. Verify EKS Setup

Run this checklist:

```bash
kubectl cluster-info
kubectl get nodes
kubectl get namespaces | grep -E "dev|stage|prod"
```

Optional load balancer smoke test:

```bash
kubectl create deployment nginx-test --image=nginx -n dev
kubectl expose deployment nginx-test --port=80 --type=LoadBalancer -n dev
kubectl get svc nginx-test -n dev -w
kubectl delete svc nginx-test -n dev
kubectl delete deployment nginx-test -n dev
```

---

## 10. Troubleshooting

### 10.1 `aws eks update-kubeconfig` fails

- Verify region and cluster name.
- Verify IAM identity has `eks:DescribeCluster`.
- Verify local AWS profile points to expected account.

### 10.2 `kubectl` unauthorized

- Verify access entry exists.
- Verify access policy association completed.
- Wait a few minutes for IAM propagation.

### 10.3 LoadBalancer remains pending

- Verify subnets tagged for load balancer use.
- Verify node/security group egress.
- Verify EKS worker nodes are healthy.

### 10.4 GitHub workflow cannot assume role

- Verify `AWS_ROLE_TO_ASSUME` ARN.
- Verify OIDC provider exists.
- Verify trust policy subject matches your repo and branch.

---

## Next Steps

1. Complete `docs/03-PREREQUISITES.md`.
2. Configure secrets and variables from `docs/05-ENVIRONMENT-VARIABLES.md`.
3. Follow `docs/04-SETUP-GUIDE.md` to run end-to-end CI/CD.
