/**
 * Modern PDF Explorer & Viewer
 * Client logic: recursive folder parsing, instant search, sorting, and PDF.js rendering.
 */

// Application State
const state = {
  files: [],          // All discovered PDF items: { name, relativePath, size, lastModified, handle, fileObj, url }
  filteredFiles: [],  // Filtered/searched files
  currentFile: null,  // Currently active file object
  pdfDoc: null,       // PDF.js loaded document
  pageNum: 1,         // Current active page
  pageRendering: false,
  pageNumPending: null,
  scale: 1.25,        // Current scale
  scaleMode: 'auto',  // 'auto', 'page-fit', 'page-width', or numeric
  rotation: 0,        // 0, 90, 180, 270
  viewMode: 'single', // 'single' or 'scroll'
  recents: [],        // Recent opened files
  // In-PDF Text Search state
  searchQuery: '',
  searchResults: [],  // [{ page: number, itemIndex: number, text: string, transform: Array, width, height }]
  currentSearchIndex: -1,
  isSearching: false
};

// DOM Elements
const btnPickFolder = document.getElementById('btnPickFolder');
const btnPickFiles = document.getElementById('btnPickFiles');
const fallbackFolderInput = document.getElementById('fallbackFolderInput');
const fallbackFilesInput = document.getElementById('fallbackFilesInput');
const folderPathLabel = document.getElementById('folderPathLabel');
const searchInput = document.getElementById('searchInput');
const clearSearchBtn = document.getElementById('clearSearchBtn');
const sortSelect = document.getElementById('sortSelect');
const fileCountBadge = document.getElementById('fileCountBadge');
const fileList = document.getElementById('fileList');
const emptyState = document.getElementById('emptyState');
const activeFileName = document.getElementById('activeFileName');
const pageNumberInput = document.getElementById('pageNumberInput');
const pageCountSpan = document.getElementById('pageCount');
const prevPageBtn = document.getElementById('prevPageBtn');
const nextPageBtn = document.getElementById('nextPageBtn');
const zoomInBtn = document.getElementById('zoomInBtn');
const zoomOutBtn = document.getElementById('zoomOutBtn');
const scaleSelect = document.getElementById('scaleSelect');
const rotateBtn = document.getElementById('rotateBtn');
const fullscreenBtn = document.getElementById('fullscreenBtn');
const sidebarToggleBtn = document.getElementById('sidebarToggleBtn');
const sidebar = document.getElementById('sidebar');
const themeToggleBtn = document.getElementById('themeToggleBtn');
const pdfCanvas = document.getElementById('pdfCanvas');
const pdfCanvasWrapper = document.getElementById('pdfCanvasWrapper');
const pdfScrollWrapper = document.getElementById('pdfScrollWrapper');
const noDocPlaceholder = document.getElementById('noDocPlaceholder');
const viewerContainer = document.getElementById('viewerContainer');
const singlePageViewBtn = document.getElementById('singlePageViewBtn');
const continuousScrollViewBtn = document.getElementById('continuousScrollViewBtn');
const downloadPdfBtn = document.getElementById('downloadPdfBtn');
const openNativeBtn = document.getElementById('openNativeBtn');
const recentBar = document.getElementById('recentBar');
const recentItems = document.getElementById('recentItems');
const pdfHighlightLayer = document.getElementById('pdfHighlightLayer');

// PDF Text Search Elements
const togglePdfSearchBtn = document.getElementById('togglePdfSearchBtn');
const pdfSearchBar = document.getElementById('pdfSearchBar');
const pdfSearchInput = document.getElementById('pdfSearchInput');
const pdfSearchMatchesCount = document.getElementById('pdfSearchMatchesCount');
const pdfSearchPrevBtn = document.getElementById('pdfSearchPrevBtn');
const pdfSearchNextBtn = document.getElementById('pdfSearchNextBtn');
const closePdfSearchBtn = document.getElementById('closePdfSearchBtn');

