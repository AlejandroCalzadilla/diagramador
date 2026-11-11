import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Project } from './project.entity';

export enum CollaboratorRole {
  VIEWER = 'viewer',
  EDITOR = 'editor',
  ADMIN = 'admin',
}

@Entity('project_collaborators')
@Unique(['projectId', 'userId'])
export class ProjectCollaborator {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  projectId: string;

  @ManyToOne(() => Project, (project) => project.collaborators, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'projectId' })
  project: Project;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, (user) => user.collaborations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({
    type: 'enum',
    enum: CollaboratorRole,
    default: CollaboratorRole.EDITOR,
  })
  role: CollaboratorRole;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;
}

