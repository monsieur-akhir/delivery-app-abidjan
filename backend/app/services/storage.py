from fastapi import UploadFile
import os
import uuid
import aiofiles
from typing import Optional
import boto3
from botocore.exceptions import NoCredentialsError

from ..core.config import settings

async def upload_file(file: UploadFile, folder: str) -> Optional[str]:
    """
    Télécharger un fichier sur le serveur local ou sur S3.
    Retourne l'URL du fichier téléchargé.
    """
    # Générer un nom de fichier unique
    file_extension = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    
    # Chemin complet
    file_path = f"uploads/{folder}/{unique_filename}"
    
    # Créer le dossier s'il n'existe pas
    os.makedirs(f"uploads/{folder}", exist_ok=True)
    
    # Enregistrer le fichier localement
    try:
        async with aiofiles.open(file_path, 'wb') as out_file:
            content = await file.read()
            await out_file.write(content)
        
        # Retourner l'URL relative
        return f"/static/{folder}/{unique_filename}"
    except Exception as e:
        print(f"Erreur lors du téléchargement du fichier: {str(e)}")
        return None

async def upload_to_s3(file: UploadFile, folder: str) -> Optional[str]:
    """
    Télécharger un fichier sur AWS S3.
    Retourne l'URL du fichier téléchargé.
    """
    # Générer un nom de fichier unique
    file_extension = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    
    # Chemin complet sur S3
    s3_path = f"{folder}/{unique_filename}"
    
    # Lire le contenu du fichier
    content = await file.read()
    
    # Télécharger sur S3
    try:
        s3 = boto3.client('s3')
        s3.put_object(
            Bucket="livraison-abidjan-uploads",
            Key=s3_path,
            Body=content,
            ContentType=file.content_type
        )
        
        # Retourner l'URL S3
        return f"https://livraison-abidjan-uploads.s3.amazonaws.com/{s3_path}"
    except NoCredentialsError:
        print("Erreur d'authentification S3")
        return None
    except Exception as e:
        print(f"Erreur lors du téléchargement sur S3: {str(e)}")
        return None

async def delete_file(file_path: str) -> bool:
    """
    Supprimer un fichier du serveur local.
    """
    try:
        # Supprimer le préfixe /static/ si présent
        if file_path.startswith("/static/"):
            file_path = file_path.replace("/static/", "uploads/")
        
        # Vérifier si le fichier existe
        if os.path.exists(file_path):
            os.remove(file_path)
            return True
        return False
    except Exception as e:
        print(f"Erreur lors de la suppression du fichier: {str(e)}")
        return False

async def delete_from_s3(s3_url: str) -> bool:
    """
    Supprimer un fichier d'AWS S3.
    """
    try:
        # Extraire le chemin S3 de l'URL
        s3_path = s3_url.replace("https://livraison-abidjan-uploads.s3.amazonaws.com/", "")
        
        # Supprimer de S3
        s3 = boto3.client('s3')
        s3.delete_object(
            Bucket="livraison-abidjan-uploads",
            Key=s3_path
        )
        
        return True
    except Exception as e:
        print(f"Erreur lors de la suppression du fichier S3: {str(e)}")
        return False
