import { Component, OnInit } from '@angular/core';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { AuthService } from 'src/app/core/service/auth.service';
import { ListPickerComponent } from './components/list-picker/list-picker.component';
import { ShoppingListService } from './shopping-list.service';
import { List } from './shoppinglist';
import { ToastService } from 'src/app/shared/services/toast.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-shopping-list',
  templateUrl: './shopping-list.component.html',
  styleUrls: ['./shopping-list.component.scss'],
})
export class ShoppingListComponent implements OnInit {
  public selectedList = this.shoppinglistService.selectedList;
  constructor(
    private authService: AuthService,
    private shoppinglistService: ShoppingListService,
    private bottomSheet: MatBottomSheet,
    private toast: ToastService,
    private router: Router
  ) {}
  ngOnInit(): void {
    this.shoppinglistService.getItems().subscribe();
    this.shoppinglistService.getLists().subscribe();
  }

  public openListPicker() {
    this.bottomSheet.open(ListPickerComponent);
  }

  public removeCrossed(list: List): void {
    const crossed = list.items.filter((x) => x.crossed);
    this.shoppinglistService
      .removeFromList(crossed.map((x) => x.itemId))
      .subscribe({
        error: (error) => {
          this.toast.error(error);
        },
      });
  }

  public removeAll(list: List): void {
    this.shoppinglistService
      .removeFromList(list.items.map((x) => x.itemId))
      .subscribe({
        error: (error) => {
          this.toast.error(error);
        },
      });
  }

  public logout(): void {
    this.shoppinglistService.selectList(null);
    this.authService.logout();
    this.router.navigateByUrl('/');
  }
}
