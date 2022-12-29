import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from './comment.entity';
import { CreateCommentDto } from './dto/CreateCommentDto';
import { Publication } from '../publication.entity';
import { UpdateCommentDto } from './dto/UpdateCommentDto';
import { NotificationService } from 'src/notification/notification.service';
import { User } from 'src/user/user.entity';
import { NotificationTypes } from 'src/notification/constants/NotificationTypes';
import { createNotificationMessage } from 'src/notification/utils/createNotificationMessage';
import { analyzeText } from 'src/utils/analyzeText';

import {
  IPaginationOptions,
  paginate,
  Pagination,
} from 'nestjs-typeorm-paginate';
import { Friend } from 'src/friend/friend.entity';
import { FriendRequestStatus } from 'src/friend/constants/friendRequestStatus';

@Injectable()
export class CommentService {
  constructor(
    @InjectRepository(Comment) private commentRepository: Repository<Comment>,
    @InjectRepository(Publication)
    private publicationRepository: Repository<Publication>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Friend)
    private friendRepository: Repository<Friend>,
    private notificationService: NotificationService,
  ) {}

  private getCommentAnalysis(comment: string) {
    return analyzeText(comment) < 0 ? -0.25 : 1;
  }

  private async isCommentatorFriend(
    pagination: Promise<Pagination<Comment>>,
    userId?: number,
  ) {
    if (userId === undefined) return pagination;
    const result = await pagination;
    const items = await Promise.all(
      result.items.map(async (c) => {
        const friend = await this.friendRepository.findOne({
          where: [
            {
              senderId: userId,
              receiverId: c.commentatorId,
              status: FriendRequestStatus.ACCEPTED,
            },
            {
              senderId: c.commentatorId,
              receiverId: userId,
              status: FriendRequestStatus.ACCEPTED,
            },
          ],
        });
        return {
          ...c,
          commentator: {
            ...c.commentator,
            isFriend: friend !== null,
          },
        };
      }),
    );
    return {
      ...result,
      items,
    };
  }

  async getAllCommentsByPublicationId(
    options: IPaginationOptions,
    publicationId: number,
    userId: number,
  ) {
    if (!publicationId)
      throw new HttpException(
        'publicationId not provided',
        HttpStatus.BAD_REQUEST,
      );
    const queryBuilder = this.commentRepository
      .createQueryBuilder('comment')
      .innerJoin(
        'comment.publication',
        'publication',
        'publication.id = :publicationId',
        { publicationId },
      )
      .innerJoin('comment.commentator', 'commentator')
      .leftJoin('commentator.avatars', 'avatars')
      .select(['comment', 'commentator', 'avatars']);
    return this.isCommentatorFriend(
      paginate<Comment>(queryBuilder, options),
      userId,
    );
  }

  async createComment(
    data: CreateCommentDto,
    publicationId: number,
    commentatorId: number,
  ) {
    if (!commentatorId || !publicationId)
      throw new HttpException(
        'commentatorId or publicationId were not provided',
        HttpStatus.BAD_REQUEST,
      );
    const foundCommentator = await this.userRepository.findOne({
      where: { id: commentatorId },
    });
    if (!foundCommentator)
      throw new HttpException('Commentator not found', HttpStatus.NOT_FOUND);

    if (!foundCommentator.emailVerified) {
      throw new HttpException(
        'Must verify email before continue',
        HttpStatus.I_AM_A_TEAPOT,
      );
    }
    const foundPost = await this.publicationRepository.findOne({
      where: {
        id: publicationId,
      },
    });
    if (!foundPost)
      throw new HttpException('Publication not found', HttpStatus.NOT_FOUND);
    const createdComment = await this.commentRepository.create({
      ...data,
      publicationId,
      commentatorId,
    });
    await this.commentRepository.save(createdComment);

    if (foundCommentator.id !== foundPost.authorId) {
      const score = this.getCommentAnalysis(createdComment.comment);

      await this.publicationRepository
        .createQueryBuilder('publication')
        .update(foundPost)
        .set({
          score: () => `score + ${score}`,
        })
        .execute();

      const content = createNotificationMessage({
        score,
        userName: foundCommentator.userName,
        actionType: NotificationTypes.NEW_COMMENT,
      });
      const actionPayload = JSON.stringify({
        commentId: createdComment.id,
      });
      await this.notificationService.sendNotification(
        {
          actionType: NotificationTypes.NEW_COMMENT,
          actionPayload,
          content,
        },
        foundPost.authorId,
      );
    }

    const comment = await this.commentRepository
      .createQueryBuilder('c')
      .where('c.id = :commentId', { commentId: createdComment.id })
      .innerJoin('c.commentator', 'commentator')
      .leftJoin('commentator.avatars', 'avatars')
      .select(['c', 'commentator', 'avatars'])
      .getOne();
    return {
      data: {
        comment,
      },
    };
  }

  async deleteComment(commentId: number, commentatorId: number) {
    if (!commentId || !commentatorId)
      throw new HttpException(
        'commentId or commentatorId were not provided',
        HttpStatus.BAD_REQUEST,
      );
    await this.commentRepository.delete({
      id: commentId,
      commentatorId,
    });
    return {
      data: {
        message: 'Comment deleted successfully!',
      },
    };
  }

  async updateComment(
    data: UpdateCommentDto,
    commentId: number,
    commentatorId: number,
  ) {
    if (!commentId || !commentatorId)
      throw new HttpException(
        'commentId or commentatorId were not provided',
        HttpStatus.BAD_REQUEST,
      );
    await this.commentRepository.update({ id: commentId, commentatorId }, data);
    const comment = await this.commentRepository
      .createQueryBuilder('c')
      .where('c.id = :commentId', { commentId })
      .innerJoin('c.commentator', 'commentator')
      .select(['c', 'commentator'])
      .getOne();
    return {
      data: {
        comment,
      },
    };
  }
}
