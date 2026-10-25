/**
 * 2025 TMoFA Annual Report Bilingual Web Viewer
 * Features:
 * - Floating Cursor Curtain Split (游標分屏滑桿對照)
 * - Instant Toggle Mode (單頁點擊/空白鍵快速切換)
 * - Dual Column Side-by-Side Mode (雙頁並排)
 * - Active Cursor Tracking & Touch Gestures
 * - Full 63-page preloading & Thumbnail Navigation
 * ponytail: Clean, robust, vanilla JS implementation
 */

(() => {
  'use strict';

  // State
  const TOTAL_PAGES = 63;
  let currentPage = 1;
  let currentMode = 'split'; // 'split' | 'toggle' | 'side'
  let activeLang = 'en';     // 'zh' | 'en' (used in toggle mode)
  let splitPct = 50.0;       // Curtain percentage (0..100)
  let isDragging = false;
  let followCursor = false;
  let isThumbsOpen = false;
  let zoomLevel = 1.0;

  // DOM Elements
  const splitContainer = document.getElementById('splitContainer');
  const sideContainer = document.getElementById('sideContainer');
  const layerEn = document.getElementById('layerEn');
  const curtainLine = document.getElementById('curtainLine');
  const curtainHandle = document.getElementById('curtainHandle');
  const imgZh = document.getElementById('imgZh');
  const imgEn = document.getElementById('imgEn');
  const imgSideZh = document.getElementById('imgSideZh');
  const imgSideEn = document.getElementById('imgSideEn');
  const pageStage = document.getElementById('pageStage');
  const viewerMain = document.getElementById('viewerMain');
  const mouseFollower = document.getElementById('mouseFollower');

  // Nav & Header Elements
  const pageInput = document.getElementById('pageInput');
  const btnPrevPage = document.getElementById('btnPrevPage');
  const btnNextPage = document.getElementById('btnNextPage');
  const tocSelect = document.getElementById('tocSelect');
  const modeSplit = document.getElementById('modeSplit');
  const modeToggle = document.getElementById('modeToggle');
  const modeSide = document.getElementById('modeSide');

  // Zoom & Tools
  const btnZoomIn = document.getElementById('btnZoomIn');
  const btnZoomOut = document.getElementById('btnZoomOut');
  const btnZoomFit = document.getElementById('btnZoomFit');
  const btnFullscreen = document.getElementById('btnFullscreen');
  const btnDownload = document.getElementById('btnDownload');
  const downloadMenu = document.getElementById('downloadMenu');
  const btnHelp = document.getElementById('btnHelp');
  const helpModal = document.getElementById('helpModal');
  const btnCloseModal = document.getElementById('btnCloseModal');

  // Bottom Pill Bar
  const floatingPillBar = document.getElementById('floatingPillBar');
  const pillZh = document.getElementById('pillZh');
  const pillEn = document.getElementById('pillEn');
  const pillSplitToggle = document.getElementById('pillSplitToggle');
  const btnFollowCursor = document.getElementById('btnFollowCursor');
  const btnToggleThumbs = document.getElementById('btnToggleThumbs');

  // Thumbnails Drawer
  const thumbsDrawer = document.getElementById('thumbsDrawer');
  const thumbsTrack = document.getElementById('thumbsTrack');
  const btnCloseThumbs = document.getElementById('btnCloseThumbs');

  // ----------------------------------------------------
  // Initialization
  // ----------------------------------------------------
  function init() {
    readUrlParams();
    buildThumbnails();
    bindEvents();
    updatePageView();
    updateModeUI();
    preloadAdjacentPages();
  }

  // Parse URL hash e.g. #page=12&mode=split
  function readUrlParams() {
    const hash = window.location.hash.replace(/^#/, '');
    if (!hash) return;
    const params = new URLSearchParams(hash);
    if (params.has('page')) {
      const p = parseInt(params.get('page'), 10);
      if (!isNaN(p) && p >= 1 && p <= TOTAL_PAGES) {
        currentPage = p;
      }
    }
    if (params.has('mode')) {
      const m = params.get('mode');
      if (['split', 'toggle', 'side'].includes(m)) {
        currentMode = m;
      }
    }
    if (params.has('lang')) {
      const l = params.get('lang');
      if (['zh', 'en'].includes(l)) {
        activeLang = l;
      }
    }
  }

  function updateUrlHash() {
    const hash = `#page=${currentPage}&mode=${currentMode}&lang=${activeLang}`;
    if (window.location.hash !== hash) {
      history.replaceState(null, '', hash);
    }
  }

  // ----------------------------------------------------
  // Page Navigation & Image Updates
  // ----------------------------------------------------
  function setPage(num) {
    if (num < 1) num = 1;
    if (num > TOTAL_PAGES) num = TOTAL_PAGES;
    currentPage = num;

    pageInput.value = currentPage;
    btnPrevPage.disabled = (currentPage === 1);
    btnNextPage.disabled = (currentPage === TOTAL_PAGES);

    // Update TOC select if matches milestone
    syncTocSelect();

    // Update images
    const zhSrc = `pages/zh/p${currentPage}.webp`;
    const enSrc = `pages/en/p${currentPage}.webp`;

    imgZh.src = zhSrc;
    imgEn.src = enSrc;
    imgSideZh.src = zhSrc;
    imgSideEn.src = enSrc;

    // Highlight thumbnail
    syncThumbnailActive();

    // Preload next & prev pages
    preloadAdjacentPages();
    updateUrlHash();
  }

  function syncTocSelect() {
    const tocBreakpoints = [1, 2, 3, 5, 21, 36, 48, 53, 57, 60, 63];
    let matched = 1;
    for (const b of tocBreakpoints) {
      if (currentPage >= b) matched = b;
    }
    tocSelect.value = String(matched);
  }

  function preloadAdjacentPages() {
    const toPreload = [
      currentPage + 1,
      currentPage + 2,
      currentPage - 1,
      currentPage - 2
    ].filter(p => p >= 1 && p <= TOTAL_PAGES);

    toPreload.forEach(p => {
      const pZh = new Image();
      pZh.src = `pages/zh/p${p}.webp`;
      const pEn = new Image();
      pEn.src = `pages/en/p${p}.webp`;
    });
  }

  // ----------------------------------------------------
  // Split Curtain Logic
  // ----------------------------------------------------
  function setSplitPercentage(pct) {
    if (pct < 0) pct = 0;
    if (pct > 100) pct = 100;
    splitPct = pct;

    splitContainer.style.setProperty('--split-pct', `${splitPct.toFixed(2)}%`);
    curtainLine.style.left = `${splitPct.toFixed(2)}%`;

    // Update clip-path on English overlay
    layerEn.style.clipPath = `polygon(${splitPct.toFixed(2)}% 0, 100% 0, 100% 100%, ${splitPct.toFixed(2)}% 100%)`;

    // Update pill indicator
    if (splitPct <= 5) {
      pillEn.classList.add('active');
      pillZh.classList.remove('active');
      pillSplitToggle.classList.remove('active');
    } else if (splitPct >= 95) {
      pillZh.classList.add('active');
      pillEn.classList.remove('active');
      pillSplitToggle.classList.remove('active');
    } else {
      pillSplitToggle.classList.add('active');
      pillZh.classList.remove('active');
      pillEn.classList.remove('active');
    }
  }

  function handlePointerMoveOnCurtain(clientX) {
    const rect = splitContainer.getBoundingClientRect();
    const x = clientX - rect.left;
    const pct = (x / rect.width) * 100;
    setSplitPercentage(pct);
  }

  // ----------------------------------------------------
  // Mode Switching
  // ----------------------------------------------------
  function setMode(mode) {
    currentMode = mode;
    updateModeUI();
    updatePageView();
    updateUrlHash();
  }

  function updateModeUI() {
    [modeSplit, modeToggle, modeSide].forEach(btn => btn.classList.remove('active'));
    if (currentMode === 'split') modeSplit.classList.add('active');
    if (currentMode === 'toggle') modeToggle.classList.add('active');
    if (currentMode === 'side') modeSide.classList.add('active');
  }

  function updatePageView() {
    if (currentMode === 'side') {
      splitContainer.style.display = 'none';
      sideContainer.style.display = 'flex';
      mouseFollower.classList.remove('visible');
      return;
    }

    // Single stage (split or toggle)
    sideContainer.style.display = 'none';
    splitContainer.style.display = 'block';

    if (currentMode === 'split') {
      curtainLine.style.display = 'block';
      layerEn.style.opacity = '1';
      setSplitPercentage(splitPct);
      mouseFollower.classList.remove('visible');
    } else if (currentMode === 'toggle') {
      curtainLine.style.display = 'none';
      if (activeLang === 'en') {
        layerEn.style.clipPath = 'polygon(0 0, 100% 0, 100% 100%, 0 100%)';
        layerEn.style.opacity = '1';
        pillEn.classList.add('active');
        pillZh.classList.remove('active');
        pillSplitToggle.classList.remove('active');
      } else {
        layerEn.style.clipPath = 'polygon(100% 0, 100% 0, 100% 100%, 100% 100%)';
        layerEn.style.opacity = '0';
        pillZh.classList.add('active');
        pillEn.classList.remove('active');
        pillSplitToggle.classList.remove('active');
      }
    }
  }

  function toggleLanguage() {
    activeLang = (activeLang === 'en') ? 'zh' : 'en';
    if (currentMode === 'split') {
      // In split mode, snap to full screen of chosen language
      setSplitPercentage(activeLang === 'zh' ? 100 : 0);
    } else {
      updatePageView();
    }
  }

  // ----------------------------------------------------
  // Thumbnails Drawer
  // ----------------------------------------------------
  function buildThumbnails() {
    const frag = document.createDocumentFragment();
    for (let i = 1; i <= TOTAL_PAGES; i++) {
      const item = document.createElement('div');
      item.className = `thumb-item ${i === currentPage ? 'active' : ''}`;
      item.dataset.page = String(i);
      item.title = `第 ${i} 頁 / Page ${i}`;

      const img = document.createElement('img');
      img.loading = 'lazy';
      img.src = `pages/thumbs/p${i}.webp`;
      img.alt = `P.${i}`;

      const num = document.createElement('span');
      num.className = 'thumb-num';
      num.textContent = String(i);

      item.appendChild(img);
      item.appendChild(num);

      item.addEventListener('click', () => {
        setPage(i);
      });

      frag.appendChild(item);
    }
    thumbsTrack.appendChild(frag);
  }

  function syncThumbnailActive() {
    const items = thumbsTrack.querySelectorAll('.thumb-item');
    items.forEach((item, idx) => {
      const pageNum = idx + 1;
      if (pageNum === currentPage) {
        item.classList.add('active');
        item.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      } else {
        item.classList.remove('active');
      }
    });
  }

  function toggleThumbnailsDrawer(force) {
    isThumbsOpen = (typeof force === 'boolean') ? force : !isThumbsOpen;
    if (isThumbsOpen) {
      thumbsDrawer.classList.add('open');
      floatingPillBar.classList.add('drawer-open');
      btnToggleThumbs.classList.add('active');
      syncThumbnailActive();
    } else {
      thumbsDrawer.classList.remove('open');
      floatingPillBar.classList.remove('drawer-open');
      btnToggleThumbs.classList.remove('active');
    }
  }

  // ----------------------------------------------------
  // Zoom Controls
  // ----------------------------------------------------
  function setZoom(lvl) {
    zoomLevel = Math.max(0.6, Math.min(2.5, lvl));
    pageStage.style.transform = `scale(${zoomLevel})`;
  }

  // ----------------------------------------------------
  // Event Listeners
  // ----------------------------------------------------
  function bindEvents() {
    // 1. Page input & buttons
    btnPrevPage.addEventListener('click', () => setPage(currentPage - 1));
    btnNextPage.addEventListener('click', () => setPage(currentPage + 1));
    pageInput.addEventListener('change', (e) => {
      const val = parseInt(e.target.value, 10);
      if (!isNaN(val)) setPage(val);
    });

    // 2. TOC Select
    tocSelect.addEventListener('change', (e) => {
      setPage(parseInt(e.target.value, 10));
    });

    // 3. Mode Buttons
    modeSplit.addEventListener('click', () => setMode('split'));
    modeToggle.addEventListener('click', () => setMode('toggle'));
    modeSide.addEventListener('click', () => setMode('side'));

    // 4. Floating Pill Bar
    pillZh.addEventListener('click', () => {
      activeLang = 'zh';
      if (currentMode === 'split') {
        setSplitPercentage(100);
      } else {
        updatePageView();
      }
    });

    pillEn.addEventListener('click', () => {
      activeLang = 'en';
      if (currentMode === 'split') {
        setSplitPercentage(0);
      } else {
        updatePageView();
      }
    });

    pillSplitToggle.addEventListener('click', () => {
      if (currentMode !== 'split') {
        setMode('split');
      }
      setSplitPercentage(50);
    });

    btnFollowCursor.addEventListener('click', () => {
      followCursor = !followCursor;
      btnFollowCursor.classList.toggle('active', followCursor);
    });

    btnToggleThumbs.addEventListener('click', () => toggleThumbnailsDrawer());
    btnCloseThumbs.addEventListener('click', () => toggleThumbnailsDrawer(false));

    // 5. Curtain Dragging (Pointer Events with capture)
    curtainHandle.addEventListener('pointerdown', (e) => {
      isDragging = true;
      curtainHandle.classList.add('dragging');
      curtainHandle.setPointerCapture(e.pointerId);
      e.preventDefault();
    });

    window.addEventListener('pointermove', (e) => {
      if (isDragging) {
        handlePointerMoveOnCurtain(e.clientX);
      } else if (followCursor && currentMode === 'split') {
        const rect = splitContainer.getBoundingClientRect();
        if (e.clientX >= rect.left && e.clientX <= rect.right &&
            e.clientY >= rect.top && e.clientY <= rect.bottom) {
          handlePointerMoveOnCurtain(e.clientX);
        }
      }

      // Mouse follower badge in toggle mode
      if (currentMode === 'toggle') {
        const rect = splitContainer.getBoundingClientRect();
        if (e.clientX >= rect.left && e.clientX <= rect.right &&
            e.clientY >= rect.top && e.clientY <= rect.bottom) {
          mouseFollower.style.left = `${e.clientX}px`;
          mouseFollower.style.top = `${e.clientY}px`;
          mouseFollower.classList.add('visible');
        } else {
          mouseFollower.classList.remove('visible');
        }
      }
    });

    window.addEventListener('pointerup', (e) => {
      if (isDragging) {
        isDragging = false;
        curtainHandle.classList.remove('dragging');
        try { curtainHandle.releasePointerCapture(e.pointerId); } catch (_) {}
      }
    });

    // In toggle mode, clicking the page container toggles language!
    splitContainer.addEventListener('click', (e) => {
      if (currentMode === 'toggle') {
        toggleLanguage();
      }
    });

    // 6. Zoom controls
    btnZoomIn.addEventListener('click', () => setZoom(zoomLevel + 0.15));
    btnZoomOut.addEventListener('click', () => setZoom(zoomLevel - 0.15));
    btnZoomFit.addEventListener('click', () => setZoom(1.0));

    // 7. Fullscreen
    btnFullscreen.addEventListener('click', () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
    });

    // 8. Download Menu
    btnDownload.addEventListener('click', (e) => {
      e.stopPropagation();
      downloadMenu.classList.toggle('show');
    });

    document.addEventListener('click', () => {
      downloadMenu.classList.remove('show');
    });

    // 9. Help Modal
    btnHelp.addEventListener('click', () => helpModal.classList.add('open'));
    btnCloseModal.addEventListener('click', () => helpModal.classList.remove('open'));
    helpModal.addEventListener('click', (e) => {
      if (e.target === helpModal) helpModal.classList.remove('open');
    });

    // 10. Keyboard Shortcuts
    window.addEventListener('keydown', (e) => {
      // Don't trigger when typing in inputs
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;

      switch (e.code) {
        case 'Space':
        case 'KeyT':
          e.preventDefault();
          toggleLanguage();
          break;
        case 'ArrowLeft':
        case 'KeyJ':
          setPage(currentPage - 1);
          break;
        case 'ArrowRight':
        case 'KeyK':
          setPage(currentPage + 1);
          break;
        case 'Home':
          setPage(1);
          break;
        case 'End':
          setPage(TOTAL_PAGES);
          break;
        case 'KeyS':
          setMode('split');
          setSplitPercentage(50);
          break;
        case 'KeyC':
          followCursor = !followCursor;
          btnFollowCursor.classList.toggle('active', followCursor);
          break;
        case 'KeyF':
          btnFullscreen.click();
          break;
        case 'Escape':
          helpModal.classList.remove('open');
          toggleThumbnailsDrawer(false);
          downloadMenu.classList.remove('show');
          break;
      }
    });

    // 11. Touch Gestures (Swipe for page flip)
    let touchStartX = 0;
    let touchStartY = 0;
    splitContainer.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      }
    }, { passive: true });

    splitContainer.addEventListener('touchend', (e) => {
      if (isDragging) return;
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      const deltaX = touchEndX - touchStartX;
      const deltaY = touchEndY - touchStartY;

      // Horizontal swipe detected
      if (Math.abs(deltaX) > 60 && Math.abs(deltaY) < 50) {
        if (deltaX < 0) {
          setPage(currentPage + 1); // Swipe left -> next page
        } else {
          setPage(currentPage - 1); // Swipe right -> prev page
        }
      }
    }, { passive: true });
  }

  // Run!
  document.addEventListener('DOMContentLoaded', init);
})();
