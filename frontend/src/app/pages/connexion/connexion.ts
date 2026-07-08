import {Component, inject} from '@angular/core';
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {Auth} from '../../core/auth';
import {Router} from '@angular/router';

@Component({
  selector: 'app-connexion',
  imports: [ReactiveFormsModule],
  templateUrl: './connexion.html',
  styleUrl: './connexion.scss',
})
export class Connexion {
  private auth = inject(Auth);
  private router = inject(Router);

  formulaire = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required, Validators.minLength(8)]),
  })


  onSubmit() {
    if (this.formulaire.invalid) return;                                  // Le Garde-fou
    const { email, password } = this.formulaire.getRawValue()             // Ce que l'utilisateur a tapé
    this.auth.login(email!, password!).subscribe({
      next: (response) => {
        this.auth.saveToken(response.token);
        this.router.navigate(['/tableau-de-bord']);                       // Une fois le token en poche
      },
      error: error => console.log('❌ erreur :', error),
    })
  }
}
