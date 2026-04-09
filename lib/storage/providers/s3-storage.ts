import "server-only";

import {
  CopyObjectCommand,
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

import { env } from "@/lib/env";
import { AppError } from "@/lib/utils/errors";

import type { SaveBufferInput, StorageAdapter } from "@/lib/storage/storage-adapter";

export class S3StorageAdapter implements StorageAdapter {
  private client: S3Client;

  constructor() {
    if (
      !env.S3_BUCKET ||
      !env.S3_REGION ||
      !env.S3_ACCESS_KEY_ID ||
      !env.S3_SECRET_ACCESS_KEY
    ) {
      throw new AppError("S3 storage is selected but S3 environment variables are incomplete.", 500);
    }

    this.client = new S3Client({
      region: env.S3_REGION,
      endpoint: env.S3_ENDPOINT,
      credentials: {
        accessKeyId: env.S3_ACCESS_KEY_ID,
        secretAccessKey: env.S3_SECRET_ACCESS_KEY,
      },
      forcePathStyle: Boolean(env.S3_ENDPOINT),
    });
  }

  getPublicUrl(storageKey: string) {
    if (env.S3_ENDPOINT) {
      return `${env.S3_ENDPOINT.replace(/\/$/, "")}/${env.S3_BUCKET}/${storageKey}`;
    }

    return `https://${env.S3_BUCKET}.s3.${env.S3_REGION}.amazonaws.com/${storageKey}`;
  }

  async saveBuffer(input: SaveBufferInput) {
    await this.client.send(
      new PutObjectCommand({
        Bucket: env.S3_BUCKET,
        Key: input.storageKey,
        Body: input.buffer,
        ContentType: input.contentType,
      }),
    );

    return {
      storageKey: input.storageKey,
      publicUrl: this.getPublicUrl(input.storageKey),
    };
  }

  async copyObject(sourceKey: string, destinationKey: string) {
    await this.client.send(
      new CopyObjectCommand({
        Bucket: env.S3_BUCKET,
        CopySource: `${env.S3_BUCKET}/${sourceKey}`,
        Key: destinationKey,
      }),
    );

    return {
      storageKey: destinationKey,
      publicUrl: this.getPublicUrl(destinationKey),
    };
  }

  async deleteObject(storageKey: string) {
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: env.S3_BUCKET,
        Key: storageKey,
      }),
    );
  }
}
