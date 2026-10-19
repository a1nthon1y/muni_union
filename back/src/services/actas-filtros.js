const agregarParametro = (params, value) => {
    params.push(value);
    return `$${params.length}`;
};

export const construirFiltrosActas = (filtros = {}) => {
    const {
        q, tipo, anio, dni, numero, libro,
        fecha_desde, fecha_hasta, persona_id,
    } = filtros;
    const clausulas = [];
    const params = [];

    const terminos = q?.trim().split(/\s+/).filter(Boolean) ?? [];
    for (const termino of terminos) {
        const placeholder = agregarParametro(params, `%${termino}%`);
        clausulas.push(`(
            concat_ws(' ', p.apellido_paterno, p.apellido_materno, p.nombres) ILIKE ${placeholder}
            OR concat_ws(' ', p2.apellido_paterno, p2.apellido_materno, p2.nombres) ILIKE ${placeholder}
            OR COALESCE(p.dni, '') ILIKE ${placeholder}
            OR COALESCE(p2.dni, '') ILIKE ${placeholder}
            OR a.numero_acta ILIKE ${placeholder}
        )`);
    }

    const personaIdTexto = persona_id?.toString().trim();
    if (personaIdTexto && /^\d+$/.test(personaIdTexto)) {
        const personaId = Number.parseInt(personaIdTexto, 10);
        if (personaId > 0) {
            const placeholder = agregarParametro(params, personaId);
            clausulas.push(
                `(a.persona_principal_id = ${placeholder} OR a.persona_secundaria_id = ${placeholder})`,
            );
        }
    }

    if (tipo?.trim()) {
        const placeholder = agregarParametro(params, tipo.trim().toUpperCase());
        clausulas.push(`a.tipo_acta = ${placeholder}`);
    }

    if (anio?.toString().trim()) {
        const parsedAnio = Number.parseInt(anio, 10);
        if (Number.isInteger(parsedAnio)) {
            const placeholder = agregarParametro(params, parsedAnio);
            clausulas.push(`a.anio = ${placeholder}`);
        }
    }

    if (libro?.trim()) {
        const raw = libro.trim().toUpperCase().replace(/^L/, "");
        const placeholderL = agregarParametro(params, `L${raw}`);
        const placeholderSinL = agregarParametro(params, raw);
        clausulas.push(`(
            split_part(a.numero_acta, '-', 2) = ${placeholderL}
            OR regexp_replace(split_part(a.numero_acta, '-', 2), '^L0*', 'L') = ${placeholderL}
            OR regexp_replace(split_part(a.numero_acta, '-', 2), '^L0*', '') = ${placeholderSinL}
        )`);
    }

    if (numero?.trim()) {
        const codigo = numero.trim().toUpperCase();

        if (/^[A-Z]+-L\d+-\d+/i.test(codigo)) {
            // Ejemplo: "NAC-L29-154" -> debe traer "NAC-L29-154" Y también "NAC-L29-154-A", etc.
            const placeholderExacto = agregarParametro(params, codigo);
            const placeholderPrefijo = agregarParametro(params, `${codigo}-%`);
            clausulas.push(`(UPPER(a.numero_acta) = ${placeholderExacto} OR UPPER(a.numero_acta) LIKE ${placeholderPrefijo})`);
        } else if (/^\d+-[A-Z0-9]+$/i.test(codigo)) {
            // Ejemplo: "154-A" -> coincide con cualquier acta que termine en -154-A o sea 154-A
            const placeholder = agregarParametro(params, `%-${codigo}`);
            const placeholderExacto = agregarParametro(params, codigo);
            clausulas.push(`(UPPER(a.numero_acta) LIKE ${placeholder} OR UPPER(a.numero_acta) = ${placeholderExacto})`);
        } else if (/^\d+$/.test(codigo)) {
            // Ejemplo: "154" -> trae 154 exacto y también con sufijo 154-A
            const placeholder = agregarParametro(params, codigo);
            const placeholderSufijo = agregarParametro(params, `${codigo}-%`);
            clausulas.push(`(split_part(a.numero_acta, '-', 3) = ${placeholder} OR split_part(a.numero_acta, '-', 3) LIKE ${placeholderSufijo} OR a.numero_acta = ${placeholder})`);
        } else {
            const placeholder = agregarParametro(params, `%${codigo}%`);
            clausulas.push(`UPPER(a.numero_acta) LIKE ${placeholder}`);
        }
    }

    if (dni?.trim()) {
        const placeholder = agregarParametro(params, `%${dni.trim()}%`);
        clausulas.push(`(p.dni ILIKE ${placeholder} OR p2.dni ILIKE ${placeholder})`);
    }

    if (fecha_desde) {
        const placeholder = agregarParametro(params, fecha_desde);
        clausulas.push(`a.fecha_acta >= ${placeholder}`);
    }

    if (fecha_hasta) {
        const placeholder = agregarParametro(params, fecha_hasta);
        clausulas.push(`a.fecha_acta <= ${placeholder}`);
    }

    return { clausulas, params };
};
