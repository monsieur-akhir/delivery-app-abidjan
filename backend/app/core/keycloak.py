from typing import Dict, Any, Optional
import requests
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
import json

from ..core.config import settings

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login")

class KeycloakAuth:
    def __init__(self):
        self.server_url = settings.KEYCLOAK_URL
        self.realm = settings.KEYCLOAK_REALM
        self.client_id = settings.KEYCLOAK_CLIENT_ID
        self.client_secret = settings.KEYCLOAK_CLIENT_SECRET
        self.admin_username = settings.KEYCLOAK_ADMIN_USERNAME
        self.admin_password = settings.KEYCLOAK_ADMIN_PASSWORD
        self.admin_token = None
        self.public_key = None
        self._load_public_key()

    def _load_public_key(self):
        """Charge la clé publique du realm Keycloak pour vérifier les tokens."""
        try:
            url = f"{self.server_url}/realms/{self.realm}"
            response = requests.get(url)
            if response.status_code == 200:
                data = response.json()
                self.public_key = f"-----BEGIN PUBLIC KEY-----\n{data['public_key']}\n-----END PUBLIC KEY-----"
            else:
                print(f"Erreur lors du chargement de la clé publique: {response.text}")
        except Exception as e:
            print(f"Exception lors du chargement de la clé publique: {str(e)}")

    def _get_admin_token(self):
        """Obtient un token d'administration pour Keycloak."""
        if self.admin_token:
            return self.admin_token

        url = f"{self.server_url}/realms/master/protocol/openid-connect/token"
        payload = {
            "client_id": "admin-cli",
            "username": self.admin_username,
            "password": self.admin_password,
            "grant_type": "password"
        }
        headers = {
            "Content-Type": "application/x-www-form-urlencoded"
        }

        response = requests.post(url, data=payload, headers=headers)
        if response.status_code == 200:
            data = response.json()
            self.admin_token = data["access_token"]
            return self.admin_token
        else:
            print(f"Erreur lors de l'obtention du token admin: {response.text}")
            return None

    def login(self, username: str, password: str) -> Dict[str, Any]:
        """Authentifie un utilisateur via Keycloak."""
        url = f"{self.server_url}/realms/{self.realm}/protocol/openid-connect/token"
        payload = {
            "client_id": self.client_id,
            "client_secret": self.client_secret,
            "username": username,
            "password": password,
            "grant_type": "password"
        }
        headers = {
            "Content-Type": "application/x-www-form-urlencoded"
        }

        response = requests.post(url, data=payload, headers=headers)
        if response.status_code == 200:
            return response.json()
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Identifiants invalides",
                headers={"WWW-Authenticate": "Bearer"},
            )

    def verify_token(self, token: str) -> Dict[str, Any]:
        """Vérifie un token JWT et retourne les claims."""
        try:
            payload = jwt.decode(
                token, 
                self.public_key, 
                algorithms=["RS256"],
                audience=self.client_id
            )
            return payload
        except JWTError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token invalide",
                headers={"WWW-Authenticate": "Bearer"},
            )

    def create_user(self, user_data: Dict[str, Any]) -> Dict[str, Any]:
        """Crée un utilisateur dans Keycloak."""
        admin_token = self._get_admin_token()
        if not admin_token:
            raise Exception("Impossible d'obtenir le token admin")

        url = f"{self.server_url}/admin/realms/{self.realm}/users"
        headers = {
            "Authorization": f"Bearer {admin_token}",
            "Content-Type": "application/json"
        }

        keycloak_user = {
            "username": user_data["phone"],
            "email": user_data.get("email", ""),
            "firstName": user_data.get("full_name", "").split(" ")[0],
            "lastName": " ".join(user_data.get("full_name", "").split(" ")[1:]),
            "enabled": True,
            "credentials": [
                {
                    "type": "password",
                    "value": user_data["password"],
                    "temporary": False
                }
            ],
            "attributes": {
                "phone": user_data["phone"],
                "role": user_data["role"],
                "commune": user_data.get("commune", ""),
                "language_preference": user_data.get("language_preference", "fr")
            }
        }

        response = requests.post(url, json=keycloak_user, headers=headers)
        if response.status_code == 201:
            # Récupérer l'ID de l'utilisateur créé
            location = response.headers.get("Location", "")
            user_id = location.split("/")[-1]
            
            # Ajouter le rôle à l'utilisateur
            self.assign_role(user_id, user_data["role"])
            
            return {"id": user_id, "status": "created"}
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Erreur lors de la création de l'utilisateur: {response.text}",
            )

    def assign_role(self, user_id: str, role: str) -> bool:
        """Assigne un rôle à un utilisateur dans Keycloak."""
        admin_token = self._get_admin_token()
        if not admin_token:
            return False

        # Récupérer l'ID du rôle
        role_id = self.get_role_id(role)
        if not role_id:
            return False

        url = f"{self.server_url}/admin/realms/{self.realm}/users/{user_id}/role-mappings/realm"
        headers = {
            "Authorization": f"Bearer {admin_token}",
            "Content-Type": "application/json"
        }

        payload = [
            {
                "id": role_id,
                "name": role
            }
        ]

        response = requests.post(url, json=payload, headers=headers)
        return response.status_code == 204

    def get_role_id(self, role_name: str) -> Optional[str]:
        """Récupère l'ID d'un rôle par son nom."""
        admin_token = self._get_admin_token()
        if not admin_token:
            return None

        url = f"{self.server_url}/admin/realms/{self.realm}/roles/{role_name}"
        headers = {
            "Authorization": f"Bearer {admin_token}"
        }

        response = requests.get(url, headers=headers)
        if response.status_code == 200:
            data = response.json()
            return data["id"]
        else:
            return None

    def update_user(self, user_id: str, user_data: Dict[str, Any]) -> bool:
        """Met à jour un utilisateur dans Keycloak."""
        admin_token = self._get_admin_token()
        if not admin_token:
            return False

        url = f"{self.server_url}/admin/realms/{self.realm}/users/{user_id}"
        headers = {
            "Authorization": f"Bearer {admin_token}",
            "Content-Type": "application/json"
        }

        # Récupérer l'utilisateur actuel
        response = requests.get(url, headers=headers)
        if response.status_code != 200:
            return False
        
        current_user = response.json()
        
        # Mettre à jour les champs
        if "email" in user_data:
            current_user["email"] = user_data["email"]
        
        if "full_name" in user_data:
            names = user_data["full_name"].split(" ")
            current_user["firstName"] = names[0]
            current_user["lastName"] = " ".join(names[1:]) if len(names) > 1 else ""
        
        # Mettre à jour les attributs
        if "attributes" not in current_user:
            current_user["attributes"] = {}
        
        if "commune" in user_data:
            current_user["attributes"]["commune"] = user_data["commune"]
        
        if "language_preference" in user_data:
            current_user["attributes"]["language_preference"] = user_data["language_preference"]
        
        # Envoyer la mise à jour
        response = requests.put(url, json=current_user, headers=headers)
        return response.status_code == 204

    def reset_password(self, user_id: str, new_password: str) -> bool:
        """Réinitialise le mot de passe d'un utilisateur."""
        admin_token = self._get_admin_token()
        if not admin_token:
            return False

        url = f"{self.server_url}/admin/realms/{self.realm}/users/{user_id}/reset-password"
        headers = {
            "Authorization": f"Bearer {admin_token}",
            "Content-Type": "application/json"
        }

        payload = {
            "type": "password",
            "value": new_password,
            "temporary": False
        }

        response = requests.put(url, json=payload, headers=headers)
        return response.status_code == 204

    def enable_totp(self, user_id: str) -> Dict[str, Any]:
        """Active l'authentification à deux facteurs pour un utilisateur."""
        admin_token = self._get_admin_token()
        if not admin_token:
            raise Exception("Impossible d'obtenir le token admin")

        # Récupérer les informations de configuration TOTP
        url = f"{self.server_url}/admin/realms/{self.realm}/users/{user_id}/credentials"
        headers = {
            "Authorization": f"Bearer {admin_token}"
        }

        response = requests.get(url, headers=headers)
        if response.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Erreur lors de la récupération des informations d'identification",
            )

        # Vérifier si TOTP est déjà configuré
        credentials = response.json()
        for cred in credentials:
            if cred["type"] == "otp":
                return {"status": "already_enabled"}

        # Configurer TOTP
        url = f"{self.server_url}/admin/realms/{self.realm}/users/{user_id}/required-actions"
        payload = {
            "name": "CONFIGURE_TOTP",
            "lifespan": 300,
            "value": "true"
        }

        response = requests.put(url, json=payload, headers=headers)
        if response.status_code == 200:
            return {"status": "enabled"}
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Erreur lors de l'activation de l'authentification à deux facteurs",
            )

# Créer une instance de KeycloakAuth
keycloak_auth = KeycloakAuth()

async def get_current_user_from_keycloak(token: str = Depends(oauth2_scheme)):
    """Dépendance pour obtenir l'utilisateur actuel à partir du token Keycloak."""
    try:
        payload = keycloak_auth.verify_token(token)
        return payload
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
            headers={"WWW-Authenticate": "Bearer"},
        )
