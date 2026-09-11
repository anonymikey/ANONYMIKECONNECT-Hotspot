(function(){
  const releaseUrl = '/release-portal/release.json';
  const versionEl = document.getElementById('version');
  const notesEl = document.getElementById('notes');
  const shaEl = document.getElementById('sha');
  const sizeEl = document.getElementById('size');
  const downloadEl = document.getElementById('download');
  const statusEl = document.getElementById('status');

  function humanFileSize(bytes){
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return (bytes / Math.pow(1024, i)).toFixed(2) * 1 + ' ' + ['B','KB','MB','GB','TB'][i];
  }

  fetch(releaseUrl).then(res=>{
    if (!res.ok) throw new Error('release.json not found');
    return res.json();
  }).then(meta=>{
    versionEl.textContent = 'Version: ' + (meta.version || '—');
    notesEl.textContent = 'Release notes: ' + (meta.notes || '—');
    shaEl.textContent = meta.sha256 || '—';
    sizeEl.textContent = meta.size ? humanFileSize(meta.size) : '—';

    if (meta.url && meta.url.length>0){
      downloadEl.href = meta.url;
      downloadEl.classList.remove('disabled');
      statusEl.textContent = 'Installer available for download.';
    } else {
      downloadEl.classList.add('disabled');
      statusEl.textContent = 'Installer is not yet available. CI will update release.json when a build is published.';
    }
  }).catch(err=>{
    versionEl.textContent = 'Version: —';
    notesEl.textContent = 'Release notes: —';
    shaEl.textContent = '—';
    sizeEl.textContent = '—';
    downloadEl.classList.add('disabled');
    statusEl.textContent = 'No release metadata found. Please run the CI to publish an artifact.';
    console.warn(err);
  });
})();
