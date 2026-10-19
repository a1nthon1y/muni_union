const fs = require('fs');
const path = require('path');

function cleanAndFix(content) {
  // Fix any accidental typos like "page-;"
  content = content.replace(/page-;?/g, '');

  // 1. TOC before
  content = content.replace(
    /nav#TOC:before\s*\{[^}]*\}/g,
    'nav#TOC:before{content:"Contenido";display:block;font-size:1.5rem;font-weight:800;color:var(--navy);border-bottom:3px solid var(--cyan);padding-bottom:.5rem;margin-bottom:1rem;break-after:avoid!important;page-break-after:avoid!important}'
  );

  // 2. nav#TOC list items: allow break inside
  content = content.replace(
    /nav#TOC\s+ul\s*\{[^}]*\}/g,
    'nav#TOC ul{list-style:none;margin:.2rem 0;padding-left:1rem;break-inside:auto!important;page-break-inside:auto!important}'
  );
  content = content.replace(
    /nav#TOC\s+li\s*\{[^}]*\}/g,
    'nav#TOC li{margin:.2rem 0;break-inside:auto!important;page-break-inside:auto!important}'
  );

  // 3. H1 and H2
  content = content.replace(
    /h1\s*\{\s*font-size:\s*2rem;[^}]*\}/g,
    'h1{font-size:2rem;color:var(--navy);border-bottom:4px solid var(--cyan);padding-bottom:.55rem;margin-top:2.5rem;break-after:avoid!important;page-break-after:avoid!important}'
  );

  content = content.replace(
    /main\s*>\s*h2(\s*\{[^}]*\})?(main\s*>\s*h2:[^}]+})?/g,
    'main>h2{page-break-before:always;break-before:page}main>h2:first-of-type,main>h2#sistema-de-registro-civil{page-break-before:avoid!important;break-before:avoid!important;margin-top:.6rem!important}'
  );

  // 4. h3#contenido and h3#contenido-institucional
  content = content.replace(
    /h3#contenido[^{]*\{[^}]*\}/g,
    'h3#contenido,h3#contenido-institucional{break-after:avoid!important;page-break-after:avoid!important}'
  );
  content = content.replace(
    /h3#contenido\+ol[^{]*\{[^}]*\}/g,
    'h3#contenido+ol,h3#contenido-institucional+ol{break-inside:auto!important;page-break-inside:auto!important}'
  );

  // 5. In @media print
  content = content.replace(
    /nav#TOC\s*\{\s*padding:\s*0\s*\}/g,
    'nav#TOC{padding:0}nav#TOC:before{break-after:avoid!important;page-break-after:avoid!important}nav#TOC ul,nav#TOC li{break-inside:auto!important;page-break-inside:auto!important}'
  );

  return content;
}

function processFile(fileName) {
  const filePath = path.join(__dirname, '..', fileName);
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');
  content = cleanAndFix(content);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Cleaned and fixed ${fileName}`);
}

processFile('MANUAL_TECNICO.html');
processFile('MANUAL_USUARIO.html');
