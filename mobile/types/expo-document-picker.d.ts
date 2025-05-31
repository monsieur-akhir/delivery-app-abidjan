declare module 'expo-document-picker' {
  export type DocumentPickerResult = {
    type: 'success' | 'cancel';
    uri?: string;
    name?: string;
    size?: number;
    mimeType?: string;
    lastModified?: number;
    file?: File;
    output?: FileList;
    assets?: DocumentPickerAsset[];
    canceled?: boolean;
  };

  export type DocumentPickerAsset = {
    uri: string;
    name?: string;
    size?: number;
    mimeType?: string;
    lastModified?: number;
  };

  export type DocumentPickerOptions = {
    type?: string | string[];
    copyToCacheDirectory?: boolean;
    multiple?: boolean;
  };

  export function getDocumentAsync(options?: DocumentPickerOptions): Promise<DocumentPickerResult>;
}
