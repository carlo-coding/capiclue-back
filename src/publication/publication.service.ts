import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  IPaginationOptions,
  Pagination,
  paginate,
} from 'nestjs-typeorm-paginate';
import { FriendRequestStatus } from 'src/friend/constants/friendRequestStatus';
import { Friend } from 'src/friend/friend.entity';
import { FriendService } from 'src/friend/friend.service';
import { ImageService } from 'src/image/image.service';
import { User } from 'src/user/user.entity';
import { Repository } from 'typeorm';
import { CreatePublicationDto } from './dto/CreatePublicationDto';
import { UpdatePublicationDto } from './dto/UpdatePublicationDto';
import { Publication } from './publication.entity';

@Injectable()
export class PublicationService {
  constructor(
    @InjectRepository(Publication)
    private publicationRepository: Repository<Publication>,
    @InjectRepository(Friend)
    private friendRepository: Repository<Friend>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private friendsService: FriendService,
    private imageService: ImageService,
  ) {}

  private async isAuthorFriend(
    pagination: Promise<Pagination<Publication>>,
    userId?: number,
  ) {
    if (userId === undefined) return pagination;
    const result = await pagination;
    const items = await Promise.all(
      result.items.map(async (p) => {
        const friend = await this.friendRepository.findOne({
          where: [
            {
              senderId: userId,
              receiverId: p.authorId,
              status: FriendRequestStatus.ACCEPTED,
            },
            {
              senderId: p.authorId,
              receiverId: userId,
              status: FriendRequestStatus.ACCEPTED,
            },
          ],
        });
        return {
          ...p,
          author: {
            ...p.author,
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

  async getPublications(options: IPaginationOptions, userId?: number) {
    const queryBuilder = this.publicationRepository
      .createQueryBuilder('p')
      .leftJoin('p.images', 'images')
      .leftJoin('p.author', 'author')
      .leftJoin('author.avatars', 'author_avatars')
      .select(['p', 'images', 'author', 'author_avatars'])
      .orderBy('p.createdAt', 'ASC');
    return this.isAuthorFriend(
      paginate<Publication>(queryBuilder, options),
      userId,
    );
  }

  async getPublicationsBySearch(search: string, options: IPaginationOptions) {
    const queryBuilder = this.publicationRepository
      .createQueryBuilder('p')
      .where('p.content like :search', { search: `%${search}%` })
      .leftJoin('p.images', 'images')
      .leftJoin('p.author', 'author')
      .leftJoin('author.avatars', 'author_avatars')
      .select(['p', 'images', 'author', 'author_avatars'])
      .orderBy('p.createdAt', 'ASC');
    return paginate<Publication>(queryBuilder, options);
  }

  async getPopularPublications(options: IPaginationOptions) {
    const queryBuilder = this.publicationRepository
      .createQueryBuilder('p')
      .leftJoin('p.images', 'images')
      .leftJoin('p.author', 'author')
      .leftJoin('author.avatars', 'author_avatars')
      .select(['p', 'images', 'author', 'author_avatars'])
      .orderBy('p.createdAt', 'DESC');
    return paginate<Publication>(queryBuilder, options);
  }

  async getUserPublications(userId: number, options: IPaginationOptions) {
    if (!userId)
      throw new HttpException(
        'userId was not provided',
        HttpStatus.BAD_REQUEST,
      );
    const queryBuilder = this.publicationRepository
      .createQueryBuilder('p')
      .leftJoin('p.images', 'images')
      .leftJoin('p.author', 'author')
      .leftJoin('author.avatars', 'author_avatars')
      .select(['p', 'images', 'author', 'author_avatars'])
      .where('p.authorId = :userId', {
        userId,
      });
    return paginate<Publication>(queryBuilder, options);
  }

  async getFriendsPulications(
    userId: number,
    options: IPaginationOptions,
  ): Promise<Pagination<Publication>> {
    if (!userId)
      throw new HttpException(
        'userId was not provided',
        HttpStatus.BAD_REQUEST,
      );
    const friends = await this.friendsService.getAllfriends(userId);
    const friendIds = friends.map((friend) => friend.id);
    if (friendIds.length === 0) {
      return {
        items: [],
        meta: {
          currentPage: 1,
          itemCount: 0,
          itemsPerPage: 0,
          totalItems: 0,
          totalPages: 0,
        },
      };
    }
    const queryBuilder = this.publicationRepository
      .createQueryBuilder('p')
      .leftJoin('p.images', 'images')
      .leftJoin('p.author', 'author')
      .leftJoin('author.avatars', 'author_avatars')
      .select(['p', 'images', 'author', 'author_avatars'])
      .where('p.authorId IN (:friendIds)', { friendIds });
    return paginate<Publication>(queryBuilder, options);
  }

  async getFavoritePublications(userId: number, options: IPaginationOptions) {
    if (!userId)
      throw new HttpException(
        'userId was not provided',
        HttpStatus.BAD_REQUEST,
      );
    const queryBuilder = this.publicationRepository
      .createQueryBuilder('p')
      .leftJoin('p.images', 'images')
      .leftJoin('p.author', 'author')
      .leftJoin('author.avatars', 'author_avatars')
      .select(['p', 'images', 'author', 'author_avatars'])
      .innerJoin('p.usersThatSavedAsFavorite', 'user', 'user.id = :userId', {
        userId,
      });
    return paginate<Publication>(queryBuilder, options);
  }

  async createPublication(data: CreatePublicationDto, authorId: number) {
    if (!authorId)
      throw new HttpException('authorId not provided', HttpStatus.BAD_REQUEST);

    const foundAuthor = await this.userRepository.findOne({
      where: { id: authorId },
    });

    if (!foundAuthor.emailVerified) {
      throw new HttpException(
        'Must verify email to make new publications',
        HttpStatus.I_AM_A_TEAPOT,
      );
    }

    const createdPublication = await this.publicationRepository.create({
      ...data,
      authorId,
    });
    await this.publicationRepository.save(createdPublication);
    const publication = await this.publicationRepository
      .createQueryBuilder('p')
      .leftJoin('p.images', 'images')
      .leftJoin('p.author', 'author')
      .leftJoin('author.avatars', 'author_avatars')
      .select(['p', 'images', 'author', 'author_avatars'])
      .where('p.id = :publicationId', { publicationId: createdPublication.id })
      .getOne();
    return {
      data: { publication },
    };
  }

  async deletePublication(publicationId: number, userId: number) {
    if (!publicationId || !userId)
      throw new HttpException(
        'publicationId or userId were not provided',
        HttpStatus.BAD_REQUEST,
      );
    const publication = await this.publicationRepository.findOne({
      where: {
        id: publicationId,
        authorId: userId,
      },
    });
    if (!publication)
      throw new HttpException(
        'Publication was not found',
        HttpStatus.NOT_FOUND,
      );
    await this.imageService.deleteImagesByPublicationId(publicationId);
    await this.publicationRepository.delete({ id: publicationId });
    return { data: { publication } };
  }

  async updatePublication(
    data: UpdatePublicationDto,
    publicationId: number,
    userId: number,
  ) {
    if (!publicationId || !userId)
      throw new HttpException(
        'publicationId or userId were not provided',
        HttpStatus.BAD_REQUEST,
      );
    await this.publicationRepository.update({ id: publicationId }, data);
    const publication = await this.publicationRepository
      .createQueryBuilder('p')
      .leftJoin('p.images', 'images')
      .leftJoin('p.author', 'author')
      .leftJoin('author.avatars', 'author_avatars')
      .select(['p', 'images', 'author', 'author_avatars'])
      .where('p.id = :publicationId', { publicationId })
      .getOne();

    return { data: { publication } };
  }

  async addPublicationToFavorites(publicationId: number, userId: number) {
    if (!publicationId || !userId)
      throw new HttpException(
        'publicationId or userId were not provided',
        HttpStatus.BAD_REQUEST,
      );
    const foundUser = await this.userRepository.findOne({
      where: { id: userId },
      relations: {
        favoritePublications: true,
      },
    });
    if (!foundUser)
      throw new HttpException('No user found', HttpStatus.NOT_FOUND);
    const foundPublication = await this.publicationRepository
      .createQueryBuilder('p')
      .leftJoin('p.images', 'images')
      .leftJoin('p.author', 'author')
      .leftJoin('author.avatars', 'author_avatars')
      .select(['p', 'images', 'author', 'author_avatars'])
      .where('p.id = :publicationId', { publicationId })
      .getOne();
    if (!foundPublication)
      throw new HttpException('No publication was found', HttpStatus.NOT_FOUND);
    foundUser.favoritePublications = [
      ...foundUser.favoritePublications,
      foundPublication,
    ];
    await this.publicationRepository
      .createQueryBuilder('publication')
      .update(foundPublication)
      .set({
        score: () => `score + 1`,
      })
      .execute();
    await this.userRepository.save(foundUser);
    return {
      data: {
        publication: foundPublication,
      },
    };
  }

  async deleteUserPublications(userId: number) {
    if (!userId)
      throw new HttpException(
        'userId was not provided in deleteUserPublications',
        HttpStatus.BAD_REQUEST,
      );
    const foundPublications = await this.publicationRepository.find({
      where: {
        authorId: userId,
      },
    });
    await Promise.all(
      foundPublications.map((publication) =>
        this.deletePublication(publication.id, userId),
      ),
    );
    return {
      data: {
        message: 'Publication deleted successfully!',
      },
    };
  }
}
