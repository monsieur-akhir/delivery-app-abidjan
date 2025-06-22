from PIL import Image, ImageDraw, ImageFont
import os

def create_community_image():
    img = Image.new('RGBA', (300, 200), (248, 249, 250, 255))
    draw = ImageDraw.Draw(img)
    
    # Dessiner des personnes simples
    colors = [(76, 175, 80, 255), (33, 150, 243, 255), (156, 39, 176, 255)]
    positions = [90, 150, 210]
    
    for i, (color, x) in enumerate(zip(colors, positions)):
        # Tête
        draw.ellipse([x-15, 50, x+15, 80], fill=color)
        # Corps
        draw.rectangle([x-10, 80, x+10, 130], fill=color)
    
    # Lignes de connexion
    draw.line([105, 105, 135, 105], fill=(221, 221, 221, 255), width=3)
    draw.line([165, 105, 195, 105], fill=(221, 221, 221, 255), width=3)
    
    img.save('community.png', 'PNG')
    print("Image communauté créée")

def create_mission_image():
    img = Image.new('RGBA', (300, 200), (248, 249, 250, 255))
    draw = ImageDraw.Draw(img)
    
    # Cible
    center_x, center_y = 150, 75
    draw.ellipse([center_x-40, center_y-40, center_x+40, center_y+40], 
                outline=(255, 107, 0, 255), width=4)
    draw.ellipse([center_x-25, center_y-25, center_x+25, center_y+25], 
                outline=(255, 107, 0, 255), width=3)
    draw.ellipse([center_x-10, center_y-10, center_x+10, center_y+10], 
                fill=(255, 107, 0, 255))
    
    # Flèche
    arrow_points = [(200, 50), (185, 55), (185, 52), (175, 52), (175, 48), (185, 48), (185, 45)]
    draw.polygon(arrow_points, fill=(51, 51, 51, 255))
    
    # Silhouette de ville
    buildings = [(50, 140, 30, 40), (90, 130, 25, 50), (125, 145, 35, 35), 
                (170, 135, 30, 45), (210, 150, 40, 30)]
    
    for x, y, w, h in buildings:
        draw.rectangle([x, y, x+w, y+h], fill=(204, 204, 204, 255))
    
    img.save('mission.png', 'PNG')
    print("Image mission créée")

def create_values_image():
    img = Image.new('RGBA', (300, 200), (248, 249, 250, 255))
    draw = ImageDraw.Draw(img)
    
    # Piliers
    pillars = [(100, 90, 30, 60), (135, 80, 30, 70), (170, 85, 30, 65)]
    
    for x, y, w, h in pillars:
        draw.rectangle([x, y, x+w, y+h], fill=(33, 150, 243, 255))
    
    # Connexion du haut
    draw.rectangle([95, 75, 205, 83], fill=(255, 215, 0, 255))
    
    # Étoiles
    star_positions = [(65, 25), (135, 28), (205, 25)]
    for x, y in star_positions:
        # Étoile simple (losange)
        points = [(x, y), (x+5, y+8), (x, y+16), (x-5, y+8)]
        draw.polygon(points, fill=(255, 215, 0, 255))
    
    img.save('values.png', 'PNG')
    print("Image valeurs créée")

def create_join_image():
    img = Image.new('RGBA', (300, 200), (248, 249, 250, 255))
    draw = ImageDraw.Draw(img)
    
    # Mains qui se rejoignent (rectangles simplifiés)
    draw.ellipse([70, 70, 120, 120], fill=(156, 39, 176, 255))
    draw.ellipse([180, 70, 230, 120], fill=(156, 39, 176, 255))
    
    # Cœur au centre
    heart_points = [(150, 85), (145, 80), (140, 85), (140, 95), (150, 105), 
                   (160, 95), (160, 85), (155, 80)]
    draw.polygon(heart_points, fill=(255, 87, 34, 255))
    
    # Bouton rejoignez-nous
    draw.rounded_rectangle([75, 140, 225, 170], radius=15, fill=(156, 39, 176, 255))
    
    # Points décoratifs
    decorative_points = [(50, 40, 3), (250, 60, 4), (30, 120, 2), (270, 140, 3)]
    colors_dec = [(255, 215, 0, 255), (76, 175, 80, 255), (33, 150, 243, 255), (255, 87, 34, 255)]
    
    for (x, y, r), color in zip(decorative_points, colors_dec):
        draw.ellipse([x-r, y-r, x+r, y+r], fill=color)
    
    img.save('join.png', 'PNG')
    print("Image rejoindre créée")

if __name__ == "__main__":
    try:
        create_community_image()
        create_mission_image()
        create_values_image()
        create_join_image()
        print("Toutes les images welcome ont été créées avec succès")
    except Exception as e:
        print(f"Erreur: {e}")
        # Créer des fichiers placeholder si Pillow n'est pas disponible
        placeholder_png = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x01,\x00\x00\x00\xc8\x08\x06\x00\x00\x00\x8d\x8a\x8f\x8f\x00\x00\x00\x04sBIT\x08\x08\x08\x08|\x08d\x88\x00\x00\x00\x19tEXtSoftware\x00www.inkscape.org\x9b\xee<\x1a\x00\x00\x00\rIDAT\x08\x1dc\xf8\x0f\x00\x00\x01\x00\x01\x00\x00\x00\x00IEND\xaeB`\x82'
        
        for filename in ['community.png', 'mission.png', 'values.png', 'join.png']:
            with open(filename, 'wb') as f:
                f.write(placeholder_png)
        print("Fichiers placeholder créés")

