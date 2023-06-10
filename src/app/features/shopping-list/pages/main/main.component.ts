import { Component, OnInit, computed, effect } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl } from '@angular/forms';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { Subscription, startWith } from 'rxjs';
import { ToastService } from 'src/app/shared/services/toast.service';
import { ShoppingListService } from '../../shopping-list.service';
import { Item, ListItem } from '../../shoppinglist';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss'],
})
export class MainComponent implements OnInit {
  public addItemSubscription = Subscription.EMPTY;
  public selectedList = this.shoppinglistService.selectedList;
  autocompleteControl = new FormControl('');
  private autocompleteControlValueChanges = toSignal(
    this.autocompleteControl.valueChanges.pipe(startWith(''))
  );
  public filteredItems = computed(() =>
    this._filter(
      this.shoppinglistService.items(),
      this.autocompleteControlValueChanges()
    )
  );
  constructor(
    private shoppinglistService: ShoppingListService,
    private toast: ToastService
  ) {
    effect(() => {
      console.log(this.filteredItems());
    });
    effect(() => {
      console.log(this.shoppinglistService.items());
    });
  }
  ngOnInit(): void {}

  public onSubmit(inputValue: string | null) {
    const value = inputValue?.trim();
    if (!value || !this.addItemSubscription.closed) {
      return;
    }
    this.addItemSubscription = this.shoppinglistService
      .addItemToList(value)
      .subscribe({
        next: () => {
          this.autocompleteControl.reset();
        },
        error: (error) => {
          this.toast.error(error);
        },
      });
  }

  public onOptionSelected(event: MatAutocompleteSelectedEvent) {
    return this.onSubmit(event.option.value);
  }

  private _filter(items: Item[], value: string | null | undefined): Item[] {
    if (!value || value === '') {
      return items;
    }
    const filterValue = value.toLowerCase();
    return items.filter((item) =>
      item.name.toLowerCase().includes(filterValue)
    );
  }

  public crossListItem(listItem: ListItem): void {
    const oldCrossedValue = listItem.crossed;
    const newCrossedValue = !listItem.crossed;
    listItem.crossed = newCrossedValue;
    this.shoppinglistService
      .crossListItem(listItem.itemId, newCrossedValue)
      .subscribe({
        error: (error) => {
          this.toast.error(error);
          listItem.crossed = oldCrossedValue;
        },
      });
  }
}
