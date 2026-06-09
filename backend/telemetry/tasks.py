from celery import shared_task
from django.db import transaction
from .models import TelemetryReading
from logging import getLogger

logger = getLogger(__name__)

@shared_task(name="telemetry.tasks.process_telemetry_batch_task")
def process_telemetry_batch_task(payload):
    ipp_id = payload.get('ipp_id')
    readings_data = payload.get('readings', [])
    
    logger.info(f"⚡ Processing asynchronous batch transaction for IPP: {ipp_id}")
    
    readings_to_upsert = []
    
    for reading in readings_data:
        # Build the model instances in memory
        readings_to_upsert.append(
            TelemetryReading(
                composite_node_key=ipp_id,
                meter_id=reading['meter_id'],
                # The serializer already parsed these into Python datetime and Decimal formats!
                timestamp=reading['timestamp'],
                megawatts_delivered=reading['mw_delivered']
            )
        )
        
    if not readings_to_upsert:
        return "Empty batch payload loop executed."

    # Execute an atomic atomic context block inside PostgreSQL
    with transaction.atomic():
        TelemetryReading.objects.bulk_create(
            readings_to_upsert,
            unique_fields=['composite_node_key', 'timestamp'], # Match our Postgres Unique Index
            update_fields=['megawatts_delivered', 'meter_id'],  # Fields to refresh if a duplicate hits
            update_conflicts=True                              # Instructs Django to compile an 'ON CONFLICT' block
        )

    msg = f"Successfully upserted {len(readings_to_upsert)} intervals for IPP: {ipp_id}"
    logger.info(msg)
    return msg