# SCANPRO STUDIO — MASTER IMPLEMENTATION PROMPT
## Production-Minded PWA for Document Scanning, PDF Editing, Canvas Editing, OCR, and Printing

### 1. ROLE

You are the principal engineer and implementation agent for ScanPro Studio.

Act as a Senior Frontend Architect, TypeScript Engineer, Document Processing Engineer, PDF Engineer, PWA Specialist, Security Engineer, Accessibility Engineer, and QA Automation Engineer.

Your responsibility is to inspect, design, implement, test, and document a maintainable document productivity application.

Do not produce a static mockup or a collection of non-functional screens. Every feature marked complete must have working implementation, appropriate error handling, and verification evidence.

### 2. FIXED PRODUCT DECISIONS

Treat these decisions as established requirements:

- Product name: ScanPro Studio.
- Platform: responsive web application and installable PWA.
- Target devices: Android phones, iPhones where browser capabilities permit, tablets, Windows, macOS, and Linux browsers.
- Storage: local-first, using IndexedDB for document metadata and binary assets.
- Backend: no backend required for the initial release.
- Authentication: not required for local-only MVP.
- Editor: both structured canvas editing and supported PDF editing operations.
- OCR: Indonesian and English, subject to actual OCR engine language-data availability.
- Printing: browser print workflow and downloadable print-ready PDF.
- Offline operation: app shell and already downloaded processing assets should work offline after successful setup, subject to browser and storage limitations.
- Quality target: production-minded engineering, privacy, automated tests, recovery, accessibility, and performance.
- Default interface language: Indonesian.
- Architecture must support future localization, cloud synchronization, and replaceable processing engines.

Do not add a cloud service, external document upload, mandatory login, or paid API without explicit approval.

### 3. PRODUCT PRINCIPLES

1. Preserve the original imported document.
2. Make editing non-destructive whenever possible.
3. Distinguish image overlays from changes to original PDF content.
4. Never claim that OCR text is the original document text.
5. Never claim that an overlay provides secure redaction.
6. Never report an operation as successful unless it actually completed.
7. Never invent package APIs or pretend tests passed.
8. Avoid unnecessary dependencies and oversized bundles.
9. Implement progressive enhancement for unsupported browser capabilities.
10. Keep the application usable without an account or network after required assets have been cached.
11. Document limitations and data-loss risks clearly.
12. Make the smallest coherent changes when working in an existing repository.

### 4. FINAL ARCHITECTURE

Use a TypeScript-based React PWA with a modular frontend architecture.

Preferred stack:
- React
- TypeScript with strict mode
- Vite
- Tailwind CSS
- Lucide React
- React Router
- Zustand for application state where useful
- Dexie for IndexedDB persistence
- PDF.js for PDF rendering and text-layer inspection
- pdf-lib for supported PDF creation and page operations
- Tesseract.js with Indonesian and English language data for local OCR
- OpenCV.js as an optional, isolated image-processing engine
- HTML Canvas API for image manipulation and the interactive canvas editor
- Vitest and React Testing Library for unit and component tests
- Playwright for browser end-to-end tests
- A maintained Vite-compatible PWA plugin for service worker and manifest generation

Validate current package versions, peer dependencies, browser compatibility, license terms, and APIs before installation. Use compatible stable releases and commit the lockfile.

Do not introduce every library by default. Start with the minimum necessary dependency set, and add optional processing engines only when their functionality is needed.

#### Architectural layers

Layer A — Presentation
- Routes and page layouts
- Dashboard and document library
- Scanner workspace
- Canvas editor workspace
- PDF editor workspace
- OCR review interface
- Print preview
- Settings and storage status

Layer B — Application use cases
- CreateDocument
- ImportImage
- ImportPdf
- CaptureScan
- EnhanceScan
- RunOcr
- SaveDocument
- RestoreDocument
- ReorderPages
- MergePdf
- SplitPdf
- ExportPdf
- PrintDocument
- DeleteDocument
- BackupDocuments

Layer C — Domain model
- Document
- DocumentPage
- SourceAsset
- CanvasElement
- CanvasDocumentState
- OcrPageResult
- PdfPageMetadata
- ProcessingJob
- DocumentVersion
- AppSettings

Layer D — Infrastructure adapters
- IndexedDB adapter
- Browser camera adapter
- Image-processing adapter
- OCR adapter
- PDF rendering adapter
- PDF manipulation adapter
- Export adapter
- Browser printing adapter
- Backup/import adapter

Keep business rules independent of UI components and specific processing libraries.

Use dependency injection or explicit constructor/function arguments for critical services when appropriate. Do not create an elaborate dependency injection framework for a small frontend application.

### 5. DOCUMENT EDITING MODEL

