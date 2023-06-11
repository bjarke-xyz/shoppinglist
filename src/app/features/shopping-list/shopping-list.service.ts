import { HttpClient } from '@angular/common/http';
import { Injectable, effect, signal } from '@angular/core';
import { Observable, catchError, of, tap, throwError } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AddItemToListResponse, Item, List, ListItem } from './shoppinglist';
import { AuthService } from '../../core/service/auth.service';
import { clientId } from 'src/app/core/interceptor/client-id.interceptor';

const SelectedListKey = 'SELECTED_LIST';

@Injectable({
  providedIn: 'root',
})
export class ShoppingListService {
  public items = signal<Item[]>([]);
  private itemsEffect = effect(
    () => {
      const itemIds = new Set(this.items().map((x) => x.id));
      // console.log('items effect', itemIds.size);
      this.selectedList.mutate((currentlySelectedList) => {
        if (!currentlySelectedList) {
          return;
        }
        // console.log('items effect 2', itemIds.size, currentlySelectedList);
        const toRemove = new Set<string>();
        for (const item of currentlySelectedList.items) {
          if (!itemIds.has(item.itemId)) {
            toRemove.add(item.itemId);
          }
        }
        currentlySelectedList.items = currentlySelectedList.items.filter(
          (x) => !toRemove.has(x.itemId)
        );
      });
    },
    { allowSignalWrites: true }
  );

  public lists = signal<List[] | undefined>(undefined);
  private listsEffect = effect(
    () => {
      const lists = this.lists();
      if (lists === undefined) return;
      // console.log('lists effect', lists.length);
      this.selectedList.update((currentlySelectedList) => {
        if (!currentlySelectedList) {
          return null;
        }
        // console.log('lists effect 2', lists.length, currentlySelectedList);
        const correspondingList = lists.find(
          (x) => x.id === currentlySelectedList.id
        );
        if (!correspondingList) {
          return null;
        }
        return correspondingList;
      });
    },
    { allowSignalWrites: true }
  );

  public selectedList = signal<List | null | undefined>(undefined);
  private selectedListEffect = effect(() => {
    const selectedList = this.selectedList();
    // console.log('selectedList effect', selectedList);
    if (selectedList === undefined) {
      return;
    }
    if (selectedList) {
      this.setLocalSelectedList(selectedList);
      this.connectToWebSocket(selectedList);
    } else {
      this.closeWebSocketConnection();
    }
  });

  private selectedListWebSocket = new Map<string, WebSocket>();

  constructor(private http: HttpClient, private authService: AuthService) {
    this.restoreSelectedList();
  }

  getItems(): Observable<Item[]> {
    return this.http.get<Item[]>(`${environment.apiUrl}/api/items`).pipe(
      tap((items) => {
        this.items.set(items);
      }),
      catchError((err) => {
        this.items.set([]);
        return throwError(() => err);
      })
    );
  }

  createItem(item: CreateItemRequest): Observable<Item> {
    return this.http.post<Item>(`${environment.apiUrl}/api/items`, item).pipe(
      tap((createdItem) => {
        this.items.mutate((items) => {
          items.push(createdItem);
        });
      })
    );
  }

  updateItem(id: string, item: CreateItemRequest): Observable<Item> {
    return this.http
      .put<Item>(`${environment.apiUrl}/api/items/${id}`, item)
      .pipe(
        tap((updatedItem) => {
          this.items.mutate((items) => {
            const index = items.findIndex((x) => x.id === id);
            if (index === -1) {
              items.push(updatedItem);
            } else {
              items[index] = updatedItem;
            }
          });
        })
      );
  }

