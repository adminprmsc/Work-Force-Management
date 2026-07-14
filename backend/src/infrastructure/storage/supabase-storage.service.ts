import {
  Injectable,
  ServiceUnavailableException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  ObjectStoragePort,
  ObjectStorageUploadInput,
} from '../../application/ports/object-storage.port';

@Injectable()
export class SupabaseStorageService implements ObjectStoragePort {
  private readonly client: SupabaseClient | null;

  constructor(private readonly configService: ConfigService) {
    const url = this.configService.get<string>('supabase.url') ?? '';
    const secretKey =
      this.configService.get<string>('supabase.secretKey') ?? '';
    this.client =
      url.length > 0 && secretKey.length > 0
        ? createClient(url, secretKey, {
            auth: { persistSession: false, autoRefreshToken: false },
          })
        : null;
  }

  async upload(input: ObjectStorageUploadInput): Promise<void> {
    const client = this.requireClient();
    const { error } = await client.storage
      .from(input.bucket)
      .upload(input.path, input.body, {
        contentType: input.contentType,
        upsert: input.upsert ?? false,
      });

    if (error) {
      throw new UnprocessableEntityException(
        `File upload failed: ${error.message}`,
      );
    }
  }

  async createSignedUrl(
    bucket: string,
    path: string,
    expiresInSeconds: number,
  ): Promise<string> {
    const client = this.requireClient();
    const { data, error } = await client.storage
      .from(bucket)
      .createSignedUrl(path, expiresInSeconds);

    if (error || !data?.signedUrl) {
      throw new UnprocessableEntityException(
        error?.message ?? 'Could not create signed URL',
      );
    }

    return data.signedUrl;
  }

  private requireClient(): SupabaseClient {
    if (!this.client) {
      throw new ServiceUnavailableException(
        'Supabase storage is not configured',
      );
    }
    return this.client;
  }
}
