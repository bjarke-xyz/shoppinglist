import { Component } from '@angular/core';
import { ShoppingListService } from '../../shopping-list.service';
import { Observable } from 'rxjs';
import { Item } from '../../shoppinglist';
import { ToastService } from 'src/app/shared/services/toast.service';
import { MatDialog } from '@angular/material/dialog';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';

interface Form {
  itemName: FormControl<string>;
}

@Component({
  selector: 'app-items',
  templateUrl: './items.component.html',
  styleUrls: ['./items.component.scss'],
})
export class ItemsComponent {
  public items: Observable<Item[]>;
  public form = this.fb.group({
    itemName: [''],
  });
  constructor(
    private shoppingListService: ShoppingListService,
    private toastService: ToastService,
    private dialog: MatDialog,
    private fb: FormBuilder
  ) {
    this.items = shoppingListService.items;
    this.shoppingListService.getItems().subscribe({
      error: (error) => {
        this.toastService.error(error);
      },
    });
  }

  createItem(): void {
    if (!this.form.value.itemName) {
      return;
    }
    this.shoppingListService
      .createItem({ name: this.form.value.itemName })
      .subscribe({
        next: () => {
          this.form.reset();
        },
        error: (error) => {
          this.toastService.error(error);
        },
      });
  }

  deleteItem(item: Item): void {
    this.shoppingListService.deleteItem(item.id).subscribe({
      error: (error) => {
        this.toastService.error(error);
      },
    });
  }
}
