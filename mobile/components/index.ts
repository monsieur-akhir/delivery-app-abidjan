// components/index.ts - Barrel exports

// Import and re-export MapView component and types
import CustomMapView from './MapView'
import type { Coordinates, Route, TrafficInfo, MapPoint, MapViewProps } from './MapView'

export { CustomMapView }
export type { Coordinates, Route, TrafficInfo, MapPoint, MapViewProps }

// Export other components that might be needed
export { default as WeatherInfo } from './WeatherInfo'
export { default as EnhancedMap } from './EnhancedMap'
export { default as EnhancedWeatherInfo } from './EnhancedWeatherInfo'
export { default as FeatherIcon } from './FeatherIcon'
