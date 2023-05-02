import { Component, OnDestroy, OnInit } from '@angular/core';
import { ShoppingListService } from '../../shopping-list.service';
import { Observable, Subject, map, of, startWith, takeUntil, tap } from 'rxjs';
import { Item } from '../../shoppinglist';
import { FormControl } from '@angular/forms';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { ToastService } from 'src/app/shared/services/toast.service';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss'],
})
export class MainComponent implements OnInit, OnDestroy {
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
        this.autocompleteControl.patchValue('');
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

  public onSubmit(value: string | null) {
    console.log(value);
    if (!value) {
      return;
    }
    this.shoppinglistService.addItemToList(value).subscribe({
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
}
