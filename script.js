(function () {
  'use strict';

  const ENDPOINTS = {
    latest: 'https://googlechromelabs.github.io/chrome-for-testing/last-known-good-versions-with-downloads.json',
    known: 'https://googlechromelabs.github.io/chrome-for-testing/known-good-versions-with-downloads.json',
  };

  const PLATFORMS = [
    { key: 'win64', label: 'Windows x64' },
    { key: 'win32', label: 'Windows x86' },
    { key: 'mac-x64', label: 'macOS Intel' },
    { key: 'mac-arm64', label: 'macOS Apple Silicon' },
    { key: 'linux64', label: 'Linux x64' },
    { key: 'linux-arm64', label: 'Linux ARM64' },
  ];

  const COMPONENTS = [
    { key: 'chrome', label: 'Chrome' },
    { key: 'chromedriver', label: 'ChromeDriver' },
    { key: 'chrome-headless-shell', label: 'Headless Shell' },
  ];

  const state = {
    platform: detectPlatform(),
    component: 'chrome',
    query: '',
    latest: {},
  };

  let indexPromise = null;

  const $ = (id) => document.getElementById(id);

  function detectPlatform() {
    const ua = navigator.userAgent;
    const plat = String(
      (navigator.userAgentData && navigator.userAgentData.platform) ||
      navigator.platform || ''
    ).toLowerCase();

    if (plat.includes('mac')) {
      return 'mac-arm64';
    }
    if (plat.includes('win')) {
      return /Win64|WOW64|x64|arm64/i.test(ua) ? 'win64' : 'win32';
    }
    if (plat.includes('linux')) {
      return /aarch64|arm64/i.test(ua) ? 'linux-arm64' : 'linux64';
    }
    return 'win64';
  }

  function compareVersion(a, b) {
    const pa = String(a).split('.').map(Number);
    const pb = String(b).split('.').map(Number);
    const len = Math.max(pa.length, pb.length);
    for (let i = 0; i < len; i++) {
      const x = pa[i] || 0;
      const y = pb[i] || 0;
      if (x !== y) return x - y;
    }
    return 0;
  }

  async function fetchJson(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return res.json();
  }

  function loadIndex() {
    if (!indexPromise) {
      indexPromise = fetchJson(ENDPOINTS.known).then((data) =>
        (data.versions || [])
          .map((v) => ({ version: v.version, revision: v.revision, downloads: v.downloads || {} }))
          .sort((a, b) => compareVersion(b.version, a.version))
      );
    }
    return indexPromise;
  }

  function buildSeg(container, items, selectedKey, onSelect) {
    container.textContent = '';
    for (const item of items) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = item.label;
      btn.className = 'seg-btn' + (item.key === selectedKey ? ' active' : '');
      btn.addEventListener('click', () => {
        onSelect(item.key);
        container.querySelectorAll('.seg-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
      });
      container.appendChild(btn);
    }
  }

  function findUrl(entry, component, platform) {
    const list = entry.downloads && entry.downloads[component];
    if (!Array.isArray(list)) return null;
    const hit = list.find((d) => d.platform === platform);
    return hit ? hit.url : null;
  }

  function buildFilename(url, version) {
    const base = url.split('/').pop();
    if (base.endsWith('.zip')) {
      return base.slice(0, -4) + '-' + version + '.zip';
    }
    return base;
  }

  function makeDownload(url, version) {
    const btn = document.createElement('a');
    if (url) {
      btn.className = 'btn btn-download';
      btn.textContent = 'Download';
      btn.href = url;
      btn.target = '_blank';
      btn.rel = 'noopener noreferrer';
      btn.download = buildFilename(url, version);
    } else {
      btn.className = 'btn btn-download disabled';
      btn.textContent = 'Not available';
    }
    return btn;
  }

  function renderLatest() {
    const wrap = $('latestCards');
    wrap.textContent = '';
    for (const ch of ['Stable', 'Beta', 'Dev', 'Canary']) {
      const info = state.latest[ch];
      if (!info) continue;
      const url = findUrl(info, state.component, state.platform);

      const card = document.createElement('div');
      card.className = 'card';

      const badge = document.createElement('span');
      badge.className = 'badge badge-' + ch.toLowerCase();
      badge.textContent = ch;

      const version = document.createElement('div');
      version.className = 'card-version';
      version.textContent = info.version;

      const rev = document.createElement('div');
      rev.className = 'card-rev';
      rev.textContent = 'r' + info.revision;

      const btn = makeDownload(url, info.version);
      btn.classList.remove('btn-download');
      btn.classList.add('btn-primary');

      card.appendChild(badge);
      card.appendChild(version);
      card.appendChild(rev);
      card.appendChild(btn);
      wrap.appendChild(card);
    }
  }

  function renderSearchResults(matches) {
    const list = $('searchList');
    list.textContent = '';
    const status = $('searchStatus');

    if (!matches.length) {
      status.textContent = 'No version matches "' + state.query.trim() + '".';
      return;
    }

    status.textContent = matches.length + ' result' + (matches.length > 1 ? 's' : '') + '.';
    for (const v of matches.slice(0, 30)) {
      const url = findUrl(v, state.component, state.platform);

      const row = document.createElement('div');
      row.className = 'row';

      const info = document.createElement('div');
      info.className = 'row-info';

      const version = document.createElement('span');
      version.className = 'version';
      version.textContent = v.version;

      const rev = document.createElement('span');
      rev.className = 'revision';
      rev.textContent = 'r' + v.revision;

      info.appendChild(version);
      info.appendChild(rev);

      const actions = document.createElement('div');
      actions.className = 'row-actions';
      actions.appendChild(makeDownload(url, v.version));

      row.appendChild(info);
      row.appendChild(actions);
      list.appendChild(row);
    }
  }

  function hideSearch() {
    $('searchSection').classList.add('hidden');
  }

  async function doSearch() {
    const q = state.query.trim().toLowerCase();
    if (!q) {
      hideSearch();
      return;
    }

    const section = $('searchSection');
    section.classList.remove('hidden');
    $('searchStatus').textContent = 'Searching…';
    $('searchList').textContent = '';

    try {
      const all = await loadIndex();
      if (state.query.trim().toLowerCase() !== q) return;
      const matches = all.filter((v) => v.version.toLowerCase().indexOf(q) !== -1);
      renderSearchResults(matches);
    } catch (err) {
      $('searchStatus').textContent = 'Search failed: ' + err.message;
    }
  }

  function refresh() {
    renderLatest();
    if (!$('searchSection').classList.contains('hidden')) {
      doSearch();
    }
  }

  function showError(err) {
    const box = $('errorBox');
    box.textContent = 'Failed to load data: ' + err.message + '. Please check your network or try again later.';
    box.classList.remove('hidden');
  }

  async function init() {
    buildSeg($('platformSeg'), PLATFORMS, state.platform, (key) => {
      state.platform = key;
      refresh();
    });

    buildSeg($('componentSeg'), COMPONENTS, state.component, (key) => {
      state.component = key;
      refresh();
    });

    let timer;
    $('searchInput').addEventListener('input', (e) => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        state.query = e.target.value;
        doSearch();
      }, 250);
    });

    $('loading').classList.remove('hidden');
    try {
      const latest = await fetchJson(ENDPOINTS.latest);
      state.latest = latest.channels || {};
      renderLatest();
    } catch (err) {
      showError(err);
    } finally {
      $('loading').classList.add('hidden');
    }
  }

  init();
})();