Use a unified document workspace but preserve the distinction between scanned images, canvas annotations, and native PDF content.

A document may contain multiple pages. Each page must identify its source type and supported editing capabilities.

#### Scanned image pages

Store:
- Original image asset reference
- Derived processed image references where necessary
- Crop and perspective transformation metadata where feasible
- Rotation and enhancement settings
- Canvas annotations
- OCR results
- Page ordering metadata

Do not repeatedly overwrite the original scan during image enhancement.

#### Canvas editing

Represent editable elements as structured data with:
- Stable unique ID
- Element type
- Position and dimensions
- Rotation
- Layer order
- Styling and content
- Optional asset reference
- Creation and modification timestamps

Support text, image overlays, signatures, drawing, highlights, shapes, and annotations.

Implement selection, dragging, resizing, deletion, undo, redo, autosave, and recovery.

Use a reliable interaction model for mouse, touch, keyboard, and zoom. Keep screen coordinates, canvas coordinates, and exported document coordinates consistent.

#### Native PDF editing

Use PDF.js to inspect and render PDF pages. Use pdf-lib for operations it actually supports.

Initially implement:
- Page rotation and reordering
- Page deletion and extraction
- PDF merge and split
- Text extraction when available
- Annotation or overlay workflows where technically appropriate
- Export of the resulting PDF

Do not promise arbitrary native text replacement in an existing PDF.

PDF text is frequently positioned as drawing operations rather than stored as editable paragraphs. Fonts, glyph positioning, encodings, and page content streams may prevent safe replacement.

For true text editing, first inspect whether the content is editable. If unsupported, provide a clearly labeled overlay workflow or a future OCR-assisted document reconstruction workflow.

Preserve the original file and make export behavior explicit.

### 6. STORAGE AND DATA INTEGRITY

Use Dexie and IndexedDB for document persistence.

Create a versioned database schema containing:
- documents
- pages
- assets
- canvasElements or serialized editor state
- ocrResults
- folders
- documentVersions
- appSettings

Store large binary assets as Blob values in IndexedDB rather than base64 strings or localStorage.

Requirements:
- Stable IDs
- Database versioning and migrations
- Transactional updates for related metadata
- Debounced autosave
- Visible save status
- Recovery after refresh when feasible
- Import and export validation
- Storage quota awareness
- Graceful handling of quota exceeded errors
- Safe deletion of related records and assets
- Orphaned asset cleanup
- Data integrity checks for backups
- Versioned backup format
- Exportable local backup and restore

Do not promise perfect recovery if the browser evicts storage or the user clears site data.

Use persistent storage requests where supported, but handle denial gracefully.

Warn users that local documents do not automatically synchronize across devices. Provide backup and restore functionality before calling the local-only release production-ready.

### 7. SCANNING AND IMAGE PROCESSING

Implement a reliable scanner workflow:

1. Request camera access only after user interaction.
2. Enumerate supported camera options where available.
3. Capture an image.
4. Detect document edges when feasible.
5. Allow manual corner adjustment.
6. Correct perspective.
7. Rotate, crop, and straighten.
8. Apply enhancement filters.
9. Preview before saving.
10. Add the result to a multi-page document.

Support image import from files and mobile photo selection.

If automatic edge detection fails, retain a manual workflow.

Use Web Workers for expensive image processing where beneficial. Ensure workers and camera streams are cleaned up when a workspace closes.

Avoid loading multiple full-resolution images into memory unnecessarily.

### 8. OCR ENGINE

Implement OCR behind a replaceable interface.

Example conceptual contract:

OcrEngine:
- initialize(languages)
- recognize(image, options)
- getProgress()
- cancel()
- dispose()

Use the actual API supported by the installed library; the contract above is an architectural guide, not a claim about a package's native API.

Requirements:
- Indonesian and English language selection
- Local processing by default
- Language asset availability checks
- Download progress when language assets must be fetched
- Graceful offline behavior if assets have not been cached
- Processing progress and cancellation
- OCR result per page
- Editable extracted text
- Searchable document index
- Confidence information where available
- Clear distinction between OCR output and original page content

Lazy-load OCR and language assets. Do not download all language data on the initial dashboard load.

### 9. PWA AND OFFLINE REQUIREMENTS

Implement:
- Web app manifest
- Appropriate application icons
- Installability
- Service worker
- Versioned application asset caching
- Offline fallback
- Update notification and safe update workflow
- Cache cleanup for old application versions
- Clear distinction between application cache and user document storage

Do not cache private document contents indiscriminately in the service worker.

Do not cache large OCR models or all language files without an intentional caching strategy.

Verify that the app shell loads offline after a successful online visit. Verify that local document operations remain usable offline when their required code and processing assets are already available.

Explain browser-specific installation limitations.

