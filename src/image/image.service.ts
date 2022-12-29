import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { unlink } from 'fs';
import { join } from 'path';
import { Repository } from 'typeorm';
import { Image } from './image.entity';

@Injectable()
export class ImageService {
  constructor(
    @InjectRepository(Image) private imageRepository: Repository<Image>,
    private configService: ConfigService,
  ) {}

  private async deleteFile(filename: string) {
    const path = join(
      __dirname,
      '..',
      '..',
      this.configService.get<string>('IMAGES_PATH'),
      filename,
    );
    await unlink(path, (err) => {
      if (err)
        throw new HttpException(
          'Could not delete file',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
    });
  }

  private createUrlString(filename: string) {
    return `${this.configService.get<string>(
      'CURRENT_HOST',
    )}/${this.configService.get<string>('IMAGES_FOLDER')}/${filename}`;
  }

  async deleteImage(imageId: number) {
    const foundImage = await this.imageRepository.findOne({
      where: { id: imageId },
    });
    if (!foundImage)
      throw new HttpException('Image not found', HttpStatus.NOT_FOUND);
    await this.deleteFile(foundImage.originalName);
    return this.imageRepository.delete({ id: imageId });
  }

  async deleteImagesByPublicationId(publicationId: number) {
    if (!publicationId)
      throw new HttpException(
        'publicationId not provided for deleteImagesByPublicationId',
        HttpStatus.BAD_REQUEST,
      );
    const foundImages = await this.imageRepository.find({
      where: { publicationId },
    });
    await Promise.all(
      foundImages.map((image) => this.deleteFile(image.originalName)),
    );
    return this.imageRepository.delete({ publicationId });
  }

  async uploadPublicationImages(
    images: Array<Express.Multer.File>,
    publicationId: number,
    userId: number,
  ) {
    await this.deleteImagesByPublicationId(publicationId);
    const data = images.map((image) => ({
      originalName: image.originalname,
      urlString: this.createUrlString(image.originalname),
    }));
    if (!userId || !publicationId) {
      await Promise.all(data.map((item) => this.deleteFile(item.originalName)));
      throw new HttpException(
        'No userId or publicationId were provided',
        HttpStatus.BAD_REQUEST,
      );
    }
    const createdImages = await this.imageRepository.create(
      data.map((item) => ({
        ...item,
        publicationId,
      })),
    );
    const savedImages = await this.imageRepository.save(createdImages);
    return {
      data: { images: savedImages },
    };
  }

  async deleteAvatarsByUserId(userId: number) {
    if (!userId)
      throw new HttpException(
        'userId not provided for deleteAvatarsByUserId',
        HttpStatus.BAD_REQUEST,
      );
    const foundImages = await this.imageRepository.find({
      where: { userId },
    });
    await Promise.all(
      foundImages.map((image) => this.deleteFile(image.originalName)),
    );
    return this.imageRepository.delete({ userId });
  }

  async uploadAvatar(file: Express.Multer.File, userId: number) {
    const data = {
      originalName: file.originalname,
      urlString: this.createUrlString(file.originalname),
    };
    if (!userId) {
      await this.deleteFile(data.originalName);
      throw new HttpException('No userId provided', HttpStatus.BAD_REQUEST);
    }
    await this.deleteAvatarsByUserId(userId);
    const foundImage = await this.imageRepository.findOne({
      where: { userId, originalName: data.originalName },
    });
    if (foundImage)
      throw new HttpException('Image already exists', HttpStatus.CONFLICT);
    const createdAvatar = await this.imageRepository.create({
      ...data,
      userId,
    });
    const avatar = await this.imageRepository.save(createdAvatar);
    return {
      data: {
        avatar,
      },
    };
  }
}
