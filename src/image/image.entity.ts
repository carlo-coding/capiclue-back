import { Publication } from 'src/publication/publication.entity';
import { User } from 'src/user/user.entity';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Image {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  urlString: string;

  @Column({ unique: true })
  originalName: string;

  @Column({ default: null })
  userId: number;

  @ManyToOne(() => User, (user) => user.avatars)
  user: User;

  @Column({ default: null })
  publicationId: number;

  @ManyToOne(() => Publication, (publication) => publication.images)
  publication: Publication;
}
