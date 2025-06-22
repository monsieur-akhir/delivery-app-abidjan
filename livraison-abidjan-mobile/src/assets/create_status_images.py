
from PIL import Image, ImageDraw, ImageFont
import os

def create_status_images():
    # Couleurs
    pending_color = "#FF9500"    # Orange
    progress_color = "#007AFF"   # Bleu
    completed_color = "#34C759"  # Vert
    cancelled_color = "#FF3B30"  # Rouge
    white = "#FFFFFF"
    
    # Dimensions
    size = 150
    
    # Créer le dossier status s'il n'existe pas
    os.makedirs("status", exist_ok=True)
    
    # 1. Pending (En attente)
    pending = Image.new('RGBA', (size, size), (255, 255, 255, 0))
    draw_pending = ImageDraw.Draw(pending)
    
    # Cercle de fond
    draw_pending.ellipse([10, 10, size-10, size-10], fill=pending_color)
    # Horloge
    center = size // 2
    # Cadran
    draw_pending.ellipse([center-30, center-30, center+30, center+30], fill=white)
    # Aiguilles
    draw_pending.line([center, center, center, center-20], fill=pending_color, width=3)
    draw_pending.line([center, center, center+15, center], fill=pending_color, width=2)
    # Points d'heures
    for i in range(12):
        angle = i * 30
        x1 = center + 25 * 0.866  # cos approximation
        y1 = center + 25 * 0.5    # sin approximation
        draw_pending.ellipse([x1-2, y1-2, x1+2, y1+2], fill=pending_color)
    
    pending.save("status/pending.png")
    
    # 2. In Progress (En cours)
    progress = Image.new('RGBA', (size, size), (255, 255, 255, 0))
    draw_progress = ImageDraw.Draw(progress)
    
    # Cercle de fond
    draw_progress.ellipse([10, 10, size-10, size-10], fill=progress_color)
    # Camion en mouvement
    truck_x = center - 25
    truck_y = center - 15
    # Corps
    draw_progress.rectangle([truck_x, truck_y, truck_x+35, truck_y+20], fill=white)
    # Cabine
    draw_progress.rectangle([truck_x, truck_y-8, truck_x+15, truck_y], fill=white)
    # Roues
    draw_progress.ellipse([truck_x+5, truck_y+15, truck_x+15, truck_y+25], fill="#333333")
    draw_progress.ellipse([truck_x+25, truck_y+15, truck_x+35, truck_y+25], fill="#333333")
    # Lignes de mouvement
    for i in range(3):
        y = truck_y + i * 5
        draw_progress.line([truck_x-15, y, truck_x-5, y], fill=white, width=2)
    
    progress.save("status/in-progress.png")
    
    # 3. Completed (Terminé)
    completed = Image.new('RGBA', (size, size), (255, 255, 255, 0))
    draw_completed = ImageDraw.Draw(completed)
    
    # Cercle de fond
    draw_completed.ellipse([10, 10, size-10, size-10], fill=completed_color)
    # Coche
    check_points = [
        (center-20, center),
        (center-10, center+15),
        (center+20, center-10)
    ]
    for i in range(len(check_points)-1):
        draw_completed.line([check_points[i], check_points[i+1]], fill=white, width=8)
    
    completed.save("status/completed.png")
    
    # 4. Cancelled (Annulé)
    cancelled = Image.new('RGBA', (size, size), (255, 255, 255, 0))
    draw_cancelled = ImageDraw.Draw(cancelled)
    
    # Cercle de fond
    draw_cancelled.ellipse([10, 10, size-10, size-10], fill=cancelled_color)
    # X
    draw_cancelled.line([center-20, center-20, center+20, center+20], fill=white, width=8)
    draw_cancelled.line([center-20, center+20, center+20, center-20], fill=white, width=8)
    
    cancelled.save("status/cancelled.png")
    
    print("Images de statut créées avec succès !")

if __name__ == "__main__":
    create_status_images()
