import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { TranslateModule } from '@ngx-translate/core';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    FormsModule,
    MatSnackBarModule,
    ReactiveFormsModule,
    TranslateModule,
  ],
  exports: [
    CommonModule,
    FormsModule,
    MatSnackBarModule,
    ReactiveFormsModule,
    TranslateModule,
  ],
})
export class SharedModule {}
