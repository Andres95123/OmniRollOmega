import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import { createReadStream, createWriteStream } from 'fs';
import archiver from 'archiver';

const execAsync = promisify(exec);

interface BrowserConfig {
  name: string;
  target: string;
  distDir: string;
  zipName: string;
  needsPersona?: boolean;
}

const browsers: BrowserConfig[] = [
  {
    name: 'Chrome',
    target: 'chrome',
    distDir: 'dist-chrome',
    zipName: 'OmniRoll-Chrome.zip'
  },
  {
    name: 'Firefox',
    target: 'firefox',
    distDir: 'dist-firefox',
    zipName: 'OmniRoll-Firefox.zip'
  },
  {
    name: 'Opera',
    target: 'chrome', // Opera uses Chrome's manifest format
    distDir: 'dist-opera',
    zipName: 'OmniRoll-Opera.zip',
    needsPersona: true
  }
];

async function cleanDist() {
  console.log('🧹 Cleaning previous builds...');
  
  for (const browser of browsers) {
    if (fs.existsSync(browser.distDir)) {
      await execAsync(`Remove-Item -Recurse -Force ${browser.distDir}`, { shell: 'powershell.exe' });
    }
    
    if (fs.existsSync(browser.zipName)) {
      await execAsync(`Remove-Item -Force ${browser.zipName}`, { shell: 'powershell.exe' });
    }
  }
}

async function buildForBrowser(config: BrowserConfig) {
  console.log(`🔨 Building ${config.name} extension...`);
  
  const env = {
    ...process.env,
    TARGET: config.target
  };
  
  // Build the extension
  await execAsync('npm run build', { env });
  
  // Rename dist to browser-specific directory
  if (fs.existsSync('dist')) {
    await execAsync(`Move-Item dist ${config.distDir}`, { shell: 'powershell.exe' });
  }
  
  // Copy persona.ini for Opera
  if (config.needsPersona) {
    await copyPersonaFile(config.distDir);
  }
  
  console.log(`✅ ${config.name} build completed`);
}

async function copyPersonaFile(distDir: string) {
  console.log('📄 Adding persona.ini for Opera...');
  
  // Read manifest to get current version and info
  const manifestPath = path.join(distDir, 'manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  
  // Create persona.ini content based on manifest
  const personaContent = `[persona]
name=${manifest.name}
description=${manifest.description}
version=${manifest.version}
author=DarkShadowsDev
`;
  
  // Write persona.ini to dist directory
  const personaPath = path.join(distDir, 'persona.ini');
  fs.writeFileSync(personaPath, personaContent, 'utf8');
  
  console.log('✅ persona.ini added successfully');
}

async function createZip(config: BrowserConfig): Promise<void> {
  return new Promise((resolve, reject) => {
    console.log(`📦 Creating ${config.zipName}...`);
    
    const output = createWriteStream(config.zipName);
    const archive = archiver('zip', {
      zlib: { level: 9 } // Maximum compression
    });
    
    output.on('close', () => {
      console.log(`✅ ${config.zipName} created (${archive.pointer()} bytes)`);
      resolve();
    });
    
    archive.on('error', (err) => {
      reject(err);
    });
    
    archive.pipe(output);
    archive.directory(config.distDir, false);
    archive.finalize();
  });
}

async function validateBuild(config: BrowserConfig) {
  const manifestPath = path.join(config.distDir, 'manifest.json');
  const popupPath = path.join(config.distDir, 'src', 'popup.html');
  const backgroundPath = path.join(config.distDir, 'src', 'background.js');
  const contentPath = path.join(config.distDir, 'src', 'content.js');
  
  const requiredFiles = [manifestPath, popupPath, backgroundPath, contentPath];
  
  for (const file of requiredFiles) {
    if (!fs.existsSync(file)) {
      throw new Error(`❌ Required file missing: ${file}`);
    }
  }
  
  // Validate manifest
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  if (!manifest.name || !manifest.version || !manifest.description) {
    throw new Error(`❌ Invalid manifest for ${config.name}`);
  }
  
  console.log(`✅ ${config.name} build validation passed`);
}

async function main() {
  try {
    console.log('🚀 Starting extension deployment process...\n');
    
    // Clean previous builds
    await cleanDist();
    
    // Build for each browser
    for (const config of browsers) {
      await buildForBrowser(config);
      await validateBuild(config);
      await createZip(config);
      console.log('');
    }
    
    console.log('🎉 Deployment completed successfully!');
    console.log('\n📁 Generated files:');
    for (const config of browsers) {
      console.log(`  - ${config.zipName} (ready for ${config.name} Web Store)`);
    }
    
    console.log('\n📋 Next steps:');
    console.log('  1. Upload OmniRoll-Chrome.zip to Chrome Web Store');
    console.log('  2. Upload OmniRoll-Firefox.zip to Firefox Add-ons');
    console.log('  3. Upload OmniRoll-Opera.zip to Opera Add-ons');
    
  } catch (error) {
    console.error('❌ Deployment failed:', error);
    process.exit(1);
  }
}

// Run the deployment
main();