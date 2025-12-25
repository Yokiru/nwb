const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Path to styles.css
const STYLES_PATH = path.join(__dirname, 'css', 'styles.css');
const EDITOR_STYLES_PATH = path.join(__dirname, 'css', 'editor-custom.css');

// Helper: Parse CSS into rules object
function parseCSS(cssText) {
    const rules = {};
    const ruleRegex = /([^{]+)\{([^}]*)\}/g;
    let match;

    while ((match = ruleRegex.exec(cssText)) !== null) {
        const selector = match[1].trim();
        const declarations = match[2].trim();
        rules[selector] = declarations;
    }

    return rules;
}

// Helper: Stringify rules back to CSS
function stringifyCSS(rules) {
    let css = '/* NWB Visual Editor - Custom Styles */\n';
    css += '/* Auto-generated - Do not edit manually */\n\n';

    for (const [selector, declarations] of Object.entries(rules)) {
        css += `${selector} {\n`;
        declarations.split(';').filter(d => d.trim()).forEach(d => {
            css += `    ${d.trim()};\n`;
        });
        css += '}\n\n';
    }

    return css;
}

// API: Save CSS rule
app.post('/api/save-css', (req, res) => {
    try {
        const { selector, property, value } = req.body;

        if (!selector || !property || value === undefined) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Read existing custom styles
        let existingCSS = '';
        if (fs.existsSync(EDITOR_STYLES_PATH)) {
            existingCSS = fs.readFileSync(EDITOR_STYLES_PATH, 'utf8');
        }

        // Parse existing rules
        const rules = parseCSS(existingCSS);

        // Get or create rule for selector
        let existingDeclarations = rules[selector] || '';

        // Convert property from camelCase to kebab-case
        const cssProperty = property.replace(/([A-Z])/g, '-$1').toLowerCase();

        // Update or add the property
        const declArray = existingDeclarations.split(';').filter(d => d.trim());
        const newDeclArray = declArray.filter(d => !d.includes(cssProperty));
        newDeclArray.push(`${cssProperty}: ${value}`);

        rules[selector] = newDeclArray.join('; ');

        // Write back to file
        const newCSS = stringifyCSS(rules);
        fs.writeFileSync(EDITOR_STYLES_PATH, newCSS);

        console.log(`[Editor] Saved: ${selector} { ${cssProperty}: ${value} }`);

        res.json({ success: true, message: 'CSS saved successfully' });
    } catch (error) {
        console.error('Error saving CSS:', error);
        res.status(500).json({ error: 'Failed to save CSS' });
    }
});

// API: Get all custom styles
app.get('/api/get-css', (req, res) => {
    try {
        if (fs.existsSync(EDITOR_STYLES_PATH)) {
            const css = fs.readFileSync(EDITOR_STYLES_PATH, 'utf8');
            res.json({ success: true, css });
        } else {
            res.json({ success: true, css: '' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to read CSS' });
    }
});

// API: Clear all custom styles
app.delete('/api/clear-css', (req, res) => {
    try {
        if (fs.existsSync(EDITOR_STYLES_PATH)) {
            fs.writeFileSync(EDITOR_STYLES_PATH, '/* NWB Visual Editor - Custom Styles */\n');
        }
        res.json({ success: true, message: 'CSS cleared' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to clear CSS' });
    }
});

// API: Delete specific selector
app.delete('/api/delete-css/:selector', (req, res) => {
    try {
        const selector = decodeURIComponent(req.params.selector);

        if (fs.existsSync(EDITOR_STYLES_PATH)) {
            const existingCSS = fs.readFileSync(EDITOR_STYLES_PATH, 'utf8');
            const rules = parseCSS(existingCSS);
            delete rules[selector];
            const newCSS = stringifyCSS(rules);
            fs.writeFileSync(EDITOR_STYLES_PATH, newCSS);
        }

        res.json({ success: true, message: 'Selector deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete CSS' });
    }
});

app.listen(PORT, () => {
    console.log(`\n🎨 NWB Visual Editor Server running on http://localhost:${PORT}`);
    console.log(`   Saving styles to: ${EDITOR_STYLES_PATH}\n`);
});
