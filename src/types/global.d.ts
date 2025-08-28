// frontend/src/types/global.d.ts

// Opsi callback Snap sesuai dokumentasi
type SnapPayOptions = {
    onSuccess?(result?: any): void;
    onPending?(result?: any): void;
    onError?(error?: any): void;
    onClose?(): void;
  };
  
  declare global {
    interface Window {
      snap?: {
        pay(token: string, options?: SnapPayOptions): void;
      };
    }
  }
  
  export {}; // agar ini jadi module dan tidak bentrok
  