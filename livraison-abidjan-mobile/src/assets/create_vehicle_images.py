
from PIL import Image, ImageDraw, ImageFont
import os

def create_vehicle_images():
    # Couleurs
    primary_color = "#FF4D4D"
    secondary_color = "#FFF5F5"
    text_color = "#1A1A1A"
    accent_color = "#34C759"
    white = "#FFFFFF"
    gray = "#888888"
    
    # Dimensions des images
    width, height = 200, 150
    
    # Créer le dossier vehicles s'il n'existe pas
    os.makedirs("vehicles", exist_ok=True)
    
    # 1. Motorcycle
    moto = Image.new('RGB', (width, height), secondary_color)
    draw_moto = ImageDraw.Draw(moto)
    
    # Corps de la moto
    draw_moto.rectangle([50, 70, 150, 90], fill=primary_color)
    # Selle
    draw_moto.ellipse([60, 50, 100, 70], fill=text_color)
    # Guidon
    draw_moto.line([70, 50, 70, 30], fill=text_color, width=3)
    draw_moto.line([60, 30, 80, 30], fill=text_color, width=3)
    # Roues
    draw_moto.ellipse([30, 80, 70, 120], fill=text_color)
    draw_moto.ellipse([130, 80, 170, 120], fill=text_color)
    # Rayons
    draw_moto.ellipse([35, 85, 65, 115], fill=white)
    draw_moto.ellipse([135, 85, 165, 115], fill=white)
    
    moto.save("vehicles/motorcycle.png")
    
    # 2. Scooter
    scooter = Image.new('RGB', (width, height), secondary_color)
    draw_scooter = ImageDraw.Draw(scooter)
    
    # Corps plus petit
    draw_scooter.rectangle([60, 75, 140, 85], fill=accent_color)
    # Plateforme
    draw_scooter.rectangle([70, 85, 130, 95], fill=gray)
    # Guidon
    draw_scooter.line([75, 75, 75, 55], fill=text_color, width=3)
    draw_scooter.line([65, 55, 85, 55], fill=text_color, width=3)
    # Roues plus petites
    draw_scooter.ellipse([40, 85, 75, 120], fill=text_color)
    draw_scooter.ellipse([125, 85, 160, 120], fill=text_color)
    
    scooter.save("vehicles/scooter.png")
    
    # 3. Bicycle
    bicycle = Image.new('RGB', (width, height), secondary_color)
    draw_bicycle = ImageDraw.Draw(bicycle)
    
    # Cadre
    draw_bicycle.line([50, 100, 100, 60], fill=text_color, width=4)
    draw_bicycle.line([100, 60, 150, 100], fill=text_color, width=4)
    draw_bicycle.line([50, 100, 150, 100], fill=text_color, width=4)
    # Guidon
    draw_bicycle.line([100, 60, 100, 40], fill=text_color, width=3)
    draw_bicycle.line([90, 40, 110, 40], fill=text_color, width=3)
    # Selle
    draw_bicycle.line([125, 80, 125, 60], fill=text_color, width=3)
    draw_bicycle.line([120, 60, 130, 60], fill=text_color, width=4)
    # Roues
    draw_bicycle.ellipse([30, 80, 70, 120], fill=text_color)
    draw_bicycle.ellipse([130, 80, 170, 120], fill=text_color)
    # Rayons
    for i in range(4):
        angle = i * 45
        draw_bicycle.line([50, 100, 50, 100], fill=white, width=1)
    
    bicycle.save("vehicles/bicycle.png")
    
    # 4. Van
    van = Image.new('RGB', (width, height), secondary_color)
    draw_van = ImageDraw.Draw(van)
    
    # Corps principal
    draw_van.rectangle([30, 60, 170, 110], fill=primary_color)
    # Cabine
    draw_van.rectangle([30, 40, 80, 60], fill=primary_color)
    # Pare-brise
    draw_van.polygon([(35, 45), (75, 45), (70, 55), (40, 55)], fill=white)
    # Roues
    draw_van.ellipse([40, 100, 70, 130], fill=text_color)
    draw_van.ellipse([130, 100, 160, 130], fill=text_color)
    # Portes
    draw_van.line([100, 65, 100, 105], fill=white, width=2)
    draw_van.line([130, 65, 130, 105], fill=white, width=2)
    
    van.save("vehicles/van.png")
    
    # 5. Pickup
    pickup = Image.new('RGB', (width, height), secondary_color)
    draw_pickup = ImageDraw.Draw(pickup)
    
    # Cabine
    draw_pickup.rectangle([30, 50, 90, 100], fill=primary_color)
    # Benne
    draw_pickup.rectangle([90, 60, 160, 100], fill=gray)
    # Pare-brise
    draw_pickup.polygon([(35, 55), (85, 55), (80, 70), (40, 70)], fill=white)
    # Roues
    draw_pickup.ellipse([40, 90, 70, 120], fill=text_color)
    draw_pickup.ellipse([130, 90, 160, 120], fill=text_color)
    
    pickup.save("vehicles/pickup.png")
    
    # 6. Moving Truck
    truck = Image.new('RGB', (width, height), secondary_color)
    draw_truck = ImageDraw.Draw(truck)
    
    # Corps principal plus grand
    draw_truck.rectangle([20, 50, 180, 110], fill=accent_color)
    # Cabine
    draw_truck.rectangle([20, 30, 70, 50], fill=accent_color)
    # Pare-brise
    draw_truck.polygon([(25, 35), (65, 35), (60, 45), (30, 45)], fill=white)
    # Roues
    draw_truck.ellipse([30, 100, 60, 130], fill=text_color)
    draw_truck.ellipse([100, 100, 130, 130], fill=text_color)
    draw_truck.ellipse([150, 100, 180, 130], fill=text_color)
    
    truck.save("vehicles/moving-truck.png")
    
    # 7. Kia Truck (spécialement pour l'Afrique)
    kia = Image.new('RGB', (width, height), secondary_color)
    draw_kia = ImageDraw.Draw(kia)
    
    # Corps du camion
    draw_kia.rectangle([25, 55, 175, 105], fill="#0066CC")  # Bleu Kia
    # Cabine
    draw_kia.rectangle([25, 35, 75, 55], fill="#0066CC")
    # Pare-brise
    draw_kia.polygon([(30, 40), (70, 40), (65, 50), (35, 50)], fill=white)
    # Barre de toit
    draw_kia.rectangle([80, 45, 170, 55], fill=gray)
    # Roues
    draw_kia.ellipse([35, 95, 65, 125], fill=text_color)
    draw_kia.ellipse([145, 95, 175, 125], fill=text_color)
    # Logo "K"
    try:
        font = ImageFont.truetype("arial.ttf", 16)
    except:
        font = ImageFont.load_default()
    draw_kia.text((125, 75), "KIA", fill=white, font=font)
    
    kia.save("vehicles/kia-truck.png")
    
    print("Images de véhicules créées avec succès !")

if __name__ == "__main__":
    create_vehicle_images()
