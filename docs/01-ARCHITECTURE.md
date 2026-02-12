# CI/CD Pipeline Architecture

This document provides architecture and workflow diagrams for the GitHub Actions and AWS EKS based deployment pipeline.

## Table of Contents

1. Overall Architecture
2. Developer Flow
3. CI Pipeline
4. Security Scan Flow
5. CD Deployment Flow
6. Rollback Flow
7. EKS Cluster Architecture

---

## 1. Overall Architecture

```mermaid
flowchart TB
    DEV[Developer] -->|git push| GH[GitHub Repository]
    GH --> CI[CI Workflow]
    CI --> DH[(Docker Hub)]
    DH --> CD[CD Workflow]
    CD --> EKS[EKS Cluster]
    EKS --> NSDEV[dev namespace]
    EKS --> NSSTAGE[stage namespace]
    EKS --> NSPROD[prod namespace]
```

### Components

| Component | Purpose |
|---|---|
| GitHub Repository | Source code, manifests, workflows |
| CI Workflow | Test, lint, scan, build, push image |
| Docker Hub | Container image registry |
| CD Workflow | Deploy image to EKS namespaces |
| EKS Cluster | Hosts all environments |

---

## 2. Developer Flow

```mermaid
flowchart TD
    A[Code change] --> B[Push or PR]
    B --> C[CI runs]
    C --> D{CI passed}
    D -->|No| E[Fix and push again]
    D -->|Yes| F[CD starts]
    F --> G[Deploy dev]
    G --> H{Dev healthy}
    H -->|No| E
    H -->|Yes| I[Approve stage]
    I --> J[Deploy stage]
    J --> K{Stage healthy}
    K -->|No| E
    K -->|Yes| L[Approve prod]
    L --> M[Deploy prod]
```

---

## 3. CI Pipeline

```mermaid
flowchart LR
    A[Checkout] --> B[Setup Node 20]
    B --> C[npm ci]
    C --> D[npm test]
    D --> E[npm run lint]
    E --> F[Trivy FS]
    F --> G[CodeQL]
    G --> H[Docker build]
    H --> I[Trivy Image]
    I --> J{Security gate}
    J -->|Pass| K[Push image]
    J -->|Fail| L[Fail job]
```

### Gate Rules

- Trivy filesystem scan: fail threshold is CRITICAL/HIGH
- Trivy image scan: fail threshold is CRITICAL/HIGH
- SARIF upload still runs even when scans fail

---

## 4. Security Scan Flow

```mermaid
flowchart TD
    A[Code and manifest scan] --> B{CRITICAL/HIGH findings}
    B -->|Yes| C[Upload SARIF]
    C --> D[Fail CI]
    B -->|No| E[Proceed to build]
    E --> F[Image scan]
    F --> G{CRITICAL/HIGH findings}
    G -->|Yes| H[Upload SARIF and fail CI]
    G -->|No| I[Allow image push]
```

---

## 5. CD Deployment Flow

```mermaid
flowchart TD
    A[CI success] --> B[Deploy dev]
    B --> C[Rollout check]
    C --> D[Health check]
    D --> E[Approval gate: stage]
    E --> F[Deploy stage]
    F --> G[Rollout check]
    G --> H[Health check]
    H --> I[Approval gate: prod]
    I --> J[Deploy prod]
    J --> K[Rollout check]
```

### Deployment Behaviors

| Path | Behavior |
|---|---|
| Automatic path | `dev -> stage -> prod` with approvals on stage/prod |
| Manual path | Deploy only selected environment (`dev`, `stage`, or `prod`) |
| Auth mode | `oidc` or `keys` |

---

## 6. Rollback Flow

```mermaid
flowchart TD
    A[Issue detected] --> B[Check deployment history]
    B --> C[kubectl rollout undo]
    C --> D[Wait for rollout]
    D --> E[Test health endpoint]
    E --> F{Recovered}
    F -->|Yes| G[Close incident]
    F -->|No| H[Escalate and investigate]
```

Rollback commands:

```bash
kubectl rollout history deployment/demo-app -n prod
kubectl rollout undo deployment/demo-app -n prod
kubectl rollout status deployment/demo-app -n prod
```

---

## 7. EKS Cluster Architecture

```mermaid
flowchart TB
    subgraph AWS[AWS Region]
      subgraph VPC[VPC]
        subgraph PUBLIC[Public Subnets]
          LBDEV[LB dev]
          LBSTAGE[LB stage]
          LBPROD[LB prod]
        end
        subgraph PRIVATE[Private Subnets]
          NODE1[Worker Node 1]
          NODE2[Worker Node 2]
          NODE3[Worker Node 3]
        end
        API[EKS API Endpoint]
      end
    end

    GHA[GitHub Actions] --> API
    LBDEV --> NODE1
    LBSTAGE --> NODE2
    LBPROD --> NODE3
```

### Environment Profile

| Environment | Replicas | Approval required |
|---|---|---|
| dev | 1 | No |
| stage | 2 | Yes |
| prod | 3 | Yes |

---

## References

- GitHub Actions docs: https://docs.github.com/en/actions
- Amazon EKS docs: https://docs.aws.amazon.com/eks/
- Trivy docs: https://aquasecurity.github.io/trivy/
- CodeQL docs: https://codeql.github.com/docs/
