# Step-by-Step Setup Guide

This guide provides end-to-end setup for CI/CD deployment to AWS EKS.

## Table of Contents

1. Phase 1: Infrastructure Setup
2. Phase 2: Docker Hub Setup
3. Phase 3: GitHub Repository Setup
4. Phase 4: Environments, Secrets, Variables
5. Phase 5: Local Validation
6. Phase 6: Verify CI
7. Phase 7: Verify CD
8. Phase 8: Demo Change and Rollback

---

## Phase 1: Infrastructure Setup

1. Complete `docs/02-EKS-SETUP.md`.
2. Confirm cluster and namespaces:

```bash
kubectl get nodes
kubectl get namespaces | grep -E "dev|stage|prod"
```

Expected:

- EKS nodes are `Ready`
- Namespaces `dev`, `stage`, and `prod` exist

---

## Phase 2: Docker Hub Setup

1. Create Docker Hub repo: `cicd-demo`.
2. Create access token with read/write permissions.
3. Validate login:

```bash
docker login -u <dockerhub-username>
```

---

## Phase 3: GitHub Repository Setup

1. Create GitHub repository.
2. Push this project to `main` branch.
3. Confirm workflows are visible in Actions tab:
- `CI`
- `CD`

Optional: enable branch protection on `main`.

---

## Phase 4: Environments, Secrets, Variables

### 4.1 Create Environments

Create environments:

- `dev` (no approval)
- `stage` (approval recommended)
- `prod` (approval required)

### 4.2 Add Required Secrets

Common secrets:

- `DOCKERHUB_USERNAME`
- `DOCKERHUB_TOKEN`
- `AWS_REGION`
- `EKS_CLUSTER_NAME`

OIDC mode:

- `AWS_ROLE_TO_ASSUME`

Access-key mode:

- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_SESSION_TOKEN` (optional)

### 4.3 Add Repository Variable

Set repository variable:

- `AWS_AUTH_MODE` = `oidc` (recommended) or `keys`

### 4.4 Manual Deploy Input

`CD` workflow `workflow_dispatch` requires:

- `environment`: `dev`, `stage`, or `prod`
- `auth_mode`: `oidc` or `keys`

---

## Phase 5: Local Validation

```bash
npm ci
npm test
npm run lint
docker build -t cicd-demo:local .
```

Run locally:

```bash
npm start
curl http://localhost:3000/health
curl http://localhost:3000/info
```

---

## Phase 6: Verify CI

1. Push commit to `main`.
2. Open Actions -> `CI`.
3. Verify stages pass:
- install
- test
- lint
- Trivy SAST
- CodeQL
- Docker build
- Trivy SCA
- security gate
- image push

4. Verify image tags in Docker Hub:
- `<username>/cicd-demo:<commit-sha>`
- `<username>/cicd-demo:latest`

---

## Phase 7: Verify CD

### 7.1 Automatic path

After successful CI on `main`:

1. Dev deploy runs automatically.
2. Stage waits for environment approval.
3. Prod waits for environment approval.

### 7.2 Manual path

Trigger `CD` manually and choose target environment:

- `dev` deploys only dev
- `stage` deploys only stage
- `prod` deploys only prod

### 7.3 Verify per environment

```bash
kubectl get pods -n dev
kubectl get svc -n dev

kubectl get pods -n stage
kubectl get svc -n stage

kubectl get pods -n prod
kubectl get svc -n prod
```

For service endpoint test:

```bash
curl http://<LOAD_BALANCER_ENDPOINT>/info
```

---

## Phase 8: Demo Change and Rollback

### 8.1 Demo change

1. Update `src/app.js` version string.
2. Commit and push.
3. Confirm new image and progressive deployment.

### 8.2 Rollback demo

```bash
kubectl rollout history deployment/demo-app -n prod
kubectl rollout undo deployment/demo-app -n prod
kubectl rollout status deployment/demo-app -n prod
```

---

## Summary Checklist

- [ ] EKS infrastructure is ready
- [ ] Docker Hub repo and token are configured
- [ ] GitHub environments and secrets are configured
- [ ] CI passes on `main`
- [ ] CD deploys to dev, stage, prod with approvals
- [ ] Manual deployment works for all environments
- [ ] Rollback command validated

---

## Related Docs

- `docs/01-ARCHITECTURE.md`
- `docs/02-EKS-SETUP.md`
- `docs/03-PREREQUISITES.md`
- `docs/05-ENVIRONMENT-VARIABLES.md`
