import { Component, OnInit } from '@angular/core';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { AuthService } from 'src/app/core/service/auth.service';
import { ListPickerComponent } from './components/list-picker/list-picker.component';
import { ShoppingListService } from './shopping-list.service';

@Component({
  selector: 'app-shopping-list',
  templateUrl: './shopping-list.component.html',
  styleUrls: ['./shopping-list.component.scss'],
})
export class ShoppingListComponent implements OnInit {
  public selectedList = this.shoppingListService.selectedList;
  constructor(
    private shoppingListService: ShoppingListService,
    private bottomSheet: MatBottomSheet
  ) {}
  ngOnInit(): void {
    this.shoppingListService.getItems().subscribe();
    this.shoppingListService.getLists().subscribe();
  }

  public openListPicker() {
    this.bottomSheet.open(ListPickerComponent);
  }
}
