from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_

from ..models.market import Product
from ..models.user import BusinessProfile, User
from ..schemas.market import ProductCreate, ProductUpdate
from ..core.exceptions import NotFoundError, BadRequestError


def create_product(db: Session, product_data: ProductCreate) -> Product:
    """
    Crée un nouveau produit.
    """
    # Vérifier que l'entreprise existe
    business = db.query(BusinessProfile).filter(BusinessProfile.id == product_data.business_id).first()
    if not business:
        raise BadRequestError("Profil d'entreprise non trouvé")
    
    db_product = Product(
        business_id=product_data.business_id,
        name=product_data.name,
        description=product_data.description,
        price=product_data.price,
        category=product_data.category,
        image_url=product_data.image_url,
        is_available=product_data.is_available
    )
    
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product


def get_product(db: Session, product_id: int) -> Optional[Product]:
    """
    Récupère un produit par son ID.
    """
    return db.query(Product).filter(Product.id == product_id).first()


def get_products(
    db: Session,
    commune: Optional[str] = None,
    category: Optional[str] = None,
    business_id: Optional[int] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 100
) -> List[Product]:
    """
    Récupère une liste de produits avec filtrage optionnel.
    """
    query = db.query(Product).join(BusinessProfile).join(User)
    
    # Filtre par commune (via le profil d'entreprise)
    if commune:
        query = query.filter(BusinessProfile.commune == commune)
    
    # Filtre par catégorie
    if category:
        query = query.filter(Product.category == category)
    
    # Filtre par entreprise
    if business_id:
        query = query.filter(Product.business_id == business_id)
    
    # Recherche textuelle dans le nom et la description
    if search:
        search_filter = or_(
            Product.name.ilike(f"%{search}%"),
            Product.description.ilike(f"%{search}%")
        )
        query = query.filter(search_filter)
    
    # Filtrer uniquement les produits disponibles
    query = query.filter(Product.is_available == True)
    
    return query.order_by(Product.created_at.desc()).offset(skip).limit(limit).all()


def update_product(db: Session, product_id: int, product_data: ProductUpdate) -> Product:
    """
    Met à jour un produit existant.
    """
    db_product = db.query(Product).filter(Product.id == product_id).first()
    if not db_product:
        raise NotFoundError("Produit non trouvé")
    
    # Mettre à jour les champs fournis
    update_data = product_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_product, field, value)
    
    db.commit()
    db.refresh(db_product)
    return db_product


def delete_product(db: Session, product_id: int) -> bool:
    """
    Supprime un produit.
    """
    db_product = db.query(Product).filter(Product.id == product_id).first()
    if not db_product:
        raise NotFoundError("Produit non trouvé")
    
    db.delete(db_product)
    db.commit()
    return True


def get_products_by_business(
    db: Session,
    business_id: int,
    skip: int = 0,
    limit: int = 100
) -> List[Product]:
    """
    Récupère tous les produits d'une entreprise spécifique.
    """
    return db.query(Product).filter(
        Product.business_id == business_id
    ).order_by(Product.created_at.desc()).offset(skip).limit(limit).all()


def toggle_product_availability(db: Session, product_id: int) -> Product:
    """
    Bascule la disponibilité d'un produit.
    """
    db_product = db.query(Product).filter(Product.id == product_id).first()
    if not db_product:
        raise NotFoundError("Produit non trouvé")
    
    db_product.is_available = not db_product.is_available
    db.commit()
    db.refresh(db_product)
    return db_product


def search_products(
    db: Session,
    query_text: str,
    commune: Optional[str] = None,
    category: Optional[str] = None,
    skip: int = 0,
    limit: int = 100
) -> List[Product]:
    """
    Recherche de produits avec texte libre.
    """
    query = db.query(Product).join(BusinessProfile).join(User)
    
    # Recherche dans le nom, description et nom de l'entreprise
    search_filter = or_(
        Product.name.ilike(f"%{query_text}%"),
        Product.description.ilike(f"%{query_text}%"),
        BusinessProfile.business_name.ilike(f"%{query_text}%")
    )
    query = query.filter(search_filter)
    
    # Filtres additionnels
    if commune:
        query = query.filter(BusinessProfile.commune == commune)
    
    if category:
        query = query.filter(Product.category == category)
    
    # Filtrer uniquement les produits disponibles
    query = query.filter(Product.is_available == True)
    
    return query.order_by(Product.created_at.desc()).offset(skip).limit(limit).all()


def get_nearby_merchants(db: Session, lat: float, lng: float, radius: float = 5.0, category: str = None) -> List[dict]:
    """
    Récupérer les marchands à proximité d'une position
    """
    try:
        # Pour l'instant, retourner tous les marchands avec des profils business
        query = db.query(User).join(BusinessProfile).filter(
            User.role == "business",
            User.is_active == True
        )
        
        # Filtrer par catégorie si fournie
        if category:
            query = query.filter(BusinessProfile.business_type == category)
        
        merchants = query.limit(20).all()
        
        result = []
        for merchant in merchants:
            # Calculer une distance simulée basée sur la commune
            distance = 2.5  # Distance par défaut en km
            
            result.append({
                "id": merchant.id,
                "name": merchant.business_profile.business_name if merchant.business_profile else merchant.full_name,
                "category": merchant.business_profile.business_type if merchant.business_profile else "general",
                "rating": 4.2,  # Rating simulé
                "distance": distance,
                "is_open": True,
                "image_url": merchant.business_profile.logo_url if merchant.business_profile else None,
                "commune": merchant.commune,
                "address": merchant.business_profile.address if merchant.business_profile else "",
                "phone": merchant.phone
            })
        
        return result
    except Exception as e:
        return []

def get_merchant(db: Session, merchant_id: int) -> Optional[dict]:
    """
    Récupérer les détails d'un marchand
    """
    try:
        merchant = db.query(User).filter(
            User.id == merchant_id,
            User.role == "business",
            User.is_active == True
        ).first()
        
        if not merchant:
            return None
            
        return {
            "id": merchant.id,
            "name": merchant.business_profile.business_name if merchant.business_profile else merchant.full_name,
            "category": merchant.business_profile.business_type if merchant.business_profile else "general",
            "description": merchant.business_profile.description if merchant.business_profile else "",
            "rating": 4.2,
            "reviews_count": 150,
            "is_open": True,
            "opening_hours": "8:00 - 18:00",
            "image_url": merchant.business_profile.logo_url if merchant.business_profile else None,
            "commune": merchant.commune,
            "address": merchant.business_profile.address if merchant.business_profile else "",
            "phone": merchant.phone,
            "email": merchant.email
        }
    except Exception as e:
        return None

def get_merchant_products(db: Session, merchant_id: int, skip: int = 0, limit: int = 20) -> List[dict]:
    """
    Récupérer les produits d'un marchand
    """
    try:
        products = db.query(Product).filter(
            Product.business_id == merchant_id,
            Product.is_available == True
        ).offset(skip).limit(limit).all()
        
        result = []
        for product in products:
            result.append({
                "id": product.id,
                "name": product.name,
                "description": product.description,
                "price": product.price,
                "category": product.category,
                "image_url": product.image_url,
                "is_available": product.is_available
            })
        
        return result
    except Exception as e:
        return []
