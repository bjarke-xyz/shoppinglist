import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ShoppingListRoutingModule } from './shopping-list-routing.module';
import { ShoppingListComponent } from './shopping-list.component';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MainComponent } from './pages/main/main.component';
import { ItemsComponent } from './pages/items/items.component';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatDialogModule } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ListPickerComponent } from './components/list-picker/list-picker.component';
@NgModule({
  declarations: [ShoppingListComponent, MainComponent, ItemsComponent, ListPickerComponent],
  imports: [
    CommonModule,
    ShoppingListRoutingModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatListModule,
    MatDialogModule,
    MatInputModule,
    FormsModule,
    ReactiveFormsModule,
  ],
})
export class ShoppingListModule {}
