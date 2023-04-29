import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/core/service/auth.service';

@Component({
  selector: 'app-shopping-list',
  templateUrl: './shopping-list.component.html',
  styleUrls: ['./shopping-list.component.scss'],
})
export class ShoppingListComponent implements OnInit {
  constructor(private authService: AuthService) {}
  ngOnInit(): void {
    const token = this.authService.decodeToken();
    console.log(token);
  }
}
