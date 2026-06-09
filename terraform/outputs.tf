output "sqs_queue_url" {
  description = "URL of the primary SQS ingestion queue"
  value       = aws_sqs_queue.telemetry_ingestion_queue.id
}

output "sqs_queue_arn" {
  description = "ARN of the primary SQS ingestion queue"
  value       = aws_sqs_queue.telemetry_ingestion_queue.arn
}

output "sqs_dlq_url" {
  description = "URL of the Dead Letter Queue"
  value       = aws_sqs_queue.telemetry_dlq.id
}