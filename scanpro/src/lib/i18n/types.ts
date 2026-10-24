export type Locale = 'id' | 'en';

export interface TranslationMessages {
  // App
  app: {
    name: string;
    tagline: string;
  };

  // Navigation
  nav: {
    dashboard: string;
    scan: string;
    pdfEditor: string;
    canvasEditor: string;
    ocr: string;
    advancedPdf: string;
    documents: string;
    settings: string;
  };

  // Common
  common: {
    save: string;
    cancel: string;
    delete: string;
    edit: string;
    create: string;
    import: string;
    export: string;
    print: string;
    close: string;
    confirm: string;
    back: string;
    next: string;
    previous: string;
    done: string;
    loading: string;
    error: string;
    success: string;
    warning: string;
    info: string;
    yes: string;
    no: string;
    ok: string;
    retry: string;
    undo: string;
    redo: string;
    copy: string;
    paste: string;
    cut: string;
    selectAll: string;
    search: string;
    filter: string;
    sort: string;
    view: string;duplicate: string;
    download: string;
    upload: string;
    refresh: string;
    settings: string;
    help: string;
    about: string;
  };

  // Dashboard
  dashboard: {
    welcome: string;
    subtitle: string;
    quickActions: string;
    startScanning: string;
    importDocument: string;
    createNew: string;
    features: {
      scan: { title: string; description: string };
      edit: { title: string; description: string };
      ocr: { title: string; description: string };
      canvas: { title: string; description: string };
      pdf: { title: string; description: string };
      print: { title: string; description: string };
    };
    recentDocuments: string;
    noDocuments: string;
  };

  // Documents
  documents: {
    title: string;
    myDocuments: string;
    newDocument: string;
    importDocument: string;
    importImage: string;
    importPdf: string;
    scanDocument: string;
    noDocuments: string;
    noDocumentsDesc: string;
    name: string;
    pages: string;
    size: string;
    created: string;
    modified: string;
    actions: {
      open: string;
      rename: string;
      duplicate: string;
      delete: string;
      move: string;
      export: string;
      print: string;
      share: string;
    };
    confirmDelete: string;
    confirmDeleteDesc: string;
    emptyState: {
      title: string;
      description: string;
      action: string;
    };
  };

  // Folders
  folders: {
    title: string;
    myFolders: string;
    createFolder: string;
    folderName: string;
    folderColor: string;
    folderIcon: string;
    noFolders: string;
    noFoldersDesc: string;
    editFolder: string;
    deleteFolder: string;
    moveToFolder: string;
    documentsCount: string;
    root: string;
  };

  // Scanner
  scanner: {
    title: string;
    startSession: string;
    sessionName: string;
    camera: {
      start: string;
      stop: string;
      capture: string;
      switch: string;
      flash: string;
      grid: string;
      resolution: string;
      facingMode: {
        environment: string;
        user: string;
      };
    };
    preview: {
      title: string;
      pages: string;
      adjust: string;
      crop: string;
      rotate: string;
      enhance: string;
      perspective: string;
      autoDetect: string;
      reset: string;
      apply: string;
    };
    review: {
      title: string;
      pages?: string;
      reorder: string;
      deletePage: string;
      rotatePage: string;
      editPage: string;
      saveSession: string;
      discardSession: string;
    };
    adjustments: {
      perspective: string;
      rotate: string;
      enhance: string;
      contrast: string;
      brightness: string;
      sharpen: string;
      grayscale: string;
      autoCrop: string;
      manualCrop: string;
    };
    errors: {
      cameraPermission: string;
      cameraNotFound: string;
      captureFailed: string;
      processingFailed: string;
      saveFailed: string;
    };
  };

  // PDF Editor
  pdfEditor: {
    title: string;
    importPdf: string;
    pages: string;
    page: string;
    of: string;
    thumbnails: string;
    listView: string;
    gridView: string;
    actions: {
      rotateLeft: string;
      rotateRight: string;
      delete: string;
      extract: string;
      reorder: string;
      insert: string;
      replace: string;
      crop: string;
    };
    export: {
      title: string;
      format: string;
      pageRange: string;
      allPages: string;
      currentPage: string;
      customRange: string;
      options: {
        compression: string;
        metadata: string;
        bookmarks: string;
      };
    };
    print: {
      title: string;
      printer: string;
      copies: string;
      pageRange: string;
      orientation: {
        portrait: string;
        landscape: string;
      };
      paperSize: {
        a4: string;
        letter: string;
        legal: string;
        a5: string;
      };
      margins: {
        none: string;
        narrow: string;
        normal: string;
        wide: string;
      };
      scale: {
        fit: string;
        actual: string;
      };
    };
    merge: {
      title: string;
      addFiles: string;
      merge: string;
    };
    split: {
      title: string;
      splitBy: string;
      everyPage: string;
      pageRange: string;
      bookmarks: string;
    };
    extract: {
      title: string;
      selectPages: string;
      extract: string;
    };
    errors: {
      importFailed: string;
      exportFailed: string;
      printFailed: string;
      mergeFailed: string;
      splitFailed: string;
    };
  };

