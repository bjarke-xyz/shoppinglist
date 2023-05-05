import { Component, OnDestroy, OnInit } from '@angular/core';
import { ShoppingListService } from '../../shopping-list.service';
import {
  Observable,
  Subject,
  Subscription,
  map,
  of,
  startWith,
  takeUntil,
  tap,
} from 'rxjs';
import { Item, List, ListItem } from '../../shoppinglist';
import { FormControl } from '@angular/forms';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { ToastService } from 'src/app/shared/services/toast.service';
import { orderBy } from 'lodash';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss'],
})
export class MainComponent implements OnInit, OnDestroy {
  public addItemSubscription = Subscription.EMPTY;
  private readonly destroy = new Subject<void>();
  public selectedList = this.shoppinglistService.selectedList;
  autocompleteControl = new FormControl('');
  public items: Item[] = [];
  public filteredItems: Observable<Item[]> = of([]);
  constructor(
    private shoppinglistService: ShoppingListService,
    private toast: ToastService
  ) {}
  ngOnInit(): void {
    this.shoppinglistService.items
      .pipe(takeUntil(this.destroy))
      .subscribe((items) => {
        this.items = items;
        // patch control value to trigger other observable
        // this.autocompleteControl.patchValue('');
      });
    this.filteredItems = this.autocompleteControl.valueChanges.pipe(
      takeUntil(this.destroy),
      startWith(''),
      map((value) => this._filter(value))
    );
  }
  ngOnDestroy(): void {
    this.destroy.next();
    this.destroy.complete();
  }

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

  private _filter(value: string | null): Item[] {
    if (!value || value === '') {
      return this.items;
    }
    const filterValue = value.toLowerCase();
    return this.items.filter((item) =>
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
