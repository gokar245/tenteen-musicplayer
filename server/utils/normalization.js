export const normalize = (str) => {
    if (!str) return '';
    return str
        .toLowerCase()
        .trim()
        .replace(/\s+/g, ' ') // Replace multiple spaces with a single space
        .replace(/[^\w\s]/gi, ''); // Optional: remove punctuation
};

export default normalize;
