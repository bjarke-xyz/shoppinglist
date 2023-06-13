import { HttpClient } from '@angular/common/http';
import { TransferState, makeStateKey } from '@angular/core';
import { TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { Observable } from 'rxjs';

export class TranslateBrowserLoader implements TranslateLoader {
  constructor(private http: HttpClient, private transferState: TransferState) {}

  public getTranslation(lang: string): Observable<unknown> {
    const key = makeStateKey<number>(`transfer-translate-${lang}`);
    const data = this.transferState.get(key, null);
    if (data) {
      return new Observable((observer) => {
        observer.next(data);
        observer.complete();
      });
    } else {
      return new TranslateHttpLoader(this.http).getTranslation(lang);
    }
  }
}

export function translateBrowserLoaderFactory(
  httpClient: HttpClient,
  transferState: TransferState
): TranslateBrowserLoader {
  return new TranslateBrowserLoader(httpClient, transferState);
}
