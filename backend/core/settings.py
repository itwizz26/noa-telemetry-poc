from datetime import timedelta
import os
import environ
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

# Initialize environ
env = environ.Env(
    DEBUG=(bool, False) # Fallback default
)

# Read the .env file
environ.Env.read_env(os.path.join(BASE_DIR, '.env'))

# Security settings pulled from environment variables
SECRET_KEY = env('SECRET_KEY')
DEBUG = env('DEBUG')

ALLOWED_HOSTS = ['127.0.0.1', 'localhost']

# 1. Add CORS and JWT Apps
INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    # Third-Party Apps
    "rest_framework",
    "corsheaders",
    "rest_framework_simplejwt",
    # Your Apps
    "telemetry",
]

# 2. Place CorsMiddleware at the very top of Middleware
MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",  # Must be first!
    "django.middleware.common.CommonMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "core.urls"

# 1. Parse the base connection string natively
DATABASES = {
    'default': env.db(
        'DATABASE_URL', 
        default='postgres://postgres:postgres@localhost:5432/noa_telemetry_poc'
    )
}

# 2. Inject pooling arguments directly to bypass django-environ parser restrictions
# Forces Django to reuse connections for up to 10 minutes (600 seconds)
DATABASES['default']['CONN_MAX_AGE'] = 600

# Enables persistent connection health checks to drop dead sockets safely
DATABASES['default']['CONN_HEALTH_CHECKS'] = True

# 3. Configure REST Framework to use JWT Authentication globally
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticated",  # Secure endpoints by default
    ),
}

# 4. Simple JWT Configuration for Next.js handshaking
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=15),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=1),
    "AUTH_HEADER_TYPES": ("Bearer",),
}

# 5. Allow Next.js (usually port 3000) to communicate with DRF
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

STATIC_URL = "static/"
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
