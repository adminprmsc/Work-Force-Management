export class MobileAppRelease {
  constructor(
    public readonly id: string,
    public readonly versionName: string,
    public readonly versionCode: number,
    public readonly fileName: string,
    public readonly mimeType: string,
    public readonly sizeBytes: number,
    public readonly bucket: string,
    public readonly storagePath: string,
    public readonly releaseNotes: string | null,
    public readonly isLatest: boolean,
    public readonly uploadedById: string,
    public readonly createdAt: Date,
  ) {}
}
