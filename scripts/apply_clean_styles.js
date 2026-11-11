const fs = require('fs');
const path = require('path');

const baseCustomCss = `
:root{--navy:#12384a;--cyan:#0e7490;--ink:#1e293b;--muted:#64748b;--line:#cbd5e1;--soft:#f1f5f9;--warn:#fef3c7;--danger:#fee2e2}
*{box-sizing:border-box}
html{scroll-behavior:smooth;font-size:15px}
body{margin:0!important;padding:0!important;max-width:none!important;color:var(--ink);background:#fff;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif;line-height:1.62}
.cover{min-height:100vh;padding:10vh 8vw;display:flex;flex-direction:column;justify-content:center;color:#fff;background:linear-gradient(145deg,#0b2531,#155e75);page-break-after:always;break-after:page}
.cover .seal{width:140px;height:140px;border:2px solid #67e8f9;border-radius:50%;display:grid;place-items:center;margin-bottom:2.2rem}
.cover .seal img{display:block;width:112px;height:112px;object-fit:contain}
.cover h1{font-size:3rem;line-height:1.08;color:#fff;border:0;margin:0 0 .8rem}
.cover p{max-width:720px;font-size:1.1rem;color:#cffafe}
.cover .meta{margin-top:2.5rem;padding-top:1.2rem;border-top:1px solid #ffffff55;display:flex;gap:2rem;flex-wrap:wrap}
.cover strong{color:#fff}
body>header#title-block-header{display:none}
nav#TOC{max-width:1040px;margin:0 auto;padding:3rem 3.5rem;page-break-after:always;break-after:page}
nav#TOC:before{content:"Contenido";display:block;font-size:1.5rem;font-weight:800;color:var(--navy);border-bottom:3px solid var(--cyan);padding-bottom:.5rem;margin-bottom:1rem;page-break-after:avoid!important;break-after:avoid!important}
nav#TOC ul{list-style:none;margin:.2rem 0;padding-left:1rem;page-break-inside:auto!important;break-inside:auto!important}
nav#TOC>ul{padding-left:0}
nav#TOC li{margin:.2rem 0;page-break-inside:auto!important;break-inside:auto!important}
nav#TOC a{color:var(--ink);text-decoration:none}
nav#TOC a:hover{color:var(--cyan)}
h3#contenido,h3#contenido-institucional{page-break-after:avoid!important;break-after:avoid!important}
h3#contenido+ol,h3#contenido-institucional+ol{page-break-inside:auto!important;break-inside:auto!important}
h3#contenido+ol li,h3#contenido-institucional+ol li{page-break-inside:avoid;break-inside:avoid}
main{max-width:1120px;margin:0 auto;padding:2rem 3.5rem 5rem}
h1,h2,h3,h4{line-height:1.25;page-break-after:avoid;break-after:avoid}
h1{font-size:2rem;color:var(--navy);border-bottom:4px solid var(--cyan);padding-bottom:.55rem;margin-top:2.5rem;page-break-after:avoid!important;break-after:avoid!important}
h2{font-size:1.55rem;color:var(--navy);border-bottom:2px solid var(--line);padding-bottom:.35rem;margin-top:2.3rem}
main>h2{page-break-before:auto;break-before:auto;margin-top:2.2rem!important;padding-top:.8rem;page-break-after:avoid!important;break-after:avoid!important}
main>h2:first-of-type,main>h2#sistema-de-registro-civil{page-break-before:avoid!important;break-before:avoid!important;margin-top:.6rem!important}
h3{font-size:1.2rem;color:#155e75;border-left:4px solid #06b6d4;padding-left:.65rem;margin-top:1.8rem}
h4{font-size:1rem;color:#334155;margin-top:1.35rem}
p,li{font-size:.94rem}
a{color:#0369a1}
blockquote{margin:1rem 0;padding:.8rem 1rem;border-left:5px solid #dc2626;background:var(--danger);color:#7f1d1d}
code{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;background:var(--soft);color:#9f1239;padding:.12rem .3rem;border-radius:4px;font-size:.82em}
pre{padding:1rem 1.1rem;background:#f8fafc;color:#111827;border:1.5px solid #64748b;border-left:5px solid #0f172a;border-radius:8px;overflow:auto;white-space:pre-wrap;word-break:break-word;font-size:.82rem;box-shadow:0 1px 2px #0f172a14}
pre code{background:transparent;color:#111827;padding:0}
.mermaid{background:#fff;color:var(--ink);border:1px solid var(--line);border-left:4px solid var(--cyan);text-align:center;overflow:auto}
.mermaid svg{max-width:100%;height:auto}
table{width:100%;border-collapse:collapse;margin:.8rem 0 1.25rem;font-size:.78rem}
thead{background:var(--navy);color:#fff}
th,td{padding:.48rem .58rem;border:1px solid #dbe3ea;text-align:left;vertical-align:top}
tbody tr:nth-child(even){background:#f8fafc}
tr{page-break-inside:avoid;break-inside:avoid}
th{font-weight:700}
ul.task-list{list-style:none;padding-left:.25rem}
.task-list-item input{margin-right:.45rem}
hr{border:0;border-top:1px solid var(--line);margin:2rem 0}
.doc-classification{display:none!important}
.screen-note{max-width:1120px;margin:1rem auto;padding:0 3.5rem;color:var(--muted);font-size:.8rem}
@media screen and (max-width:760px){
  .cover{min-height:auto;padding:4rem 1.4rem}
  .cover h1{font-size:2.1rem}
  nav#TOC,main{padding:1.5rem 1rem}
  table{display:block;overflow-x:auto;white-space:nowrap}
}
@media print{
  @page{size:A4;margin:1.6cm 1.4cm 1.8cm}
  html{font-size:10.2pt}
  body{print-color-adjust:exact;-webkit-print-color-adjust:exact}
  .cover{min-height:25cm;padding:4cm 1.2cm}
  .cover h1{font-size:28pt}
  nav#TOC{padding:0;font-size:8.6pt;line-height:1.32}
  nav#TOC:before{page-break-after:avoid!important;break-after:avoid!important}
  nav#TOC ul{page-break-inside:auto!important;break-inside:auto!important}
  nav#TOC li{margin:.08rem 0;page-break-inside:avoid!important;break-inside:avoid!important}
  .screen-note{display:none}
  main{max-width:none;padding:0}
  h1{font-size:18pt;page-break-after:avoid!important;break-after:avoid!important}
  main>h2{page-break-before:auto;break-before:auto;page-break-after:avoid!important;break-after:avoid!important;margin-top:1.8rem!important;padding-top:.6rem}
  main>h2:first-of-type,main>h2#sistema-de-registro-civil{page-break-before:avoid!important;break-before:avoid!important;margin-top:.4cm!important}
  h2{font-size:15pt}
  h3{font-size:12pt}
  h4{font-size:10.5pt}
  p,li{font-size:9.2pt}
  ol,ul{orphans:3;widows:3}
  ol li,ul li{page-break-inside:avoid;break-inside:avoid}
  h1+p,h2+p,h3+p,h4+p,h1+ol,h2+ol,h3+ol,h4+ol,h1+ul,h2+ul,h3+ul,h4+ul{page-break-after:avoid!important;break-after:avoid!important}
  hr{page-break-after:avoid;break-after:avoid;margin:1.2rem 0}
  h3#contenido,h3#contenido-institucional{page-break-after:avoid!important;break-after:avoid!important}
  h3#contenido+ol,h3#contenido-institucional+ol{page-break-inside:auto!important;break-inside:auto!important}
  h3#contenido+ol li,h3#contenido-institucional+ol li{page-break-inside:avoid;break-inside:avoid}
  blockquote{page-break-inside:avoid;break-inside:avoid}
  table{font-size:7.2pt}
  pre{font-size:7.5pt;page-break-inside:auto;break-inside:auto;background:#fff!important;color:#111827!important;border:1.5px solid #334155!important;border-left:5px solid #0f172a!important;box-shadow:none!important}
  pre code{color:#111827!important;background:transparent!important}
  .mermaid{page-break-inside:avoid;break-inside:avoid}
  a{color:inherit;text-decoration:none}
  .doc-classification{display:none!important}
}
`;

