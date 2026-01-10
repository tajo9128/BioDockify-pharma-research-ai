const fs = require('fs');
const path = require('path');

const FILES_TO_CHECK = [
    'ui/src/lib/agent/full_constitution_text.ts',
    'ui/src/lib/agent/default_constitution.ts'
];

let hasErrors = false;

console.log('🔍 Validating template literals...\n');

FILES_TO_CHECK.forEach(file => {
    const filePath = path.join(__dirname, '..', file);

    if (!fs.existsSync(filePath)) {
        console.warn(`⚠️  File not found: ${file}`);
        return;
    }

    const content = fs.readFileSync(filePath, 'utf-8');

    // Check for nested backticks within template literals
    // Match template literals (backtick to backtick, non-greedy)
    const templateLiteralRegex = /`[\s\S]*?`/g;
    const literals = content.match(templateLiteralRegex) || [];

    literals.forEach((literal, index) => {
        // Count unescaped backticks (should be exactly 2: opening and closing)
        const unescapedBackticks = (literal.match(/(?<!\\)`/g) || []).length;

        if (unescapedBackticks > 2) {
            console.error(`❌ NESTED BACKTICKS DETECTED in ${file}`);
            console.error(`   Template literal #${index + 1} has ${unescapedBackticks} backticks (expected 2)`);
            console.error('   Fix: Use \\` to escape or remove backticks from the content\n');
            hasErrors = true;
        }
    });

    // Additional check: look for escaped closing backticks which break the template
    if (content.includes('\\`;')) {
        console.error(`❌ ESCAPED CLOSING BACKTICK DETECTED in ${file}`);
        console.error('   Found: \\`; (should be: `;)');
        console.error('   This will cause "Unexpected EOF" errors\n');
        hasErrors = true;
    }

    if (!hasErrors) {
        console.log(`✅ ${file}`);
    }
});

if (hasErrors) {
    console.error('\n❌ Template literal validation FAILED');
    process.exit(1);
}

console.log('\n✅ All template literal validations passed');
process.exit(0);
