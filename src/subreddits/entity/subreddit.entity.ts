import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('subreddits')
export class Subreddit {
  @PrimaryColumn()
  id: string;

  @Column({ unique: true })
  name: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  publicDescription: string | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'int', default: 0 })
  subscribers: number;

  @Column()
  url: string;

  @Column({ default: false })
  over18: boolean;

  @Column({
    type: 'bigint',
    transformer: {
      to: (value: number) => value,
      from: (value: string | number) => Number(value),
    },
  })
  createdUtc: number;

  @Column({ type: 'text', nullable: true })
  iconImg: string | null;

  @Column({ type: 'text', nullable: true })
  bannerImg: string | null;

  @Column({ type: 'datetime' })
  fetchedAt: Date;
}
