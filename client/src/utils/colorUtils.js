
/**
 * Extracts dominant colors from an image URL or File object.
 * Returns a promise that resolves to an array of hex color strings.
 */
export const extractColors = (imageSource) => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "Anonymous";

        if (imageSource instanceof File) {
            img.src = URL.createObjectURL(imageSource);
        } else {
            img.src = imageSource;
        }

        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            // Downscale for performance
            const width = 50;
            const height = 50;
            canvas.width = width;
            canvas.height = height;

            ctx.drawImage(img, 0, 0, width, height);

            try {
                const imageData = ctx.getImageData(0, 0, width, height).data;
                const colors = {};

                for (let i = 0; i < imageData.length; i += 4) {
                    const r = imageData[i];
                    const g = imageData[i + 1];
                    const b = imageData[i + 2];
                    const a = imageData[i + 3];

                    if (a < 128) continue; // Skip transparent

                    // Simple quantization (rounding to nearest 10)
                    const key = `${Math.round(r / 20) * 20},${Math.round(g / 20) * 20},${Math.round(b / 20) * 20}`;
                    colors[key] = (colors[key] || 0) + 1;
                }

                // Sort by frequency
                const sortedColors = Object.entries(colors)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 6) // Top 6
                    .map(entry => {
                        const [r, g, b] = entry[0].split(',').map(Number);
                        const toHex = (c) => {
                            const hex = c.toString(16);
                            return hex.length === 1 ? '0' + hex : hex;
                        };
                        return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
                    });

                // If we have enough colors, return them. Otherwise return default.
                if (sortedColors.length === 0) {
                    resolve(['#394867', '#000000']);
                } else if (sortedColors.length === 1) {
                    resolve([sortedColors[0], '#000000']);
                } else {
                    resolve(sortedColors);
                }
            } catch (e) {
                console.error("Color extraction failed", e);
                resolve(['#394867', '#000000']);
            }
        };

        img.onerror = (e) => {
            console.error("Image load failed", e);
            resolve(['#394867', '#000000']);
        };
    });
};

/**
 * Generates a CSS linear-gradient string from an array of colors.
 */
export const generateGradient = (colors) => {
    if (!colors || colors.length === 0) return 'linear-gradient(135deg, #394867, #000000)';
    if (colors.length === 1) return `linear-gradient(135deg, ${colors[0]}, #000000)`;

    if (colors.length >= 3) {
        return `linear-gradient(135deg, ${colors[0]} 0%, ${colors[1]} 50%, ${colors[2]} 100%)`;
    }

    return `linear-gradient(135deg, ${colors[0]} 0%, ${colors[1]} 100%)`;
};

/**
 * Generates the Spotify-style background object.
 */
export const generateSpotifyGradient = (colors) => {
    const primary = colors[0] || '#394867';
    // Deep vertical gradient
    const css = `linear-gradient(180deg, ${primary} 0%, rgba(18,18,18,0.8) 70%, #121212 100%)`;

    return {
        colors: colors.slice(0, 6),
        css: css
    };
};
