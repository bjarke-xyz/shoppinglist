import { NgModule, TransferState, isDevMode } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { CoreModule } from './core/core.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { SharedModule } from './shared/shared.module';
import {
  MAT_RIPPLE_GLOBAL_OPTIONS,
  RippleGlobalOptions,
} from '@angular/material/core';
import { ServiceWorkerModule } from '@angular/service-worker';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { translateBrowserLoaderFactory } from './core/utils/translate-browser.loader';
import { HttpClient } from '@angular/common/http';
const globalRippleConfig: RippleGlobalOptions = {
  disabled: true,
};
@NgModule({
  declarations: [AppComponent],
  imports: [
    // angular
    BrowserModule.withServerTransition({ appId: 'serverApp' }),
    BrowserAnimationsModule,

    // core + shared
    CoreModule,
    SharedModule,

    // app
    AppRoutingModule,
    ServiceWorkerModule.register('ngsw-worker.js', {
      enabled: !isDevMode(),
      // Register the ServiceWorker as soon as the application is stable
      // or after 30 seconds (whichever comes first).
      registrationStrategy: 'registerWhenStable:30000',
    }),

    // translation
    TranslateModule.forRoot({
      defaultLanguage: 'en',
      loader: {
        provide: TranslateLoader,
        useFactory: translateBrowserLoaderFactory,
        deps: [HttpClient, TransferState],
      },
    }),
  ],
  providers: [
    {
      provide: MAT_RIPPLE_GLOBAL_OPTIONS,
      useValue: globalRippleConfig,
    },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
