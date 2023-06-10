import { Component, WritableSignal, computed } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { orderBy } from 'lodash-es';
import { OperatorFunction, Subscription, map } from 'rxjs';
import { ToastService } from 'src/app/shared/services/toast.service';
import { ShoppingListService } from '../../shopping-list.service';
import { List } from '../../shoppinglist';

@Component({
  selector: 'app-list-picker',
  templateUrl: './list-picker.component.html',
  styleUrls: ['./list-picker.component.scss'],
})
export class ListPickerComponent {
  public subscription = Subscription.EMPTY;
  public lists = computed(() =>
    orderBy(this.shoppingListService.lists(), (x) => x.createdAt)
  );
  public form = this.fb.group({
    listName: [''],
  });
  constructor(
    private shoppingListService: ShoppingListService,
    private bottomSheetRef: MatBottomSheetRef<ListPickerComponent>,
    private fb: FormBuilder,
    private toast: ToastService
  ) {
    this.shoppingListService.getLists().subscribe({
      error: (error) => {
        this.toast.error(error);
      },
    });
  }

  public close() {
    this.bottomSheetRef.dismiss();
  }

  public selectList(list: List) {
    this.shoppingListService.selectedList.set(list);
    this.close();
  }

  public deleteList(list: List) {
    this.subscription = this.shoppingListService.deleteList(list.id).subscribe({
      error: (error) => {
        this.toast.error(error);
      },
    });
  }

  public createList() {
    const listName = this.form.value.listName;
    if (!listName) {
      return;
    }
    this.subscription = this.shoppingListService
      .createList({ name: listName })
      .subscribe({
        next: (list) => {
          this.shoppingListService.selectedList.set(list);
          this.close();
          this.form.reset();
        },
        error: (error) => {
          this.toast.error(error);
        },
      });
  }
}
