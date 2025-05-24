"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Home,
  Package,
  ShoppingBag,
  User,
  MapPin,
  Clock,
  Star,
  Phone,
  MessageCircle,
  Navigation,
  Truck,
  DollarSign,
  Cloud,
  Sun,
  CloudRain,
} from "lucide-react"

// Types simulés
interface Delivery {
  id: string
  title: string
  pickup: string
  destination: string
  status: "pending" | "accepted" | "in_progress" | "delivered"
  price: number
  distance: string
  estimatedTime: string
}

interface Courier {
  id: string
  name: string
  rating: number
  vehicle: string
  phone: string
  avatar: string
}

interface WeatherData {
  temperature: number
  condition: string
  humidity: number
  windSpeed: number
}

export default function DeliveryAppDemo() {
  const [activeTab, setActiveTab] = useState("home")
  const [userType, setUserType] = useState<"client" | "courier">("client")
  const [deliveries, setDeliveries] = useState<Delivery[]>([
    {
      id: "1",
      title: "Livraison de documents",
      pickup: "Plateau, Abidjan",
      destination: "Cocody, Abidjan",
      status: "pending",
      price: 2500,
      distance: "8.5 km",
      estimatedTime: "25 min",
    },
    {
      id: "2",
      title: "Colis fragile",
      pickup: "Marcory, Abidjan",
      destination: "Yopougon, Abidjan",
      status: "in_progress",
      price: 3500,
      distance: "12 km",
      estimatedTime: "35 min",
    },
  ])

  const [weather, setWeather] = useState<WeatherData>({
    temperature: 28,
    condition: "sunny",
    humidity: 75,
    windSpeed: 12,
  })

  const [newDelivery, setNewDelivery] = useState({
    title: "",
    pickup: "",
    destination: "",
    description: "",
  })

  const couriers: Courier[] = [
    {
      id: "1",
      name: "Kouassi Jean",
      rating: 4.8,
      vehicle: "Moto",
      phone: "+225 07 12 34 56 78",
      avatar: "/courier-profile.png",
    },
    {
      id: "2",
      name: "Aya Marie",
      rating: 4.9,
      vehicle: "Voiture",
      phone: "+225 05 98 76 54 32",
      avatar: "/placeholder.svg?height=40&width=40&query=female+courier",
    },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500"
      case "accepted":
        return "bg-blue-500"
      case "in_progress":
        return "bg-orange-500"
      case "delivered":
        return "bg-green-500"
      default:
        return "bg-gray-500"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "En attente"
      case "accepted":
        return "Acceptée"
      case "in_progress":
        return "En cours"
      case "delivered":
        return "Livrée"
      default:
        return "Inconnu"
    }
  }

  const getWeatherIcon = (condition: string) => {
    switch (condition) {
      case "sunny":
        return <Sun className="h-6 w-6 text-yellow-500" />
      case "cloudy":
        return <Cloud className="h-6 w-6 text-gray-500" />
      case "rainy":
        return <CloudRain className="h-6 w-6 text-blue-500" />
      default:
        return <Sun className="h-6 w-6 text-yellow-500" />
    }
  }

  const createDelivery = () => {
    if (newDelivery.title && newDelivery.pickup && newDelivery.destination) {
      const delivery: Delivery = {
        id: Date.now().toString(),
        title: newDelivery.title,
        pickup: newDelivery.pickup,
        destination: newDelivery.destination,
        status: "pending",
        price: Math.floor(Math.random() * 3000) + 1500,
        distance: `${(Math.random() * 15 + 2).toFixed(1)} km`,
        estimatedTime: `${Math.floor(Math.random() * 30 + 15)} min`,
      }
      setDeliveries([...deliveries, delivery])
      setNewDelivery({ title: "", pickup: "", destination: "", description: "" })
      setActiveTab("deliveries")
    }
  }

  const acceptDelivery = (deliveryId: string) => {
    setDeliveries(deliveries.map((d) => (d.id === deliveryId ? { ...d, status: "accepted" as const } : d)))
  }

  const startDelivery = (deliveryId: string) => {
    setDeliveries(deliveries.map((d) => (d.id === deliveryId ? { ...d, status: "in_progress" as const } : d)))
  }

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen">
      {/* Header */}
      <div className="bg-orange-500 text-white p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Livraison Abidjan</h1>
          <div className="flex items-center space-x-2">
            <Button
              variant={userType === "client" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setUserType("client")}
              className="text-xs"
            >
              Client
            </Button>
            <Button
              variant={userType === "courier" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setUserType("courier")}
              className="text-xs"
            >
              Coursier
            </Button>
          </div>
        </div>

        {/* Weather Info */}
        <div className="mt-3 flex items-center justify-between bg-orange-600 rounded-lg p-2">
          <div className="flex items-center space-x-2">
            {getWeatherIcon(weather.condition)}
            <span className="text-sm">{weather.temperature}°C</span>
          </div>
          <div className="text-xs">
            Humidité: {weather.humidity}% | Vent: {weather.windSpeed} km/h
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="home" className="flex flex-col items-center p-2">
              <Home className="h-4 w-4" />
              <span className="text-xs mt-1">Accueil</span>
            </TabsTrigger>
            <TabsTrigger value="deliveries" className="flex flex-col items-center p-2">
              <Package className="h-4 w-4" />
              <span className="text-xs mt-1">Livraisons</span>
            </TabsTrigger>
            <TabsTrigger value="marketplace" className="flex flex-col items-center p-2">
              <ShoppingBag className="h-4 w-4" />
              <span className="text-xs mt-1">Marché</span>
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex flex-col items-center p-2">
              <User className="h-4 w-4" />
              <span className="text-xs mt-1">Profil</span>
            </TabsTrigger>
          </TabsList>

          {/* Home Tab */}
          <TabsContent value="home" className="mt-4">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {userType === "client" ? "Bienvenue Client!" : "Bienvenue Coursier!"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <Package className="h-8 w-8 mx-auto text-blue-500 mb-2" />
                      <div className="text-2xl font-bold text-blue-600">{deliveries.length}</div>
                      <div className="text-sm text-gray-600">Livraisons</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <DollarSign className="h-8 w-8 mx-auto text-green-500 mb-2" />
                      <div className="text-2xl font-bold text-green-600">
                        {deliveries.reduce((sum, d) => sum + d.price, 0).toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-600">FCFA</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {userType === "client" && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Créer une livraison</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Input
                      placeholder="Titre de la livraison"
                      value={newDelivery.title}
                      onChange={(e) => setNewDelivery({ ...newDelivery, title: e.target.value })}
                    />
                    <Input
                      placeholder="Adresse de récupération"
                      value={newDelivery.pickup}
                      onChange={(e) => setNewDelivery({ ...newDelivery, pickup: e.target.value })}
                    />
                    <Input
                      placeholder="Adresse de livraison"
                      value={newDelivery.destination}
                      onChange={(e) => setNewDelivery({ ...newDelivery, destination: e.target.value })}
                    />
                    <Textarea
                      placeholder="Description (optionnel)"
                      value={newDelivery.description}
                      onChange={(e) => setNewDelivery({ ...newDelivery, description: e.target.value })}
                    />
                    <Button onClick={createDelivery} className="w-full bg-orange-500 hover:bg-orange-600">
                      Créer la livraison
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Deliveries Tab */}
          <TabsContent value="deliveries" className="mt-4">
            <div className="space-y-4">
              {deliveries.map((delivery) => (
                <Card key={delivery.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{delivery.title}</h3>
                        <Badge className={`${getStatusColor(delivery.status)} text-white text-xs`}>
                          {getStatusText(delivery.status)}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-green-600">{delivery.price.toLocaleString()} FCFA</div>
                        <div className="text-sm text-gray-500">{delivery.distance}</div>
                      </div>
                    </div>

                    <div className="space-y-2 mb-3">
                      <div className="flex items-center space-x-2 text-sm">
                        <MapPin className="h-4 w-4 text-green-500" />
                        <span className="text-gray-600">De: {delivery.pickup}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm">
                        <Navigation className="h-4 w-4 text-red-500" />
                        <span className="text-gray-600">À: {delivery.destination}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm">
                        <Clock className="h-4 w-4 text-blue-500" />
                        <span className="text-gray-600">Temps estimé: {delivery.estimatedTime}</span>
                      </div>
                    </div>

                    {userType === "courier" && delivery.status === "pending" && (
                      <Button
                        onClick={() => acceptDelivery(delivery.id)}
                        className="w-full bg-green-500 hover:bg-green-600"
                      >
                        Accepter la livraison
                      </Button>
                    )}

                    {userType === "courier" && delivery.status === "accepted" && (
                      <Button
                        onClick={() => startDelivery(delivery.id)}
                        className="w-full bg-blue-500 hover:bg-blue-600"
                      >
                        Commencer la livraison
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Marketplace Tab */}
          <TabsContent value="marketplace" className="mt-4">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Coursiers disponibles</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {couriers.map((courier) => (
                      <div key={courier.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                        <img
                          src={courier.avatar || "/placeholder.svg"}
                          alt={courier.name}
                          className="w-12 h-12 rounded-full"
                        />
                        <div className="flex-1">
                          <div className="font-semibold">{courier.name}</div>
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <Truck className="h-4 w-4" />
                            <span>{courier.vehicle}</span>
                            <Star className="h-4 w-4 text-yellow-500" />
                            <span>{courier.rating}</span>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button size="sm" variant="outline">
                            <Phone className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <MessageCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile" className="mt-4">
            <div className="space-y-4">
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <img
                      src="/placeholder.svg?height=80&width=80&query=user+profile"
                      alt="Profile"
                      className="w-20 h-20 rounded-full mx-auto mb-4"
                    />
                    <h2 className="text-xl font-bold">
                      {userType === "client" ? "Utilisateur Client" : "Coursier Pro"}
                    </h2>
                    <p className="text-gray-600">+225 07 12 34 56 78</p>
                    <div className="flex items-center justify-center space-x-1 mt-2">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <span className="font-semibold">4.8</span>
                      <span className="text-gray-600">(127 avis)</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Statistiques</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{userType === "client" ? "23" : "156"}</div>
                      <div className="text-sm text-gray-600">
                        {userType === "client" ? "Livraisons créées" : "Livraisons effectuées"}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{userType === "client" ? "98%" : "99%"}</div>
                      <div className="text-sm text-gray-600">Taux de satisfaction</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