// Password Modal Elements
const passwordModal = document.getElementById('passwordModal');
const pdfPasswordInput = document.getElementById('pdfPasswordInput');
const toggleShowPasswordBtn = document.getElementById('toggleShowPasswordBtn');
const passwordErrorMsg = document.getElementById('passwordErrorMsg');
const cancelPasswordBtn = document.getElementById('cancelPasswordBtn');
const submitPasswordBtn = document.getElementById('submitPasswordBtn');

let pendingPasswordCallback = null;

const canvasCtx = pdfCanvas.getContext('2d');

// --- Helper Functions ---
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function formatDate(timestamp) {
  if (!timestamp) return '';
  const d = new Date(timestamp);
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

function highlightMatch(text, query) {
  if (!query) return text;
  const regex = new RegExp(`(${query.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')})`, 'gi');
  return text.replace(regex, '<mark class="highlight">$1</mark>');
}

// --- Folder & Files Access ---
btnPickFolder.addEventListener('click', () => {
  fallbackFolderInput.click();
});

btnPickFiles.addEventListener('click', () => {
  fallbackFilesInput.click();
});

fallbackFilesInput.addEventListener('change', (e) => {
  const files = e.target.files;
  if (!files || files.length === 0) return;

  const pdfItems = [];
  for (let i = 0; i < files.length; i++) {
    const f = files[i];
    if (f.name.toLowerCase().endsWith('.pdf')) {
      pdfItems.push({
        name: f.name,
        relativePath: f.name,
        size: f.size,
        lastModified: f.lastModified,
        fileObj: f,
        url: null
      });
    }
  }

  folderPathLabel.textContent = `${pdfItems.length} File PDF Dipilih`;
  state.files = pdfItems;
  applyFilterAndRender();
});

fallbackFolderInput.addEventListener('change', (e) => {
  const fileListRaw = e.target.files;
  if (!fileListRaw || fileListRaw.length === 0) return;

  const total = fileListRaw.length;
  folderPathLabel.textContent = `Memproses ${total} file...`;

  // Berikan jeda via setTimeout agar UI browser tidak membeku saat file banyak
  setTimeout(() => {
    const pdfItems = [];
    const len = fileListRaw.length;
    
    // Folder blacklist yang membuat macet
    const ignoredRegex = /(node_modules|\.git|\.svn|build|dist|\.gradle|\.cache|vendor|\.idea|\.vscode)/i;

    for (let i = 0; i < len; i++) {
      const f = fileListRaw[i];
      const path = f.webkitRelativePath || f.name;

      if (ignoredRegex.test(path)) continue;

      const lowerName = f.name.toLowerCase();
      if (lowerName.endsWith('.pdf')) {
        pdfItems.push({
          name: f.name,
          relativePath: path,
          size: f.size,
          lastModified: f.lastModified,
          fileObj: f,
          url: null
        });
      }
    }

    const rootName = pdfItems.length > 0 
      ? (pdfItems[0].relativePath.split('/')[0] || 'Selected Folder')
      : (fileListRaw[0].webkitRelativePath.split('/')[0] || 'Selected Folder');
    
    folderPathLabel.textContent = `${rootName} (${pdfItems.length} PDF)`;
    state.files = pdfItems;

    applyFilterAndRender();
  }, 20);
});

// Recursive folder scanning with File System Access API
async function readDirectoryRecursively(dirHandle, pathAccumulator) {
  for await (const [name, handle] of dirHandle.entries()) {
    if (handle.kind === 'file' && name.toLowerCase().endsWith('.pdf')) {
      const fileData = await handle.getFile();
      state.files.push({
        name: name,
        relativePath: `${pathAccumulator}/${name}`,
        size: fileData.size,
        lastModified: fileData.lastModified,
        fileObj: fileData,
        handle: handle,
        url: null
      });
    } else if (handle.kind === 'directory') {
      await readDirectoryRecursively(handle, `${pathAccumulator}/${name}`);
    }
  }
}

// --- Search & Filtering & Sorting ---
function applyFilterAndRender() {
  const query = searchInput.value.trim().toLowerCase();
  clearSearchBtn.style.display = query ? 'block' : 'none';

  let result = state.files.filter(item => {
    return item.name.toLowerCase().includes(query) ||
           item.relativePath.toLowerCase().includes(query);
  });

  const sortValue = sortSelect.value;
  result.sort((a, b) => {
    switch (sortValue) {
      case 'name_asc':
        return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
      case 'name_desc':
        return b.name.localeCompare(a.name, undefined, { numeric: true, sensitivity: 'base' });
      case 'size_desc':
        return b.size - a.size;
      case 'size_asc':
        return a.size - b.size;
      case 'date_desc':
        return b.lastModified - a.lastModified;
      default:
        return 0;
    }
  });

  state.filteredFiles = result;
  renderFileList(query);
}

function renderFileList(highlightQuery = '') {
  fileList.innerHTML = '';
  const total = state.filteredFiles.length;
  fileCountBadge.textContent = `${total} File`;

  if (total === 0) {
    emptyState.style.display = 'block';
    if (state.files.length > 0) {
      emptyState.querySelector('p').textContent = 'Tidak ada file PDF yang cocok dengan kata kunci pencarian.';
    } else {
      emptyState.querySelector('p').innerHTML = 'Klik tombol <strong>"Pilih Folder"</strong> di atas untuk memuat semua file PDF.';
    }
    return;
  }

  emptyState.style.display = 'none';

  // Render max 100 item pertama secara instan (lazy load sisanya saat discroll) agar browser tidak freeze
  const itemsToRender = state.filteredFiles.slice(0, 100);
  const fragment = document.createDocumentFragment();

  itemsToRender.forEach(item => {
    const li = createCardElement(item, highlightQuery);
    fragment.appendChild(li);
  });

  fileList.appendChild(fragment);

  // Jika file lebih dari 100, tambahkan tombol / info "Muat Lebih Banyak"
  if (total > 100) {
    const loadMoreLi = document.createElement('li');
    loadMoreLi.id = 'loadMoreItem';
    loadMoreLi.style.cssText = 'text-align:center; padding:10px; cursor:pointer; font-size:12px; color:var(--accent-color); font-weight:600; list-style:none;';
    loadMoreLi.textContent = `Menampilkan 100 dari ${total} file. Klik untuk memuat semua...`;
    loadMoreLi.addEventListener('click', () => {
      loadMoreLi.remove();
      const extraFragment = document.createDocumentFragment();
      state.filteredFiles.slice(100).forEach(item => {
        extraFragment.appendChild(createCardElement(item, highlightQuery));
      });
      fileList.appendChild(extraFragment);
    });
    fileList.appendChild(loadMoreLi);
  }
}

function createCardElement(item, highlightQuery) {
  const li = document.createElement('li');
  li.className = 'file-card';
  if (state.currentFile && state.currentFile.relativePath === item.relativePath) {
    li.classList.add('active');
  }

  const displayName = highlightMatch(item.name, highlightQuery);
  const displayPath = highlightMatch(item.relativePath, highlightQuery);

  li.innerHTML = `
    <i class="fa-solid fa-file-pdf file-card-icon"></i>
    <div class="file-card-details">
      <div class="file-card-name" title="${item.name}">${displayName}</div>
      <div class="file-card-path" title="${item.relativePath}">${displayPath}</div>
      <div class="file-card-meta">
        <span>${formatBytes(item.size)}</span>
        <span>•</span>
        <span>${formatDate(item.lastModified)}</span>
      </div>
    </div>
  `;

  li.addEventListener('click', () => {
    openPdfDocument(item);
  });

  return li;
}

let searchFilterTimer = null;
searchInput.addEventListener('input', () => {
  clearTimeout(searchFilterTimer);
  searchFilterTimer = setTimeout(() => {
    applyFilterAndRender();
  }, 120);
});

clearSearchBtn.addEventListener('click', () => {
  searchInput.value = '';
  applyFilterAndRender();
  searchInput.focus();
});

sortSelect.addEventListener('change', () => {
  applyFilterAndRender();
});

// --- Modern PDF.js Rendering Engine ---
async function openPdfDocument(fileItem) {
  state.currentFile = fileItem;

  // Highlight active in file list
  document.querySelectorAll('.file-card').forEach(card => card.classList.remove('active'));
  const activeCards = Array.from(document.querySelectorAll('.file-card')).filter(card => {
    return card.querySelector('.file-card-name').textContent.trim() === fileItem.name;
  });
  if (activeCards.length > 0) activeCards[0].classList.add('active');

  activeFileName.textContent = fileItem.name;
  activeFileName.title = fileItem.relativePath;
  noDocPlaceholder.style.display = 'none';
  pdfCanvasWrapper.style.display = 'block';

  // Add to recents
  addToRecents(fileItem);

  try {
    let pdfSource;
    if (fileItem.fileObj) {
      const arrayBuffer = await fileItem.fileObj.arrayBuffer();
      pdfSource = { data: arrayBuffer };
      // Prepare download URL
      const blob = new Blob([fileItem.fileObj], { type: 'application/pdf' });
      const objectUrl = URL.createObjectURL(blob);
      downloadPdfBtn.href = objectUrl;
      downloadPdfBtn.download = fileItem.name;
      downloadPdfBtn.style.display = 'inline-flex';
      openNativeBtn.onclick = () => window.open(objectUrl, '_blank');
    } else if (fileItem.url) {
      pdfSource = fileItem.url;
      downloadPdfBtn.href = fileItem.url;
      downloadPdfBtn.download = fileItem.name;
      downloadPdfBtn.style.display = 'inline-flex';
      openNativeBtn.onclick = () => window.open(fileItem.url, '_blank');
    }

    const loadingTask = pdfjsLib.getDocument(pdfSource);

    // Callback saat PDF memerlukan kata sandi
    loadingTask.onPassword = function (callback, reason) {
      promptPdfPassword(callback, reason);
    };

    state.pdfDoc = await loadingTask.promise;
    closePasswordModal();

    pageCountSpan.textContent = state.pdfDoc.numPages;
    pageNumberInput.max = state.pdfDoc.numPages;
    state.pageNum = 1;
    pageNumberInput.value = 1;
    state.rotation = 0;

    // Reset In-PDF search results for new document
    resetPdfSearch();

    if (state.viewMode === 'scroll') {
      renderContinuousScrollView();
    } else {
      renderPage(state.pageNum);
    }
  } catch (err) {
    console.error('Error saat merender file PDF:', err);
    alert('Gagal memuat PDF: ' + err.message);
  }
}

async function renderPage(num) {
  if (!state.pdfDoc) return;
  state.pageRendering = true;

  try {
    const page = await state.pdfDoc.getPage(num);

    let viewport = page.getViewport({ scale: 1, rotation: state.rotation });
    
    // Scale calculation
    let calculatedScale = state.scale;
    if (state.scaleMode === 'auto' || state.scaleMode === 'page-width') {
      const containerWidth = viewerContainer.clientWidth - 60;
      calculatedScale = containerWidth / viewport.width;
      if (state.scaleMode === 'auto' && calculatedScale > 1.6) calculatedScale = 1.6;
    } else if (state.scaleMode === 'page-fit') {
      const containerHeight = viewerContainer.clientHeight - 60;
      const containerWidth = viewerContainer.clientWidth - 60;
      const scaleH = containerHeight / viewport.height;
      const scaleW = containerWidth / viewport.width;
      calculatedScale = Math.min(scaleH, scaleW);
    } else {
      calculatedScale = parseFloat(state.scaleMode) || 1.0;
    }

    state.scale = calculatedScale;
    viewport = page.getViewport({ scale: calculatedScale, rotation: state.rotation });

    // HiDPI support (Retina displays)
    const outputScale = window.devicePixelRatio || 1;
    pdfCanvas.width = Math.floor(viewport.width * outputScale);
    pdfCanvas.height = Math.floor(viewport.height * outputScale);
    pdfCanvas.style.width = Math.floor(viewport.width) + 'px';
    pdfCanvas.style.height = Math.floor(viewport.height) + 'px';

    const transform = outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : null;

    const renderContext = {
      canvasContext: canvasCtx,
      transform: transform,
      viewport: viewport
    };

    await page.render(renderContext).promise;
    state.pageRendering = false;

    // Render In-PDF Search Highlight overlays on current page
    renderSearchHighlightsForPage(page, viewport);

    if (state.pageNumPending !== null) {
      renderPage(state.pageNumPending);
      state.pageNumPending = null;
    }
  } catch (err) {
    console.error('Render page error:', err);
    state.pageRendering = false;
  }

  // Update Toolbar status
  pageNumberInput.value = num;
  prevPageBtn.disabled = (num <= 1);
  nextPageBtn.disabled = (num >= state.pdfDoc.numPages);
}

function queueRenderPage(num) {
  if (state.pageRendering) {
    state.pageNumPending = num;
  } else {
    renderPage(num);
  }
}

// Toggle View Mode (Single Page vs Continuous Scroll)
singlePageViewBtn.addEventListener('click', () => {
  if (state.viewMode === 'single') return;
  state.viewMode = 'single';
  singlePageViewBtn.classList.add('active');
  continuousScrollViewBtn.classList.remove('active');
  pdfScrollWrapper.style.display = 'none';
  pdfCanvasWrapper.style.display = 'block';
  if (state.pdfDoc) {
    renderPage(state.pageNum);
  }
});

continuousScrollViewBtn.addEventListener('click', () => {
  if (state.viewMode === 'scroll') return;
  state.viewMode = 'scroll';
  continuousScrollViewBtn.classList.add('active');
  singlePageViewBtn.classList.remove('active');
  pdfCanvasWrapper.style.display = 'none';
  pdfScrollWrapper.style.display = 'flex';
  if (state.pdfDoc) {
    renderContinuousScrollView();
  }
});

// Render pages in vertical scroll view with Lazy On-Demand Rendering
let scrollIntersectionObserver = null;

async function renderContinuousScrollView() {
  if (!state.pdfDoc) return;
  pdfScrollWrapper.innerHTML = '';
  pdfScrollWrapper.style.display = 'flex';
  pdfCanvasWrapper.style.display = 'none';

  if (scrollIntersectionObserver) {
    scrollIntersectionObserver.disconnect();
  }

  const totalPages = state.pdfDoc.numPages;
  const outputScale = window.devicePixelRatio || 1;

  // Dapatkan dimensi halaman pertama sebagai template ukuran
  const firstPage = await state.pdfDoc.getPage(1);
  const sampleViewport = firstPage.getViewport({ scale: state.scale || 1.25, rotation: state.rotation });
  const estimatedWidth = Math.floor(sampleViewport.width);
  const estimatedHeight = Math.floor(sampleViewport.height);

  // Buat IntersectionObserver agar halaman hanya di-render saat terlihat di layar (Lazy Render)
  scrollIntersectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const pageContainer = entry.target;
        const pageNum = parseInt(pageContainer.getAttribute('data-page-num'));
        if (!pageContainer.hasAttribute('data-rendered')) {
          pageContainer.setAttribute('data-rendered', 'true');
          renderSingleScrollPage(pageContainer, pageNum, outputScale);
        }
      }
    });
  }, {
    root: viewerContainer,
    rootMargin: '300px 0px 300px 0px' // Preload halaman sebelum masuk viewport
  });

  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    const pageContainer = document.createElement('div');
    pageContainer.className = 'pdf-scroll-page-container';
    pageContainer.id = `scroll-page-${pageNum}`;
    pageContainer.setAttribute('data-page-num', pageNum);
    pageContainer.style.width = `${estimatedWidth}px`;
    pageContainer.style.minHeight = `${estimatedHeight}px`;

    const pageTag = document.createElement('div');
    pageTag.className = 'pdf-page-number-tag';
    pageTag.textContent = `Hal ${pageNum}`;
    pageContainer.appendChild(pageTag);

    pdfScrollWrapper.appendChild(pageContainer);
    scrollIntersectionObserver.observe(pageContainer);
  }
}

