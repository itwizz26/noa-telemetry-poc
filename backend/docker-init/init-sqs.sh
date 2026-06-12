#!/bin/bash
echo "Initializing LocalStack Queues..."
awslocal sqs create-queue --queue-name dev-ipp-telemetry-ingestion-queue
awslocal sqs create-queue --queue-name dev-ipp-telemetry-dlq
echo "Queues successfully provisioned!"