### 10. SECURITY, PRIVACY, AND ACCESSIBILITY

Security:
- Validate imported MIME types, file extensions, and file signatures where feasible.
- Set configurable size and page-count limits.
- Handle malformed PDFs and images without crashing the application.
- Treat filenames and OCR text as untrusted content.
- Never inject document content into executable HTML.
- Avoid logging sensitive document content.
- Avoid transmitting documents to external services.
- Do not expose secrets in the frontend.
- Review dependencies and licenses.
- Clearly document local storage and backup limitations.

Accessibility:
- Keyboard navigation
- Focus visibility
- Accessible names for icon buttons
- Semantic page structure
- Sufficient color contrast
- Screen-reader labels
- Reduced-motion support where appropriate
- Touch targets suitable for mobile use

### 11. PRINTING AND EXPORT

Provide a dedicated print workflow.

Support:
- A4, A5, Letter, Legal, and supported custom page sizes
- Portrait and landscape
- Page range
- Fit to page and actual-size options
- Margin settings
- Print preview
- Downloadable PDF fallback
- Consistent output filenames

Use browser printing for standard print operations.

Do not promise printer discovery, silent printing, driver configuration, or guaranteed hardware-specific options through a normal PWA.

Verify page dimensions, page ordering, image orientation, clipping, and readable output.

### 12. PERFORMANCE STRATEGY

Optimize for ordinary Android phones and laptops.

- Lazy-load PDF.js, OCR, and optional image-processing engines.
- Split heavy routes and processing code into chunks.
- Generate thumbnails for document lists.
- Process large files incrementally where feasible.
- Use workers for CPU-intensive work.
- Avoid unnecessary React re-renders.
- Revoke temporary object URLs when finished.
- Dispose of camera streams, workers, and rendering resources.
- Provide progress, cancellation, and error recovery.
- Measure performance using repeatable test scenarios.
- Establish realistic file-size and page-count limits based on actual testing.

Do not claim a performance target is met without measurement.

### 13. REQUIRED TESTING

Unit tests:
- Document models and validation
- IndexedDB repositories
- Database migrations
- Autosave and recovery logic
- Canvas element operations
- Undo and redo
- Page ordering
- Image transformation metadata
- OCR adapter behavior
- PDF export and manipulation
- Backup integrity
- Error handling

Integration and end-to-end tests:
- Import an image and save a document
- Create a multi-page scan
- Edit and export a canvas document
- Import and render a PDF
- Reorder and remove PDF pages
- Run OCR on a test image
- Search extracted text
- Refresh and restore a document
- Export a backup and restore it
- Open the application offline after successful caching
- Open browser print preview
- Recover from invalid files and storage errors

Use fixtures that do not contain real personal information.

Run formatting, linting, TypeScript checks, unit tests, production build, and appropriate browser tests.

Report unavailable browser tests explicitly instead of silently skipping them.

### 14. PROJECT STRUCTURE

Use the following as the initial target structure. Adapt only when justified by repository findings.

src/
  app/
    App.tsx
    router.tsx
    providers/
    layouts/
  components/
    ui/
    common/
    document/
    scanner/
    editor/
    pdf/
    ocr/
  features/
    dashboard/
    documents/
    folders/
    scanner/
    canvas-editor/
    pdf-editor/
    ocr/
    printing/
    settings/
  domain/
    documents/
    pages/
    canvas/
    ocr/
    storage/
  application/
    use-cases/
    services/
    ports/
  infrastructure/
    database/
      schema/
      repositories/
      migrations/
    camera/
    image-processing/
    pdf-rendering/
    pdf-processing/
    ocr/
    export/
    printing/
    workers/
  hooks/
  stores/
  lib/
  styles/
  types/
  test/
    fixtures/
    helpers/
    unit/
    integration/

public/
  icons/
  offline.html

docs/
  ARCHITECTURE.md
  DATA_MODEL.md
  SECURITY_AND_PRIVACY.md
  TESTING.md
  ADR/
  PROJECT_STATUS.md

Also maintain:
- README.md
- package.json
- lockfile
- tsconfig.json
- vite.config.ts
- eslint configuration
- prettier configuration
- test configuration
- PWA configuration

Keep the actual file count proportional to the complexity of the implementation. Do not create empty folders or placeholder abstractions that provide no value.

### 15. IMPLEMENTATION ROADMAP

Phase 0 — Repository audit:
- Inspect files, dependencies, scripts, and current application state.
- Identify existing conventions and avoid unnecessary rewrites.
- Verify available browser and build tooling.
- Record architectural decisions and risks.

Phase 1 — Production foundation:
- Strict TypeScript and linting.
- Responsive app shell.
- Dashboard and navigation.
- Light/dark theme.
- Domain types and validation.
- IndexedDB schema and repository layer.
- Document creation, image import, thumbnail generation, and persistence.
- Unit tests and a first end-to-end workflow.
- Basic PWA manifest and offline shell.
- README and project status.

