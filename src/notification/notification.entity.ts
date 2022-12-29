import { User } from 'src/user/user.entity';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { NotificationTypes } from './constants/NotificationTypes';

@Entity()
export class Notification {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  content: string;

  @Column({ nullable: false, type: 'enum', enum: NotificationTypes })
  actionType: NotificationTypes;

  @Column({ nullable: false })
  actionPayload: string;

  @ManyToOne(() => User, (user) => user.notifications, {
    onDelete: 'CASCADE',
  })
  user: User;

  @Column()
  userId: number;

  @Column({ type: 'boolean', default: false })
  read: boolean;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  createdAt?: Date;
}
