import { StateKey, TransferState, makeStateKey } from '@angular/core';
import { TranslateLoader } from '@ngx-translate/core';
import { readFileSync } from 'fs';
import { join } from 'path';
import { Observable } from 'rxjs';

export class TranslateServerLoader implements TranslateLoader {
  constructor(
    private transferState: TransferState,
    private prefix = 'i18n',
    private suffix = '.json'
  ) {}

  public getTranslation(lang: string): Observable<unknown> {
    return new Observable((observer) => {
      const assetsFolder = join(
        process.cwd(),
        'dist',
        'shoppinglist-frontend',
        'browser',
        'assets',
        this.prefix
      );

      const jsonData = JSON.parse(
        readFileSync(`${assetsFolder}/${lang}.${this.suffix}`, 'utf8')
      );

      const key: StateKey<number> = makeStateKey<number>(
        `transfer-translate-${lang}`
      );
      this.transferState.set(key, jsonData);

      observer.next(jsonData);
      observer.complete();
    });
  }
}

export function translateServerLoaderFactory(
  transferState: TransferState
): TranslateLoader {
  return new TranslateServerLoader(transferState);
}
