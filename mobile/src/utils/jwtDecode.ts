export function jwtDecode<T>(token: string): T {
    const parts = token.split('.');
    if (parts.length !== 3) throw new Error('Invalid JWT format');
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    try {
        const json = decodeURIComponent(
            atob(base64)
                .split('')
                .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
        );
        return JSON.parse(json) as T;
    } catch {
        throw new Error('Failed to decode token payload');
    }
}
