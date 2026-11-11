import { Module } from '@nestjs/common';
import { CollaborationGateway } from './collaboration.gateway';
import { ProjectsModule } from '../projects/projects.module';

@Module({
  imports: [ProjectsModule],
  providers: [CollaborationGateway],
  exports: [CollaborationGateway],
})
export class CollaborationModule {}

