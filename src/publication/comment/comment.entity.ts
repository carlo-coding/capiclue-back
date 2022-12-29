import { Report } from 'src/report/report.entity';
import { User } from 'src/user/user.entity';
import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Publication } from '../publication.entity';

@Entity()
export class Comment {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt?: Date;

  @Column()
  comment: string;

  @Column()
  commentatorId: number;

  @ManyToOne(() => User, (user) => user.comments, { onDelete: 'CASCADE' })
  commentator: User;

  @Column()
  publicationId: number;

  @ManyToOne(() => Publication, (publication) => publication.comments, {
    onDelete: 'CASCADE',
  })
  publication: Publication;

  @OneToMany(() => Report, (report) => report.reportedComment)
  reports: Report[];
}
