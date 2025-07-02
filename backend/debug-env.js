require('dotenv').config();

console.log('Environment Variables:');
console.log('AWS_REGION:', process.env.AWS_REGION);
console.log('DYNAMODB_ENDPOINT:', process.env.DYNAMODB_ENDPOINT);
console.log('AWS_ACCESS_KEY_ID:', process.env.AWS_ACCESS_KEY_ID);
console.log('JWT_SECRET:', process.env.JWT_SECRET);
console.log('PORT:', process.env.PORT); 