
from PIL import Image, ImageDraw, ImageFont
import os

def create_logo_and_icon():
    # Couleurs de l'entreprise
    primary_color = "#FF4D4D"
    secondary_color = "#FFF5F5"
    text_color = "#1A1A1A"
    accent_color = "#34C759"
    white = "#FFFFFF"
    
    # Créer le logo principal (512x512)
    logo_size = 512
    logo = Image.new('RGBA', (logo_size, logo_size), (255, 255, 255, 0))
    draw_logo = ImageDraw.Draw(logo)
    
    # Fond circulaire
    margin = 40
    draw_logo.ellipse([margin, margin, logo_size-margin, logo_size-margin], fill=primary_color)
    
    # Camion stylisé au centre
    truck_color = white
    center_x, center_y = logo_size//2, logo_size//2
    
    # Corps du camion
    truck_width = 200
    truck_height = 80
    truck_x = center_x - truck_width//2
    truck_y = center_y - truck_height//2
    
    # Cabine
    draw_logo.rectangle([truck_x, truck_y, truck_x+60, truck_y+truck_height], fill=truck_color)
    # Benne
    draw_logo.rectangle([truck_x+70, truck_y+10, truck_x+truck_width, truck_y+truck_height], fill=truck_color)
    
    # Roues
    wheel_radius = 25
    draw_logo.ellipse([truck_x+20-wheel_radius, truck_y+truck_height-10, truck_x+20+wheel_radius, truck_y+truck_height+40], fill=text_color)
    draw_logo.ellipse([truck_x+truck_width-30-wheel_radius, truck_y+truck_height-10, truck_x+truck_width-30+wheel_radius, truck_y+truck_height+40], fill=text_color)
    
    # Lignes de mouvement
    for i in range(3):
        y = center_y - 30 + i * 20
        draw_logo.line([truck_x-60, y, truck_x-20, y], fill=accent_color, width=4)
    
    # Texte sous le camion
    try:
        font_large = ImageFont.truetype("arial.ttf", 48)
        font_small = ImageFont.truetype("arial.ttf", 32)
    except:
        font_large = ImageFont.load_default()
        font_small = ImageFont.load_default()
    
    # Nom de l'app
    text1 = "LIVRAISON"
    text2 = "ABIDJAN"
    
    # Calculer la position du texte
    bbox1 = draw_logo.textbbox((0, 0), text1, font=font_large)
    bbox2 = draw_logo.textbbox((0, 0), text2, font=font_small)
    
    text1_width = bbox1[2] - bbox1[0]
    text2_width = bbox2[2] - bbox2[0]
    
    text1_x = (logo_size - text1_width) // 2
    text2_x = (logo_size - text2_width) // 2
    
    text_y = center_y + 100
    
    draw_logo.text((text1_x, text_y), text1, fill=white, font=font_large)
    draw_logo.text((text2_x, text_y + 50), text2, fill=white, font=font_small)
    
    logo.save("logo-new.png")
    
    # Créer l'icône (192x192)
    icon_size = 192
    icon = Image.new('RGBA', (icon_size, icon_size), (255, 255, 255, 0))
    draw_icon = ImageDraw.Draw(icon)
    
    # Redimensionner le design pour l'icône
    margin_icon = 15
    draw_icon.ellipse([margin_icon, margin_icon, icon_size-margin_icon, icon_size-margin_icon], fill=primary_color)
    
    # Camion plus petit
    center_x_icon, center_y_icon = icon_size//2, icon_size//2
    truck_width_icon = 80
    truck_height_icon = 30
    truck_x_icon = center_x_icon - truck_width_icon//2
    truck_y_icon = center_y_icon - truck_height_icon//2
    
    # Corps du camion
    draw_icon.rectangle([truck_x_icon, truck_y_icon, truck_x_icon+25, truck_y_icon+truck_height_icon], fill=white)
    draw_icon.rectangle([truck_x_icon+30, truck_y_icon+5, truck_x_icon+truck_width_icon, truck_y_icon+truck_height_icon], fill=white)
    
    # Roues
    wheel_radius_icon = 8
    draw_icon.ellipse([truck_x_icon+8-wheel_radius_icon, truck_y_icon+truck_height_icon-5, truck_x_icon+8+wheel_radius_icon, truck_y_icon+truck_height_icon+11], fill=text_color)
    draw_icon.ellipse([truck_x_icon+truck_width_icon-12-wheel_radius_icon, truck_y_icon+truck_height_icon-5, truck_x_icon+truck_width_icon-12+wheel_radius_icon, truck_y_icon+truck_height_icon+11], fill=text_color)
    
    # Lignes de mouvement plus petites
    for i in range(2):
        y = center_y_icon - 10 + i * 10
        draw_icon.line([truck_x_icon-20, y, truck_x_icon-10, y], fill=accent_color, width=2)
    
    icon.save("icon-new.png")
    
    print("Logo et icône créés avec succès !")
    print("- logo-new.png (512x512)")
    print("- icon-new.png (192x192)")

if __name__ == "__main__":
    create_logo_and_icon()
