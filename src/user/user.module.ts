import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { PublicationModule } from 'src/publication/publication.module';
import { ImageModule } from 'src/image/image.module';

@Module({
  imports: [TypeOrmModule.forFeature([User]), PublicationModule, ImageModule],
  providers: [UserService],
  controllers: [UserController],
})
export class UserModule {}
