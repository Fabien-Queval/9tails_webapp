import {Component, inject} from '@angular/core';
import {FormControl, ReactiveFormsModule, Validators, FormGroup} from '@angular/forms';
import {Auth} from '../../core/auth';
import {Router} from '@angular/router';

@Component({
  selector: 'app-inscription',
    imports: [
        ReactiveFormsModule
    ],
  templateUrl: './inscription.html',
  styleUrl: './inscription.scss',
})
export class Inscription {
  private auth = inject(Auth);
  private router = inject(Router);

  formulaire = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    pseudo: new FormControl('', [Validators.required, Validators.minLength(3)]),
    password: new FormControl('', [Validators.required,Validators.minLength(8)]),
  })

  onSubmit() {
    if (this.formulaire.invalid) return;
    const { email, pseudo, password } = this.formulaire.getRawValue();
    this.auth.register(email!, pseudo!, password!).subscribe({
      next: (response) => {
        this.auth.saveToken(response.token);
        this.router.navigate(['/tableau-de-bord']);
      },
      error: error => console.log('❌ erreur :', error),
    })
  }
}

