
from PIL import Image, ImageDraw, ImageFont
import os

def create_welcome_images():
    # Créer le dossier s'il n'existe pas
    os.makedirs(".", exist_ok=True)
    
    # Dimensions des images
    width, height = 400, 300
    
    # Couleurs de l'entreprise
    primary_color = "#FF4D4D"
    secondary_color = "#FFF5F5"
    text_color = "#1A1A1A"
    accent_color = "#34C759"
    
    # Image 1: Community (Communauté)
    img1 = Image.new('RGB', (width, height), secondary_color)
    draw1 = ImageDraw.Draw(img1)
    
    # Dessiner des cercles représentant une communauté
    circle_color = primary_color
    draw1.ellipse([50, 50, 150, 150], fill=circle_color)
    draw1.ellipse([200, 50, 300, 150], fill=circle_color)
    draw1.ellipse([125, 150, 225, 250], fill=circle_color)
    
    # Lignes de connexion
    draw1.line([100, 150, 175, 150], fill=text_color, width=3)
    draw1.line([225, 150, 250, 150], fill=text_color, width=3)
    
    # Texte
    try:
        font = ImageFont.truetype("arial.ttf", 24)
    except:
        font = ImageFont.load_default()
    
    draw1.text((width//2-60, height-40), "COMMUNAUTÉ", fill=text_color, font=font)
    img1.save("community.png")
    
    # Image 2: Mission
    img2 = Image.new('RGB', (width, height), secondary_color)
    draw2 = ImageDraw.Draw(img2)
    
    # Dessiner une cible (représentant la mission)
    center_x, center_y = width//2, height//2 - 20
    for i in range(4):
        radius = 80 - i*15
        color = primary_color if i % 2 == 0 else "#FFFFFF"
        draw2.ellipse([center_x-radius, center_y-radius, center_x+radius, center_y+radius], fill=color)
    
    # Point central
    draw2.ellipse([center_x-10, center_y-10, center_x+10, center_y+10], fill=accent_color)
    
    draw2.text((width//2-40, height-40), "MISSION", fill=text_color, font=font)
    img2.save("mission.png")
    
    # Image 3: Values (Valeurs)
    img3 = Image.new('RGB', (width, height), secondary_color)
    draw3 = ImageDraw.Draw(img3)
    
    # Dessiner des étoiles représentant les valeurs
    def draw_star(draw, center_x, center_y, size, color):
        points = []
        for i in range(10):
            angle = i * 36
            if i % 2 == 0:
                radius = size
            else:
                radius = size // 2
            x = center_x + radius * 0.866  # cos approximation
            y = center_y + radius * 0.5    # sin approximation
            points.append((x, y))
        draw.polygon(points, fill=color)
    
    # Trois étoiles
    draw_star(draw3, 100, 100, 30, accent_color)
    draw_star(draw3, 200, 80, 35, primary_color)
    draw_star(draw3, 300, 120, 25, accent_color)
    
    draw3.text((width//2-40, height-40), "VALEURS", fill=text_color, font=font)
    img3.save("values.png")
    
    # Image 4: Join (Rejoindre)
    img4 = Image.new('RGB', (width, height), secondary_color)
    draw4 = ImageDraw.Draw(img4)
    
    # Dessiner une flèche vers le haut
    arrow_color = primary_color
    # Flèche
    draw4.polygon([
        (width//2, 50),      # Pointe
        (width//2-30, 100),  # Gauche
        (width//2-15, 100),  # Gauche intérieur
        (width//2-15, 180),  # Bas gauche
        (width//2+15, 180),  # Bas droite
        (width//2+15, 100),  # Droite intérieur
        (width//2+30, 100)   # Droite
    ], fill=arrow_color)
    
    # Cercle de base
    draw4.ellipse([width//2-40, 180, width//2+40, 260], fill=accent_color)
    
    draw4.text((width//2-50, height-40), "REJOINDRE", fill=text_color, font=font)
    img4.save("join.png")
    
    print("Images créées avec succès !")

if __name__ == "__main__":
    create_welcome_images()
