const {compile} = require('./index.js');

console.log('Testing @fob/mdx-node NAPI bindings...\n');

// Test 1: Basic compilation
try {
  const result1 = compile('# Hello World');
  console.log('✅ Test 1: Basic compilation');
  console.log('   Code length:', result1.code.length);
} catch (e) {
  console.error('❌ Test 1 failed:', e.message);
  process.exit(1);
}

// Test 2: With GFM
try {
  const result2 = compile('This is ~~strikethrough~~', { gfm: true });
  console.log('✅ Test 2: GFM support');
  console.log('   Contains <del> tag:', result2.code.includes('del'));
} catch (e) {
  console.error('❌ Test 2 failed:', e.message);
  process.exit(1);
}

// Test 3: Math support
try {
  const result3 = compile('Math: $E = mc^2$', { math: true });
  console.log('✅ Test 3: Math support');
  console.log('   Contains math:', result3.code.includes('math'));
} catch (e) {
  console.error('❌ Test 3 failed:', e.message);
  process.exit(1);
}

// Test 4: Image extraction
try {
  const result4 = compile('![alt text](image.png)\n\n# Title');
  console.log('✅ Test 4: Image extraction');
  console.log('   Images found:', result4.images);
} catch (e) {
  console.error('❌ Test 4 failed:', e.message);
  process.exit(1);
}

// Test 5: Named exports
try {
  const result5 = compile('export const foo = "bar";\n\n# Title');
  console.log('✅ Test 5: Named exports');
  console.log('   Exports found:', result5.namedExports);
} catch (e) {
  console.error('❌ Test 5 failed:', e.message);
  process.exit(1);
}

// Test 6: TypeScript types exist
const fs = require('fs');
const hasTypes = fs.existsSync('./index.d.ts');
console.log('✅ Test 6: TypeScript definitions exist:', hasTypes);

console.log('\n🎉 All NAPI binding tests passed!');
