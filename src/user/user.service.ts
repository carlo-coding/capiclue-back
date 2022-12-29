import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ImageService } from 'src/image/image.service';
import { PublicationService } from 'src/publication/publication.service';
import { Repository } from 'typeorm';
import { UpdateUserDto } from './dto/UpdateUserDto';
import { User } from './user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    private publicationService: PublicationService,
    private imageService: ImageService,
  ) {}

  async deleteUser(userId: number) {
    const foundUser = await this.userRepository.findOne({
      where: { id: userId },
    });
    if (!foundUser)
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    await this.publicationService.deleteUserPublications(userId);
    await this.imageService.deleteAvatarsByUserId(userId);
    await this.userRepository.delete({ id: userId });
    return {
      data: {
        message: 'User deleted successfully',
      },
    };
  }

  async updateUserInfo(userId: number, dto: UpdateUserDto) {
    if (!userId)
      throw new HttpException('User id not provided', HttpStatus.BAD_REQUEST);
    const duplicateUsername = await this.userRepository.findOne({
      where: { userName: dto.userName },
    });
    if (duplicateUsername)
      throw new HttpException(
        'Username already exists',
        HttpStatus.BAD_REQUEST,
      );
    await this.userRepository.update({ id: userId }, dto);
    const userUpdated = await this.userRepository.findOne({
      where: { id: userId },
    });
    return {
      data: {
        user: userUpdated,
      },
    };
  }
}
