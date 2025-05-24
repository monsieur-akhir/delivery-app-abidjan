# -*- coding: utf-8 -*-

"""
Configuration Celery pour Livraison Abidjan
"""

import os

# Broker et backend
broker_url = os.getenv("REDIS_URL", "redis://redis:6379/0")
result_backend = os.getenv("REDIS_URL", "redis://redis:6379/0")

# Sérialisation
task_serializer = "json"
result_serializer = "json"
accept_content = ["json"]

# Fuseaux horaires
timezone = "Africa/Abidjan"
enable_utc = True

# Paramètres d'exécution
worker_concurrency = int(os.getenv("CELERY_CONCURRENCY", "4"))
worker_prefetch_multiplier = 1
task_acks_late = True
task_reject_on_worker_lost = True
task_time_limit = 600  # 10 minutes
task_soft_time_limit = 300  # 5 minutes

# Paramètres de file d'attente
task_default_queue = "default"
task_queues = {
    "default": {
        "exchange": "default",
        "routing_key": "default"
    },
    "notifications": {
        "exchange": "notifications",
        "routing_key": "notifications"
    },
    "background": {
        "exchange": "background",
        "routing_key": "background"
    }
}
task_routes = {
    "send_sms_notification": {"queue": "notifications"},
    "send_push_notification": {"queue": "notifications"},
    "process_delivery_status_updates": {"queue": "default"},
    "clean_expired_sessions": {"queue": "background"},
    "update_traffic_data": {"queue": "background"}
}

# Paramètres de journalisation
worker_log_format = "[%(asctime)s: %(levelname)s/%(processName)s] %(message)s"
worker_task_log_format = "[%(asctime)s: %(levelname)s/%(processName)s] [%(task_name)s(%(task_id)s)] %(message)s"