async function renderSingleScrollPage(pageContainer, pageNum, outputScale) {
  try {
    const page = await state.pdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale: state.scale || 1.25, rotation: state.rotation });

    const canvas = document.createElement('canvas');
    canvas.width = Math.floor(viewport.width * outputScale);
    canvas.height = Math.floor(viewport.height * outputScale);
    canvas.style.width = Math.floor(viewport.width) + 'px';
    canvas.style.height = Math.floor(viewport.height) + 'px';

    const ctx = canvas.getContext('2d');
    pageContainer.insertBefore(canvas, pageContainer.firstChild);

    const transform = outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : null;
    await page.render({
      canvasContext: ctx,
      transform: transform,
      viewport: viewport
    }).promise;
  } catch (err) {
    console.error(`Gagal render scroll halaman ${pageNum}:`, err);
  }
}

// Navigation Events
prevPageBtn.addEventListener('click', () => {
  if (state.pageNum <= 1) return;
  state.pageNum--;
  queueRenderPage(state.pageNum);
});

nextPageBtn.addEventListener('click', () => {
  if (!state.pdfDoc || state.pageNum >= state.pdfDoc.numPages) return;
  state.pageNum++;
  queueRenderPage(state.pageNum);
});

pageNumberInput.addEventListener('change', (e) => {
  let val = parseInt(e.target.value);
  if (!state.pdfDoc) return;
  if (isNaN(val) || val < 1) val = 1;
  if (val > state.pdfDoc.numPages) val = state.pdfDoc.numPages;
  state.pageNum = val;
  queueRenderPage(state.pageNum);
});

