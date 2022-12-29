import { Message } from 'src/chat/message.entity';
import { Friend } from 'src/friend/friend.entity';
import { Image } from 'src/image/image.entity';
import { Notification } from 'src/notification/notification.entity';
import { Comment } from 'src/publication/comment/comment.entity';
import { Publication } from 'src/publication/publication.entity';
import { Report } from 'src/report/report.entity';
import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column({ nullable: false })
  names: string;

  @Column({ nullable: false })
  surnames: string;

  @Column({ nullable: false, unique: true })
  userName: string;

  @Column({ nullable: false, unique: true })
  email: string;

  @Column({ default: false })
  emailVerified: boolean;

  @Column({ nullable: true, select: false })
  password?: string;

  @Column({ nullable: true, type: 'datetime', default: null })
  birthday: Date;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  createdAt?: Date;

  @OneToMany(() => Notification, (noti) => noti.user)
  notifications: Notification[];

  @OneToMany(() => Friend, (friend) => friend.sender)
  petitionsSent: Friend[];

  @OneToMany(() => Friend, (friend) => friend.receiver)
  petitionsReceived: Friend[];

  @OneToMany(() => Publication, (publication) => publication.author)
  publications: Publication[];

  @ManyToMany(
    () => Publication,
    (publication) => publication.usersThatSavedAsFavorite,
  )
  @JoinTable()
  favoritePublications: Publication[];

  @OneToMany(() => Comment, (comment) => comment.commentator)
  comments: Comment[];

  @OneToMany(() => Image, (image) => image.user, { eager: true })
  avatars: Image[];

  @OneToMany(() => Message, (message) => message.receiver)
  messagesReceived: Message[];

  @OneToMany(() => Message, (message) => message.sender)
  messagesSent: Message[];

  @OneToMany(() => Report, (report) => report.user)
  reportsMade: Report[];

  @OneToMany(() => Report, (report) => report.reportedUser)
  reports: Report[];
}
