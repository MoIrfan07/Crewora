const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Building Crewora...');

try {
    // Clean
    console.log('Cleaning previous builds...');
    if (fs.existsSync('release')) {
        fs.rmSync('release', { recursive: true, force: true });
    }
    if (fs.existsSync('frontend/dist')) {
        fs.rmSync('frontend/dist', { recursive: true, force: true });
    }

    // Build frontend
    console.log('Building React app...');
    execSync('cd frontend && npm run build', { stdio: 'inherit' });

    // Verify build
    const indexPath = path.join('frontend', 'dist', 'index.html');
    if (!fs.existsSync(indexPath)) {
        console.error('❌ Frontend build failed! index.html not found.');
        process.exit(1);
    }
    console.log('✅ Frontend built successfully');

    // Build Electron app
    console.log('Packaging Electron app...');
    execSync('npx electron-builder --win --x64', { stdio: 'inherit' });

    console.log('✅ Build completed successfully!');
    console.log('📁 Output in: release/');

} catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
}