export interface Item {
  id: string;
  userId: string;
  name: string;
  createdAt: Date;
}

export interface List {
  id: string;
  userId: string;
  name: string;
  createdAt: Date;
  items: ListItem[];
}

export interface ListItem {
  listId: string;
  itemId: string;
  itemName: string;
  count: number;
  crossed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AddItemToListResponse {
  listItems: ListItem[];
  addedItem: Item;
}
