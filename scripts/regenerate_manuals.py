#!/usr/bin/env python3
"""Regenera el contenido de los manuales conservando su plantilla imprimible."""

from __future__ import annotations

import html
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

MANUALES = (
    (
        ROOT / "MANUAL_TECNICO.md",
        ROOT / "MANUAL_TECNICO.html",
        "Manual Técnico — Sistema de Registro Civil",
        False,
    ),
    (
        ROOT / "MANUAL_USUARIO.md",
        ROOT / "MANUAL_USUARIO.html",
        "Manual de Usuario — Sistema de Registro Civil",
        True,
    ),
)


def extraer(patron: str, texto: str, descripcion: str) -> re.Match[str]:
    coincidencia = re.search(patron, texto, flags=re.DOTALL)
    if not coincidencia:
        raise RuntimeError(f"No se encontró {descripcion}")
    return coincidencia


def convertir_mermaid(contenido: str) -> str:
    patron = re.compile(
        r'<pre class="mermaid"><code>(.*?)</code></pre>',
        flags=re.DOTALL,
    )
    return patron.sub(
        lambda match: f'<pre class="mermaid">{html.unescape(match.group(1))}</pre>',
        contenido,
    )


def convertir_capturas(contenido: str) -> str:
    patron = re.compile(
        r"<blockquote>\s*<p><strong>Captura pendiente — Figura "
        r"(\d+\.\d+)\.</strong>\s*(.*?)</p>\s*</blockquote>",
        flags=re.DOTALL,
    )

    def reemplazar(match: re.Match[str]) -> str:
        numero = match.group(1)
        slug = numero.replace(".", "-")
        descripcion = match.group(2).strip()
        ruta = f"docs/manual-usuario/capturas/figura-{slug}.png"
        return (
            f'<figure class="manual-capture" id="figura-{slug}">\n'
            f'  <div class="capture-slot">Imagen pendiente<br><code>{ruta}</code></div>'
            f'<img src="{ruta}" alt="Figura {numero}" loading="lazy" '
            'onload="this.hidden=false;this.previousElementSibling.hidden=true" '
            'onerror="this.hidden=true;this.previousElementSibling.hidden=false">\n'
            f'  <figcaption><strong>Figura {numero}.</strong> {descripcion}</figcaption>\n'
            "</figure>"
        )

    return patron.sub(reemplazar, contenido)


def regenerar(md_path: Path, html_path: Path, titulo: str, capturas: bool) -> None:
    plantilla = html_path.read_text(encoding="utf-8")
    generado = subprocess.run(
        [
            "pandoc",
            str(md_path),
            "--standalone",
            "--toc",
            "--no-highlight",
            "--from=gfm+raw_html",
            "--to=html5",
            "--metadata",
            f"title={titulo}",
        ],
        check=True,
        capture_output=True,
        text=True,
    ).stdout

    prefijo = extraer(
        r"\A(.*?<body>\s*)",
        plantilla,
        "el inicio de body de la plantilla",
    ).group(1)
    cubierta = extraer(
        r"<body>\s*(.*?)(?=<header id=\"title-block-header\">)",
        plantilla,
        "la cubierta",
    ).group(1)
    pie = extraer(
        r'(<div class="doc-classification".*)\Z',
        plantilla,
        "el pie del manual",
    ).group(1)
    cuerpo_generado = extraer(
        r"<body>\s*(.*?)\s*</body>",
        generado,
        "el body generado",
    ).group(1)
    encabezado = extraer(
        r"(<header id=\"title-block-header\">.*?</header>)",
        cuerpo_generado,
        "el encabezado generado",
    ).group(1)
    tabla_contenido = extraer(
        r"(<nav id=\"TOC\".*?</nav>)",
        cuerpo_generado,
        "la tabla de contenido generada",
    ).group(1)

    contenido = cuerpo_generado
    contenido = contenido.replace(encabezado, "", 1)
    contenido = contenido.replace(tabla_contenido, "", 1).strip()
    contenido = convertir_mermaid(contenido)
    if capturas:
        contenido = convertir_capturas(contenido)

    resultado = (
        f"{prefijo}{cubierta}{encabezado}\n{tabla_contenido}\n"
        f"<main>\n{contenido}\n</main>\n{pie}"
    )
    html_path.write_text(resultado, encoding="utf-8")


def main() -> None:
    for manual in MANUALES:
        regenerar(*manual)


if __name__ == "__main__":
    main()
