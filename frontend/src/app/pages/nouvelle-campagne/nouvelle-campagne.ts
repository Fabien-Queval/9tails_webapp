import { Component } from '@angular/core';
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';

@Component({
  selector: 'app-nouvelle-campagne',
  imports: [ReactiveFormsModule],
  templateUrl: './nouvelle-campagne.html',
  styleUrl: './nouvelle-campagne.scss',
})
export class NouvelleCampagne {

  formulaire = new FormGroup({
    titre: new FormControl('', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]),
    genre: new FormControl('', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]),
    description: new FormControl(''),
    maturite: new FormControl('', [Validators.required]),
  })

}
