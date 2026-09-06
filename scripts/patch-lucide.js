const fs = require('fs');
const path = require('path');

// 1. Patch lucide-react createContext for React 19 RSC
const lucidePath = path.join(process.cwd(), 'node_modules/lucide-react/dist/cjs/lucide-react.js');
if (fs.existsSync(lucidePath)) {
  let s = fs.readFileSync(lucidePath, 'utf8');
  if (s.includes('const LucideContext = react.createContext({});')) {
    s = s.replace(
      'const LucideContext = react.createContext({});',
      'const LucideContext = (typeof react.createContext === "function") ? react.createContext({}) : { Provider: null, Consumer: null };'
    );
    fs.writeFileSync(lucidePath, s, 'utf8');
    console.log('[patch-lucide] Patched LucideContext for React 19 RSC');
  }
}

// 2. Ensure lucide-react typing d.ts exists
const dtsPath = path.join(process.cwd(), 'node_modules/lucide-react/dist/lucide-react.d.ts');
if (!fs.existsSync(dtsPath) && fs.existsSync(lucidePath)) {
  try {
    const mod = require('lucide-react');
    const keys = Object.keys(mod).filter((k) => /^[A-Za-z0-9_]+$/.test(k));
    let dts = `import * as React from 'react';\n\nexport interface LucideProps extends React.SVGProps<SVGSVGElement> {\n  size?: string | number;\n  color?: string;\n  strokeWidth?: string | number;\n  absoluteStrokeWidth?: boolean;\n}\n\nexport type LucideIcon = React.ForwardRefExoticComponent<LucideProps & React.RefAttributes<SVGSVGElement>>;\n\n`;
    dts += keys.map((k) => `export declare const ${k}: LucideIcon;`).join('\n') + '\n';
    fs.writeFileSync(dtsPath, dts, 'utf8');
    console.log('[patch-lucide] Generated lucide-react.d.ts with', keys.length, 'icons');
  } catch (err) {
    console.warn('[patch-lucide] Could not generate d.ts:', err.message);
  }
}

// 3. Fix truncated comment in openai usage.d.mts if present
const openaiUsagePath = path.join(process.cwd(), 'node_modules/openai/resources/admin/organization/usage.d.mts');
if (fs.existsSync(openaiUsagePath)) {
  let s = fs.readFileSync(openaiUsagePath, 'utf8');
  if (s.includes('grouped usag') && !s.includes('grouped usage result.')) {
    const idx = s.indexOf('grouped usag');
    s = s.slice(0, idx) + 'grouped usage result.\n             */\n            model?: string | null;\n          }\n        }\n      }\n';
    fs.writeFileSync(openaiUsagePath, s, 'utf8');
    console.log('[patch-lucide] Fixed openai usage.d.mts truncated comment');
  }
}
