import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import decodeJwt from 'jwt-decode';
import { Observable, map, mergeMap, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { bypassInterceptor } from '../interceptor/token.interceptor';

const TokenInfoKey = 'TokenInfo';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(private http: HttpClient) {}

  login(email: string, password: string): Observable<SignInResponse> {
    return this.http
      .post<SignInResponse>(`${environment.apiUrl}/api/auth/login`, {
        email,
        password,
      })
      .pipe(
        mergeMap((result) => {
          const tokenPair = {
            idToken: result.idToken,
            refreshToken: result.refreshToken,
          } as TokenPair;
          this.setTokenPair(tokenPair);
          return of(result);
        })
      );
  }

  register(email: string, password: string): Observable<SignUpResponse> {
    return this.http
      .post<SignUpResponse>(`${environment.apiUrl}/api/auth/register`, {
        email,
        password,
      })
      .pipe(
        mergeMap((result) => {
          const tokenPair = {
            idToken: result.idToken,
            refreshToken: result.refreshToken,
          } as TokenPair;
          this.setTokenPair(tokenPair);
          return of(result);
        })
      );
  }

  logout(): void {
    this.setTokenPair(null);
  }

  refreshToken(): Observable<boolean> {
    const tokenPair = this.getTokenPair();
    if (!tokenPair) {
      return of(false);
    }
    return this.http
      .post<IdTokenResponse>(
        `${environment.apiUrl}/api/auth/refresh`,
        {
          refreshToken: tokenPair.refreshToken,
        },
        { context: bypassInterceptor() }
      )
      .pipe(
        map((result) => {
          const tokenPair = {
            idToken: result.id_token,
            refreshToken: result.refresh_token,
          } as TokenPair;
          this.setTokenPair(tokenPair);
          return true;
        })
      );
  }

  refreshIfNecessary(): Observable<boolean> {
    return of(false).pipe(
      mergeMap(() => {
        const token = this.decodeToken();
        if (!token) {
          this.setTokenPair(null);
          return of(false);
        }
        const secondsSinceEpoch = Math.round(Date.now() / 1000);
        if (secondsSinceEpoch >= token.exp) {
          return this.refreshToken();
        } else {
          return of(true);
        }
      })
    );
  }

  decodeToken(): TokenInfo | null {
    const tokenPair = this.getTokenPair();
    if (!tokenPair) {
      return null;
    }
    try {
      const decoded = decodeJwt(tokenPair.idToken) as TokenInfo;
      return decoded;
    } catch (error) {
      console.error('decodeToken failed', error);
      return null;
    }
  }

  getToken(): string | null {
    const tokenPair = this.getTokenPair();
    if (!tokenPair) {
      return null;
    }
    return tokenPair.idToken;
  }

  private getTokenPair(): TokenPair | null {
    const tokenPairJson = localStorage.getItem(TokenInfoKey);
    if (!tokenPairJson) {
      return null;
    }
    const tokenPair = JSON.parse(tokenPairJson) as TokenPair;
    return tokenPair;
  }

  private setTokenPair(tokenPair: TokenPair | null): void {
    if (!tokenPair) {
      localStorage.removeItem(TokenInfoKey);
    } else {
      localStorage.setItem(TokenInfoKey, JSON.stringify(tokenPair));
    }
  }
}

export interface TokenPair {
  idToken: string;
  refreshToken: string;
}

export interface SignInResponse {
  idToken: string;
  email: string;
  refreshToken: string;
  expiresIn: string;
  localId: string;
  registered: boolean;
}

export type SignUpResponse = Omit<SignInResponse, 'registered'>;

export interface TokenInfo {
  aud: string;
  auth_time: number;
  email: string;
  email_verified: boolean;
  exp: number;
  iat: number;
  iss: string;
  sub: string;
  user_id: string;
}

export interface IdTokenResponse {
  expires_in: string;
  token_type: string;
  refresh_token: string;
  id_token: string;
  user_id: string;
  project_id: string;
}
