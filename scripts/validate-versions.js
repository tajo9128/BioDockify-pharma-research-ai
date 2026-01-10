const fs = require('fs');
const path = require('path');

const VERSION_FILES = {
    'package.json': (content) => JSON.parse(content).version,
    'ui/package.json': (content) => JSON.parse(content).version,
    'desktop/tauri/src-tauri/Cargo.toml': (content) => {
        const match = content.match(/version\s*=\s*"([^"]+)"/);
        return match ? match[1] : null;
    },
    'desktop/tauri/src-tauri/tauri.conf.json': (content) => JSON.parse(content).package.version,
    'installer/setup.nsi': (content) => {
        const match = content.match(/OutFile\s+"BioDockify_Setup_v([^"]+)\.exe"/);
        return match ? match[1] : null;
    },
    'runtime/config_loader.py': (content) => {
        const match = content.match(/"version":\s*"([^"]+)"/);
        return match ? match[1] : null;
    }
};

console.log('🔍 Validating version synchronization...\n');

const versions = new Map();
let hasErrors = false;

Object.entries(VERSION_FILES).forEach(([file, parser]) => {
    const filePath = path.join(__dirname, '..', file);

    if (!fs.existsSync(filePath)) {
        console.error(`❌ File not found: ${file}`);
        hasErrors = true;
        return;
    }

    try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const version = parser(content);

        if (!version) {
            console.error(`❌ Could not extract version from: ${file}`);
            hasErrors = true;
            return;
        }

        versions.set(file, version);
        console.log(`   ${file.padEnd(50)} → ${version}`);
    } catch (error) {
        console.error(`❌ Error parsing ${file}: ${error.message}`);
        hasErrors = true;
    }
});

console.log();

if (hasErrors) {
    console.error('❌ Version validation FAILED due to parsing errors');
    process.exit(1);
}

// Check if all versions are the same
const uniqueVersions = new Set(versions.values());

if (uniqueVersions.size !== 1) {
    console.error('❌ VERSION MISMATCH DETECTED\n');
    console.error('All files must have the same version. Found:');

    const versionGroups = new Map();
    versions.forEach((version, file) => {
        if (!versionGroups.has(version)) {
            versionGroups.set(version, []);
        }
        versionGroups.get(version).push(file);
    });

    versionGroups.forEach((files, version) => {
        console.error(`\n  Version ${version}:`);
        files.forEach(file => console.error(`    - ${file}`));
    });

    console.error('\n💡 Fix: Run version bump script to synchronize all files\n');
    process.exit(1);
}

const syncedVersion = [...uniqueVersions][0];
console.log(`✅ All versions synchronized: ${syncedVersion}\n`);
process.exit(0);
