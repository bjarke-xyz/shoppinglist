import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ShoppingListRoutingModule } from './shopping-list-routing.module';
import { ShoppingListComponent } from './shopping-list.component';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MainComponent } from './pages/main/main.component';
import { ItemsComponent } from './pages/items/items.component';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@NgModule({
  declarations: [ShoppingListComponent, MainComponent, ItemsComponent],
  imports: [
    CommonModule,
    ShoppingListRoutingModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
  ],
})
export class ShoppingListModule {}
