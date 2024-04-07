import { HttpClient } from '@angular/common/http';
import { Injectable, effect, signal } from '@angular/core';
import {
  Observable,
  catchError,
  firstValueFrom,
  of,
  tap,
  throwError,
} from 'rxjs';
import { environment } from 'src/environments/environment';
import { AddItemToListResponse, Item, List, ListItem } from './shoppinglist';
import { AuthService } from '../../core/service/auth.service';
import { clientId } from 'src/app/core/interceptor/client-id.interceptor';
import { isEqual } from 'lodash-es';

const SelectedListKey = 'SELECTED_LIST';

@Injectable({
  providedIn: 'root',
})
export class ShoppingListService {
  public items = signal<Item[] | undefined>(undefined, { equal: isEqual });
  private itemsEffect = effect(
    () => {
      const items = this.items();
      if (items === undefined) return;
      const itemIds = new Set(items.map((x) => x.id));
      // console.log('items effect', itemIds.size);
      this.selectedList.update((currentlySelectedList) => {
        if (!currentlySelectedList) {
          return currentlySelectedList;
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
        return { ...currentlySelectedList }
      });
    },
    { allowSignalWrites: true }
  );

  public lists = signal<List[] | undefined>(undefined, { equal: isEqual });
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

  public selectedList = signal<List | null | undefined>(undefined, {
    equal: isEqual,
  });
  private selectedListEffect = effect(() => {
    const selectedList = this.selectedList();
    // console.log('selectedList effect', selectedList);
    if (selectedList === undefined) {
      return;
    }
    if (selectedList) {
      this.setLocalSelectedList(selectedList);
      try {
        this.connectToWebSocketForList(selectedList);
      } catch (error) {
        console.error('ws failed');
      }
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
        this.items.update((items) => {
          if (!items) return items;
          return [...items, createdItem];
        });
      })
    );
  }

  updateItem(id: string, item: CreateItemRequest): Observable<Item> {
    return this.http
      .put<Item>(`${environment.apiUrl}/api/items/${id}`, item)
      .pipe(
        tap((updatedItem) => {
          this.items.update((items) => {
            if (!items) return items;
            const newItems = [...items]
            const index = newItems.findIndex((x) => x.id === id);
            if (index === -1) {
              newItems.push(updatedItem);
            } else {
              newItems[index] = updatedItem;
            }
            return newItems
          });
        })
      );
  }

