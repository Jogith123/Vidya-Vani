// Helper script to update BASE_URL in .env file
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const newUrl = args[0];

if (!newUrl) {
  console.log('❌ Please provide a URL');
  console.log('Usage: node update-url.js https://your-tunnel-url.loca.lt');
  process.exit(1);
}

const envPath = path.join(__dirname, '.env');

try {
  let envContent = fs.readFileSync(envPath, 'utf8');
  
  // Update BASE_URL
  const urlRegex = /BASE_URL=.*/;
  if (urlRegex.test(envContent)) {
    envContent = envContent.replace(urlRegex, `BASE_URL=${newUrl}`);
  } else {
    envContent += `\nBASE_URL=${newUrl}\n`;
  }
  
  fs.writeFileSync(envPath, envContent);
  
  console.log('✅ BASE_URL updated successfully!');
  console.log(`📍 New URL: ${newUrl}`);
  console.log('\n🔄 Please restart your server (npm run server)');
} catch (error) {
  console.error('❌ Error updating .env:', error.message);
  process.exit(1);
}
