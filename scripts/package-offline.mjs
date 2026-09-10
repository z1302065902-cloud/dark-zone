/* Build offline full-version ZIP: dist + launchers → dark-zone-vX.Y.Z-full.zip */
import { copyFileSync, mkdirSync, rmSync, existsSync, readFileSync, statSync } from 'fs';
import { execSync } from 'child_process';
import { join } from 'path';

const root = '/Users/zsy/dark-zone';
const version = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).version;
const zipName = `dark-zone-v${version}-full.zip`;
const zipPath = join('/tmp', zipName);

// 1. Copy launchers into dist
for (const f of ['启动游戏.command', '启动游戏.bat', '使用说明.txt']) {
  copyFileSync(join(root, 'launcher', f), join(root, 'dist', f));
}

// 2. Zip (ignore macOS junk)
const tmpdir = '/tmp/dz-offline-pkg';
if (existsSync(tmpdir)) rmSync(tmpdir, { recursive: true });
mkdirSync(tmpdir);
execSync(`cp -R "${root}/dist/" "${tmpdir}/"`, { stdio: 'inherit' });
execSync(`cd "${tmpdir}" && zip -r "${zipPath}" . -x ".*" "__MACOSX/*"`, { stdio: 'inherit' });

const size = (existsSync(zipPath) ? statSync(zipPath).size : 0) / 1048576;
console.log(`ZIP_READY=${zipPath} (${size.toFixed(1)} MB)`);
