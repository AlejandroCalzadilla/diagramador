import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from './entities/project.entity';
import {
  ProjectCollaborator,
  CollaboratorRole,
} from './entities/project-collaborator.entity';
import { UsersService } from '../users/users.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { AddCollaboratorDto } from './dto/add-collaborator.dto';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(ProjectCollaborator)
    private readonly collaboratorRepository: Repository<ProjectCollaborator>,
    private readonly usersService: UsersService,
  ) {}

  async create(userId: string, createDto: CreateProjectDto): Promise<Project> {
    const project = this.projectRepository.create({
      title: createDto.title,
      description: createDto.description,
      data: createDto.data || {},
      ownerId: userId,
    });

    return this.projectRepository.save(project);
  }

  async findAllForUser(userId: string): Promise<any[]> {
    const projects = await this.projectRepository
      .createQueryBuilder('project')
      .leftJoinAndSelect('project.owner', 'owner')
      .leftJoinAndSelect('project.collaborators', 'collaborator')
      .leftJoinAndSelect('collaborator.user', 'collabUser')
      .where('project.ownerId = :userId', { userId })
      .orWhere('collaborator.userId = :userId', { userId })
      .orderBy('project.updatedAt', 'DESC')
      .getMany();

    return projects.map((p) => {
      let role = 'viewer';
      if (p.ownerId === userId) {
        role = 'owner';
      } else {
        const collab = p.collaborators?.find((c) => c.userId === userId);
        if (collab) {
          role = collab.role;
        }
      }

      return {
        ...p,
        userRole: role,
      };
    });
  }

  async findOne(projectId: string, userId: string): Promise<Project> {
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
      relations: ['owner', 'collaborators', 'collaborators.user'],
    });

    if (!project) {
      throw new NotFoundException(`Project with ID ${projectId} not found`);
    }

    const hasAccess =
      project.ownerId === userId ||
      project.collaborators.some((c) => c.userId === userId);

    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this project');
    }

    return project;
  }

  async update(
    projectId: string,
    userId: string,
    updateDto: UpdateProjectDto,
  ): Promise<Project> {
    const project = await this.findOne(projectId, userId);

    // Permission check: owner, admin, or editor can update
    const isOwner = project.ownerId === userId;
    const collaborator = project.collaborators.find((c) => c.userId === userId);
    const canEdit =
      isOwner ||
      collaborator?.role === CollaboratorRole.ADMIN ||
      collaborator?.role === CollaboratorRole.EDITOR;

    if (!canEdit) {
      throw new ForbiddenException(
        'You do not have permission to modify this project',
      );
    }

    if (updateDto.title !== undefined) {
      project.title = updateDto.title;
    }
    if (updateDto.description !== undefined) {
      project.description = updateDto.description;
    }
    if (updateDto.data !== undefined) {
      project.data = updateDto.data;
    }

    return this.projectRepository.save(project);
  }

  async remove(projectId: string, userId: string): Promise<{ message: string }> {
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException(`Project with ID ${projectId} not found`);
    }

    if (project.ownerId !== userId) {
      throw new ForbiddenException('Only the project owner can delete this project');
    }

    await this.projectRepository.remove(project);
    return { message: 'Project successfully deleted' };
  }

  async addCollaborator(
    projectId: string,
    currentUserId: string,
    addDto: AddCollaboratorDto,
  ): Promise<ProjectCollaborator> {
    const project = await this.findOne(projectId, currentUserId);

    // Only owner or admin can add collaborators
    const isOwner = project.ownerId === currentUserId;
    const currentUserCollab = project.collaborators.find(
      (c) => c.userId === currentUserId,
    );
    const canManageCollabs =
      isOwner || currentUserCollab?.role === CollaboratorRole.ADMIN;

    if (!canManageCollabs) {
      throw new ForbiddenException(
        'Only project owners or administrators can add collaborators',
      );
    }

    const targetUser = await this.usersService.findByEmail(addDto.email);
    if (!targetUser) {
      throw new NotFoundException(
        `User with email ${addDto.email} was not found`,
      );
    }

    if (targetUser.id === project.ownerId) {
      throw new BadRequestException('Project owner is already the administrator');
    }

    let existingCollab = await this.collaboratorRepository.findOne({
      where: { projectId, userId: targetUser.id },
      relations: ['user'],
    });

    const targetRole = addDto.role || CollaboratorRole.EDITOR;

    if (existingCollab) {
      existingCollab.role = targetRole;
      return this.collaboratorRepository.save(existingCollab);
    }

    const newCollaborator = this.collaboratorRepository.create({
      projectId,
      userId: targetUser.id,
      role: targetRole,
    });

    await this.collaboratorRepository.save(newCollaborator);

    const saved = await this.collaboratorRepository.findOne({
      where: { id: newCollaborator.id },
      relations: ['user'],
    });

    return saved!;
  }

  async removeCollaborator(
    projectId: string,
    currentUserId: string,
    collaboratorUserId: string,
  ): Promise<{ message: string }> {
    const project = await this.findOne(projectId, currentUserId);

    const isOwner = project.ownerId === currentUserId;
    const currentUserCollab = project.collaborators.find(
      (c) => c.userId === currentUserId,
    );
    const isSelfRemoval = currentUserId === collaboratorUserId;
    const canManageCollabs =
      isOwner || currentUserCollab?.role === CollaboratorRole.ADMIN;

    if (!canManageCollabs && !isSelfRemoval) {
      throw new ForbiddenException(
        'You do not have permission to remove collaborators from this project',
      );
    }

    if (collaboratorUserId === project.ownerId) {
      throw new BadRequestException('Cannot remove the project owner');
    }

    const collab = await this.collaboratorRepository.findOne({
      where: { projectId, userId: collaboratorUserId },
    });

    if (!collab) {
      throw new NotFoundException('Collaborator not found in this project');
    }

    await this.collaboratorRepository.remove(collab);
    return { message: 'Collaborator successfully removed' };
  }

  async getCollaborators(
    projectId: string,
    userId: string,
  ): Promise<{ owner: any; collaborators: ProjectCollaborator[] }> {
    const project = await this.findOne(projectId, userId);

    return {
      owner: {
        id: project.owner.id,
        email: project.owner.email,
        name: project.owner.name,
      },
      collaborators: project.collaborators,
    };
  }
}

