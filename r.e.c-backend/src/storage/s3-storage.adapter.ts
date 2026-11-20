/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Injectable } from '@nestjs/common';
import { StorageAdapter, StorageObject } from './storage.interface';

/**
 * Adaptador S3-compatible (Cloudflare R2, AWS S3, etc.).
 * Se activa con STORAGE_PROVIDER=s3 y requiere @aws-sdk/client-s3 instalado
 * (dependencia opcional, no incluida por defecto para mantener free-tier liviano).
 */
@Injectable()
export class S3StorageAdapter implements StorageAdapter {
  readonly name = 's3';

  private client: any;
  private bucket: string;

  constructor() {
    this.bucket = process.env.S3_BUCKET || '';
    // Lazy require to avoid hard dependency

    const { S3Client } = require('@aws-sdk/client-s3');
    this.client = new S3Client({
      region: process.env.S3_REGION || 'auto',
      endpoint: process.env.S3_ENDPOINT,
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
      },
      forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
    });
  }

  async put(object: StorageObject): Promise<string> {
    const { PutObjectCommand } = require('@aws-sdk/client-s3');
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: object.key,
        Body: object.buffer,
        ContentType: object.mimeType,
      }),
    );
    return object.key;
  }

  async get(key: string): Promise<Buffer> {
    const { GetObjectCommand } = require('@aws-sdk/client-s3');
    const res = await this.client.send(
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
    );
    const chunks: Buffer[] = [];
    for await (const chunk of res.Body) chunks.push(Buffer.from(chunk));
    return Buffer.concat(chunks);
  }

  async delete(key: string): Promise<void> {
    const { DeleteObjectCommand } = require('@aws-sdk/client-s3');
    await this.client.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
    );
  }
}
