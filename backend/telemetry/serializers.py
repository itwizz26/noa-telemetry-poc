from rest_framework import serializers
from datetime import datetime

class MeterReadingSerializer(serializers.Serializer):
    meter_id = serializers.CharField(max_length=100, trim_whitespace=True)
    timestamp = serializers.DateTimeField()
    # Using DecimalField to prevent floating-point precision loss on financial grid settlements
    mw_delivered = serializers.DecimalField(max_digits=10, decimal_places=4, min_value=0.0)

class TelemetryPayloadSerializer(serializers.Serializer):
    ipp_id = serializers.CharField(max_length=150, trim_whitespace=True)
    readings = MeterReadingSerializer(many=True, allow_empty=False)

    def validate_ipp_id(self, value):
        """Sanity check to block empty spaces or broken identifier flags."""
        if not value.strip():
            raise serializers.ValidationError("IPP Identifier cannot be blank or whitespace-only.")
        return value.upper() # Standardize tokens to uppercase globally