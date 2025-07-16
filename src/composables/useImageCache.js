// Composable for using cached images
export function useImageCache() {
    // Get the cached image URL or return original if not cached
    const getCachedImageUrl = (url) => {
        // Check if the image is in the global cache
        if (window.deskImageCache && window.deskImageCache.has(url)) {
            const cachedImage = window.deskImageCache.get(url);
            // Return the cached image's src (which should be the same URL but now cached)
            return cachedImage.src;
        }

        // If not cached, return original URL
        return url;
    };

    // Pre-cache an image URL for immediate use
    const preloadImage = (url) => {
        return new Promise((resolve, reject) => {
            // Check if already cached
            if (window.deskImageCache && window.deskImageCache.has(url)) {
                resolve(window.deskImageCache.get(url));
                return;
            }

            const img = new Image();
            img.onload = () => {
                // Store in cache
                if (!window.deskImageCache) {
                    window.deskImageCache = new Map();
                }
                window.deskImageCache.set(url, img);
                resolve(img);
            };
            img.onerror = reject;
            img.src = url;
        });
    };

    // Check if an image is cached
    const isImageCached = (url) => {
        return window.deskImageCache && window.deskImageCache.has(url);
    };

    return {
        getCachedImageUrl,
        preloadImage,
        isImageCached
    };
}
