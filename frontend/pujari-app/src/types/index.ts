export type UserRole = 'admin' | 'user';

export interface User {
    id: string;
    email: string;
    role: UserRole;
    name?: string;
}

export interface ApiResponse<T> {
    data: T;
    message: string;
    status: number;
}