// Zoom Controls
zoomInBtn.addEventListener('click', () => {
  state.scaleMode = (state.scale * 1.2).toFixed(2);
  scaleSelect.value = '1';
  queueRenderPage(state.pageNum);
});

zoomOutBtn.addEventListener('click', () => {
  state.scaleMode = (state.scale / 1.2).toFixed(2);
  scaleSelect.value = '1';
  queueRenderPage(state.pageNum);
});

scaleSelect.addEventListener('change', (e) => {
  state.scaleMode = e.target.value;
  queueRenderPage(state.pageNum);
});

rotateBtn.addEventListener('click', () => {
  state.rotation = (state.rotation + 90) % 360;
  queueRenderPage(state.pageNum);
});

fullscreenBtn.addEventListener('click', () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(err => alert(err.message));
  } else {
    document.exitFullscreen();
  }
});

// Sidebar Toggle
sidebarToggleBtn.addEventListener('click', () => {
  sidebar.classList.toggle('collapsed');
});

// Theme Toggle
themeToggleBtn.addEventListener('click', () => {
  const isDark = document.body.classList.toggle('theme-dark');
  themeToggleBtn.innerHTML = isDark ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';
});

// Recent Documents Management
function addToRecents(fileItem) {
  const existingIndex = state.recents.findIndex(r => r.relativePath === fileItem.relativePath);
  if (existingIndex > -1) {
    state.recents.splice(existingIndex, 1);
  }
  state.recents.unshift(fileItem);
  if (state.recents.length > 5) state.recents.pop();

  renderRecentChips();
}

