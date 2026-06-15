import { UserRole } from "./user.model";

export interface AdminUser {
    name: string;
    username: string;
    role: UserRole;
}