  deleteItem(id: string): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/api/items/${id}`).pipe(
      tap(() => {
        this.items.update((items) => {
          if (!items) return items;
          const newItems = [...items]
          const index = newItems.findIndex((x) => x.id === id);
          if (index !== -1) {
            newItems.splice(index, 1);
          }
          return newItems;
        });
      })
    );
  }

  private connectToWebSocket(
    list: List,
    wsInfo: {
      wsUrl: string;
      ticket: { token: string };
    }
  ) {
    const ws = new WebSocket(`${wsInfo.wsUrl}?token=${wsInfo.ticket.token}`);
    this.selectedListWebSocket.set(list.id, ws);
    ws.addEventListener('error', (event) => {
      console.error('ws error', event);
      this.closeWebSocketConnection(list.id);
    });
    ws.addEventListener('close', (event) => {
      console.log('ws close', event);
      this.closeWebSocketConnection(list.id);
    });
    ws.addEventListener('message', (event) => {
      const payload = JSON.parse(event.data) as BroadcastPayload;
      if (payload.initiator === clientId) {
        return;
      }
      console.log(payload);
      switch (payload.type) {
        case 'ListItemCrossed': {
          const data = payload.data as ListItemCrossed;
          this.lists.update((lists) => {
            if (!lists) return lists;
            const newLists = [...lists];
            const l = newLists.find((x) => x.id === list.id);
            if (!l) return newLists;
            const item = l.items.find((x) => x.itemId === data.itemId);
            if (!item) return newLists;
            item.crossed = data.crossed;
            return newLists;
          });
          break;
        }
        case 'ListItemAdded': {
          const data = payload.data as ListItemAddEvent;
          this.lists.update((lists) => {
            if (!lists) return lists;
            const newLists = [...lists]
            const l = newLists.find((x) => x.id === list.id);
            if (!l) return newLists;
            l.items = data.listItems;
            return newLists;
          });
          this.items.update((items) => {
            if (!items) return items;
            const newItems = [...items]
            const itemAlreadyExists = newItems.some(
              (x) => x.id === data.addedItem.id
            );
            if (!itemAlreadyExists) {
              newItems.push(data.addedItem);
            }
            return newItems;
          });
          break;
        }
        case 'ListItemsRemoved': {
          const data = payload.data as ListItemsRemoved;
          this.lists.update((lists) => {
            if (!lists) return lists;
            const newLists = [...lists]
            const l = newLists.find((x) => x.id === list.id);
            if (!l) return newLists;
            l.items = l.items.filter((x) => !data.itemIds.includes(x.itemId));
            return newLists
          });
          break;
        }
        case 'ItemDeleted': {
          const data = payload.data as ItemDeletedEvent;
          this.items.update((items) => {
            if (!items) return items;
            const newItems = [...items]
            const index = newItems.findIndex((x) => x.id === data.itemId);
            if (index !== -1) {
              newItems.splice(index, 1);
            }
            return newItems;
          });
        }
      }
    });
  }

  private connectToWebSocketForList(list: List): void {
    const existingWs = this.selectedListWebSocket.get(list.id);
    if (existingWs) {
      switch (existingWs.readyState) {
        case WebSocket.OPEN:
        case WebSocket.CONNECTING:
          return;
        default:
          this.closeWebSocketConnection(list.id);
          break;
      }
    }
    this.createWsTicket(list.id).subscribe({
      next: (wsInfo) => {
        this.connectToWebSocket(list, wsInfo);
      },
    });
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

  private createWsTicket(
    listId: string
  ): Observable<{ wsUrl: string; ticket: { token: string } }> {
    return this.http.post<{ wsUrl: string; ticket: { token: string } }>(
      `${environment.apiUrl}/api/sse/ws/ticket?listId=${listId}`,
      null
    );
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
        this.lists.update((lists) => {
          if (lists === undefined) return lists;
          return [...lists, list];
        });
      })
    );
  }

  updateList(listId: string, req: CreateItemRequest) {
    return this.http
      .put<List>(`${environment.apiUrl}/api/list/${listId}`, req)
      .pipe(
        tap((updatedList) => {
          this.lists.update((lists) => {
            if (lists === undefined) return lists;
            const newLists = [...lists];
            const index = newLists.findIndex((x) => x.id === listId);
            if (index === -1) {
              newLists.push(updatedList);
            } else {
              newLists[index] = updatedList;
            }
            return newLists;
          });
        })
      );
  }

  deleteList(listId: string) {
    return this.http
      .delete<void>(`${environment.apiUrl}/api/lists/${listId}`)
      .pipe(
        tap(() => {
          this.lists.update((lists) => {
            if (lists === undefined) return lists;
            const newLists = [...lists]
            const index = newLists.findIndex((x) => x.id === listId);
            if (index !== -1) {
              newLists.splice(index, 1);
            }
            return newLists;
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
          this.selectedList.update((list) => {
            if (!list) {
              return list;
            }
            const newList = { ...list }
            newList.items = listItems;
            return newList;
          });
          this.items.update((items) => {
            if (!items) return items;
            const newItems = [...items]
            const itemAlreadyExists = newItems.some((x) => x.id === addedItem.id);
            if (!itemAlreadyExists) {
              newItems.push(addedItem);
            }
            return newItems;
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
          this.selectedList.update((list) => {
            if (!list) return list;
            const newList = { ...list }
            newList.items = newList.items.filter((x) => !itemIds.includes(x.itemId));
            return newList
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
          this.selectedList.update((list) => {
            if (!list) return list;
            const newList = { ...list }
            for (const listItem of newList.items) {
              if (listItem.itemId === itemId) {
                listItem.crossed = crossed;
              }
            }
            return newList;
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

type EventType =
  | 'ListItemAdded'
  | 'ListItemsRemoved'
  | 'ListItemCrossed'
  | 'ItemDeleted';
type EventData =
  | ListItemAddEvent
  | ListItemsRemoved
  | ListItemCrossed
  | ItemDeletedEvent;
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
interface ItemDeletedEvent {
  itemId: string;
}
