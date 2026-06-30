import { Injectable } from '@nestjs/common';

import { auth } from './auth';

@Injectable()
export class AuthService {
  getSession(headersInit: HeadersInit) {
    const headers = new Headers(headersInit);
    return auth.api.getSession({ headers });
  }
}
