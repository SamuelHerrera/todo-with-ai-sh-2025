export function isEmptyString(str: string): boolean {
    return str === null || str === undefined || str.trim() === ''
}