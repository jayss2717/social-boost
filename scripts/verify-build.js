const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying build files...');

const requiredFiles = [
  'hooks/useMetrics.ts',
  'hooks/useSubscription.ts',
  'hooks/useInfluencers.ts',
  'hooks/useUgcPosts.ts',
  'hooks/usePayouts.ts',
  'components/PaywallModal.tsx',
  'components/UsageMeter.tsx',
  'app/page.tsx',
  'app/influencers/page.tsx',
  'app/test/page.tsx'
];

let allFilesExist = true;

requiredFiles.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - MISSING`);
    allFilesExist = false;
  }
});

if (allFilesExist) {
  console.log('\n🎉 All required files exist!');
  process.exit(0);
} else {
  console.log('\n💥 Some files are missing!');
  process.exit(1);
} 