  deleteItem(id: string): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/api/items/${id}`).pipe(
      tap(() => {
        this.items.mutate((items) => {
          const index = items.findIndex((x) => x.id === id);
          if (index !== -1) {
            items.splice(index, 1);
          }
        });
      })
    );
  }

  private connectToWebSocket(list: List): void {
    const existingWs = this.selectedListWebSocket.get(list.id);
    if (existingWs) {
      if (existingWs.readyState == WebSocket.OPEN) {
        return;
      }
      if (existingWs.readyState == WebSocket.CLOSED) {
        this.closeWebSocketConnection(list.id);
      }
    }
    const ws = new WebSocket(
      `${
        environment.wsUrl
      }/api/sse/sse?idToken=${this.authService.getToken()}&listId=${list.id}`
    );
    ws.addEventListener('message', (event) => {
      const payload = JSON.parse(event.data) as BroadcastPayload;
      if (payload.initiator === clientId) {
        return;
      }
      console.log(payload);
      switch (payload.type) {
        case 'ListItemCrossed': {
          const data = payload.data as ListItemCrossed;
          this.lists.mutate((lists) => {
            if (!lists) return;
            const l = lists.find((x) => x.id === list.id);
            if (!l) return;
            const item = l.items.find((x) => x.itemId === data.itemId);
            if (!item) return;
            item.crossed = data.crossed;
          });
          break;
        }
        case 'ListItemAdded': {
          const data = payload.data as ListItemAddEvent;
          this.lists.mutate((lists) => {
            if (!lists) return;
            const l = lists.find((x) => x.id === list.id);
            if (!l) return;
            l.items = data.listItems;
          });
          this.items.mutate((items) => {
            const itemAlreadyExists = items.some(
              (x) => x.id === data.addedItem.id
            );
            if (!itemAlreadyExists) {
              items.push(data.addedItem);
            }
          });
          break;
        }
        case 'ListItemsRemoved': {
          const data = payload.data as ListItemsRemoved;
          this.lists.mutate((lists) => {
            if (!lists) return;
            const l = lists.find((x) => x.id === list.id);
            if (!l) return;
            l.items = l.items.filter((x) => !data.itemIds.includes(x.itemId));
          });
        }
      }
    });
    this.selectedListWebSocket.set(list.id, ws);
  }

  private closeWebSocketConnection(listId?: string): void {
    if (listId) {
      const ws = this.selectedListWebSocket.get(listId);
      if (ws) {
        ws.close();
        this.selectedListWebSocket.delete(listId);
      }
    } else {
      for (const [list, ws] of this.selectedListWebSocket) {
        ws.close();
      }
      this.selectedListWebSocket.clear();
    }
  }

  private restoreSelectedList(): void {
    const list = this.getLocalSelectedList();
    if (!list) {
      return;
    }
    // console.log('restore', list);
    this.selectedList.set(list);
  }

  private setLocalSelectedList(list: List): void {
    localStorage.setItem(SelectedListKey, JSON.stringify(list));
  }
  public clearLocalSelectedList(): void {
    localStorage.removeItem(SelectedListKey);
  }
  private getLocalSelectedList(): List | null {
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
        this.lists.set(lists);
      }),
      catchError((err) => {
        this.lists.set([]);
        return throwError(() => err);
      })
    );
  }

  createList(req: CreateListRequest) {
    return this.http.post<List>(`${environment.apiUrl}/api/lists`, req).pipe(
      tap((list) => {
        this.lists.mutate((lists) => {
          if (lists === undefined) return;
          lists.push(list);
        });
      })
    );
  }

  updateList(listId: string, req: CreateItemRequest) {
    return this.http
      .put<List>(`${environment.apiUrl}/api/list/${listId}`, req)
      .pipe(
        tap((updatedList) => {
          this.lists.mutate((lists) => {
            if (lists === undefined) return;
            const index = lists.findIndex((x) => x.id === listId);
            if (index === -1) {
              lists.push(updatedList);
            } else {
              lists[index] = updatedList;
            }
          });
        })
      );
  }

  deleteList(listId: string) {
    return this.http
      .delete<void>(`${environment.apiUrl}/api/lists/${listId}`)
      .pipe(
        tap(() => {
          this.lists.mutate((lists) => {
            if (lists === undefined) return;
            const index = lists.findIndex((x) => x.id === listId);
            if (index !== -1) {
              lists.splice(index, 1);
            }
          });
        })
      );
  }

  addItemToList(itemName: string): Observable<null | AddItemToListResponse> {
    const selectedList = this.selectedList();
    if (!selectedList) {
      return of(null);
    }
    return this.http
      .post<AddItemToListResponse>(
        `${environment.apiUrl}/api/lists/${selectedList.id}/items`,
        { itemName }
      )
      .pipe(
        tap(({ listItems, addedItem }) => {
          this.selectedList.mutate((list) => {
            if (!list) {
              return;
            }
            list.items = listItems;
          });
          this.items.mutate((items) => {
            const itemAlreadyExists = items.some((x) => x.id === addedItem.id);
            if (!itemAlreadyExists) {
              items.push(addedItem);
            }
          });
        })
      );
  }

  removeFromList(itemIds: string[]): Observable<void> {
    const selectedList = this.selectedList();
    if (!selectedList) {
      return of();
    }
    return this.http
      .patch<void>(
        `${environment.apiUrl}/api/lists/${selectedList.id}/items/delete`,
        { itemIds }
      )
      .pipe(
        tap(() => {
          this.selectedList.mutate((list) => {
            if (!list) return;
            list.items = list.items.filter((x) => !itemIds.includes(x.itemId));
          });
        })
      );
  }

  crossListItem(itemId: string, crossed: boolean): Observable<void> {
    const selectedList = this.selectedList();
    if (!selectedList) {
      return of();
    }
    return this.http
      .patch<void>(
        `${environment.apiUrl}/api/lists/${selectedList.id}/items/${itemId}/crossed`,
        { crossed }
      )
      .pipe(
        tap(() => {
          this.selectedList.mutate((list) => {
            if (!list) return;
            for (const listItem of list.items) {
              if (listItem.itemId === itemId) {
                listItem.crossed = crossed;
              }
            }
          });
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
type EventType = 'ListItemAdded' | 'ListItemsRemoved' | 'ListItemCrossed';
type EventData = ListItemAddEvent | ListItemsRemoved | ListItemCrossed;
interface BroadcastPayload {
  type: EventType;
  data: EventData;
  initiator?: string;
}
interface ListItemAddEvent {
  listItems: ListItem[];
  addedItem: Item;
}
interface ListItemsRemoved {
  itemIds: string[];
}
interface ListItemCrossed {
  itemId: string;
  crossed: boolean;
}
