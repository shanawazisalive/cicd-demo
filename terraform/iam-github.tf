# GitHub Actions OIDC Provider
resource "aws_iam_openid_connect_provider" "github_actions" {
  url = "https://token.actions.githubusercontent.com"

  client_id_list = [
    "sts.amazonaws.com"
  ]

  thumbprint_list = [
    "6938fd4d98bab03faadb97b34396831e3780aea1"
  ]

  tags = {
    Name = "github-actions-oidc-provider"
  }
}

# IAM role for GitHub Actions deployment
resource "aws_iam_role" "github_actions_deploy" {
  name = var.deploy_role_name

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Federated = aws_iam_openid_connect_provider.github_actions.arn
      }
      Action = "sts:AssumeRoleWithWebIdentity"
      Condition = {
        StringEquals = {
          "token.actions.githubusercontent.com:aud" = "sts.amazonaws.com"
        }
        StringLike = {
          "token.actions.githubusercontent.com:sub" = "repo:${var.github_org}/${var.github_repo}:*"
        }
      }
    }]
  })

  tags = {
    Name = var.deploy_role_name
  }
}

# Inline policy for least-privilege EKS deployment access
resource "aws_iam_role_policy" "github_actions_deploy_policy" {
  name = "GitHubActionsEKSDeployLeastPrivilege"
  role = aws_iam_role.github_actions_deploy.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "EKSDescribeCluster"
        Effect = "Allow"
        Action = [
          "eks:DescribeCluster"
        ]
        Resource = aws_eks_cluster.main.arn
      },
      {
        Sid    = "VPCReadOnly"
        Effect = "Allow"
        Action = [
          "ec2:DescribeVpcs",
          "ec2:DescribeSubnets",
          "ec2:DescribeRouteTables",
          "ec2:DescribeTags",
          "ec2:DescribeInternetGateways",
          "ec2:DescribeNatGateways"
        ]
        Resource = "*"
      }
    ]
  })
}

# EKS Access Entry for GitHub Actions role
resource "aws_eks_access_entry" "github_actions" {
  cluster_name      = aws_eks_cluster.main.name
  principal_arn     = aws_iam_role.github_actions_deploy.arn
  type              = "STANDARD"
  
  depends_on = [
    aws_eks_node_group.main
  ]
}

# EKS Access Policy Association for all namespaces
resource "aws_eks_access_policy_association" "github_actions" {
  cluster_name  = aws_eks_cluster.main.name
  principal_arn = aws_iam_role.github_actions_deploy.arn
  policy_arn    = "arn:aws:eks::aws:cluster-access-policy/AmazonEKSEditPolicy"

  access_scope {
    type       = "namespace"
    namespaces = var.namespaces
  }

  depends_on = [
    aws_eks_access_entry.github_actions
  ]
}
