import { Module } from '@nestjs/common';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { ProfileHook } from './profile.hook';

@Module({
  controllers: [AuthController],
  providers: [AuthService, ProfileHook],
  exports: [AuthService],
})
export class AppAuthModule {}
