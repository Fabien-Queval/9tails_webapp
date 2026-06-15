import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { createUser, getUserByEmail } from '../dal/userDAL';

export async function register(email: string, pseudo: string, password: string) {
    const existingUser = getUserByEmail(email);
    if (existingUser) {
        throw new Error('Cet email est déjà utilisé');
    }

    //La hash a lieu ici. Il est irréversible.
    const hash = await bcrypt.hash(password, 10);

    const user = createUser(email, pseudo, hash);

    const token = jwt.sign({
        id_utilisateur: user.id_utilisateur,
        email: user.email},
        process.env.JWT_SECRET!,
        { expiresIn: '7d' });

    return token;
}

export async function login(email: string, password: string) {
    const user = getUserByEmail(email);
    if (!user) {
        throw new Error ('Identifiants invalides');
    }
    const validePassword = await bcrypt.compare(password, user.mot_de_passe_hash);
    if (!validePassword) {
        throw new Error ('Identifiants invalides');
    }

    const token = jwt.sign({
        id_utilisateur: user.id_utilisateur,
        email: user.email},
        process.env.JWT_SECRET!,
        { expiresIn: '7d' });

    return token;
}