  // Canvas Editor
  canvasEditor: {
    title: string;
    newDocument: string;
    tools: {
      select: string;
      text: string;
      rectangle: string;
      ellipse: string;
      line: string;
      arrow: string;
      freehand: string;
      image: string;
      signature: string;
      stickyNote: string;
      highlight: string;
      eraser: string;
    };
    properties: {
      title: string;
      position: string;
      size: string;
      rotation: string;
      opacity: string;
      zIndex: string;
      lock: string;
      unlock: string;
      visible: string;
      hidden: string;
      bringToFront: string;
      sendToBack: string;
      duplicate: string;
      delete: string;
    };
    text: {
      content: string;
      fontFamily: string;
      fontSize: string;
      fontWeight: string;
      fontStyle: string;
      color: string;
      backgroundColor: string;
      alignment: {
        left: string;
        center: string;
        right: string;
      };
      lineHeight: string;
      padding: string;
    };
    shape: {
      strokeColor: string;
      fillColor: string;
      strokeWidth: string;
      strokeStyle: {
        solid: string;
        dashed: string;
        dotted: string;
      };
      fillOpacity: string;
    };
    freehand: {
      strokeColor: string;
      strokeWidth: string;
      strokeStyle: {
        solid: string;
        dashed: string;
      };
    };
    stickyNote: {
      content: string;
      color: string;
      fontSize: string;
    };
    highlight: {
      color: string;
    };
    image: {
      upload: string;
      crop: string;
      originalSize: string;
    };
    layers: {
      title: string;
      visible: string;
      hidden: string;
      locked: string;
      unlocked: string;
      bringForward: string;
      sendBackward: string;
      bringToFront: string;
      sendToBack: string;
      duplicate: string;
      delete: string;
      rename: string;
    };
    pages: {
      title: string;
      addPage: string;
      duplicatePage: string;
      deletePage: string;
      page: string;
      of: string;
    };
    grid: {
      show: string;
      snap: string;
      size: string;
    };
    zoom: {
      zoomIn: string;
      zoomOut: string;
      reset: string;
      fit: string;
      actual: string;
    };
    export: {
      title: string;
      asImage: string;
      asJson: string;
      asPdf: string;
    };
    shortcuts: string;
    shortcutsList: {
      select: string;
      text: string;
      rectangle: string;
      ellipse: string;
      line: string;
      arrow: string;
      freehand: string;
      image: string;
      signature: string;
      stickyNote: string;
      highlight: string;
      undo: string;
      redo: string;
      zoomIn: string;
      zoomOut: string;
      resetZoom: string;
      delete: string;
      duplicate: string;
      deselect: string;
    };
  };

  // OCR
  ocr: {
    title: string;
    initialize: string;
    initialized: string;
    language: string;
    languages: {
      eng: string;
      ind: string;
      engInd: string;
      ara: string;
      chiSim: string;
      chiTra: string;
      fra: string;
      deu: string;
      jpn: string;
      kor: string;
      spa: string;
      rus: string;
    };
    tabs: {
      document: string;
      image: string;
      batch: string;
      search: string;
    };
    documentTab: {
      selectDocument: string;
      runOcr: string;
      preview: string;
      options: {
        previewBeforeSave: string;
        saveAsTextLayer: string;
        createSearchIndex: string;
      };
    };
    imageTab: {
      uploadImage: string;
      dragDrop: string;
      runOcr: string;
    };
    batchTab: {
      title: string;
      runBatch: string;
      options: {
        allDocuments: string;
        onlyWithoutOcr: string;
        onlyPdfs: string;
      };
      progress: string;
    };
    searchTab: {
      title: string;
      search: string;
      placeholder: string;
      results: string;
      noResults: string;
    };
    progress: {
      initializing: string;
      downloading: string;
      processing: string;
      completed: string;
      error: string;
      cancel: string;
    };
    editor: {
      confidence: string;
      editMode: string;
      viewMode: string;
      save: string;
      cancel: string;
      search: string;
      copy: string;
      download: string;
      previous: string;
      next: string;
      matches: string;
    };
    results: {
      title: string;
      page: string;
      confidence: string;
      text: string;
      words: string;
      lines: string;
      blocks: string;
      processingTime: string;
      language: string;
    };
    errors: {
      initFailed: string;
      ocrFailed: string;
      fileTooLarge: string;
      unsupportedFormat: string;
      noTextFound: string;
    };
  };

