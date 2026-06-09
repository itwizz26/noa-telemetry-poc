# backend/core/celery.py
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

# Construct runtime broker using safe environment variables
broker_credentials = f"{env('AWS_ACCESS_KEY_ID')}:{env('AWS_SECRET_ACCESS_KEY')}"
sqs_host = env('SQS_ENDPOINT_URL').replace('http://', '').replace('https://', '')

app.conf.update(
    broker_url=f'sqs://{broker_credentials}@{sqs_host}',
    broker_transport_options={
        'region': env('AWS_DEFAULT_REGION'),
        'endpoint_url': env('SQS_ENDPOINT_URL'),
        'use_ssl': False,
        'predefined_queues': {
            'celery': {
                'url': env('SQS_QUEUE_URL')
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
)

app.autodiscover_tasks()