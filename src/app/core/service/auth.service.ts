import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, delay, map, of, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import decodeJwt from 'jwt-decode';

const TokenInfoKey = 'TokenInfo';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(private http: HttpClient) {}

  isLoggedIn(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const token = this.decodeToken();
      if (!token) {
        resolve(false);
        return;
      }
      const secondsSinceEpoch = Math.round(Date.now() / 1000);
      if (secondsSinceEpoch >= token.exp) {
        this.refreshToken().subscribe({
          next: (success) => {
            resolve(success);
          },
          error: (error) => {
            reject(error);
          },
        });
        return;
      }
      resolve(true);
    });
  }

  login(email: string, password: string): Observable<SignInResponse> {
    return this.http
      .post<SignInResponse>(`${environment.apiUrl}/api/auth/login`, {
        email,
        password,
      })
      .pipe(
        tap((result) => {
          const tokenPair = {
            idToken: result.idToken,
            refreshToken: result.refreshToken,
          } as TokenPair;
          this.setTokenPair(tokenPair);
        })
      );
  }

  refreshToken(): Observable<boolean> {
    const tokenPair = this.getTokenPair();
    if (!tokenPair) {
      return of(false);
    }
    return this.http
      .post<IdTokenResponse>(`${environment.apiUrl}/api/auth/refresh`, {
        refreshToken: tokenPair.refreshToken,
      })
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

  decodeToken(): TokenInfo | null {
    const tokenPair = this.getTokenPair();
    if (!tokenPair) {
      return null;
    }
    const decoded = decodeJwt(tokenPair.idToken) as TokenInfo;
    return decoded;
  }

  private getTokenPair(): TokenPair | null {
    const tokenPairJson = localStorage.getItem(TokenInfoKey);
    if (!tokenPairJson) {
      return null;
    }
    const tokenPair = JSON.parse(tokenPairJson) as TokenPair;
    return tokenPair;
  }

  private setTokenPair(tokenPair: TokenPair): void {
    localStorage.setItem(TokenInfoKey, JSON.stringify(tokenPair));
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
