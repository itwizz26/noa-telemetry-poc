import os
import environ
from celery import Celery
from pathlib import Path

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

BASE_DIR = Path(__file__).resolve().parent.parent

# Initialize environment reading
env = environ.Env()
environ.Env.read_env(os.path.join(BASE_DIR, '.env'))

# Force-inject mock credential variables into the execution process scope
os.environ['AWS_ACCESS_KEY_ID'] = env('AWS_ACCESS_KEY_ID')
os.environ['AWS_SECRET_ACCESS_KEY'] = env('AWS_SECRET_ACCESS_KEY')
os.environ['AWS_DEFAULT_REGION'] = env('AWS_DEFAULT_REGION')

# Explicitly ensure clean session boundaries
if 'AWS_SESSION_TOKEN' in os.environ:
    del os.environ['AWS_SESSION_TOKEN']

app = Celery('core')

# Construct runtime broker safely using credentials
broker_credentials = f"{env('AWS_ACCESS_KEY_ID')}:{env('AWS_SECRET_ACCESS_KEY')}"
sqs_host = env('SQS_ENDPOINT_URL').replace('http://', '').replace('https://', '')

app.conf.update(
    broker_url=f'sqs://{broker_credentials}@{sqs_host}',
    
    # 1. Force the default queue globally inside Celery
    task_default_queue='dev-ipp-telemetry-ingestion-queue',
    
    broker_transport_options={
        'region': env('AWS_DEFAULT_REGION'),
        'endpoint_url': env('SQS_ENDPOINT_URL'),
        'use_ssl': False,
        
        # 2. Hardcode the explicit string literal keys so Kombu's internal
        # SQS.py _resolve_queue_url lookup cannot fail with a KeyError.
        'predefined_queues': {
            'dev-ipp-telemetry-ingestion-queue': {
                'url': env('SQS_QUEUE_URL')
            },
            'dev-ipp-telemetry-dlq': {
                'url': env('SQS_DLQ_URL')
            }
        }
    },
    broker_connection_retry_on_startup=False,
    broker_connection_timeout=2,
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='Africa/Johannesburg',
    enable_utc=True,
    
    # Force acknowledgment behavior to happen only AFTER task execution completes.
    task_acks_late=True,
    task_reject_on_worker_lost=True,
)

app.autodiscover_tasks()