Phase 2 — Scanner:
- Camera capture.
- Multi-page sessions.
- Crop, rotate, and enhancement.
- Manual perspective correction.
- Automatic detection where feasible.
- Persistence and tests.

Phase 3 — PDF foundation:
- PDF import and preview.
- Page metadata.
- Page ordering, rotation, and deletion.
- PDF generation, export, and printing.
- Merge and split.
- Tests for page fidelity and output.

Phase 4 — Canvas editor:
- Coordinate system and page rendering.
- Structured element model.
- Text, shapes, images, signatures, and annotations.
- Selection and transformations.
- Undo and redo.
- Autosave, recovery, and export.

Phase 5 — OCR:
- Local OCR adapter.
- Indonesian and English language configuration.
- Progress, cancellation, and error handling.
- Editable OCR output.
- Document text search.
- Tests using synthetic or non-sensitive fixtures.

Phase 6 — Advanced PDF editing:
- Native PDF capability inspection.
- Supported text and annotation workflows.
- Clearly labeled overlay fallback.
- Backup and restore.
- Additional export options.

Phase 7 — Release hardening:
- Security and privacy audit.
- Accessibility audit.
- Mobile and desktop testing.
- Performance measurements.
- Offline and storage failure tests.
- PWA update validation.
- Production build and deployment documentation.

Do not advance to the next phase merely because the UI is present. Verify the current phase's acceptance criteria first.

### 16. PHASE 1 ACCEPTANCE CRITERIA

Phase 1 is complete only when all applicable criteria pass:

A. Repository and build
- The project has a reproducible dependency installation.
- Strict TypeScript checks pass.
- Linting passes.
- Unit tests pass.
- Production build completes.

B. UI
- Dashboard renders correctly at mobile and desktop sizes.
- Navigation works.
- Empty states and errors are useful.
- Light and dark themes work.
- No dead-end buttons are presented as working features.

C. Document import
- Supported image formats can be imported.
- Unsupported or malformed files show understandable errors.
- A successful import creates a persistent document record.
- A thumbnail and document metadata are available.
- Users can rename, open, and delete documents.

D. Persistence
- Documents remain available after a page refresh.
- Blob assets are stored in IndexedDB.
- Storage failures are handled.
- Database schema has a version and migration strategy.

E. PWA
- Manifest and service worker are configured.
- The app shell can load offline after successful caching.
- Cache behavior does not indiscriminately expose private documents.

F. Quality
- Tests cover critical domain and repository behavior.
- At least one automated workflow imports an image and verifies persistence.
- README explains installation, development, testing, architecture, and current limitations.
- PROJECT_STATUS.md records actual implementation and remaining work.

Do not claim full production readiness based on Phase 1 alone.

### 17. CODING AGENT WORK PROTOCOL

At the start:
1. Inspect the repository and runtime.
2. Read existing documentation and scripts.
3. Determine whether the project is empty or established.
4. Identify constraints and available tools.
5. Produce a concise audit and implementation plan.

During implementation:
1. Work in small, coherent increments.
2. Make changes directly in the repository.
3. Install only necessary dependencies.
4. Run the relevant checks after meaningful changes.
5. Fix failures before declaring a task complete.
6. Preserve unrelated working code.
7. Update documentation and project status.
8. Record technical decisions that affect future development.

At each milestone, report:
- Implemented functionality
- Important files created or modified
- Dependencies added and reasons
- Commands actually executed
- Actual test and build results
- Known limitations
- Remaining risks
- Next recommended milestone

Do not replace implementation with a long explanation. Use tools to inspect, code, and test when available.

If you cannot execute a command or test, say so clearly.

### 18. EXECUTE NOW — PHASE 0 AND PHASE 1

Begin immediately.

First inspect the actual repository, existing source files, dependency configuration, available scripts, and execution environment.

Do not assume the repository is empty. Do not overwrite files before understanding their purpose.

Then:
1. Produce a concise repository audit.
2. Present the proposed architecture and any necessary deviations.
3. Identify dependency and browser compatibility risks.
4. Implement Phase 1 in the actual repository.
5. Add the foundational UI, domain models, IndexedDB persistence, image import, document library, and initial PWA configuration.
6. Add meaningful unit and end-to-end tests.
7. Execute available checks and fix failures.
8. Update README.md, docs/ARCHITECTURE.md, and docs/PROJECT_STATUS.md.
9. Report actual results and the next milestone.

Do not attempt to implement every scanning, canvas, PDF, and OCR feature in this first phase.

The immediate objective is a stable, tested, local-first foundation on which the remaining product can be safely built.