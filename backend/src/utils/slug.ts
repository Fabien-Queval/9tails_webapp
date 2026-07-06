

export function slugify(entity: string) {
    const normalizedEntity = entity.normalize('NFD').replace(/[\u0300-\u036f]/g, '');   // 1. plie les accents
    const loweredEntity    = normalizedEntity.toLowerCase();                                                        // 2. minuscules
    const slugifiedEntity  = loweredEntity.replace(/[^a-z0-9]+/g, '_');                      // 3. non-alphanum → _
    const trimmedEntity    = slugifiedEntity.replace(/^_+|_+$/g, '');                        // 4. trim les _ aux bouts

    return trimmedEntity;
}

export function slugNpc(nom: string) {
    return ('npc_' + slugify(nom))
}