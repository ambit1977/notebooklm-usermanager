#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class VersionManager {
  private packageJsonPath: string;
  private manifestJsonPath: string;
  private changelogPath: string;

  constructor() {
    this.packageJsonPath = path.join(__dirname, '..', 'package.json');
    this.manifestJsonPath = path.join(__dirname, '..', 'src', 'manifest.json');
    this.changelogPath = path.join(__dirname, '..', 'CHANGELOG.md');
  }

  public getCurrentVersion(): string {
    const packageJson = JSON.parse(fs.readFileSync(this.packageJsonPath, 'utf8'));
    return packageJson.version;
  }

  public incrementPatchVersion(currentVersion: string): string {
    const parts = currentVersion.split('.');
    const patch = parseInt(parts[2]) + 1;
    return `${parts[0]}.${parts[1]}.${patch}`;
  }

  public incrementMinorVersion(currentVersion: string): string {
    const parts = currentVersion.split('.');
    const minor = parseInt(parts[1]) + 1;
    return `${parts[0]}.${minor}.0`;
  }

  public incrementMajorVersion(currentVersion: string): string {
    const parts = currentVersion.split('.');
    const major = parseInt(parts[0]) + 1;
    return `${major}.0.0`;
  }

  public updateVersion(newVersion: string, changeDescription: string = ''): void {
    console.log(`Updating version from ${this.getCurrentVersion()} to ${newVersion}`);

    // package.jsonを更新
    const packageJson = JSON.parse(fs.readFileSync(this.packageJsonPath, 'utf8'));
    packageJson.version = newVersion;
    fs.writeFileSync(this.packageJsonPath, JSON.stringify(packageJson, null, 2));

    // manifest.jsonを更新
    const manifestJson = JSON.parse(fs.readFileSync(this.manifestJsonPath, 'utf8'));
    manifestJson.version = newVersion;
    fs.writeFileSync(this.manifestJsonPath, JSON.stringify(manifestJson, null, 2));

    // CHANGELOG.mdを更新
    this.updateChangelog(newVersion, changeDescription);

    console.log(`Version updated to ${newVersion}`);
  }

  private updateChangelog(version: string, description: string): void {
    const today = new Date().toISOString().split('T')[0];
    const changelogEntry = `## [${version}] - ${today}\n${description ? `\n- ${description}\n` : '\n'}`;

    let existingContent = '';
    if (fs.existsSync(this.changelogPath)) {
      existingContent = fs.readFileSync(this.changelogPath, 'utf8');
    } else {
      existingContent = '# Changelog\n\nAll notable changes to this project will be documented in this file.\n\n';
    }

    // 最初の##を見つけて、その前に挿入
    const index = existingContent.indexOf('##');
    if (index === -1) {
      // CHANGELOGがない場合は末尾に追加
      const newContent = existingContent + '\n' + changelogEntry;
      fs.writeFileSync(this.changelogPath, newContent);
    } else {
      // 既存のCHANGELOGの最初の##の前に挿入
      const newContent = existingContent.slice(0, index) + changelogEntry + '\n' + existingContent.slice(index);
      fs.writeFileSync(this.changelogPath, newContent);
    }
  }

  public commitVersion(newVersion: string): void {
    execSync(`git add package.json src/manifest.json CHANGELOG.md`, { stdio: 'inherit' });
    execSync(`git commit -m "chore: bump version to ${newVersion}"`, { stdio: 'inherit' });
    execSync(`git tag -a v${newVersion} -m "Version ${newVersion}"`, { stdio: 'inherit' });
    console.log(`Version ${newVersion} committed and tagged`);
  }

  public pushVersion(): void {
    execSync('git push origin main --tags', { stdio: 'inherit' });
    console.log('Version pushed to remote');
  }
}

// コマンドライン引数を処理
const args = process.argv.slice(2);

if (args.length === 0) {
  console.log('Usage:');
  console.log('  npm run version:patch [description]  - Increment patch version (0.0.1 -> 0.0.2)');
  console.log('  npm run version:minor [description]  - Increment minor version (0.0.1 -> 0.1.0)');
  console.log('  npm run version:major [description]  - Increment major version (0.0.1 -> 1.0.0)');
  console.log('  npm run version:show                 - Show current version');
  process.exit(1);
}

const manager = new VersionManager();
const command = args[0];
const description = args.slice(1).join(' ');

try {
  switch (command) {
    case 'patch':
      const currentVersion = manager.getCurrentVersion();
      const newPatchVersion = manager.incrementPatchVersion(currentVersion);
      manager.updateVersion(newPatchVersion, description);
      break;

    case 'minor':
      const currentVersionMinor = manager.getCurrentVersion();
      const newMinorVersion = manager.incrementMinorVersion(currentVersionMinor);
      manager.updateVersion(newMinorVersion, description);
      break;

    case 'major':
      const currentVersionMajor = manager.getCurrentVersion();
      const newMajorVersion = manager.incrementMajorVersion(currentVersionMajor);
      manager.updateVersion(newMajorVersion, description);
      break;

    case 'show':
      console.log(manager.getCurrentVersion());
      break;

    default:
      console.error(`Unknown command: ${command}`);
      process.exit(1);
  }
} catch (error) {
  console.error('Error:', error);
  process.exit(1);
}
