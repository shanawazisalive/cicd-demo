# Prerequisites

This document lists required accounts, tools, and baseline configuration before enabling the CI/CD pipeline.

## Table of Contents

1. Required Accounts
2. Required Tools
3. Account Setup Notes
4. Tool Installation
5. Verification Checklist

---

## 1. Required Accounts

| Account | Purpose |
|---|---|
| AWS | Host Kubernetes cluster in EKS |
| GitHub | Source repository and GitHub Actions |
| Docker Hub | Image registry |

---

## 2. Required Tools

| Tool | Version | Purpose |
|---|---|---|
| Git | 2.40+ | Version control |
| Node.js | 20.x | Local app runtime |
| npm | 10+ | Dependency management |
| Docker Desktop | Latest | Local container build/test |
| kubectl | 1.28+ | Kubernetes CLI |
| AWS CLI | v2 | AWS and EKS operations |

Optional tools:

- VS Code
- Postman
- Lens

---

## 3. Account Setup Notes

### 3.1 GitHub

- Enable GitHub Actions for the repository.
- Create environments: `dev`, `stage`, `prod`.

### 3.2 Docker Hub

1. Create repository `cicd-demo`.
2. Generate an access token with read/write permissions.
3. Save username and token for GitHub secrets.

### 3.3 AWS

1. Create or use an AWS account.
2. Choose target region.
3. Create EKS cluster and node group (see `docs/02-EKS-SETUP.md`).
4. Prepare one auth model for CI/CD:
- OIDC role (recommended)
- IAM user access keys

---

## 4. Tool Installation

### 4.1 Verify Git

```bash
git --version
```

### 4.2 Verify Node and npm

```bash
node --version
npm --version
```

### 4.3 Verify Docker

```bash
docker --version
docker run hello-world
```

### 4.4 Verify kubectl

```bash
kubectl version --client
```

### 4.5 Verify AWS CLI

```bash
aws --version
```

Configure AWS CLI profile:

```bash
aws configure
```

---

## 5. Verification Checklist

### Accounts

- [ ] GitHub account and repository ready
- [ ] Docker Hub repository and token created
- [ ] AWS account ready
- [ ] EKS cluster active

### Tooling

```bash
echo "=== Git ===" && git --version
echo "=== Node.js ===" && node --version
echo "=== npm ===" && npm --version
echo "=== Docker ===" && docker --version
echo "=== kubectl ===" && kubectl version --client
echo "=== AWS CLI ===" && aws --version
```

### Saved Values

- [ ] `DOCKERHUB_USERNAME`
- [ ] `DOCKERHUB_TOKEN`
- [ ] `AWS_REGION`
- [ ] `EKS_CLUSTER_NAME`
- [ ] `AWS_ROLE_TO_ASSUME` (OIDC mode)
- [ ] `AWS_ACCESS_KEY_ID` (keys mode)
- [ ] `AWS_SECRET_ACCESS_KEY` (keys mode)
- [ ] `AWS_SESSION_TOKEN` if required by your setup

---

## Next Steps

1. Complete EKS setup in `docs/02-EKS-SETUP.md`.
2. Configure GitHub secrets and variables in `docs/05-ENVIRONMENT-VARIABLES.md`.
3. Follow `docs/04-SETUP-GUIDE.md` for end-to-end setup.
