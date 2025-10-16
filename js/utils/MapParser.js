// Parse RTF map files into usable level data
export class MapParser {
    // Cache for parsed level data
    static levelCache = {};
    static cacheLoaded = false;

    static async loadLevelCache(progressCallback) {
        console.log('Loading level cache from JSON...');
        try {
            const response = await fetch('/js/data/levelCache.json');
            const cacheData = await response.json();

            // Convert array to indexed object
            for (const levelEntry of cacheData) {
                if (levelEntry.data) {
                    MapParser.levelCache[levelEntry.level - 1] = levelEntry.data;
                }
            }

            MapParser.cacheLoaded = true;
            console.log(`Level cache loaded: ${Object.keys(MapParser.levelCache).length} levels`);

            if (progressCallback) {
                progressCallback(1.0);
            }

            return true;
        } catch (error) {
            console.error('Error loading level cache:', error);
            return false;
        }
    }

    static getCachedLevel(levelIndex) {
        if (!MapParser.cacheLoaded) {
            console.warn('Level cache not loaded yet!');
            return null;
        }
        return MapParser.levelCache[levelIndex] || null;
    }
}
