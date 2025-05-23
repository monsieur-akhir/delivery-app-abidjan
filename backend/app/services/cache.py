import redis.asyncio as redis
import json
from typing import Any, Dict, List, Optional, Union
import pickle
from datetime import timedelta

from ..core.config import settings

# Pool de connexion Redis
redis_pool = None

async def get_redis_connection():
    """
    Obtient une connexion Redis du pool.
    """
    global redis_pool
    if redis_pool is None:
        redis_pool = redis.ConnectionPool.from_url(
            settings.REDIS_URL,
            max_connections=10,
            decode_responses=True
        )
    
    return redis.Redis(connection_pool=redis_pool)

async def set_cache(key: str, value: Any, expire: int = 3600):
    """
    Stocke une valeur dans le cache Redis.
    """
    r = await get_redis_connection()
    
    # Sérialiser la valeur si nécessaire
    if isinstance(value, (dict, list, tuple, set)):
        value = json.dumps(value)
    
    await r.set(key, value, ex=expire)

async def get_cache(key: str) -> Optional[Any]:
    """
    Récupère une valeur du cache Redis.
    """
    r = await get_redis_connection()
    value = await r.get(key)
    
    if value is None:
        return None
    
    # Essayer de désérialiser la valeur
    try:
        return json.loads(value)
    except json.JSONDecodeError:
        return value

async def delete_cache(key: str):
    """
    Supprime une valeur du cache Redis.
    """
    r = await get_redis_connection()
    await r.delete(key)

async def flush_cache():
    """
    Vide le cache Redis.
    """
    r = await get_redis_connection()
    await r.flushdb()

async def set_object_cache(key: str, obj: Any, expire: int = 3600):
    """
    Stocke un objet Python dans le cache Redis.
    """
    r = await get_redis_connection(decode_responses=False)
    
    # Sérialiser l'objet avec pickle
    serialized = pickle.dumps(obj)
    
    await r.set(key, serialized, ex=expire)

async def get_object_cache(key: str) -> Optional[Any]:
    """
    Récupère un objet Python du cache Redis.
    """
    r = await get_redis_connection(decode_responses=False)
    value = await r.get(key)
    
    if value is None:
        return None
    
    # Désérialiser l'objet avec pickle
    return pickle.loads(value)

async def increment_counter(key: str, amount: int = 1) -> int:
    """
    Incrémente un compteur dans Redis.
    """
    r = await get_redis_connection()
    return await r.incrby(key, amount)

async def get_counter(key: str) -> int:
    """
    Récupère la valeur d'un compteur dans Redis.
    """
    r = await get_redis_connection()
    value = await r.get(key)
    
    if value is None:
        return 0
    
    return int(value)

async def add_to_queue(queue_name: str, item: Any):
    """
    Ajoute un élément à une file d'attente Redis.
    """
    r = await get_redis_connection()
    
    # Sérialiser l'élément si nécessaire
    if isinstance(item, (dict, list, tuple, set)):
        item = json.dumps(item)
    
    await r.lpush(queue_name, item)

async def get_from_queue(queue_name: str) -> Optional[Any]:
    """
    Récupère un élément d'une file d'attente Redis.
    """
    r = await get_redis_connection()
    value = await r.rpop(queue_name)
    
    if value is None:
        return None
    
    # Essayer de désérialiser l'élément
    try:
        return json.loads(value)
    except json.JSONDecodeError:
        return value

async def get_queue_length(queue_name: str) -> int:
    """
    Récupère la longueur d'une file d'attente Redis.
    """
    r = await get_redis_connection()
    return await r.llen(queue_name)

async def set_config(key: str, value: Any):
    """
    Stocke une configuration dans Redis.
    """
    r = await get_redis_connection()
    
    # Sérialiser la valeur si nécessaire
    if isinstance(value, (dict, list, tuple, set)):
        value = json.dumps(value)
    
    await r.hset("config", key, value)

async def get_config(key: str) -> Optional[Any]:
    """
    Récupère une configuration de Redis.
    """
    r = await get_redis_connection()
    value = await r.hget("config", key)
    
    if value is None:
        return None
    
    # Essayer de désérialiser la valeur
    try:
        return json.loads(value)
    except json.JSONDecodeError:
        return value

async def get_all_config() -> Dict[str, Any]:
    """
    Récupère toutes les configurations de Redis.
    """
    r = await get_redis_connection()
    config = await r.hgetall("config")
    
    # Essayer de désérialiser les valeurs
    for key, value in config.items():
        try:
            config[key] = json.loads(value)
        except json.JSONDecodeError:
            pass
    
    return config

async def publish_message(channel: str, message: Any):
    """
    Publie un message sur un canal Redis.
    """
    r = await get_redis_connection()
    
    # Sérialiser le message si nécessaire
    if isinstance(message, (dict, list, tuple, set)):
        message = json.dumps(message)
    
    await r.publish(channel, message)

async def subscribe_to_channel(channel: str):
    """
    S'abonne à un canal Redis.
    """
    r = await get_redis_connection()
    pubsub = r.pubsub()
    await pubsub.subscribe(channel)
    
    return pubsub

async def get_message(pubsub):
    """
    Récupère un message d'un canal Redis.
    """
    message = await pubsub.get_message(ignore_subscribe_messages=True)
    
    if message is None:
        return None
    
    # Essayer de désérialiser le message
    try:
        return json.loads(message["data"])
    except (json.JSONDecodeError, TypeError):
        return message["data"]
