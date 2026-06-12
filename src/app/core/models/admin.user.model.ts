import { UserRole } from "./user.model";

export interface AdminUser {
    id: number;
    username: string;
    role: UserRole;
}
