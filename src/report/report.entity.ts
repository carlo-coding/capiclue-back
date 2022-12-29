import { Comment } from 'src/publication/comment/comment.entity';
import { Publication } from 'src/publication/publication.entity';
import { User } from 'src/user/user.entity';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Report {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column()
  content: string;

  @Column({ type: 'float', default: 0 })
  score: number;

  @Column()
  userId: number;

  @ManyToOne(() => User, (user) => user.reportsMade, {
    onDelete: 'CASCADE',
  })
  user: User;

  @Column({ default: null })
  reportedUserId: number;

  @ManyToOne(() => User, (user) => user.reports)
  reportedUser: User;

  @Column({ default: null })
  reportedPublicationId: number;

  @ManyToOne(() => Publication, (publication) => publication.reports)
  reportedPublication: Publication;

  @Column({ default: null })
  reportedCommentId: number;

  @ManyToOne(() => Comment, (comment) => comment.reports)
  reportedComment: Comment;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
