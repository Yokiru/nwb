/**
 * NWB Visual Editor v2 - Context-Aware with Auto-Save
 * A Framer/Figma-like visual editor with element-specific controls
 */

class NWBEditor {
    constructor() {
        this.isActive = false;
        this.selectedElement = null;
        this.highlight = null;
        this.hoverHighlight = null;
        this.panel = null;
        this.currentElementType = null;

        // Drag state
        this.isDragging = false;
        this.dragOffset = { x: 0, y: 0 };

        // API endpoint
        this.API_URL = 'http://localhost:3001';
        this.autoSaveEnabled = true;

        this.init();
    }

    init() {
        this.createToggleButton();
        this.createPanel();
        this.createHighlights();
        this.bindEvents();
    }

    // Detect element type for context-aware panels
    detectElementType(element) {
        const tag = element.tagName.toLowerCase();
        const classes = element.className.toString();

        // Text elements
        if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'span', 'a', 'label', 'li'].includes(tag)) {
            return 'text';
        }

        // Images
        if (tag === 'img') {
            return 'image';
        }

        // Buttons
        if (tag === 'button' || classes.includes('btn')) {
            return 'button';
        }

        // Carousel/Loop elements
        if (classes.includes('loop') || classes.includes('carousel') || classes.includes('slider') || classes.includes('infinite')) {
            return 'carousel';
        }

        // Navigation
        if (tag === 'nav' || classes.includes('nav')) {
            return 'navigation';
        }

        // Inputs
        if (['input', 'textarea', 'select'].includes(tag)) {
            return 'input';
        }

        // Icons/SVG
        if (tag === 'svg' || tag === 'i' || classes.includes('icon')) {
            return 'icon';
        }

        // Default: container
        return 'container';
    }

    // Create the floating toggle button
    createToggleButton() {
        const btn = document.createElement('button');
        btn.className = 'nwb-editor-toggle';
        btn.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 20h9"/>
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
            </svg>
        `;
        btn.title = 'Toggle Visual Editor';
        btn.addEventListener('click', () => this.toggle());
        document.body.appendChild(btn);
        this.toggleBtn = btn;
    }

    // Create the editor panel with context-aware sections
    createPanel() {
        const panel = document.createElement('div');
        panel.className = 'nwb-editor-panel';
        panel.innerHTML = `
            <div class="nwb-editor-header" id="editor-drag-handle">
                <div class="nwb-editor-header-left">
                    <svg class="nwb-editor-drag-icon" viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                        <circle cx="9" cy="6" r="1.5"/>
                        <circle cx="15" cy="6" r="1.5"/>
                        <circle cx="9" cy="12" r="1.5"/>
                        <circle cx="15" cy="12" r="1.5"/>
                        <circle cx="9" cy="18" r="1.5"/>
                        <circle cx="15" cy="18" r="1.5"/>
                    </svg>
                    <h3>Visual Editor</h3>
                </div>
                <div class="nwb-editor-header-right">
                    <span class="nwb-editor-type-badge" id="element-type-badge">—</span>
                    <label class="nwb-editor-autosave-toggle" title="Auto-save to CSS file">
                        <input type="checkbox" id="autosave-toggle" checked>
                        <span class="slider"></span>
                    </label>
                </div>
            </div>
            
            <div class="nwb-editor-body">
                <div class="nwb-editor-no-selection" id="editor-no-selection">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <rect x="3" y="3" width="18" height="18" rx="2"/>
                        <path d="M9 9h6v6H9z"/>
                    </svg>
                    <p>Click any element to select and edit</p>
                </div>
                
                <div id="editor-controls" style="display: none;">
                    <!-- Element Info -->
                    <div class="nwb-editor-element-info">
                        <code id="selected-element-tag">-</code>
                    </div>
                    
                    <!-- TEXT CONTROLS -->
                    <div id="controls-text" class="nwb-editor-context-panel">
                        <div class="nwb-editor-section">
                            <div class="nwb-editor-section-title">Typography</div>
                            
                            <div class="nwb-editor-row">
                                <div class="nwb-editor-input-group">
                                    <label>Font Size</label>
                                    <input type="text" data-prop="fontSize" placeholder="16px">
                                </div>
                                <div class="nwb-editor-input-group">
                                    <label>Font Weight</label>
                                    <select data-prop="fontWeight">
                                        <option value="">—</option>
                                        <option value="300">300 Light</option>
                                        <option value="400">400 Regular</option>
                                        <option value="500">500 Medium</option>
                                        <option value="600">600 Semi Bold</option>
                                        <option value="700">700 Bold</option>
                                        <option value="800">800 Extra Bold</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div class="nwb-editor-row">
                                <div class="nwb-editor-input-group">
                                    <label>Line Height</label>
                                    <input type="text" data-prop="lineHeight" placeholder="1.5">
                                </div>
                                <div class="nwb-editor-input-group">
                                    <label>Letter Spacing</label>
                                    <input type="text" data-prop="letterSpacing" placeholder="0px">
                                </div>
                            </div>
                            
                            <div class="nwb-editor-row full">
                                <div class="nwb-editor-input-group">
                                    <label>Text Color</label>
                                    <div class="nwb-editor-color-input">
                                        <input type="color" data-prop="color" data-color-picker>
                                        <input type="text" data-prop="color" placeholder="#ffffff">
                                    </div>
                                </div>
                            </div>
                            
                            <div class="nwb-editor-row">
                                <div class="nwb-editor-input-group">
                                    <label>Text Align</label>
                                    <select data-prop="textAlign">
                                        <option value="">—</option>
                                        <option value="left">Left</option>
                                        <option value="center">Center</option>
                                        <option value="right">Right</option>
                                    </select>
                                </div>
                                <div class="nwb-editor-input-group">
                                    <label>Transform</label>
                                    <select data-prop="textTransform">
                                        <option value="">—</option>
                                        <option value="none">None</option>
                                        <option value="uppercase">UPPERCASE</option>
                                        <option value="capitalize">Capitalize</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- IMAGE CONTROLS -->
                    <div id="controls-image" class="nwb-editor-context-panel" style="display:none;">
                        <div class="nwb-editor-section">
                            <div class="nwb-editor-section-title">Image</div>
                            
                            <div class="nwb-editor-row">
                                <div class="nwb-editor-input-group">
                                    <label>Object Fit</label>
                                    <select data-prop="objectFit">
                                        <option value="">—</option>
                                        <option value="cover">Cover</option>
                                        <option value="contain">Contain</option>
                                        <option value="fill">Fill</option>
                                        <option value="none">None</option>
                                    </select>
                                </div>
                                <div class="nwb-editor-input-group">
                                    <label>Object Position</label>
                                    <select data-prop="objectPosition">
                                        <option value="">—</option>
                                        <option value="center">Center</option>
                                        <option value="top">Top</option>
                                        <option value="bottom">Bottom</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div class="nwb-editor-row">
                                <div class="nwb-editor-input-group">
                                    <label>Border Radius</label>
                                    <input type="text" data-prop="borderRadius" placeholder="0px">
                                </div>
                                <div class="nwb-editor-input-group">
                                    <label>Opacity</label>
                                    <input type="text" data-prop="opacity" placeholder="1">
                                </div>
                            </div>
                            
                            <div class="nwb-editor-row full">
                                <div class="nwb-editor-input-group">
                                    <label>Filter (blur, brightness, etc)</label>
                                    <input type="text" data-prop="filter" placeholder="none">
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- CONTAINER CONTROLS -->
                    <div id="controls-container" class="nwb-editor-context-panel" style="display:none;">
                        <div class="nwb-editor-section">
                            <div class="nwb-editor-section-title">Layout</div>
                            
                            <div class="nwb-editor-row">
                                <div class="nwb-editor-input-group">
                                    <label>Display</label>
                                    <select data-prop="display">
                                        <option value="">—</option>
                                        <option value="block">Block</option>
                                        <option value="flex">Flex</option>
                                        <option value="grid">Grid</option>
                                        <option value="none">None</option>
                                    </select>
                                </div>
                                <div class="nwb-editor-input-group">
                                    <label>Flex Direction</label>
                                    <select data-prop="flexDirection">
                                        <option value="">—</option>
                                        <option value="row">Row</option>
                                        <option value="column">Column</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div class="nwb-editor-row">
                                <div class="nwb-editor-input-group">
                                    <label>Justify</label>
                                    <select data-prop="justifyContent">
                                        <option value="">—</option>
                                        <option value="flex-start">Start</option>
                                        <option value="center">Center</option>
                                        <option value="flex-end">End</option>
                                        <option value="space-between">Space Between</option>
                                    </select>
                                </div>
                                <div class="nwb-editor-input-group">
                                    <label>Align Items</label>
                                    <select data-prop="alignItems">
                                        <option value="">—</option>
                                        <option value="flex-start">Start</option>
                                        <option value="center">Center</option>
                                        <option value="flex-end">End</option>
                                        <option value="stretch">Stretch</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div class="nwb-editor-row">
                                <div class="nwb-editor-input-group">
                                    <label>Gap</label>
                                    <input type="text" data-prop="gap" placeholder="0px">
                                </div>
                            </div>
                        </div>
                        
                        <div class="nwb-editor-section">
                            <div class="nwb-editor-section-title">Size</div>
                            <div class="nwb-editor-row">
                                <div class="nwb-editor-input-group">
                                    <label>Width</label>
                                    <input type="text" data-prop="width" placeholder="auto">
                                </div>
                                <div class="nwb-editor-input-group">
                                    <label>Height</label>
                                    <input type="text" data-prop="height" placeholder="auto">
                                </div>
                            </div>
                            <div class="nwb-editor-row">
                                <div class="nwb-editor-input-group">
                                    <label>Max Width</label>
                                    <input type="text" data-prop="maxWidth" placeholder="none">
                                </div>
                                <div class="nwb-editor-input-group">
                                    <label>Max Height</label>
                                    <input type="text" data-prop="maxHeight" placeholder="none">
                                </div>
                            </div>
                        </div>
                        
                        <div class="nwb-editor-section">
                            <div class="nwb-editor-section-title">Background</div>
                            <div class="nwb-editor-row full">
                                <div class="nwb-editor-input-group">
                                    <label>Background Color</label>
                                    <div class="nwb-editor-color-input">
                                        <input type="color" data-prop="backgroundColor" data-color-picker>
                                        <input type="text" data-prop="backgroundColor" placeholder="transparent">
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- CAROUSEL/LOOP CONTROLS -->
                    <div id="controls-carousel" class="nwb-editor-context-panel" style="display:none;">
                        <div class="nwb-editor-section">
                            <div class="nwb-editor-section-title">Animation</div>
                            
                            <div class="nwb-editor-row full">
                                <div class="nwb-editor-input-group">
                                    <label>Animation Duration</label>
                                    <input type="text" data-prop="animationDuration" placeholder="20s">
                                </div>
                            </div>
                            
                            <div class="nwb-editor-row">
                                <div class="nwb-editor-input-group">
                                    <label>Animation Direction</label>
                                    <select data-prop="animationDirection">
                                        <option value="">—</option>
                                        <option value="normal">Normal</option>
                                        <option value="reverse">Reverse</option>
                                        <option value="alternate">Alternate</option>
                                    </select>
                                </div>
                                <div class="nwb-editor-input-group">
                                    <label>Animation Timing</label>
                                    <select data-prop="animationTimingFunction">
                                        <option value="">—</option>
                                        <option value="linear">Linear</option>
                                        <option value="ease">Ease</option>
                                        <option value="ease-in">Ease In</option>
                                        <option value="ease-out">Ease Out</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div class="nwb-editor-row">
                                <div class="nwb-editor-input-group">
                                    <label>Play State</label>
                                    <select data-prop="animationPlayState">
                                        <option value="running">Running</option>
                                        <option value="paused">Paused</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        
                        <div class="nwb-editor-section">
                            <div class="nwb-editor-section-title">Fade Effect (Edges)</div>
                            
                            <div class="nwb-editor-row full">
                                <div class="nwb-editor-input-group">
                                    <label>Fade Preset</label>
                                    <div class="nwb-editor-fade-presets">
                                        <button class="nwb-editor-preset-btn" data-fade="none">None</button>
                                        <button class="nwb-editor-preset-btn" data-fade="subtle">Subtle</button>
                                        <button class="nwb-editor-preset-btn" data-fade="medium">Medium</button>
                                        <button class="nwb-editor-preset-btn" data-fade="strong">Strong</button>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="nwb-editor-row">
                                <div class="nwb-editor-input-group">
                                    <label>Left Fade %</label>
                                    <input type="range" id="fade-left" min="0" max="40" value="10" class="nwb-editor-slider">
                                    <span id="fade-left-value">10%</span>
                                </div>
                                <div class="nwb-editor-input-group">
                                    <label>Right Fade %</label>
                                    <input type="range" id="fade-right" min="0" max="40" value="10" class="nwb-editor-slider">
                                    <span id="fade-right-value">10%</span>
                                </div>
                            </div>
                            
                            <div class="nwb-editor-row full">
                                <div class="nwb-editor-input-group">
                                    <label>Custom Mask Gradient</label>
                                    <input type="text" data-prop="maskImage" id="mask-gradient-input" placeholder="linear-gradient(to right, transparent, black 10%, black 90%, transparent)">
                                </div>
                            </div>
                            
                            <div class="nwb-editor-row full">
                                <div class="nwb-editor-input-group">
                                    <label>Webkit Mask (for Safari)</label>
                                    <input type="text" data-prop="webkitMaskImage" placeholder="same as mask-image">
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- BUTTON CONTROLS -->
                    <div id="controls-button" class="nwb-editor-context-panel" style="display:none;">
                        <div class="nwb-editor-section">
                            <div class="nwb-editor-section-title">Button Style</div>
                            
                            <div class="nwb-editor-row full">
                                <div class="nwb-editor-input-group">
                                    <label>Background</label>
                                    <div class="nwb-editor-color-input">
                                        <input type="color" data-prop="backgroundColor" data-color-picker>
                                        <input type="text" data-prop="backgroundColor" placeholder="#000">
                                    </div>
                                </div>
                            </div>
                            
                            <div class="nwb-editor-row full">
                                <div class="nwb-editor-input-group">
                                    <label>Text Color</label>
                                    <div class="nwb-editor-color-input">
                                        <input type="color" data-prop="color" data-color-picker>
                                        <input type="text" data-prop="color" placeholder="#fff">
                                    </div>
                                </div>
                            </div>
                            
                            <div class="nwb-editor-row">
                                <div class="nwb-editor-input-group">
                                    <label>Padding</label>
                                    <input type="text" data-prop="padding" placeholder="12px 24px">
                                </div>
                                <div class="nwb-editor-input-group">
                                    <label>Border Radius</label>
                                    <input type="text" data-prop="borderRadius" placeholder="8px">
                                </div>
                            </div>
                            
                            <div class="nwb-editor-row full">
                                <div class="nwb-editor-input-group">
                                    <label>Border</label>
                                    <input type="text" data-prop="border" placeholder="1px solid #fff">
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- COMMON SPACING (always shown) -->
                    <div id="controls-common" class="nwb-editor-context-panel">
                        <div class="nwb-editor-section">
                            <div class="nwb-editor-section-title">Spacing</div>
                            
                            <div class="nwb-editor-row full">
                                <div class="nwb-editor-input-group">
                                    <label>Padding</label>
                                    <input type="text" data-prop="padding" placeholder="0px">
                                </div>
                            </div>
                            
                            <div class="nwb-editor-row full">
                                <div class="nwb-editor-input-group">
                                    <label>Margin</label>
                                    <input type="text" data-prop="margin" placeholder="0px">
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="nwb-editor-footer">
                <button class="nwb-editor-btn secondary" id="editor-clear-all" title="Clear all saved changes">Clear</button>
                <button class="nwb-editor-btn secondary" id="editor-reset">Reset</button>
                <button class="nwb-editor-btn primary" id="editor-save-all">Save All</button>
            </div>
        `;

        document.body.appendChild(panel);
        this.panel = panel;
    }

    // Create highlight overlays
    createHighlights() {
        this.highlight = document.createElement('div');
        this.highlight.className = 'nwb-editor-highlight';
        this.highlight.style.display = 'none';
        document.body.appendChild(this.highlight);

        this.hoverHighlight = document.createElement('div');
        this.hoverHighlight.className = 'nwb-editor-hover-highlight';
        this.hoverHighlight.style.display = 'none';
        document.body.appendChild(this.hoverHighlight);
    }

    // Bind all events
    bindEvents() {
        document.addEventListener('click', (e) => this.handleClick(e), true);
        document.addEventListener('mousemove', (e) => this.handleHover(e));

        // Bind all inputs with data-prop
        this.panel.querySelectorAll('[data-prop]').forEach(input => {
            input.addEventListener('input', (e) => this.handleInputChange(e));
            input.addEventListener('change', (e) => this.handleInputChange(e));
        });

        // Color picker sync
        this.panel.querySelectorAll('[data-color-picker]').forEach(picker => {
            picker.addEventListener('input', (e) => {
                const prop = e.target.dataset.prop;
                const textInput = this.panel.querySelector(`input[type="text"][data-prop="${prop}"]`);
                if (textInput) textInput.value = e.target.value;
                this.applyStyle(prop, e.target.value);
            });
        });

        // Footer buttons
        document.getElementById('editor-reset')?.addEventListener('click', () => this.resetElement());
        document.getElementById('editor-save-all')?.addEventListener('click', () => this.saveAllStyles());
        document.getElementById('editor-clear-all')?.addEventListener('click', () => this.clearAllChanges());

        // Auto-save toggle
        document.getElementById('autosave-toggle')?.addEventListener('change', (e) => {
            this.autoSaveEnabled = e.target.checked;
        });

        // Drag and window events
        this.bindDragEvents();
        window.addEventListener('resize', () => this.updateHighlightPosition());
        window.addEventListener('scroll', () => this.updateHighlightPosition());

        // Fade effect controls
        this.bindFadeControls();
    }

    // Bind fade effect controls for carousel
    bindFadeControls() {
        // Fade presets
        this.panel.querySelectorAll('.nwb-editor-preset-btn[data-fade]').forEach(btn => {
            btn.addEventListener('click', () => {
                const preset = btn.dataset.fade;
                this.applyFadePreset(preset);

                // Update active state
                this.panel.querySelectorAll('.nwb-editor-preset-btn[data-fade]').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });

        // Fade sliders
        const fadeLeft = document.getElementById('fade-left');
        const fadeRight = document.getElementById('fade-right');
        const fadeLeftValue = document.getElementById('fade-left-value');
        const fadeRightValue = document.getElementById('fade-right-value');

        if (fadeLeft) {
            fadeLeft.addEventListener('input', () => {
                fadeLeftValue.textContent = fadeLeft.value + '%';
                this.updateFadeGradient();
            });
        }

        if (fadeRight) {
            fadeRight.addEventListener('input', () => {
                fadeRightValue.textContent = fadeRight.value + '%';
                this.updateFadeGradient();
            });
        }
    }

    // Apply fade preset
    applyFadePreset(preset) {
        const fadeLeft = document.getElementById('fade-left');
        const fadeRight = document.getElementById('fade-right');
        const fadeLeftValue = document.getElementById('fade-left-value');
        const fadeRightValue = document.getElementById('fade-right-value');

        const presets = {
            'none': { left: 0, right: 0 },
            'subtle': { left: 5, right: 5 },
            'medium': { left: 10, right: 10 },
            'strong': { left: 20, right: 20 }
        };

        const values = presets[preset] || presets['medium'];

        if (fadeLeft) {
            fadeLeft.value = values.left;
            fadeLeftValue.textContent = values.left + '%';
        }
        if (fadeRight) {
            fadeRight.value = values.right;
            fadeRightValue.textContent = values.right + '%';
        }

        this.updateFadeGradient();
    }

    // Update the mask gradient based on slider values
    updateFadeGradient() {
        if (!this.selectedElement) return;

        const fadeLeft = document.getElementById('fade-left');
        const fadeRight = document.getElementById('fade-right');

        const left = fadeLeft ? fadeLeft.value : 10;
        const right = fadeRight ? fadeRight.value : 10;

        const gradient = `linear-gradient(to right, transparent, black ${left}%, black ${100 - right}%, transparent)`;

        // Update input display
        const maskInput = document.getElementById('mask-gradient-input');
        if (maskInput) maskInput.value = gradient;

        // Apply to element
        this.applyStyle('maskImage', gradient);
        this.applyStyle('webkitMaskImage', gradient);
    }

    // Handle input changes
    handleInputChange(e) {
        const prop = e.target.dataset.prop;
        const value = e.target.value;

        if (prop && this.selectedElement) {
            this.applyStyle(prop, value);
        }
    }

    // Apply style and optionally auto-save
    applyStyle(property, value) {
        if (!this.selectedElement) return;

        // Apply inline style immediately
        this.selectedElement.style[property] = value;
        this.updateHighlightPosition();

        // Auto-save to file
        if (this.autoSaveEnabled) {
            this.saveStyleToServer(property, value);
        }
    }

    // Save style to backend server
    async saveStyleToServer(property, value) {
        const selector = this.getElementSelector(this.selectedElement);

        try {
            await fetch(`${this.API_URL}/api/save-css`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ selector, property, value })
            });
        } catch (error) {
            console.warn('Auto-save failed (is server running?):', error.message);
        }
    }

    // Get CSS selector for element
    getElementSelector(el) {
        if (el.id) return `#${el.id}`;
        if (el.className) {
            const classes = el.className.toString().split(' ').filter(c => c && !c.startsWith('nwb-'));
            if (classes.length) return `.${classes[0]}`;
        }
        return el.tagName.toLowerCase();
    }

    // Bind drag events  
    bindDragEvents() {
        const handle = document.getElementById('editor-drag-handle');
        if (!handle) return;

        handle.addEventListener('mousedown', (e) => {
            if (e.target.closest('input, select, button, label')) return;

            this.isDragging = true;
            const rect = this.panel.getBoundingClientRect();
            this.dragOffset.x = e.clientX - rect.left;
            this.dragOffset.y = e.clientY - rect.top;
            this.panel.classList.add('dragging');
            e.preventDefault();
        });

        document.addEventListener('mousemove', (e) => {
            if (!this.isDragging) return;

            const x = e.clientX - this.dragOffset.x;
            const y = e.clientY - this.dragOffset.y;
            const maxX = window.innerWidth - this.panel.offsetWidth;
            const maxY = window.innerHeight - this.panel.offsetHeight;

            this.panel.style.left = `${Math.max(0, Math.min(x, maxX))}px`;
            this.panel.style.top = `${Math.max(0, Math.min(y, maxY))}px`;
            this.panel.style.right = 'auto';
        });

        document.addEventListener('mouseup', () => {
            if (this.isDragging) {
                this.isDragging = false;
                this.panel.classList.remove('dragging');
            }
        });
    }

    // Toggle editor mode
    toggle() {
        this.isActive = !this.isActive;
        this.toggleBtn.classList.toggle('active', this.isActive);
        this.panel.classList.toggle('visible', this.isActive);
        document.body.classList.toggle('nwb-editor-mode', this.isActive);

        if (!this.isActive) {
            this.deselectElement();
        }
    }

    // Handle element click
    handleClick(e) {
        if (!this.isActive) return;
        if (e.target.closest('.nwb-editor-panel') || e.target.closest('.nwb-editor-toggle')) return;

        e.preventDefault();
        e.stopPropagation();
        this.selectElement(e.target);
    }

    // Handle hover
    handleHover(e) {
        if (!this.isActive) return;

        const target = e.target;
        if (target.closest('.nwb-editor-panel') || target.closest('.nwb-editor-toggle') ||
            target.classList.contains('nwb-editor-highlight') || target.classList.contains('nwb-editor-hover-highlight')) {
            this.hoverHighlight.style.display = 'none';
            return;
        }

        if (target !== this.selectedElement) {
            const rect = target.getBoundingClientRect();
            this.hoverHighlight.style.display = 'block';
            this.hoverHighlight.style.top = rect.top + window.scrollY + 'px';
            this.hoverHighlight.style.left = rect.left + window.scrollX + 'px';
            this.hoverHighlight.style.width = rect.width + 'px';
            this.hoverHighlight.style.height = rect.height + 'px';
        } else {
            this.hoverHighlight.style.display = 'none';
        }
    }

    // Select an element
    selectElement(element) {
        this.selectedElement = element;
        this.currentElementType = this.detectElementType(element);

        this.updateHighlightPosition();

        // Update element info
        const tagName = element.tagName.toLowerCase();
        const className = element.className ? `.${element.className.toString().split(' ').filter(c => !c.startsWith('nwb-')).join('.')}` : '';
        const id = element.id ? `#${element.id}` : '';

        document.getElementById('selected-element-tag').textContent = `${tagName}${id}${className}`;
        document.getElementById('element-type-badge').textContent = this.currentElementType.toUpperCase();

        // Show/hide context panels
        this.showContextPanel(this.currentElementType);

        // Load current styles
        this.loadElementStyles();

        document.getElementById('editor-no-selection').style.display = 'none';
        document.getElementById('editor-controls').style.display = 'block';
        this.hoverHighlight.style.display = 'none';
    }

    // Show appropriate context panel
    showContextPanel(type) {
        // Hide all context panels first
        this.panel.querySelectorAll('.nwb-editor-context-panel').forEach(p => {
            p.style.display = 'none';
        });

        // Show relevant panel
        const panelId = `controls-${type}`;
        const panel = document.getElementById(panelId);
        if (panel) {
            panel.style.display = 'block';
        }

        // Always show common controls
        document.getElementById('controls-common').style.display = 'block';
    }

    deselectElement() {
        this.selectedElement = null;
        this.currentElementType = null;
        this.highlight.style.display = 'none';
        this.hoverHighlight.style.display = 'none';

        document.getElementById('editor-no-selection').style.display = 'block';
        document.getElementById('editor-controls').style.display = 'none';
    }

    updateHighlightPosition() {
        if (!this.selectedElement) return;

        const rect = this.selectedElement.getBoundingClientRect();
        this.highlight.style.display = 'block';
        this.highlight.style.top = rect.top + window.scrollY + 'px';
        this.highlight.style.left = rect.left + window.scrollX + 'px';
        this.highlight.style.width = rect.width + 'px';
        this.highlight.style.height = rect.height + 'px';
        this.highlight.setAttribute('data-tag', this.selectedElement.tagName.toLowerCase());
    }

    // Load current styles into inputs
    loadElementStyles() {
        if (!this.selectedElement) return;

        const computed = window.getComputedStyle(this.selectedElement);

        this.panel.querySelectorAll('[data-prop]').forEach(input => {
            const prop = input.dataset.prop;
            const value = computed[prop] || '';

            if (input.type === 'color') {
                input.value = this.rgbToHex(value);
            } else {
                input.value = value;
            }
        });
    }

    // Reset current element
    resetElement() {
        if (!this.selectedElement) return;
        this.selectedElement.removeAttribute('style');
        this.loadElementStyles();
        this.updateHighlightPosition();
    }

    // Save all styles manually
    async saveAllStyles() {
        alert('Styles are auto-saved as you edit when the toggle is ON.\n\nCheck css/editor-custom.css for saved styles.');
    }

    // Clear all custom styles
    async clearAllChanges() {
        if (!confirm('Clear ALL saved custom styles? This will delete css/editor-custom.css content.')) return;

        try {
            await fetch(`${this.API_URL}/api/clear-css`, { method: 'DELETE' });
            location.reload();
        } catch (error) {
            console.error('Failed to clear:', error);
            alert('Failed to clear. Is the server running?');
        }
    }

    // RGB to Hex helper
    rgbToHex(rgb) {
        if (!rgb || rgb === 'rgba(0, 0, 0, 0)' || rgb === 'transparent') return '#000000';
        const match = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        if (!match) return rgb;
        const r = parseInt(match[1]).toString(16).padStart(2, '0');
        const g = parseInt(match[2]).toString(16).padStart(2, '0');
        const b = parseInt(match[3]).toString(16).padStart(2, '0');
        return `#${r}${g}${b}`;
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.nwbEditor = new NWBEditor();
});
