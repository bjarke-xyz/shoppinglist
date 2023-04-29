import { NgModule } from '@angular/core';
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
