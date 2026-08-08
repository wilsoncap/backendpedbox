import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('characters')
export class Character {
  @PrimaryColumn({ type: 'int' })
  id: number;

  @Column()
  name: string;

  @Column()
  status: string;

  @Column()
  species: string;

  @Column({ default: '' })
  type: string;

  @Column()
  gender: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  originName: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  locationName: string | null;

  @Column({ type: 'text', nullable: true })
  image: string | null;

  @Column({ type: 'text', nullable: true })
  url: string | null;

  @Column({ type: 'datetime' })
  created: Date;

  @Column({ type: 'datetime' })
  fetchedAt: Date;
}
