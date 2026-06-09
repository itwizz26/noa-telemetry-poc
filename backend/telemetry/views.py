from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework import status

from .serializers import TelemetryPayloadSerializer
from .tasks import process_telemetry_batch_task
from django.db.models import Sum, Max, Count
from .models import TelemetryReading

class TelemetryIngestView(APIView):
    # Explicitly allow unauthenticated automated posts to this endpoint
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        # Bind payload data to our validation schema matrix
        serializer = TelemetryPayloadSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(
                {
                    "error": "Data Validation Failed", 
                    "details": serializer.errors
                }, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        # Hand off sanitized, validated primitive data directly to the queue
        validated_data = serializer.validated_data
        process_telemetry_batch_task.delay(validated_data)
        
        return Response(
            {"status": "Metrics payload validated and dispatched asynchronously."}, 
            status=status.HTTP_202_ACCEPTED
        )

    """
    Computes system-wide grid aggregation metrics directly from PostgreSQL.
    Provides the core data feeds for the Next.js operational dashboard dashboard.
    """

    def get(self, request, *args, **kwargs):
        # Run optimized aggregates inside the database engine layer
        aggregates = TelemetryReading.objects.aggregate(
            total_nodes=Count('composite_node_key', distinct=True),
            peak_mw=Max('megawatts_delivered'),
            total_mwh=Sum('megawatts_delivered')
        )
        
        # Pull the last 50 intervals to feed our time-series line graph curve
        recent_readings = TelemetryReading.objects.order_by('-timestamp')[:50]
        
        # Map time series objects cleanly to match our TypeScript contracts
        graph_data = [
            {
                "composite_node_key": reading.composite_node_key,
                "timestamp": reading.timestamp.isoformat(),
                "megawatts_delivered": float(reading.megawatts_delivered)
            }
            for reading in reversed(recent_readings) # Chronological ordering for Recharts
        ]
        
        # Construct the unified response payload match
        payload = {
            "totalIPPCount": aggregates.get('total_nodes') or 0,
            "peakGenerationMW": float(aggregates.get('peak_mw') or 0.0),
            # Divide by 2 if calculating accurate 30-min settlement interval MWh values, 
            # but for a pure raw metric tracking view, a raw sum accumulation works perfectly here.
            "totalEnergyDeliveredMWH": float(aggregates.get('total_mwh') or 0.0),
            "recentReadings": graph_data
        }
        
        return Response(payload)