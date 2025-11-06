const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

describe('Preact Application Setup', () => {
  const playgroundDir = path.join(__dirname, '..');
  const distDir = path.join(playgroundDir, 'dist');
  const frontendSrcDir = path.join(playgroundDir, 'src', 'frontend');

  test('should have TypeScript configuration', () => {
    const tsconfigPath = path.join(playgroundDir, 'tsconfig.json');
    expect(fs.existsSync(tsconfigPath)).toBe(true);
    
    const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
    expect(tsconfig.compilerOptions.jsx).toBe('react-jsx');
    expect(tsconfig.compilerOptions.jsxImportSource).toBe('preact');
  });

  test('should have webpack configuration', () => {
    const webpackConfigPath = path.join(playgroundDir, 'webpack.config.js');
    expect(fs.existsSync(webpackConfigPath)).toBe(true);
  });

  test('should have frontend source structure', () => {
    expect(fs.existsSync(frontendSrcDir)).toBe(true);
    expect(fs.existsSync(path.join(frontendSrcDir, 'App.tsx'))).toBe(true);
    expect(fs.existsSync(path.join(frontendSrcDir, 'index.tsx'))).toBe(true);
  });

  test('should build successfully', () => {
    expect(() => {
      execSync('npm run build', { 
        cwd: playgroundDir, 
        stdio: 'pipe',
        timeout: 30000 
      });
    }).not.toThrow();
    
    expect(fs.existsSync(distDir)).toBe(true);
    expect(fs.existsSync(path.join(distDir, 'index.html'))).toBe(true);
  });

  test('should have required dependencies', () => {
    const packageJsonPath = path.join(playgroundDir, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    expect(packageJson.dependencies.preact).toBeDefined();
    expect(packageJson.devDependencies.typescript).toBeDefined();
    expect(packageJson.devDependencies.webpack).toBeDefined();
    expect(packageJson.devDependencies['ts-loader']).toBeDefined();
  });

  test('should have build and dev scripts', () => {
    const packageJsonPath = path.join(playgroundDir, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    expect(packageJson.scripts.build).toBeDefined();
    expect(packageJson.scripts['dev:frontend']).toBeDefined();
  });
});
