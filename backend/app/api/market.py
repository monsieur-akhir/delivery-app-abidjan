from fastapi import APIRouter, Depends, HTTPException, status, Query, File, UploadFile
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from ..db.session import get_db
from ..core.dependencies import get_current_user, get_current_active_user
from ..schemas.market import ProductCreate, ProductUpdate, ProductResponse
from ..schemas.user import UserResponse
from ..services.market import create_product, get_product, get_products, update_product, delete_product
from ..services.storage import upload_file
from ..models.user import UserRole

router = APIRouter()

@router.post("/", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
async def create_new_product(
    product: ProductCreate,
    image: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_active_user)
):
    """
    Créer un nouveau produit.
    Seuls les entreprises et les gestionnaires peuvent créer des produits.
    """
    if current_user.role not in [UserRole.business, UserRole.manager]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les entreprises et les gestionnaires peuvent créer des produits"
        )
    
    # Si une image est fournie, la télécharger
    image_url = None
    if image:
        image_url = await upload_file(image, "products")
    
    # Mettre à jour l'URL de l'image si elle a été téléchargée
    if image_url:
        product.image_url = image_url
    
    # Créer le produit
    return create_product(db, product)

@router.get("/{product_id}", response_model=ProductResponse)
async def read_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_active_user)
):
    """
    Récupérer les détails d'un produit.
    """
    product = get_product(db, product_id)
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Produit non trouvé"
        )
    
    return product

@router.get("/", response_model=List[ProductResponse])
async def read_products(
    commune: Optional[str] = None,
    category: Optional[str] = None,
    business_id: Optional[int] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_active_user)
):
    """
    Récupérer la liste des produits.
    Filtrage par commune, catégorie, entreprise et recherche possible.
    """
    return get_products(
        db,
        commune=commune,
        category=category,
        business_id=business_id,
        search=search,
        skip=skip,
        limit=limit
    )

@router.put("/{product_id}", response_model=ProductResponse)
async def update_existing_product(
    product_id: int,
    product: ProductUpdate,
    image: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_active_user)
):
    """
    Mettre à jour un produit existant.
    Seul l'entreprise propriétaire ou un gestionnaire peut modifier un produit.
    """
    db_product = get_product(db, product_id)
    if not db_product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Produit non trouvé"
        )
    
    # Vérifier les permissions
    if current_user.role == UserRole.manager or (current_user.role == UserRole.business and db_product.business_id == current_user.id):
        # Si une image est fournie, la télécharger
        if image:
            image_url = await upload_file(image, "products")
            product.image_url = image_url
        
        return update_product(db, product_id, product)
    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Vous n'avez pas la permission de modifier ce produit"
        )

@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_existing_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_active_user)
):
    """
    Supprimer un produit.
    Seul l'entreprise propriétaire ou un gestionnaire peut supprimer un produit.
    """
    db_product = get_product(db, product_id)
    if not db_product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Produit non trouvé"
        )
    
    # Vérifier les permissions
    if current_user.role == UserRole.manager or (current_user.role == UserRole.business and db_product.business_id == current_user.id):
        delete_product(db, product_id)
        return {"detail": "Produit supprimé"}
    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Vous n'avez pas la permission de supprimer ce produit"
        )
