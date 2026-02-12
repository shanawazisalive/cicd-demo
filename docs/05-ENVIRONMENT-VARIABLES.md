# Environment Variables and Secrets Configuration

This document describes all GitHub repository secrets and variables required for CI/CD deployment to AWS EKS.

## Table of Contents

1. Overview
2. Required Repository Secrets
3. OIDC Auth Mode
4. Access-Key Auth Mode
5. Repository Variables
6. GitHub Environments
7. Troubleshooting

---

## 1. Overview

### Secret vs Variable

| Type | Purpose |
|---|---|
| Secret | Sensitive credentials |
| Variable | Non-sensitive configuration |

### Supported Deployment Auth Modes

- `oidc` (recommended)
- `keys`

CD workflow selects auth mode by:

- `workflow_dispatch` input `auth_mode`, or
- repository variable `AWS_AUTH_MODE` for automatic deployments

---

## 2. Required Repository Secrets

### Common Secrets (all auth modes)

| Secret | Used by | Example |
|---|---|---|
| `DOCKERHUB_USERNAME` | CI | `mydockeruser` |
| `DOCKERHUB_TOKEN` | CI | `dckr_pat_xxx` |
| `AWS_REGION` | CD | `us-east-1` |
| `EKS_CLUSTER_NAME` | CD | `cicd-demo-eks` |

### OIDC Mode Secret

| Secret | Used by | Example |
|---|---|---|
| `AWS_ROLE_TO_ASSUME` | CD | `arn:aws:iam::123456789012:role/github-actions-eks-deployer` |

### Access-Key Mode Secrets

| Secret | Used by | Example |
|---|---|---|
| `AWS_ACCESS_KEY_ID` | CD | `AKIA...` |
| `AWS_SECRET_ACCESS_KEY` | CD | `xxxxxxxx` |
| `AWS_SESSION_TOKEN` | CD (optional) | `IQoJ...` |

---

## 3. OIDC Auth Mode

Use this mode when possible.

### 3.1 AWS Setup

1. Add GitHub OIDC provider in IAM:
- URL: `https://token.actions.githubusercontent.com`
- Audience: `sts.amazonaws.com`
2. Create IAM role for GitHub Actions.
3. Restrict trust policy to repository and branch.
4. Add role ARN to secret `AWS_ROLE_TO_ASSUME`.

### 3.2 GitHub Setup

- Set repository variable `AWS_AUTH_MODE=oidc` for automatic deployments.
- For manual runs, choose `auth_mode=oidc`.

---

## 4. Access-Key Auth Mode

Use this only when OIDC is not possible.

### 4.1 AWS Setup

1. Create IAM user for deployments.
2. Create access keys.
3. Store keys in GitHub secrets:
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_SESSION_TOKEN` if required

### 4.2 GitHub Setup

- Set repository variable `AWS_AUTH_MODE=keys` for automatic deployments.
- For manual runs, choose `auth_mode=keys`.

---

## 5. Repository Variables

| Variable | Required | Allowed values |
|---|---|---|
| `AWS_AUTH_MODE` | Yes (recommended) | `oidc`, `keys` |

Default behavior in workflow if variable is empty:

- fallback to `oidc`

---

## 6. GitHub Environments

Create and configure these environments:

| Environment | Approval |
|---|---|
| `dev` | none |
| `stage` | recommended |
| `prod` | required |

CD workflow uses environment names directly for approvals.

---

## 7. Troubleshooting

### 7.1 Docker push fails

- Verify `DOCKERHUB_USERNAME` and `DOCKERHUB_TOKEN`.
- Verify token permissions.

### 7.2 OIDC role assumption fails

- Verify OIDC provider exists.
- Verify trust policy subject matches repo/branch.
- Verify `AWS_ROLE_TO_ASSUME` ARN.

### 7.3 Access key mode fails

- Verify key pair is active.
- Verify IAM permissions for EKS deployment.
- Verify `AWS_REGION` and `EKS_CLUSTER_NAME`.

### 7.4 EKS access denied

- Verify access entry exists for deploy principal.
- Verify access policy association completed.
- Verify `aws eks update-kubeconfig` works from runner identity.

### 7.5 Manual deployment does not trigger expected job

- Verify `environment` input selected correctly.
- Verify chosen `auth_mode` has matching secrets configured.

---

## Related Docs

- `docs/02-EKS-SETUP.md`
- `docs/04-SETUP-GUIDE.md`
- GitHub secrets docs: https://docs.github.com/en/actions/security-guides/encrypted-secrets
- EKS docs: https://docs.aws.amazon.com/eks/
