import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';

const ROOT = 'mobile-releases';

@Injectable()
export class MobileAppPathService {
  buildPath(input: { versionCode: number; fileName: string }): string {
    const ext = this.extensionFromFileName(input.fileName);
    return `${ROOT}/${input.versionCode}/${randomUUID()}.${ext}`;
  }

  private extensionFromFileName(fileName: string): string {
    const idx = fileName.lastIndexOf('.');
    if (idx <= 0) return 'apk';
    const ext = fileName
      .slice(idx + 1)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');
    return ext.length > 0 ? ext : 'apk';
  }
}