  // Advanced PDF Editor
  advancedPdf: {
    title: string;
    tabs: {
      inspect: string;
      annotate: string;
      forms: string;
      redact: string;
      overlay: string;
      backup: string;
    };
    inspect: {
      title: string;
      capabilities: string;
      fonts: string;
      pages: string;
      page: string;
      size: string;
      rotation: string;
      hasText: string;
      hasImages: string;
      hasForms: string;
      hasAnnotations: string;
      yes: string;
      no: string;
    };
    annotate: {
      textAnnotation: string;
      highlight: string;
      ink: string;
      addText: string;
      addHighlight: string;
      addInk: string;
      color: string;
      opacity: string;
    };
    forms: {
      textField: string;
      checkbox: string;
      radioGroup: string;
      dropdown: string;
      addTextField: string;
      addCheckbox: string;
      addRadioGroup: string;
      addDropdown: string;
      flattenForm: string;
      fieldName: string;
      fieldValue: string;
      options: string;
      required: string;
      readOnly: string;
      multiline: string;
      password: string;
      maxLength: string;
    };
    redact: {
      title: string;
      warning: string;
      page: string;
      x: string;
      y: string;
      width: string;
      height: string;
      color: string;
      apply: string;
      backupFirst: string;
    };
    overlay: {
      textOverlay: string;
      imageOverlay: string;
      watermark: string;
      text: string;
      position: string;
      fontSize: string;
      color: string;
      rotation: string;
      opacity: string;
      imageFile: string;
      width: string;
      height: string;
      watermarkText: string;spacing: string;
      apply: string;
    };
    backup: {
      title: string;
      create: string;
      verify: string;
      backupId: string;
      verified: string;
      invalid: string;
    };
    errors: {
      inspectFailed: string;
      annotationFailed: string;
      formFailed: string,
      redactFailed: string,
      overlayFailed: string,
      backupFailed: string,
    };
  };

  // Settings
  settings: {
    title: string;
    language: string;
    theme: {
      title: string;
      light: string;
      dark: string;
      system: string;
      current: string;
    };
    ocr: {
      title: string;
      languages: string;
    };
    storage: {
      title: string;
      usage: string;
      quota: string;
      autoCleanup: string;
      backupEnabled: string;
    };
    processing: {
      title: string;
      gpuAcceleration: string;
      maxMemory: string;
      concurrentJobs: string;
    };
    print: {
      title: string;
      defaultMargins: string;
      defaultOrientation: string;
      defaultScale: string;
    };
    advanced: {
      title: string;
      autoSave: string;
      autoSaveInterval: string;
      maxImageSize: string;
      maxPdfPages: string;
      defaultPageSize: string;
    };
    system: {
      title: string;
      requirements: string;
      pwaInstallable: string;
      offlineFirst: string;
      localStorage: string;
      localOcr: string;
    };
  };

  // Errors
  errors: {
    generic: string;
    network: string;
    timeout: string;
    unauthorized: string;
    forbidden: string;
    notFound: string;
    serverError: string;
    validation: string;
    fileTooLarge: string;
    unsupportedFileType: string;
    storageQuotaExceeded: string;
    cameraPermissionDenied: string;
    ocrLanguageNotAvailable: string;
    pdfCorrupted: string;
    pdfPasswordProtected: string;
  };

  // Time
  time: {
    now: string;
    today: string;
    yesterday: string;
    daysAgo: string;
    hoursAgo: string;
    minutesAgo: string;
    secondsAgo: string;
  };

  // Units
  units: {
    pages: string;
    page: string;
    mb: string;
    kb: string;
    gb: string;
    bytes: string;
    percent: string;
    dpi: string;
    px: string;
    mm: string;
    cm: string;
    inch: string;
  };

  propertiesPanel?: Record<string, string>;
}

export const defaultLocale: Locale = 'id';

export const supportedLocales: Locale[] = ['id', 'en'];

export const localeNames: Record<Locale, string> = {
  id: 'Bahasa Indonesia',
  en: 'English',
};

export function getNestedValue(obj: any, path: string): string {
  return path.split('.').reduce((current, key) => current?.[key], obj) ?? path;
}

export function t(messages: TranslationMessages, key: string, params?: Record<string, string | number>): string {
  let value = getNestedValue(messages, key);
  if (typeof value !== 'string') {
    return key;
  }
  if (params) {
    Object.entries(params).forEach(([paramKey, paramVal]) => {
      value = value.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(paramVal));
    });
  }
  return value;
}