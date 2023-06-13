import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

export type Locale = 'da' | 'en';
@Injectable({
  providedIn: 'root',
})
export class LanguageService {
  public readonly locales: { locale: Locale; title: string }[] = [
    {
      locale: 'da',
      title: 'Dansk',
    },
    {
      locale: 'en',
      title: 'English',
    },
  ];
  public get language(): Locale {
    return this.translateService.currentLang as Locale;
  }
  constructor(private translateService: TranslateService) {}

  public init(): void {
    const storageLang = localStorage.getItem('language') as Locale;
    if (storageLang) {
      this.useLanguage(storageLang);
    } else if (window.navigator?.language) {
      if (window.navigator.language.startsWith('da')) {
        this.useLanguage('da');
      } else {
        this.useLanguage('en');
      }
    } else {
      this.useLanguage('en');
    }
  }

  public useLanguage(lang: Locale): void {
    this.translateService.use(lang);
    localStorage.setItem('language', lang);
  }
}
