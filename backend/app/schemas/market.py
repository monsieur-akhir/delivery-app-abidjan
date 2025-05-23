from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime
import enum

class ProductCategory(str, enum.Enum):
    food = "food"
    clothing = "clothing"
    electronics = "electronics"
    household = "household"
    beauty = "beauty"
    other = "other"

# Schémas de base pour les produits
class ProductBase(BaseModel):
    name: str
    description: Optional[str] = None
    price: float
    category: ProductCategory
    image_url: Optional[str] = None
    is_available: bool = True

# Schéma pour la création d'un produit
class ProductCreate(ProductBase):
    business_id: int
    
    @validator('price')
    def price_must_be_positive(cls, v):
        if v <= 0:
            raise ValueError('Le prix doit être positif')
        return v

# Schéma pour la mise à jour d'un produit
class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    category: Optional[ProductCategory] = None
    image_url: Optional[str] = None
    is_available: Optional[bool] = None

# Schéma pour la réponse de produit
class ProductResponse(ProductBase):
    id: int
    business_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    # Informations supplémentaires
    business: Optional[Dict[str, Any]] = None
    
    class Config:
        orm_mode = True
