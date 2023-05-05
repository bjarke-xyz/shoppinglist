import { Injectable, inject } from '@angular/core';
import { AuthService } from '../service/auth.service';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs';

export const authGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.refreshIfNecessary().pipe(
    map((loggedIn) => {
      if (loggedIn) {
        return true;
      }

      const currentPath = window.location.pathname;
      return router.parseUrl(`/auth/login?return=${currentPath}`);
    })
  );
};
