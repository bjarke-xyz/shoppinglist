import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { MatSnackBarModule } from '@angular/material/snack-bar';

@NgModule({
  declarations: [],
  imports: [CommonModule, FormsModule, MatSnackBarModule, ReactiveFormsModule],
  exports: [CommonModule, FormsModule, MatSnackBarModule, ReactiveFormsModule],
})
export class SharedModule {}
