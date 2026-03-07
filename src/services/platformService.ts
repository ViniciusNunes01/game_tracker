const abbreviationMap: Record<string, string> = {
    'playstation': 'PS',
    'playstation 1': 'PS1',
    'playstation 2': 'PS2',
    'playstation 3': 'PS3',
    'playstation 4': 'PS4',
    'playstation 5': 'PS5',
    'ps vita': 'Vita',
    'playstation vita': 'Vita',
    'playstation portable': 'PSP',
    'nintendo switch': 'Switch',
    'nintendo switch 2': 'Switch 2',
    'wii u': 'Wii U',
    'xbox': 'Xbox',
    'xbox 360': 'X360',
    'xbox one': 'XOne',
    'xbox series x|s': 'XSX|S',
    'xbox series x': 'XSX',
    'xbox series s': 'XSS',
    'pc (microsoft windows)': 'PC',
    'microsoft windows': 'PC',
};

export function getPlatformAbbreviation(platformName: string, igdbAbbreviation?: string): string {
    if (igdbAbbreviation?.trim()) {
        return igdbAbbreviation.trim();
    }

    const normalized = platformName.trim().toLowerCase();

    if (abbreviationMap[normalized]) {
        return abbreviationMap[normalized];
    }

    if (normalized.startsWith('playstation ')) {
        const match = normalized.match(/playstation\s+(\d+)/);
        if (match?.[1]) {
            return `PS${match[1]}`;
        }
    }

    return platformName;
}
