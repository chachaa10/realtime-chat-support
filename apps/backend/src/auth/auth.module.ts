import { Module } from '@nestjs/common';

import { ProfileHook } from './profile.hook';

@Module({
  providers: [ProfileHook],
})
export class AppAuthModule {}