function renderRecentChips() {
  if (state.recents.length === 0) {
    recentBar.style.display = 'none';
    return;
  }
  recentBar.style.display = 'block';
  recentItems.innerHTML = '';
  state.recents.forEach(item => {
    const chip = document.createElement('div');
    chip.className = 'recent-chip';
    chip.textContent = item.name;
    chip.title = item.relativePath;
    chip.addEventListener('click', () => openPdfDocument(item));
    recentItems.appendChild(chip);
  });
}

// Auto resize re-render
window.addEventListener('resize', () => {
  if (state.pdfDoc && (state.scaleMode === 'auto' || state.scaleMode === 'page-width' || state.scaleMode === 'page-fit')) {
    queueRenderPage(state.pageNum);
  }
});

// Keyboard Navigation
window.addEventListener('keydown', (e) => {
  // Shortcut Ctrl+F or Cmd+F for PDF search
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
    if (state.pdfDoc) {
      e.preventDefault();
      openPdfSearchBar();
      return;
    }
  }

  if (e.key === 'Escape') {
    if (pdfSearchBar.style.display !== 'none') {
      closePdfSearchBar();
      return;
    }
  }

  if (document.activeElement === searchInput || 
      document.activeElement === pageNumberInput || 
      document.activeElement === pdfSearchInput) {
    return;
  }
  if (e.key === 'ArrowRight' || e.key === 'PageDown') {
    if (state.pdfDoc && state.pageNum < state.pdfDoc.numPages) {
      state.pageNum++;
      queueRenderPage(state.pageNum);
    }
  } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
    if (state.pdfDoc && state.pageNum > 1) {
      state.pageNum--;
      queueRenderPage(state.pageNum);
    }
  }
});

