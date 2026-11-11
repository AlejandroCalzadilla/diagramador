import { IsEmail, IsEnum, IsNotEmpty, IsOptional } from 'class-validator';
import { CollaboratorRole } from '../entities/project-collaborator.entity';

export class AddCollaboratorDto {
  @IsEmail({}, { message: 'A valid email is required to add collaborator' })
  @IsNotEmpty()
  email: string;

  @IsEnum(CollaboratorRole, {
    message: 'Role must be one of: viewer, editor, admin',
  })
  @IsOptional()
  role?: CollaboratorRole = CollaboratorRole.EDITOR;
}

