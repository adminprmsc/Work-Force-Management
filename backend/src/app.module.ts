import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './infrastructure/config/configuration';
import { validate } from './infrastructure/config/env.validation';
import { PrismaModule } from './infrastructure/database/prisma/prisma.module';
import { AuthModule } from './presentation/auth/auth.module';
import { ProcurementModule } from './presentation/procurement/procurement.module';
import { RbacModule } from './presentation/rbac/rbac.module';
import { MobileAppModule } from './presentation/mobile-app/mobile-app.module';
import { StorageModule } from './presentation/storage/storage.module';
import { SurveyModule } from './presentation/survey/survey.module';
import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate,
    }),
    PrismaModule,
    AuthModule,
    RbacModule,
    ProcurementModule,
    SurveyModule,
    StorageModule,
    MobileAppModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
