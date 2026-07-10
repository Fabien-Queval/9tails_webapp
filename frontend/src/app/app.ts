import { Component, inject, signal } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { Auth } from './core/auth';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('9tails');

  // J'expose Auth au template : isLoggedIn() décide si le header s'affiche,
  // et deconnexion() sera branché sur le bouton de déconnexion.
  protected readonly auth = inject(Auth);
  private readonly router = inject(Router);

  // Je vide le JWT (logout) puis je renvoie l'utilisateur vers l'écran de connexion.
  deconnexion(): void {
    this.auth.logout();
    this.router.navigate(['/connexion']);
  }
}
