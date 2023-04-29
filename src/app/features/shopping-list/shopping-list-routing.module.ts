import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ShoppingListComponent } from './shopping-list.component';
import { MainComponent } from './pages/main/main.component';
import { ItemsComponent } from './pages/items/items.component';

const routes: Routes = [
  {
    path: '',
    component: ShoppingListComponent,
    children: [
      {
        path: '',
        redirectTo: 'main',
        pathMatch: 'full',
      },
      {
        path: 'main',
        component: MainComponent,
      },
      {
        path: 'items',
        component: ItemsComponent,
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ShoppingListRoutingModule {}
