import dotenv from 'dotenv';
dotenv.config();

console.log('JWT_SECRET present:', !!process.env.JWT_SECRET);
console.log('MONGODB_URI present:', !!process.env.MONGODB_URI);
console.log('NODE_ENV:', process.env.NODE_ENV);
process.exit(0);
