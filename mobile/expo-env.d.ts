import type React from "react"
/// <reference types="expo" />
/// <reference types="react-native" />

// Ajoutez des déclarations de types personnalisés ici
declare module "*.svg" {
  import type { SvgProps } from "react-native-svg"
  const content: React.FC<SvgProps>
  export default content
}

declare module "*.png" {
  const value: any
  export default value
}

declare module "*.jpg" {
  const value: any
  export default value
}

declare module "*.json" {
  const value: any
  export default value
}

// Déclarations pour les modules qui n'ont pas de types
declare module "react-native-maps" {
  import { Component } from "react"
  import type { ViewProps } from "react-native"

  export interface Region {
    latitude: number
    longitude: number
    latitudeDelta: number
    longitudeDelta: number
  }

  export interface LatLng {
    latitude: number
    longitude: number
  }

  export interface MapViewProps extends ViewProps {
    provider?: "google" | undefined
    region?: Region
    initialRegion?: Region
    onRegionChange?: (region: Region) => void
    onRegionChangeComplete?: (region: Region) => void
    onPress?: (event: any) => void
    onLongPress?: (event: any) => void
    showsUserLocation?: boolean
    showsMyLocationButton?: boolean
    showsTraffic?: boolean
    zoomEnabled?: boolean
    rotateEnabled?: boolean
    scrollEnabled?: boolean
    pitchEnabled?: boolean
    toolbarEnabled?: boolean
    showsCompass?: boolean
    showsScale?: boolean
    loadingEnabled?: boolean
    mapType?: "standard" | "satellite" | "hybrid" | "terrain" | "none"
    style?: any
    customMapStyle?: any[]
    compassOffset?: { x: number; y: number }
    liteMode?: boolean
    mapPadding?: { top: number; right: number; bottom: number; left: number }
    maxDelta?: number
    minDelta?: number
    legalLabelInsets?: { top: number; right: number; bottom: number; left: number }
  }

  export interface MarkerProps {
    coordinate: LatLng
    title?: string
    description?: string
    image?: any
    pinColor?: string
    anchor?: { x: number; y: number }
    calloutAnchor?: { x: number; y: number }
    callout?: React.ReactNode
    draggable?: boolean
    flat?: boolean
    identifier?: string
    rotation?: number
    zIndex?: number
    tracksViewChanges?: boolean
    opacity?: number
    onPress?: () => void
    onCalloutPress?: () => void
    onDragStart?: () => void
    onDrag?: () => void
    onDragEnd?: () => void
    stopPropagation?: boolean
  }

  export interface PolylineProps {
    coordinates: LatLng[]
    strokeWidth?: number
    strokeColor?: string
    lineDashPattern?: number[]
    lineCap?: "butt" | "round" | "square"
    lineJoin?: "miter" | "round" | "bevel"
    miterLimit?: number
    geodesic?: boolean
    lineDashPhase?: number
    zIndex?: number
    tappable?: boolean
    onPress?: () => void
  }

  export interface CalloutProps {
    tooltip?: boolean
    onPress?: () => void
  }

  export class Marker extends Component<MarkerProps> {}
  export class Polyline extends Component<PolylineProps> {}
  export class Callout extends Component<CalloutProps> {}

  export default class MapView extends Component<MapViewProps> {
    static Marker: typeof Marker
    static Polyline: typeof Polyline
    static Callout: typeof Callout

    animateToRegion(region: Region, duration?: number): void
    animateToCoordinate(coordinate: LatLng, duration?: number): void
    fitToElements(animated: boolean): void
    fitToSuppliedMarkers(markerIDs: string[], animated: boolean): void
    fitToCoordinates(
      coordinates: LatLng[],
      options?: { edgePadding?: { top: number; right: number; bottom: number; left: number }; animated?: boolean },
    ): void
  }
}
