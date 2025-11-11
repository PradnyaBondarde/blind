export function generateCustomId(prefix, count) {
    return `${prefix}${String(count + 1).padStart(3, '0')}`;
}
