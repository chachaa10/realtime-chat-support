import { Module } from '@nestjs/common';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ProfileHook } from './profile.hook';

@Module({
  controllers: [AuthController],
  providers: [AuthService, ProfileHook],
  exports: [AuthService],
})
export class AppAuthModule {}
