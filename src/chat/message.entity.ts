import { User } from 'src/user/user.entity';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Message {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column()
  message: string;

  @Column({ type: 'boolean', default: false })
  read: boolean;

  @Column()
  senderId: number;

  @ManyToOne(() => User, (user) => user.messagesSent, {
    onDelete: 'CASCADE',
  })
  sender: User;

  @Column()
  receiverId: number;

  @ManyToOne(() => User, (user) => user.messagesReceived, {
    onDelete: 'CASCADE',
  })
  receiver: User;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt?: Date;
}
