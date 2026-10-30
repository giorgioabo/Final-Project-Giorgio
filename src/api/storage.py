"""
Fotos de producto en Neon Object Storage (compatible con S3).

Las credenciales llegan con los nombres estándar de AWS (AWS_ACCESS_KEY_ID,
AWS_SECRET_ACCESS_KEY, AWS_ENDPOINT_URL_S3, AWS_REGION), que `neon deploy`
escribe en .env.local. El bucket es privado: guardamos solo la clave del objeto
y la servimos con URLs firmadas de corta duración.
"""
import os
import uuid

BUCKET = os.getenv("ASSETS_BUCKET", "assets")
MAX_UPLOAD_BYTES = 5 * 1024 * 1024
IMAGE_TYPES = {"image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/avif": "avif"}
PRESIGN_SECONDS = 3600

_client = None


def is_configured():
    return bool(os.getenv("AWS_ENDPOINT_URL_S3") and os.getenv("AWS_ACCESS_KEY_ID"))


def client():
    global _client
    if _client is None:
        import boto3
        from botocore.config import Config
        # Neon solo admite direcciones path-style y firmas SigV4.
        _client = boto3.client(
            "s3",
            endpoint_url=os.getenv("AWS_ENDPOINT_URL_S3"),
            config=Config(signature_version="s3v4", s3={"addressing_style": "path"}),
        )
    return _client


def upload_image(data, content_type):
    ext = IMAGE_TYPES.get(content_type)
    if not ext:
        raise ValueError("Formato no admitido: usa JPG, PNG, WebP o AVIF")
    if not data:
        raise ValueError("El archivo está vacío")
    if len(data) > MAX_UPLOAD_BYTES:
        raise ValueError("La imagen supera los 5 MB")
    key = f"products/{uuid.uuid4().hex}.{ext}"
    client().put_object(
        Bucket=BUCKET, Key=key, Body=data, ContentType=content_type,
        # Cada versión usa una clave nueva, así que puede cachearse para siempre.
        CacheControl="public, max-age=31536000, immutable",
    )
    return key


def presigned_url(key):
    return client().generate_presigned_url(
        "get_object", Params={"Bucket": BUCKET, "Key": key}, ExpiresIn=PRESIGN_SECONDS,
    )
