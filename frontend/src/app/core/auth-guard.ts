import {CanActivateFn, Router} from '@angular/router';
import {Auth} from './auth';
import {inject} from '@angular/core';

export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(Auth);
  const router = inject(Router);

  if (auth.isLoggedIn()) {
    return true;                                    // It's okay
  }

  return router.createUrlTree(['/connexion']);      // Refus !! → Retour à l'écran de connexion (Sinon Tableau de bord vide)
};
