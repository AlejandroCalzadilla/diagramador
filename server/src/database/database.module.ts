import { Module, Logger } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { User } from '../modules/users/entities/user.entity';
import { Project } from '../modules/projects/entities/project.entity';
import { ProjectCollaborator } from '../modules/projects/entities/project-collaborator.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const logger = new Logger('DatabaseModule');
        const databaseUrl = configService.get<string>('DATABASE_URL');
        const isProduction = configService.get<string>('NODE_ENV') === 'production';
        const useSsl =
          configService.get<string>('DATABASE_SSL', isProduction ? 'true' : 'false') === 'true' ||
          Boolean(databaseUrl?.includes('sslmode=require'));

        if (databaseUrl) {
          const masked = databaseUrl.replace(/:[^:@]+@/, ':****@');
          logger.log(`Connecting to database via URL: ${masked}`);
        } else {
          logger.warn(
            `No DATABASE_URL found in environment variables. Falling back to host: ${configService.get<string>('DATABASE_HOST', 'localhost')}`,
          );
        }

        const sslConfig = useSsl ? { rejectUnauthorized: false } : false;

        return {
          type: 'postgres',
          ...(databaseUrl
            ? { url: databaseUrl }
            : {
                host: configService.get<string>('DATABASE_HOST', 'localhost'),
                port: configService.get<number>('DATABASE_PORT', 5432),
                username: configService.get<string>('DATABASE_USER', 'chartdb'),
                password: configService.get<string>('DATABASE_PASSWORD', 'chartdb_password'),
                database: configService.get<string>('DATABASE_NAME', 'chartdb'),
              }),
          ssl: sslConfig,
          extra: {
            ssl: sslConfig,
          },
          entities: [User, Project, ProjectCollaborator],
          synchronize:
            configService.get<string>('DATABASE_SYNCHRONIZE', 'true') === 'true',
          logging:
            configService.get<string>('DATABASE_LOGGING', 'false') === 'true',
        };
      },
    }),
  ],
})
export class DatabaseModule {}

