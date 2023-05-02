import { Injectable } from '@angular/core';
import {
  BehaviorSubject,
  Observable,
  Subject,
  filter,
  of,
  skip,
  tap,
} from 'rxjs';
import { Item, List, ListItem } from './shoppinglist';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

const SelectedListKey = 'SELECTED_LIST';

@Injectable({
  providedIn: 'root',
})
export class ShoppingListService {
  private _items = new BehaviorSubject<Item[]>([]);
  public items = this._items.asObservable();

  private _lists = new BehaviorSubject<List[]>([]);
  public lists = this._lists.asObservable();

  private _selectedList = new BehaviorSubject<List | null>(null);
  public selectedList = this._selectedList.asObservable();

  constructor(private http: HttpClient) {
    this.restoreSelectedList();

    this.lists.pipe(skip(1)).subscribe({
      next: (lists) => {
        const selectedList = this._selectedList.value;
        if (!selectedList) {
          return;
        }
        const correspondingList = lists.find((x) => x.id === selectedList.id);
        if (!correspondingList) {
          this.selectList(null);
          return;
        }
        if (correspondingList.name !== selectedList.name) {
          this.selectList(correspondingList);
        }
      },
    });
  }

  getItems(): Observable<Item[]> {
    return this.http.get<Item[]>(`${environment.apiUrl}/api/items`).pipe(
      tap((items) => {
        this._items.next(items);
      })
    );
  }

  createItem(item: CreateItemRequest): Observable<Item> {
    return this.http.post<Item>(`${environment.apiUrl}/api/items`, item).pipe(
      tap((createdItem) => {
        this._items.next([...this._items.value, createdItem]);
      })
    );
  }

  updateItem(id: string, item: CreateItemRequest): Observable<Item> {
    return this.http
      .put<Item>(`${environment.apiUrl}/api/items/${id}`, item)
      .pipe(
        tap((updatedItem) => {
          const items = this._items.value;
          const index = items.findIndex((x) => x.id === id);
          if (index === -1) {
            items.push(updatedItem);
          } else {
            items[index] = updatedItem;
          }
          this._items.next(items);
        })
      );
  }

  deleteItem(id: string): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/api/items/${id}`).pipe(
      tap(() => {
        this._items.next([...this._items.value.filter((x) => x.id !== id)]);
      })
    );
  }

  selectList(list: List | null): void {
    this._selectedList.next(list);
    this.setSelectedList(list);
  }

  private restoreSelectedList(): void {
    const list = this.getSelectedList();
    if (!list) {
      return;
    }
    this.selectList(list);
  }

  private setSelectedList(list: List | null): void {
    if (!list) {
      localStorage.removeItem(SelectedListKey);
      return;
    }
    localStorage.setItem(SelectedListKey, JSON.stringify(list));
  }
  private getSelectedList(): List | null {
    const json = localStorage.getItem(SelectedListKey);
    if (!json) {
      return null;
    }
    const list = JSON.parse(json) as List;
    return list;
  }

  getLists(): Observable<List[]> {
    return this.http.get<List[]>(`${environment.apiUrl}/api/lists`).pipe(
      tap((lists) => {
        this._lists.next(lists);
      })
    );
  }

  createList(req: CreateListRequest) {
    return this.http.post<List>(`${environment.apiUrl}/api/lists`, req).pipe(
      tap((list) => {
        this._lists.next([...this._lists.value, list]);
      })
    );
  }

  updateList(listId: string, req: CreateItemRequest) {
    return this.http
      .put<List>(`${environment.apiUrl}/api/list/${listId}`, req)
      .pipe(
        tap((updatedList) => {
          const lists = this._lists.value;
          const index = lists.findIndex((x) => x.id === listId);
          if (index === -1) {
            lists.push(updatedList);
          } else {
            lists[index] = updatedList;
          }
          this._lists.next(lists);
        })
      );
  }

  deleteList(listId: string) {
    return this.http
      .delete<void>(`${environment.apiUrl}/api/lists/${listId}`)
      .pipe(
        tap(() => {
          this._lists.next([
            ...this._lists.value.filter((x) => x.id !== listId),
          ]);
        })
      );
  }

  addItemToList(itemName: string): Observable<null | ListItem[]> {
    const selectedList = this._selectedList.value;
    if (!selectedList) {
      return of(null);
    }
    return this.http
      .post<ListItem[]>(
        `${environment.apiUrl}/api/lists/${selectedList.id}/items`,
        { itemName }
      )
      .pipe(
        tap((listItems) => {
          selectedList.items = listItems;
          this.selectList(selectedList);
        })
      );
  }
}

export interface CreateItemRequest {
  name: string;
}

export interface CreateListRequest {
  name: string;
}
