// This file provides type declarations for the react-i18next library
import 'react-i18next';

declare module 'react-i18next' {
  // Define your custom translation type structure here
  export interface CustomTypeOptions {
    resources: {
      common: {
        back: string;
        cancel: string;
        // Add other common keys as needed
      };
      rateDelivery: {
        title: string;
        loading: string;
        alreadyRated: string;
        alreadyRatedMessage: string;
        errorLoadingDelivery: string;
        permissionDenied: string;
        microphonePermissionRequired: string;
        recordingError: string;
        couldNotStartRecording: string;
        couldNotStopRecording: string;
        offlineMode: string;
        cannotTranscribeOffline: string;
        errorDeliveryNotFound: string;
        thankYou: string;
        ratingSubmitted: string;
        offlineRatingSubmitted: string;
        errorSubmittingRating: string;
        skipRating: string;
        skipRatingMessage: string;
        deliveryNotFound: string;
        // Add other rating keys as needed
      };
      // Add other namespaces as needed
    };
  }
}
