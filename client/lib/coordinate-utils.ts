// Convert database numbers to display strings
export function formatCoordinate(coord: number | null | undefined): string {
    if (coord === null || coord === undefined) return "";
    return coord.toString();
}

// Convert form strings to database numbers
export function parseCoordinate(coord: string | undefined): number | undefined {
    if (!coord || coord.trim() === "") return undefined;
    const parsed = parseFloat(coord);
    return isNaN(parsed) ? undefined : parsed;
}
