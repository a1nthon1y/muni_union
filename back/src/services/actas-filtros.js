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
        const numeroLibro = libro.trim().replace(/^L/i, "");
        const placeholder = agregarParametro(params, `L${numeroLibro}`);
        clausulas.push(`split_part(a.numero_acta, '-', 2) = ${placeholder}`);
    }

    if (numero?.trim()) {
        const codigo = numero.trim().toUpperCase();
        const placeholder = agregarParametro(params, codigo);

        if (codigo.includes("-")) {
            clausulas.push(`UPPER(a.numero_acta) = ${placeholder}`);
        } else if (/^\d+$/.test(codigo)) {
            clausulas.push(`(split_part(a.numero_acta, '-', 3) = ${placeholder} OR a.numero_acta = ${placeholder})`);
        } else {
            clausulas.push(`UPPER(a.numero_acta) = ${placeholder}`);
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
