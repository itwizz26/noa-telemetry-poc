# 1. Dead Letter Queue (DLQ) for corrupt payloads
resource "aws_sqs_queue" "telemetry_dlq" {
  name                      = "${var.environment}-ipp-telemetry-dlq"
  message_retention_seconds = 1209600 # 14 days for forensic debugging

  tags = {
    Environment = "var.environment"
    ManagedBy   = "Terraform"
  }
}

# 2. Main Ingestion Queue
resource "aws_sqs_queue" "telemetry_ingestion_queue" {
  name                      = "${var.environment}-ipp-telemetry-ingestion-queue"
  delay_seconds             = 0
  max_message_size          = 262144 # 256 KB
  message_retention_seconds = 345600 # 4 days
  receive_wait_time_seconds = 20     # Enforce Long Polling to eliminate empty reads

  # Move message to DLQ if Celery workers crash or reject it 3 times
  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.telemetry_dlq.arn
    maxReceiveCount     = 3
  })

  tags = {
    Environment = "var.environment"
    ManagedBy   = "Terraform"
  }
}
