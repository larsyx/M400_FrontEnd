export enum UserRole {
    ADMIN = "amministratore",
    USER = "utente",
    MIXER = "mixerista",
    VIDEO = "video"
}

export interface JwtPayload {
    sub: string;
    role: UserRole;
    exp: number;
}

export interface User {
    username: string;
    role: UserRole;
}