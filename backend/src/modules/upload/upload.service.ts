import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import { UploadApiResponse } from 'cloudinary';
import * as fs from 'fs';
import * as path from 'path';
import { randomUUID } from 'crypto';

@Injectable()
export class UploadService {
  private readonly useCloudinary: boolean;
  private readonly uploadsDir: string;

  constructor(private readonly configService: ConfigService) {
    const cloudName = this.configService.get('CLOUDINARY_CLOUD_NAME');
    this.useCloudinary = !!cloudName && cloudName.trim() !== '';
    this.uploadsDir = path.join(process.cwd(), 'uploads');

    // Criar diretório de uploads se não existir (para fallback local)
    if (!this.useCloudinary && !fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
    }
  }

  async uploadImage(file: Express.Multer.File): Promise<{ url: string }> {
    if (!file) {
      throw new BadRequestException('Nenhum arquivo enviado');
    }

    if (this.useCloudinary) {
      return this.uploadToCloudinary(file);
    } else {
      return this.uploadToLocal(file);
    }
  }

  private async uploadToCloudinary(file: Express.Multer.File): Promise<{ url: string }> {
    return new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: 'auto-os',
            resource_type: 'image',
            transformation: [
              { width: 1200, height: 1200, crop: 'limit' },
              { quality: 'auto' },
            ],
          },
          (error, result: UploadApiResponse) => {
            if (error) {
              reject(new BadRequestException('Erro no upload da imagem'));
            } else {
              resolve({ url: result.secure_url });
            }
          },
        )
        .end(file.buffer);
    });
  }

  private async uploadToLocal(file: Express.Multer.File): Promise<{ url: string }> {
    const ext = path.extname(file.originalname) || '.jpg';
    const filename = `${randomUUID()}${ext}`;
    const filepath = path.join(this.uploadsDir, filename);

    await fs.promises.writeFile(filepath, file.buffer);

    const baseUrl = this.configService.get('API_URL', 'http://localhost:3000');
    return { url: `${baseUrl}/uploads/${filename}` };
  }

  async deleteImage(publicIdOrUrl: string): Promise<void> {
    if (this.useCloudinary) {
      await cloudinary.uploader.destroy(publicIdOrUrl);
    } else {
      // Para uploads locais, extrair o nome do arquivo da URL
      const filename = publicIdOrUrl.split('/').pop();
      if (filename) {
        const filepath = path.join(this.uploadsDir, filename);
        if (fs.existsSync(filepath)) {
          await fs.promises.unlink(filepath);
        }
      }
    }
  }
}
