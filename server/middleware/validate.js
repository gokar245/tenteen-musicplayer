// Simple validation middleware

export const validateEmail = (email) => {
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    return emailRegex.test(email);
};

export const validateRequired = (fields) => {
    return (req, res, next) => {
        const missing = [];

        for (const field of fields) {
            if (!req.body[field]) {
                missing.push(field);
            }
        }

        if (missing.length > 0) {
            return res.status(400).json({
                message: `Missing required fields: ${missing.join(', ')}`
            });
        }

        next();
    };
};

export const validateFileUpload = (allowedFormats, maxSizeMB) => {
    return (req, res, next) => {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const ext = req.file.originalname.split('.').pop().toLowerCase();
        if (!allowedFormats.includes(ext)) {
            return res.status(400).json({
                message: `Invalid file format. Allowed: ${allowedFormats.join(', ')}`
            });
        }

        const fileSizeMB = req.file.size / (1024 * 1024);
        if (fileSizeMB > maxSizeMB) {
            return res.status(400).json({
                message: `File too large. Maximum size: ${maxSizeMB}MB`
            });
        }

        next();
    };
};

export default { validateEmail, validateRequired, validateFileUpload };
