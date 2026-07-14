export interface ObjectStorageUploadInput {
  bucket: string;
  path: string;
  body: Buffer;
  contentType: string;
  upsert?: boolean;
}

export abstract class ObjectStoragePort {
  abstract upload(input: ObjectStorageUploadInput): Promise<void>;
  abstract createSignedUrl(
    bucket: string,
    path: string,
    expiresInSeconds: number,
  ): Promise<string>;
}

export const OBJECT_STORAGE = Symbol('OBJECT_STORAGE');
