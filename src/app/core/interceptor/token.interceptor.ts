import { Observable, mergeMap } from 'rxjs';
import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpContextToken,
  HttpContext,
} from '@angular/common/http';
import { AuthService } from '../service/auth.service';
export const BYPASS_INTERCEPTOR_TOKEN = new HttpContextToken(() => false);
export const bypassInterceptor = () => {
  return new HttpContext().set(BYPASS_INTERCEPTOR_TOKEN, true);
};
@Injectable()
export class TokenInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService) {}
  intercept(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    if (request.context.get(BYPASS_INTERCEPTOR_TOKEN)) {
      return next.handle(request);
    }

    return this.authService.refreshIfNecessary().pipe(
      mergeMap(() => {
        const token = this.authService.getToken();
        let newRequest = request;
        if (token) {
          newRequest = newRequest.clone({
            setHeaders: { Authorization: `Bearer ${token}` },
          });
        }
        return next.handle(newRequest);
      })
    );
  }
}
