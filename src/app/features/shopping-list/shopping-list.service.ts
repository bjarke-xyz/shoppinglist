import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject, tap } from 'rxjs';
import { Item, List } from './shoppinglist';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ShoppingListService {
  private _items = new BehaviorSubject<Item[]>([]);
  public items = this._items.asObservable();

  private _lists = new BehaviorSubject<List[]>([]);
  public lists = this._lists.asObservable();

  constructor(private http: HttpClient) {}

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
}

export interface CreateItemRequest {
  name: string;
}
