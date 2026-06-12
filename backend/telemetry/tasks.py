from celery import shared_task, Task
from celery.exceptions import Ignore
from django.db import transaction, DatabaseError
from .models import TelemetryReading
from logging import getLogger

logger = getLogger(__name__)

class DLQRoutingTask(Task):
    """Custom task base class to handle dead-letter queue routing on final exhaustion."""
    def on_failure(self, exc, task_id, args, kwargs, einfo):
        payload = args[0] if args else {}
        ipp_id = payload.get('ipp_id', 'UNKNOWN_IPP')
        
        print("\n=======================================================")
        print("🚨 DLQ TRIGGERED: MAX RETRIES EXCEEDED VIA LIFECYCLE HOOK")
        print("=======================================================\n")
        logger.critical(f"🚨 Task {task_id} failed permanently. Shunting payload for {ipp_id} straight to DLQ.")
        
        self.app.send_task(
            "telemetry.tasks.process_telemetry_batch_task", 
            args=[payload], 
            queue='dev-ipp-telemetry-dlq'
        )

@shared_task(
    bind=True, 
    base=DLQRoutingTask,
    name="telemetry.tasks.process_telemetry_batch_task",
    # 💥 CRITICAL FIX: Bind the main task explicitly to your ingestion queue name
    queue="dev-ipp-telemetry-ingestion-queue",
    max_retries=3,
    default_retry_delay=2
)
def process_telemetry_batch_task(self, payload):
    ipp_id = payload.get('ipp_id')
    readings_data = payload.get('readings', [])
    
    attempt_count = self.request.retries + 1
    logger.info(f"⚡ Processing batch transaction for IPP: {ipp_id} (Attempt {attempt_count}/4)")
    
    readings_to_upsert = [
        TelemetryReading(
            composite_node_key=ipp_id,
            timestamp=reading['timestamp'],
            megawatts_delivered=reading['mw_delivered']
        )
        for reading in readings_data
    ]
    
    if not readings_to_upsert:
        return "Empty batch payload loop executed."

    try:
        # 🧪 Keep the breaker active for our final log cleanup verification
        # raise DatabaseError("CRITICAL: PostgreSQL connection pool exhausted!")

        with transaction.atomic():
            TelemetryReading.objects.bulk_create(
                readings_to_upsert,
                unique_fields=['composite_node_key', 'timestamp'],
                update_fields=['megawatts_delivered'],
                update_conflicts=True
            )
        return f"Successfully upserted {len(readings_to_upsert)} records for {ipp_id}."

    except DatabaseError as exc:
        if self.request.retries < self.max_retries:
            logger.warning(f"⚠️ DB Failure on attempt {attempt_count}: {str(exc)}")
            countdown_timer = (2 ** self.request.retries) * 2
            raise self.retry(exc=exc, countdown=countdown_timer)
        else:
            # ✅ Clean Exit: Explicitly trigger the DLQ handler hook manually
            self.on_failure(exc, self.request.id, [payload], {}, None)
            
            # Update task state to clean FAILURE inside Celery's tracking backend
            self.update_state(state='FAILURE', meta={'error': str(exc)})
            
            # Suppress the messy Python console traceback dump completely
            raise Ignore()