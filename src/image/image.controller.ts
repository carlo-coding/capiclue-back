import {
  Controller,
  Delete,
  Param,
  ParseIntPipe,
  Post,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { IUserAuthPayload } from 'src/auth/user.auth.payload';
import { User } from 'src/user/user.decorator';
import { ImageService } from './image.service';

@Controller('image')
export class ImageController {
  constructor(private imageService: ImageService) {}

  @UseInterceptors(FileInterceptor('avatar'))
  @Post('/avatar')
  @UseGuards(JwtAuthGuard)
  uploadAvatar(
    @UploadedFile()
    avatar: Express.Multer.File,
    @User() user: IUserAuthPayload,
  ) {
    return this.imageService.uploadAvatar(avatar, user.userId);
  }

  @UseInterceptors(FilesInterceptor('images'))
  @Post('/publication/:publicationId')
  @UseGuards(JwtAuthGuard)
  uploadFiles(
    @Param('publicationId', ParseIntPipe) publicationId: number,
    @User() user: IUserAuthPayload,
    @UploadedFiles()
    files: Array<Express.Multer.File>,
  ) {
    return this.imageService.uploadPublicationImages(
      files,
      publicationId,
      user.userId,
    );
  }

  @Delete('/:imageId')
  @UseGuards(JwtAuthGuard)
  deleteImage(@Param('imageId', ParseIntPipe) imageId: number) {
    return this.imageService.deleteImage(imageId);
  }
}
