import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { nanoid } from 'nanoid';
import { Observable } from 'rxjs';

export const clientId = nanoid();

@Injectable()
export class ClientIdInterceptor implements HttpInterceptor {
  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    const newRequest = req.clone({
      setHeaders: {
        'Client-ID': clientId,
      },
    });
    return next.handle(newRequest);
  }
}
