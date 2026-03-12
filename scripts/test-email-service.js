import { cleanEmails, validateEmail, scoreLead } from '../src/services/emailService.js';

console.log('=== Email Service Test ===\n');

console.log('1. Testing email cleaning:\n');
const testEmails = [
  'info@company.com',
  'contact@business.vn',
  'test@yahoo.com',
  'hello@outlook.com',
  'noreply@domain.com',
  'admin@example.com',
  'logo@2x.png',
  'invalid-email',
  'support@realestate.com',
  'webmaster@site.com'
];

console.log('Input emails:', testEmails);
const cleaned = cleanEmails(testEmails);
console.log('Cleaned emails:', cleaned);
console.log(`Removed: ${testEmails.length - cleaned.length} invalid/blacklisted emails\n`);

console.log('2. Testing email validation:\n');
const validationTests = [
  'info@company.com',
  'test@yahoo.com',
  'invalid',
  'logo.png',
];

validationTests.forEach(email => {
  const isValid = validateEmail(email);
  console.log(`  ${email}: ${isValid ? '✓ Valid' : '✗ Invalid'}`);
});

console.log('\n3. Testing lead scoring:\n');
const leads = [
  {
    email: 'info@company.com',
    website: 'company.com',
    phone: '+84123456',
    rating: 4.8,
    reviews: 200
  },
  {
    email: '',
    website: 'business.com',
    phone: '',
    rating: 3.5,
    reviews: 10
  },
  {
    email: 'contact@shop.vn',
    website: '',
    phone: '+84987654',
    rating: 4.2,
    reviews: 50
  },
  {
    email: '',
    website: '',
    phone: '',
    rating: 0,
    reviews: 0
  }
];

leads.forEach((lead, i) => {
  const score = scoreLead(lead);
  console.log(`Lead ${i + 1}: Score = ${score}/100`);
  console.log(`  Email: ${lead.email || 'none'}, Website: ${lead.website || 'none'}, Phone: ${lead.phone || 'none'}`);
  console.log(`  Rating: ${lead.rating}, Reviews: ${lead.reviews}\n`);
});

console.log('=== Test Complete ===');
