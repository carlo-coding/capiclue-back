import { Module } from '@nestjs/common';
import { ImageService } from './image.service';
import { ImageController } from './image.controller';
import { MulterModule } from '@nestjs/platform-express/multer';
import * as multer from 'multer';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Image } from './image.entity';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
@Module({
  imports: [
    TypeOrmModule.forFeature([Image]),
    MulterModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        dest: `./${configService.get<string>('IMAGES_PATH')}`,
        storage: multer.diskStorage({
          destination: `./${configService.get<string>('IMAGES_PATH')}`,
          filename: (req, file, cb) => {
            const id = crypto.randomBytes(16).toString('hex');
            file.originalname = `${id}-${file.originalname}`;
            cb(null, file.originalname);
          },
        }),
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [ImageService, ConfigService],
  controllers: [ImageController],
  exports: [ImageService],
})
export class ImageModule {}