// ==========================================
// In-PDF Text Search Engine
// ==========================================

function openPdfSearchBar() {
  pdfSearchBar.style.display = 'flex';
  pdfSearchInput.focus();
  pdfSearchInput.select();
}

function closePdfSearchBar() {
  pdfSearchBar.style.display = 'none';
  resetPdfSearch();
  if (state.pdfDoc) queueRenderPage(state.pageNum);
}

togglePdfSearchBtn.addEventListener('click', () => {
  if (!state.pdfDoc) return;
  if (pdfSearchBar.style.display === 'none' || !pdfSearchBar.style.display) {
    openPdfSearchBar();
  } else {
    closePdfSearchBar();
  }
});

closePdfSearchBtn.addEventListener('click', () => {
  closePdfSearchBar();
});

function resetPdfSearch() {
  state.searchQuery = '';
  state.searchResults = [];
  state.currentSearchIndex = -1;
  pdfSearchMatchesCount.textContent = '0/0';
  pdfHighlightLayer.innerHTML = '';
}

let searchDebounceTimer = null;
pdfSearchInput.addEventListener('input', () => {
  clearTimeout(searchDebounceTimer);
  searchDebounceTimer = setTimeout(() => {
    executePdfSearch(pdfSearchInput.value.trim());
  }, 250);
});

pdfSearchInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    if (e.shiftKey) {
      navigatePdfSearch(-1);
    } else {
      navigatePdfSearch(1);
    }
  }
});

pdfSearchPrevBtn.addEventListener('click', () => navigatePdfSearch(-1));
pdfSearchNextBtn.addEventListener('click', () => navigatePdfSearch(1));

async function executePdfSearch(query) {
  if (!state.pdfDoc || !query) {
    resetPdfSearch();
    return;
  }

  state.searchQuery = query.toLowerCase();
  state.searchResults = [];
  state.currentSearchIndex = -1;
  pdfSearchMatchesCount.textContent = '...';

  const totalPages = state.pdfDoc.numPages;
  for (let pageIdx = 1; pageIdx <= totalPages; pageIdx++) {
    const page = await state.pdfDoc.getPage(pageIdx);
    const textContent = await page.getTextContent();

    textContent.items.forEach((item, itemIdx) => {
      const str = item.str.toLowerCase();
      if (str.includes(state.searchQuery)) {
        state.searchResults.push({
          pageNumber: pageIdx,
          itemIndex: itemIdx,
          str: item.str,
          transform: item.transform,
          width: item.width,
          height: item.height
        });
      }
    });
  }

  const count = state.searchResults.length;
  if (count > 0) {
    // Cari yang berada di halaman aktif atau setelahnya
    let matchIdx = state.searchResults.findIndex(m => m.pageNumber >= state.pageNum);
    state.currentSearchIndex = matchIdx !== -1 ? matchIdx : 0;
    updateSearchMatchDisplay();
    jumpToMatch(state.currentSearchIndex);
  } else {
    pdfSearchMatchesCount.textContent = '0/0';
    pdfHighlightLayer.innerHTML = '';
  }
}

function navigatePdfSearch(direction) {
  const total = state.searchResults.length;
  if (total === 0) return;

  state.currentSearchIndex += direction;
  if (state.currentSearchIndex >= total) state.currentSearchIndex = 0;
  if (state.currentSearchIndex < 0) state.currentSearchIndex = total - 1;

  updateSearchMatchDisplay();
  jumpToMatch(state.currentSearchIndex);
}

function updateSearchMatchDisplay() {
  const total = state.searchResults.length;
  const current = state.currentSearchIndex + 1;
  pdfSearchMatchesCount.textContent = `${current}/${total}`;
}

