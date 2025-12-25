import dotenv from 'dotenv';
dotenv.config();
console.log('PORT:', process.env.PORT);
console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'Defined' : 'Undefined');
process.exit(0);
