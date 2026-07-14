/** Minimal shape of an in-memory multipart upload (multer memoryStorage). */
export type UploadedFilePayload = {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
};
