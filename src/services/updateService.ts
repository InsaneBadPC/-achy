/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface AppReleaseInfo {
  hasUpdate: boolean;
  currentVersion: string;
  latestVersion: string;
  releaseName: string;
  releaseNotes: string;
  downloadUrl: string;
  publishedAt: string;
}

export interface DownloadProgress {
  loaded: number;
  total: number;
  percent: number;
  speed: string;
}

export const CURRENT_APP_VERSION = '1.0.5';
const DEFAULT_REPO = 'InsaneBadPC/-achy';

/**
 * Compare two semver-like version strings (e.g., "1.0.4" vs "1.0.5")
 * Returns 1 if v2 > v1, -1 if v1 > v2, 0 if equal
 */
export function compareVersions(v1: string, v2: string): number {
  const clean1 = v1.replace(/^v/i, '').trim();
  const clean2 = v2.replace(/^v/i, '').trim();

  const p1 = clean1.split('.').map((n) => parseInt(n, 10) || 0);
  const p2 = clean2.split('.').map((n) => parseInt(n, 10) || 0);

  const len = Math.max(p1.length, p2.length);
  for (let i = 0; i < len; i++) {
    const num1 = p1[i] || 0;
    const num2 = p2[i] || 0;
    if (num2 > num1) return 1;
    if (num1 > num2) return -1;
  }
  return 0;
}

/**
 * Check GitHub Releases API (and fallback tags/version.json) for the latest published APK build
 */
export async function checkForGitHubUpdate(repoName: string = DEFAULT_REPO): Promise<AppReleaseInfo> {
  const defaultResult: AppReleaseInfo = {
    hasUpdate: false,
    currentVersion: CURRENT_APP_VERSION,
    latestVersion: CURRENT_APP_VERSION,
    releaseName: '',
    releaseNotes: '',
    downloadUrl: `https://github.com/${repoName}/releases`,
    publishedAt: '',
  };

  try {
    // 1. Try local version.json first (generated during CI build)
    try {
      const localVerRes = await fetch('/version.json?t=' + Date.now(), { cache: 'no-store' });
      if (localVerRes.ok) {
        const localVer = await localVerRes.json();
        if (localVer && localVer.version) {
          defaultResult.currentVersion = localVer.version;
        }
      }
    } catch {
      // Ignore local fetch failure in dev mode
    }

    // 2. Query GitHub Releases API (first try /releases/latest, then /releases list)
    let releaseData: any = null;
    const latestRes = await fetch(`https://api.github.com/repos/${repoName}/releases/latest`, {
      headers: {
        Accept: 'application/vnd.github.v3+json',
      },
      cache: 'no-store',
    });

    if (latestRes.ok) {
      releaseData = await latestRes.json();
    } else {
      const listRes = await fetch(`https://api.github.com/repos/${repoName}/releases?per_page=5`, {
        headers: {
          Accept: 'application/vnd.github.v3+json',
        },
        cache: 'no-store',
      });
      if (listRes.ok) {
        const list = await listRes.json();
        if (Array.isArray(list) && list.length > 0) {
          releaseData = list[0];
        }
      }
    }

    if (!releaseData) {
      return defaultResult;
    }

    const tagName = releaseData.tag_name || releaseData.name || '';
    const cleanTag = tagName.replace(/^v/i, '').trim();

    // Find APK asset in release
    let apkDownloadUrl = releaseData.html_url || `https://github.com/${repoName}/releases/latest`;
    if (Array.isArray(releaseData.assets)) {
      const apkAsset = releaseData.assets.find(
        (a: { name: string; browser_download_url: string }) =>
          a.name && a.name.toLowerCase().endsWith('.apk')
      );
      if (apkAsset) {
        apkDownloadUrl = apkAsset.browser_download_url;
      }
    }

    const hasNewer = cleanTag ? compareVersions(defaultResult.currentVersion, cleanTag) > 0 : false;

    return {
      hasUpdate: hasNewer,
      currentVersion: defaultResult.currentVersion,
      latestVersion: cleanTag || defaultResult.currentVersion,
      releaseName: releaseData.name || `Verze ${cleanTag}`,
      releaseNotes:
        releaseData.body ||
        'Nové sestavení s vylepšenou 3D grafikou, českými hlasy postaviček, funkční AI a bonusy.',
      downloadUrl: apkDownloadUrl,
      publishedAt: releaseData.published_at || '',
    };
  } catch (err) {
    console.warn('Update check failed:', err);
    return defaultResult;
  }
}

/**
 * Download update directly inside the app with real-time progress.
 * If running on native Android, triggers native DownloadManager & Package Installer.
 * In web/PWA mode, uses streaming fetch and triggers seamless file download.
 */
export async function downloadUpdateInApp(
  url: string,
  fileName: string = 'WackyChess-Update.apk',
  onProgress?: (progress: DownloadProgress) => void
): Promise<void> {
  // 1. Try native Capacitor Android updater plugin first
  try {
    const { Capacitor, registerPlugin } = await import('@capacitor/core');
    if (Capacitor.isNativePlatform()) {
      const NativeUpdater = registerPlugin<{
        downloadAndInstall: (opts: { url: string; fileName: string }) => Promise<{ status: string; downloadId: number }>;
      }>('NativeUpdater');
      await NativeUpdater.downloadAndInstall({ url, fileName });
      return;
    }
  } catch (err) {
    console.warn('Native updater plugin bypassed or unavailable:', err);
  }

  // 2. In-app streaming fetch downloader with real-time percentage
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Stahování selhalo (HTTP ${response.status})`);
  }

  const contentLength = response.headers.get('content-length');
  const total = contentLength ? parseInt(contentLength, 10) : 0;
  let loaded = 0;
  const startTime = Date.now();

  const reader = response.body?.getReader();
  if (!reader) {
    const blob = await response.blob();
    triggerBlobDownload(blob, fileName);
    return;
  }

  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      chunks.push(value);
      loaded += value.length;
      const elapsedSec = (Date.now() - startTime) / 1000 || 0.1;
      const speedMBs = (loaded / (1024 * 1024) / elapsedSec).toFixed(1);
      const percent = total > 0 ? Math.min(100, Math.round((loaded / total) * 100)) : 50;

      onProgress?.({
        loaded,
        total: total || loaded,
        percent,
        speed: `${speedMBs} MB/s`,
      });
    }
  }

  const blob = new Blob(chunks as BlobPart[], { type: 'application/vnd.android.package-archive' });
  triggerBlobDownload(blob, fileName);
}

function triggerBlobDownload(blob: Blob, fileName: string) {
  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
}
