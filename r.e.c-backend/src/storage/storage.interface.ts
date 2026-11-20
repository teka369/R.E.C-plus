export interface StorageObject {
  key: string;
  buffer: Buffer;
  mimeType?: string;
}

export interface StorageAdapter {
  readonly name: string;
  put(object: StorageObject): Promise<string>; // returns storage key
  get(key: string): Promise<Buffer>;
  delete(key: string): Promise<void>;
  getSignedUrl?(key: string, ttlSeconds: number): Promise<string>;
}
