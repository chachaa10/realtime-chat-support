import { Module } from '@nestjs/common';

import { AuthService } from './auth.service';
import { ProfileHook } from './profile.hook';

@Module({
  providers: [AuthService, ProfileHook],
  exports: [AuthService],
})
export class AppAuthModule {}
