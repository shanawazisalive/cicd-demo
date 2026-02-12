# Data source for existing VPC
data "aws_vpc" "existing" {
  id = var.vpc_id
}

# Data source for existing subnets
data "aws_subnet" "existing" {
  for_each = toset(var.subnet_ids)
  id       = each.value
}

# Add EKS cluster discovery tags to existing subnets
resource "aws_ec2_tag" "subnet_cluster_tag" {
  for_each    = toset(var.subnet_ids)
  resource_id = each.value
  key         = "kubernetes.io/cluster/${var.cluster_name}"
  value       = "shared"
}

# Add ELB role tag to public subnets for LoadBalancer service discovery
resource "aws_ec2_tag" "subnet_elb_tag" {
  for_each    = toset(var.subnet_ids)
  resource_id = each.value
  key         = "kubernetes.io/role/elb"
  value       = "1"
}
