// Module augmentation for react-native-maps to support children on MapView, Marker, and Callout
import type React from "react";

declare module 'react-native-maps' {
  interface MapViewProps {
    children?: React.ReactNode;
  }
  interface MarkerProps {
    children?: React.ReactNode;
    tracksViewChanges?: boolean;
  }
  interface CalloutProps {
    children?: React.ReactNode;
    tooltip?: boolean;
  }
}
