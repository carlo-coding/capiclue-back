import { User } from 'src/user/user.entity';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { FriendRequestStatus } from './constants/friendRequestStatus';

@Entity()
export class Friend {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column({
    nullable: false,
    type: 'enum',
    enum: FriendRequestStatus,
    default: FriendRequestStatus.SENT,
  })
  status?: FriendRequestStatus;

  @ManyToOne(() => User, (user) => user.petitionsSent, {
    onDelete: 'CASCADE',
    eager: true,
  })
  sender: User;

  @Column()
  senderId: number;

  @Column()
  receiverId: number;

  @ManyToOne(() => User, (user) => user.petitionsReceived, {
    onDelete: 'CASCADE',
    eager: true,
  })
  receiver: User;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt?: Date;
}
