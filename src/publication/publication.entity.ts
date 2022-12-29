import { Image } from 'src/image/image.entity';
import { Report } from 'src/report/report.entity';
import { User } from 'src/user/user.entity';
import {
  Column,
  Entity,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Comment } from './comment/comment.entity';

@Entity()
export class Publication {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column({ length: 500 })
  content: string;

  @Column({ type: 'float', default: 0 })
  score: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column()
  authorId: number;

  @ManyToOne(() => User, (user) => user.publications, { onDelete: 'CASCADE' })
  author: User;

  @ManyToMany(() => User, (user) => user.favoritePublications)
  usersThatSavedAsFavorite: User[];

  @OneToMany(() => Comment, (comment) => comment.publication)
  comments: Comment[];

  @OneToMany(() => Image, (image) => image.publication, { eager: true })
  images: Image[];

  @OneToMany(() => Report, (report) => report.reportedPublication)
  reports: Report[];
}
