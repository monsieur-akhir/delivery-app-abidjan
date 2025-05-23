import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from database import Base, get_db
from main import app
from models import User, UserRole, UserStatus
from auth import get_password_hash

# Créer une base de données en mémoire pour les tests
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Remplacer la dépendance de base de données
def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)

@pytest.fixture(scope="function")
def test_db():
    # Créer les tables
    Base.metadata.create_all(bind=engine)
    
    # Créer un utilisateur de test
    db = TestingSessionLocal()
    test_user = User(
        phone="+22507000001",
        email="test@example.com",
        hashed_password=get_password_hash("password123"),
        full_name="Test User",
        role=UserRole.client,
        status=UserStatus.active
    )
    db.add(test_user)
    db.commit()
    db.close()
    
    yield
    
    # Supprimer les tables
    Base.metadata.drop_all(bind=engine)

def test_register_user(test_db):
    response = client.post(
        "/auth/register",
        json={
            "phone": "+22507000002",
            "email": "new@example.com",
            "password": "password123",
            "full_name": "New User",
            "role": "client",
            "commune": "Cocody"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["phone"] == "+22507000002"
    assert data["email"] == "new@example.com"
    assert data["full_name"] == "New User"
    assert data["role"] == "client"
    assert "id" in data

def test_login_user(test_db):
    response = client.post(
        "/auth/login",
        json={
            "phone": "+22507000001",
            "password": "password123"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

def test_login_user_wrong_password(test_db):
    response = client.post(
        "/auth/login",
        json={
            "phone": "+22507000001",
            "password": "wrongpassword"
        }
    )
    assert response.status_code == 401

def test_get_current_user(test_db):
    # D'abord se connecter pour obtenir un token
    login_response = client.post(
        "/auth/login",
        json={
            "phone": "+22507000001",
            "password": "password123"
        }
    )
    token = login_response.json()["access_token"]
    
    # Utiliser le token pour accéder à l'endpoint protégé
    response = client.get(
        "/users/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["phone"] == "+22507000001"
    assert data["email"] == "test@example.com"
    assert data["full_name"] == "Test User"
