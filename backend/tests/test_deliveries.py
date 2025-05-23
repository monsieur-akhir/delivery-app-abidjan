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
from models import User, UserRole, UserStatus, Delivery, DeliveryStatus
from auth import get_password_hash, create_access_token

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
    
    # Créer des utilisateurs de test
    db = TestingSessionLocal()
    
    # Client
    client_user = User(
        id=1,
        phone="+22507000001",
        email="client@example.com",
        hashed_password=get_password_hash("password123"),
        full_name="Client User",
        role=UserRole.client,
        status=UserStatus.active
    )
    db.add(client_user)
    
    # Coursier
    courier_user = User(
        id=2,
        phone="+22507000002",
        email="courier@example.com",
        hashed_password=get_password_hash("password123"),
        full_name="Courier User",
        role=UserRole.courier,
        status=UserStatus.active
    )
    db.add(courier_user)
    
    # Livraison
    delivery = Delivery(
        id=1,
        client_id=1,
        pickup_address="Adresse de ramassage",
        pickup_commune="Cocody",
        pickup_lat=5.35,
        pickup_lng=-4.01,
        delivery_address="Adresse de livraison",
        delivery_commune="Plateau",
        delivery_lat=5.32,
        delivery_lng=-4.02,
        description="Description de la livraison",
        proposed_price=2000.0,
        status=DeliveryStatus.pending
    )
    db.add(delivery)
    
    db.commit()
    db.close()
    
    yield
    
    # Supprimer les tables
    Base.metadata.drop_all(bind=engine)

def get_client_token():
    return create_access_token(data={"sub": "+22507000001", "role": "client"})

def get_courier_token():
    return create_access_token(data={"sub": "+22507000002", "role": "courier"})

def test_create_delivery(test_db):
    token = get_client_token()
    
    response = client.post(
        "/deliveries/",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "pickup_address": "Nouvelle adresse de ramassage",
            "pickup_commune": "Yopougon",
            "pickup_lat": 5.36,
            "pickup_lng": -4.05,
            "delivery_address": "Nouvelle adresse de livraison",
            "delivery_commune": "Marcory",
            "delivery_lat": 5.30,
            "delivery_lng": -4.03,
            "description": "Nouvelle livraison",
            "proposed_price": 2500.0
        }
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["pickup_commune"] == "Yopougon"
    assert data["delivery_commune"] == "Marcory"
    assert data["proposed_price"] == 2500.0
    assert data["status"] == "pending"

def test_get_deliveries(test_db):
    token = get_client_token()
    
    response = client.get(
        "/deliveries/",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["id"] == 1
    assert data[0]["pickup_commune"] == "Cocody"
    assert data[0]["delivery_commune"] == "Plateau"

def test_get_delivery(test_db):
    token = get_client_token()
    
    response = client.get(
        "/deliveries/1",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == 1
    assert data["pickup_commune"] == "Cocody"
    assert data["delivery_commune"] == "Plateau"
    assert data["proposed_price"] == 2000.0

def test_bid_for_delivery(test_db):
    token = get_courier_token()
    
    response = client.put(
        "/deliveries/1/bid",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "amount": 1800.0
        }
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == 1
    assert data["status"] == "pending"  # Le statut reste en attente jusqu'à ce que le client accepte l'enchère

def test_accept_bid(test_db):
    # D'abord, faire une enchère
    courier_token = get_courier_token()
    client.put(
        "/deliveries/1/bid",
        headers={"Authorization": f"Bearer {courier_token}"},
        json={
            "amount": 1800.0
        }
    )
    
    # Ensuite, accepter l'enchère
    client_token = get_client_token()
    response = client.put(
        "/deliveries/1/accept-bid/2",
        headers={"Authorization": f"Bearer {client_token}"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == 1
    assert data["status"] == "accepted"
    assert data["courier_id"] == 2
    assert data["final_price"] == 1800.0

def test_update_delivery_status(test_db):
    # D'abord, faire une enchère et l'accepter
    courier_token = get_courier_token()
    client_token = get_client_token()
    
    client.put(
        "/deliveries/1/bid",
        headers={"Authorization": f"Bearer {courier_token}"},
        json={
            "amount": 1800.0
        }
    )
    
    client.put(
        "/deliveries/1/accept-bid/2",
        headers={"Authorization": f"Bearer {client_token}"}
    )
    
    # Ensuite, mettre à jour le statut
    response = client.put(
        "/deliveries/1/status",
        headers={"Authorization": f"Bearer {courier_token}"},
        json={
            "status": "in_progress"
        }
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == 1
    assert data["status"] == "in_progress"
