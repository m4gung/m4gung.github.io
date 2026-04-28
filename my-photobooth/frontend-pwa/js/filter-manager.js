const FilterManager = {
  currentFilter: 'none',
  
  filters: {
    'none': '',
    'cool-1': 'contrast(1.2) saturate(1.3) brightness(1.1)',
    'cool-2': 'sepia(0.3) contrast(1.1) saturate(1.2)',
    'vintage': 'sepia(0.5) contrast(0.9) brightness(1.1)',
    'bw': 'grayscale(1)',
    'vivid': 'saturate(1.8) contrast(1.2)',
    'fade': 'contrast(0.9) brightness(1.2) saturate(0.8)',
    'dramatic': 'contrast(1.4) brightness(0.9) saturate(0.9)'
  },

  init() {
    this.bindEvents();
  },

  bindEvents() {
    document.querySelectorAll('.filter-card').forEach(card => {
      card.addEventListener('click', (e) => {
        document.querySelectorAll('.filter-card').forEach(c => c.classList.remove('selected'));
        e.currentTarget.classList.add('selected');
        this.applyFilter(e.currentTarget.dataset.filter);
      });
    });
  },

  applyFilter(filterName) {
    this.currentFilter = filterName;
    const streamImage = document.getElementById('streamImage');
    
    if (streamImage) {
      const filter = this.filters[filterName] || '';
      streamImage.style.filter = filter;
      App.showNotification('Filter: ' + (filterName === 'none' ? 'Normal' : filterName), 'info');
    }
  },

  getFilterStyle() {
    return this.filters[this.currentFilter] || '';
  },

  applyToCanvas(ctx, width, height, imageData) {
    if (this.currentFilter === 'none') return;
    
    const filter = this.filters[this.currentFilter];
    if (!filter) return;
    
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tempCtx = tempCanvas.getContext('2d');
    
    const img = new Image();
    img.onload = () => {
      tempCtx.filter = filter;
      tempCtx.drawImage(img, 0, 0, width, height);
      ctx.drawImage(tempCanvas, 0, 0);
    };
    img.src = imageData;
  },

  reset() {
    this.currentFilter = 'none';
    const streamImage = document.getElementById('streamImage');
    if (streamImage) {
      streamImage.style.filter = '';
    }
    document.querySelectorAll('.filter-card').forEach(c => {
      c.classList.toggle('selected', c.dataset.filter === 'none');
    });
  }
};

window.FilterManager = FilterManager;