function jumpToMatch(index) {
  const match = state.searchResults[index];
  if (!match) return;

  if (state.pageNum !== match.pageNumber) {
    state.pageNum = match.pageNumber;
    queueRenderPage(state.pageNum);
  } else {
    // Halaman sudah sesuai, perbarui highlight
    state.pdfDoc.getPage(state.pageNum).then(page => {
      let viewport = page.getViewport({ scale: state.scale, rotation: state.rotation });
      renderSearchHighlightsForPage(page, viewport);
    });
  }
}

async function renderSearchHighlightsForPage(page, viewport) {
  pdfHighlightLayer.innerHTML = '';
  if (!state.searchQuery || state.searchResults.length === 0) return;

  const pageMatches = state.searchResults
    .map((m, idx) => ({ ...m, globalIndex: idx }))
    .filter(m => m.pageNumber === page.pageNumber);

  if (pageMatches.length === 0) return;

  // Sesuaikan layer dengan canvas
  pdfHighlightLayer.style.width = pdfCanvas.style.width;
  pdfHighlightLayer.style.height = pdfCanvas.style.height;

  pageMatches.forEach(match => {
    // Transformasi koordinat dari PDF space ke CSS viewport
    const tx = match.transform;
    const pdfX = tx[4];
    const pdfY = tx[5];
    const pdfW = match.width;
    const pdfH = match.height || (tx[0] > 0 ? tx[0] : 12);

    const rect = viewport.convertToViewportRectangle([pdfX, pdfY, pdfX + pdfW, pdfY + pdfH]);
    const left = Math.min(rect[0], rect[2]);
    const top = Math.min(rect[1], rect[3]);
    const width = Math.abs(rect[2] - rect[0]);
    const height = Math.abs(rect[3] - rect[1]);

    const highlightEl = document.createElement('div');
    highlightEl.className = 'pdf-search-highlight';
    if (match.globalIndex === state.currentSearchIndex) {
      highlightEl.classList.add('active');
    }

    highlightEl.style.left = `${left}px`;
    highlightEl.style.top = `${top}px`;
    highlightEl.style.width = `${Math.max(width, 10)}px`;
    highlightEl.style.height = `${Math.max(height, 8)}px`;

    pdfHighlightLayer.appendChild(highlightEl);
  });
}

// ==========================================
// PDF Password Handling Dialog
// ==========================================

function promptPdfPassword(callback, reason) {
  pendingPasswordCallback = callback;
  passwordModal.style.display = 'flex';
  pdfPasswordInput.value = '';

  if (reason === pdfjsLib.PasswordResponses.INCORRECT_PASSWORD) {
    passwordErrorMsg.style.display = 'block';
  } else {
    passwordErrorMsg.style.display = 'none';
  }

  setTimeout(() => pdfPasswordInput.focus(), 50);
}

function closePasswordModal() {
  passwordModal.style.display = 'none';
  passwordErrorMsg.style.display = 'none';
  pdfPasswordInput.value = '';
  pendingPasswordCallback = null;
}

submitPasswordBtn.addEventListener('click', () => {
  const pwd = pdfPasswordInput.value;
  if (pendingPasswordCallback) {
    pendingPasswordCallback(pwd);
  }
});

pdfPasswordInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    submitPasswordBtn.click();
  } else if (e.key === 'Escape') {
    cancelPasswordBtn.click();
  }
});

cancelPasswordBtn.addEventListener('click', () => {
  closePasswordModal();
  noDocPlaceholder.style.display = 'block';
  pdfCanvasWrapper.style.display = 'none';
  activeFileName.textContent = 'Belum ada dokumen terbuka';
});

toggleShowPasswordBtn.addEventListener('click', () => {
  const isPass = pdfPasswordInput.type === 'password';
  pdfPasswordInput.type = isPass ? 'text' : 'password';
  toggleShowPasswordBtn.innerHTML = isPass ? '<i class="fa-solid fa-eye-slash"></i>' : '<i class="fa-solid fa-eye"></i>';
});
