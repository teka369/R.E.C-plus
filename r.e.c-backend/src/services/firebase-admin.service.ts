import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class FirebaseAdminService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseAdminService.name);
  private app: admin.app.App | null = null;

  onModuleInit() {
    try {
      const serviceAccountPath = path.join(
        process.cwd(),
        'firebase-service-account.json',
      );
      if (!fs.existsSync(serviceAccountPath)) {
        this.logger.warn(
          'firebase-service-account.json no encontrado — push notifications desactivadas',
        );
        return;
      }
      const serviceAccount = JSON.parse(
        fs.readFileSync(serviceAccountPath, 'utf-8'),
      ) as admin.ServiceAccount;
      if (admin.apps.length === 0) {
        this.app = admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
      } else {
        this.app = admin.app();
      }
      this.logger.log('Firebase Admin inicializado correctamente');
    } catch (err) {
      this.logger.error('Error inicializando Firebase Admin:', err);
    }
  }

  async sendToTokens(
    tokens: string[],
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<void> {
    if (!this.app || tokens.length === 0) return;
    try {
      const messaging = admin.messaging(this.app);
      const chunks: string[][] = [];
      for (let i = 0; i < tokens.length; i += 500) {
        chunks.push(tokens.slice(i, i + 500));
      }
      await Promise.all(
        chunks.map((chunk) =>
          messaging.sendEachForMulticast({
            tokens: chunk,
            notification: { title, body },
            data: data ?? {},
            android: {
              priority: 'high',
              notification: {
                channelId: 'recedu-default',
                sound: 'default',
                color: '#32a656',
              },
            },
          }),
        ),
      );
    } catch (err) {
      this.logger.error('Error enviando push notifications:', err);
    }
  }
}
