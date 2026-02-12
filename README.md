# CI/CD Demo with GitHub Actions and AWS EKS

A complete CI/CD pipeline demo using GitHub Actions for automation and Amazon Elastic Kubernetes Service (EKS) for deployment.

## Features

- Continuous Integration (CI)
  - Unit testing with Jest
  - Linting with ESLint
  - SAST scan with Trivy filesystem scan
  - Code analysis with CodeQL
  - Container image scan (SCA) with Trivy image scan
  - Docker image build and push to Docker Hub
- Continuous Deployment (CD)
  - Progressive deployment: dev -> stage -> prod
  - Environment approval gates for stage and prod
  - Automatic rollout status checks
  - Kubernetes deployment on EKS
- Application
  - Node.js Express REST API
  - Health and readiness endpoints
  - Environment-aware configuration
  - Production-ready Dockerfile

## Architecture

```
Developer -> GitHub Actions (CI) -> Docker Hub
                                  |
                                  v
                          GitHub Actions (CD)
                                  |
                                  v
                               EKS Cluster
                        dev -> stage -> prod
```

## Quick Start

### Prerequisites

- GitHub account
- Docker Hub account
- AWS account
- EKS cluster
- Node.js 20.x
- AWS CLI and kubectl configured

### Local Development

```bash
npm install
npm test
npm run lint
npm start

curl http://localhost:3000/health
curl http://localhost:3000/info
```

### Deploy to EKS

1. Configure repository secrets and variables from `docs/05-ENVIRONMENT-VARIABLES.md`
2. Push to `main` to trigger CI and automatic dev deployment
3. Approve stage and prod deployments in GitHub Actions

## Project Structure

```
.github/workflows/
  ci.yaml
  cd.yaml
kubernetes/
  dev/
  stage/
  prod/
src/
  app.js
tests/
  app.test.js
docs/
  01-ARCHITECTURE.md
  02-EKS-SETUP.md
  03-PREREQUISITES.md
  04-SETUP-GUIDE.md
  05-ENVIRONMENT-VARIABLES.md
Dockerfile
package.json
package-lock.json
README.md
LICENSE
```

## API Endpoints

- `GET /` - Welcome message and endpoint list
- `GET /health` - Liveness endpoint
- `GET /ready` - Readiness endpoint
- `GET /info` - Application metadata
- `POST /echo` - Echo request payload

## Environment Variables

- `PORT` (default: `3000`)
- `APP_ENV` (default: `development`)
- `NODE_ENV` (default: `development`)

## CI/CD Pipeline

### CI (`.github/workflows/ci.yaml`)

Push/PR -> install -> test -> lint -> SAST -> CodeQL -> build -> SCA -> security gate -> push image

### CD (`.github/workflows/cd.yaml`)

CI success -> deploy dev (auto) -> deploy stage (approval) -> deploy prod (approval)

Manual deploy is also supported for any environment, with auth mode selection:
- `oidc` (recommended)
- `keys`

## Security

- Trivy filesystem and image scans run on every CI execution
- CodeQL runs on JavaScript code
- SARIF results are uploaded to GitHub Security tab
- CI fails when Trivy finds CRITICAL/HIGH issues

## Rollback

```bash
kubectl rollout history deployment/demo-app -n prod
kubectl rollout undo deployment/demo-app -n prod
kubectl rollout undo deployment/demo-app -n prod --to-revision=2
```

## Documentation

- `docs/01-ARCHITECTURE.md` - Architecture and flow diagrams
- `docs/02-EKS-SETUP.md` - AWS and EKS setup
- `docs/03-PREREQUISITES.md` - Accounts and tooling checklist
- `docs/04-SETUP-GUIDE.md` - End-to-end setup guide
- `docs/05-ENVIRONMENT-VARIABLES.md` - Secrets and variables configuration

## License

Licensed under the MIT License. See `LICENSE`.
