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
    const storageLang = this.getStorageLang();
    if (storageLang) {
      this.useLanguage(storageLang);
    } else if (typeof window !== 'undefined' && window.navigator?.language) {
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
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('language', lang);
      }
    } catch (error) {
      console.error('failed to set localstorage language', error);
    }
  }

  private getStorageLang(): Locale | null {
    if (typeof localStorage === 'undefined') {
      return null;
    }
    try {
      const storageLang = localStorage.getItem('language') as Locale;
      return storageLang;
    } catch {
      return null;
    }
  }
}
