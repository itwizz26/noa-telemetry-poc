from django.db import models

class TelemetryReading(models.Model):
    """
    Optimized for high-frequency time-series energy readings.
    Enforces a strict unique constraint across node identifier and timestamp.
    """
    # A calculated field joining IPP and Meter ID (e.g., "IPP_SOLAR_01_METER_A")
    composite_node_key = models.CharField(max_length=150, db_index=True)
    
    # The explicit half-hour interval timestamp
    timestamp = models.DateTimeField()
    
    # Energy metrics delivered in Megawatts (MW)
    megawatts_delivered = models.DecimalField(max_digits=10, decimal_places=4)
    
    # Metadata for full audatability
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        # Crucial for performance: creates a composite index for fast analytical query reads
        indexes = [
            models.Index(fields=['composite_node_key', 'timestamp']),
        ]
        # Crucial for Idempotency: prevents duplicate entries for the exact same interval block
        unique_together = [['composite_node_key', 'timestamp']]
    
    def __str__(self):
        return f"{self.composite_node_key} | {self.timestamp} | {self.megawatts_delivered} MW"