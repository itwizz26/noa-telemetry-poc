from django.urls import path
from .views import TelemetryIngestView

urlpatterns = [
    # Bind the APIView directly using .as_view() instead of routing it
    path('ingest/', TelemetryIngestView.as_view(), name='telemetry-ingest'),
    path('analytics/', TelemetryIngestView.as_view(), name='telemetry-analytics'),
]