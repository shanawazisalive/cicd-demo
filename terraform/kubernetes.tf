# Kubernetes provider configuration
provider "kubernetes" {
  host                   = aws_eks_cluster.main.endpoint
  cluster_ca_certificate = base64decode(aws_eks_cluster.main.certificate_authority[0].data)

  exec {
    api_version = "client.authentication.k8s.io/v1beta1"
    command     = "aws"
    args = [
      "eks",
      "get-token",
      "--cluster-name",
      aws_eks_cluster.main.name,
      "--region",
      var.aws_region
    ]
  }
}

# Create dev namespace
resource "kubernetes_namespace" "dev" {
  metadata {
    name = "dev"
    labels = {
      environment = "dev"
      managed-by  = "terraform"
    }
  }

  depends_on = [
    aws_eks_node_group.main
  ]
}

# Create stage namespace
resource "kubernetes_namespace" "stage" {
  metadata {
    name = "stage"
    labels = {
      environment = "stage"
      managed-by  = "terraform"
    }
  }

  depends_on = [
    aws_eks_node_group.main
  ]
}

# Create prod namespace
resource "kubernetes_namespace" "prod" {
  metadata {
    name = "prod"
    labels = {
      environment = "prod"
      managed-by  = "terraform"
    }
  }

  depends_on = [
    aws_eks_node_group.main
  ]
}
