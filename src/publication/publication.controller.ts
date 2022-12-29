import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { Query } from '@nestjs/common/decorators';
import { DefaultValuePipe } from '@nestjs/common/pipes/default-value.pipe';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { IUserAuthPayload } from 'src/auth/user.auth.payload';
import { User } from 'src/user/user.decorator';
import { CreatePublicationDto } from './dto/CreatePublicationDto';
import { UpdatePublicationDto } from './dto/UpdatePublicationDto';
import { OptionalAuthGuard } from '../auth/optional-auth.guard';
import { PublicationService } from './publication.service';

@Controller('publication')
export class PublicationController {
  constructor(private publicationService: PublicationService) {}

  @Get('/all')
  @UseGuards(OptionalAuthGuard)
  getPublications(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page = 1,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit = 10,
    @User() user?: IUserAuthPayload,
  ) {
    limit = limit > 100 ? 100 : limit;
    return this.publicationService.getPublications(
      { page, limit },
      user?.userId,
    );
  }

  @Post('')
  @UseGuards(JwtAuthGuard)
  createPublication(
    @User() user: IUserAuthPayload,
    @Body() data: CreatePublicationDto,
  ) {
    return this.publicationService.createPublication(data, user.userId);
  }

  @Get('')
  @UseGuards(JwtAuthGuard)
  getUserPublications(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page = 1,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit = 10,
    @User() user: IUserAuthPayload,
  ) {
    limit = limit > 100 ? 100 : limit;
    return this.publicationService.getUserPublications(user.userId, {
      page,
      limit,
    });
  }

  @Get('/popular')
  getPopularPublications(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page = 1,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit = 10,
  ) {
    limit = limit > 100 ? 100 : limit;
    return this.publicationService.getPopularPublications({ page, limit });
  }

  @Get('/friends')
  @UseGuards(JwtAuthGuard)
  getFriendPublications(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page = 1,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit = 10,
    @User() user: IUserAuthPayload,
  ) {
    limit = limit > 100 ? 100 : limit;
    return this.publicationService.getFriendsPulications(user.userId, {
      page,
      limit,
    });
  }

  @Get('/favorites')
  @UseGuards(JwtAuthGuard)
  getFavoritePublications(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page = 1,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit = 10,
    @User() user: IUserAuthPayload,
  ) {
    limit = limit > 100 ? 100 : limit;
    return this.publicationService.getFavoritePublications(user.userId, {
      page,
      limit,
    });
  }

  @Post('/favorite/:publicationId')
  @UseGuards(JwtAuthGuard)
  addPublicationToFavourites(
    @User() user: IUserAuthPayload,
    @Param('publicationId', ParseIntPipe) publicationId: number,
  ) {
    return this.publicationService.addPublicationToFavorites(
      publicationId,
      user.userId,
    );
  }

  @Get('search/:search')
  getPublicationsBySearch(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page = 1,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit = 10,
    @Param('search') search: string,
  ) {
    limit = limit > 100 ? 100 : limit;
    return this.publicationService.getPublicationsBySearch(search, {
      page,
      limit,
    });
  }

  @Delete('/:publicationId')
  @UseGuards(JwtAuthGuard)
  deletePublication(
    @Param('publicationId', ParseIntPipe) publicationId: number,
    @User() user: IUserAuthPayload,
  ) {
    return this.publicationService.deletePublication(
      publicationId,
      user.userId,
    );
  }

  @Put('/:publicationId')
  @UseGuards(JwtAuthGuard)
  updatePublication(
    @Param('publicationId', ParseIntPipe) publicationId: number,
    @Body() data: UpdatePublicationDto,
    @User() user: IUserAuthPayload,
  ) {
    return this.publicationService.updatePublication(
      data,
      publicationId,
      user.userId,
    );
  }
}