const usuarioCapturesCss = `
.manual-capture {
  margin: 1.25rem 0 1.75rem;
  padding: .8rem;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: #f8fafc;
  page-break-inside: avoid;
  break-inside: avoid;
}
.manual-capture img {
  display: block;
  width: 100%;
  height: auto;
  max-height: 720px;
  object-fit: contain;
  margin: 0 auto .7rem;
  border: 1px solid #cbd5e1;
  border-radius: 5px;
  background: #fff;
}
.manual-capture img[hidden] {
  display: none;
}
.capture-slot {
  min-height: 220px;
  aspect-ratio: 16/9;
  display: grid;
  place-items: center;
  padding: 1rem;
  border: 2px dashed #0891b2;
  border-radius: 5px;
  background: #ecfeff;
  color: #155e75;
  text-align: center;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: .78rem;
  overflow-wrap: anywhere;
}
.capture-slot[hidden] {
  display: none;
}
.manual-capture figcaption {
  margin-top: .65rem;
  color: #334155;
  font-size: .84rem;
}
.manual-capture figcaption strong {
  color: var(--navy);
}
@media print {
  .manual-capture {
    margin: .5cm 0;
    page-break-inside: avoid;
    break-inside: avoid;
  }
  .manual-capture img {
    max-height: 12cm;
    width: auto;
    max-width: 100%;
    margin: 0 auto;
  }
  .capture-slot {
    min-height: 4.5cm;
  }
}
`;

function updateFile(fileName, isUsuario) {
  const filePath = path.join(__dirname, '..', fileName);
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace everything between the second <style> and </head>
  const firstStyleEnd = content.indexOf('</style>');
  if (firstStyleEnd === -1) {
    console.error('Could not find </style> in ' + fileName);
    return;
  }
  const headEnd = content.indexOf('</head>', firstStyleEnd);
  if (headEnd === -1) {
    console.error('Could not find </head> in ' + fileName);
    return;
  }

  const newStyleBlock = '<style>' + baseCustomCss + (isUsuario ? usuarioCapturesCss : '') + '</style>';
  content = content.substring(0, firstStyleEnd + 8) + '\n' + newStyleBlock + content.substring(headEnd);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Successfully updated ${fileName}`);
}

updateFile('MANUAL_TECNICO.html', false);
updateFile('MANUAL_USUARIO.html', true);
