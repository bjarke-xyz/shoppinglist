import { Component } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ToastService } from 'src/app/shared/services/toast.service';
import { ShoppingListService } from '../../shopping-list.service';
import { Item } from '../../shoppinglist';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-items',
  templateUrl: './items.component.html',
  styleUrls: ['./items.component.scss'],
})
export class ItemsComponent {
  public getSubscription = Subscription.EMPTY;
  public subscription = Subscription.EMPTY;
  public items = this.shoppingListService.items;
  public form = this.fb.group({
    itemName: [''],
  });
  constructor(
    private shoppingListService: ShoppingListService,
    private toastService: ToastService,
    private dialog: MatDialog,
    private fb: FormBuilder
  ) {
    this.getSubscription = this.shoppingListService.getItems().subscribe({
      error: (error) => {
        this.toastService.error(error);
      },
    });
  }

  deleteItem(item: Item): void {
    this.subscription = this.shoppingListService.deleteItem(item.id).subscribe({
      error: (error) => {
        this.toastService.error(error);
      },
    });
  }
}
