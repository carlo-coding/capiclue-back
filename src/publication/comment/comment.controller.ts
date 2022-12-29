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
  Query,
} from '@nestjs/common';
import { DefaultValuePipe } from '@nestjs/common/pipes';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { OptionalAuthGuard } from 'src/auth/optional-auth.guard';
import { IUserAuthPayload } from 'src/auth/user.auth.payload';
import { User } from 'src/user/user.decorator';
import { CommentService } from './comment.service';
import { CreateCommentDto } from './dto/CreateCommentDto';
import { UpdateCommentDto } from './dto/UpdateCommentDto';

@Controller('comment')
export class CommentController {
  constructor(private commentService: CommentService) {}

  @Get('/all/:publicationId')
  @UseGuards(OptionalAuthGuard)
  getByPublication(
    @Param('publicationId', ParseIntPipe) publicationId: number,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page = 1,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit = 10,
    @User() user?: IUserAuthPayload,
  ) {
    limit = limit > 100 ? 100 : limit;
    return this.commentService.getAllCommentsByPublicationId(
      {
        page,
        limit,
      },
      publicationId,
      user?.userId,
    );
  }

  @Post('/:publicationId')
  @UseGuards(JwtAuthGuard)
  createComment(
    @Body() data: CreateCommentDto,
    @Param('publicationId', ParseIntPipe) publicationId: number,
    @User() user: IUserAuthPayload,
  ) {
    return this.commentService.createComment(data, publicationId, user.userId);
  }

  @Delete('/:commentId')
  @UseGuards(JwtAuthGuard)
  deleteComment(
    @Param('commentId', ParseIntPipe) commentId: number,
    @User() user: IUserAuthPayload,
  ) {
    return this.commentService.deleteComment(commentId, user.userId);
  }

  @Put('/:commentId')
  @UseGuards(JwtAuthGuard)
  updateComment(
    @Body() data: UpdateCommentDto,
    @Param('commentId', ParseIntPipe) commentId: number,
    @User() user: IUserAuthPayload,
  ) {
    return this.commentService.updateComment(data, commentId, user.userId);
  }
}
