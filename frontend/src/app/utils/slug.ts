// Reproduit la règle de slug du backend, pour fabriquer slug_pc côté front.
// Ordre du pipeline (le même piège qu'en S3) : accents → minuscules → remplacement → trim.
export function slugify(nom: string): string {
  return nom
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')   // enlève les accents (é → e)
    .toLowerCase()                                                                  // AVANT le remplacement
    .replace(/[^a-z0-9]+/g, '_')                              // tout le reste → _
    .replace(/^_+|_+$/g, '');                                 // pas de _ au début/fin (EN DERNIER)
}

export function slugPc(nom: string): string {
  return 'pc_' + slugify(nom);
}
