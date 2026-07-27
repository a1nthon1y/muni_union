"use client";

import { Acta } from "@/types/acta";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { dateUtils } from "@/utils/dateUtils";

interface ActaPrintViewProps {
    acta: Acta;
}

export function ActaPrintView({ acta }: ActaPrintViewProps) {
    return (
        <div className="print-container bg-white text-black p-0 font-serif leading-relaxed block overflow-visible">
            <div className="max-w-[190mm] mx-auto p-8 border border-slate-200">
                {/* Header Compacto */}
                <div className="flex flex-col items-center text-center space-y-1 border-b-2 border-slate-900 pb-3 mb-4 relative">
                    <img src="/Logo_MDUnion.svg" alt="Logo" className="w-14 h-14 mb-1" />
                    <h1 className="text-xl font-black uppercase tracking-widest text-slate-900">Municipalidad Distrital de La Unión</h1>
                    <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600">Oficina de Registro Civil</h2>
                    <div className="absolute top-0 right-0 text-[8px] font-mono text-slate-400">STDU-V2.0</div>
                </div>

                {/* Document Title Compacto */}
                <div className="text-center mb-6">
                    <h3 className="text-xl font-black uppercase tracking-tighter text-slate-900 mb-1">
                        Detalle de Registro de Acta
                    </h3>
                    <div className="flex justify-center items-center gap-4">
                        <span className="h-0.5 w-8 bg-slate-900"></span>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                            Expediente {acta.numero_acta} · {acta.anio}
                        </p>
                        <span className="h-0.5 w-8 bg-slate-900"></span>
                    </div>
                </div>

                {/* Content Body Compacto */}
                <div className="space-y-6">
                    {/* Section 1: Titular */}
                    <section>
                        <div className="flex items-center gap-2 mb-2">
                            <div className="bg-slate-900 text-white px-2 py-0.5 font-black text-[10px] uppercase tracking-widest">01</div>
                            <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-900 underline underline-offset-4 decoration-2">
                                {acta.tipo_acta === 'MATRIMONIO' ? 'Contrayente 1' : 'Información del Titular'}
                            </h4>
                        </div>

                        <div className="grid grid-cols-2 gap-x-12 gap-y-4 px-2">
                            <div className="col-span-2 border-b border-slate-100 pb-2">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Apellidos y Nombres Completos</p>
                                <p className="text-lg font-black text-slate-900 uppercase">{acta.apellido_paterno} {acta.apellido_materno}, {acta.nombres}</p>
                            </div>

                            <div className="border-b border-slate-100 pb-2">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">DNI / Documento</p>
                                <p className="text-base font-black text-slate-900 font-mono tracking-widest">{acta.dni}</p>
                            </div>

                            <div className="border-b border-slate-100 pb-2">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Sexo / Género</p>
                                <p className="text-base font-black text-slate-900 uppercase">{acta.sexo === 'M' ? 'Masculino' : 'Femenino'}</p>
                            </div>

                            <div className="border-b border-slate-100 pb-2">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Fecha de Nacimiento</p>
                                <p className="text-base font-black text-slate-900">
                                    {dateUtils.formatDisplayDate(acta.fecha_nacimiento)}
                                </p>
                            </div>

                            {acta.fecha_fallecimiento && (
                                <div className="border-b border-slate-100 pb-2">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Fecha de Fallecimiento</p>
                                    <p className="text-base font-black text-slate-900">
                                        {dateUtils.formatDisplayDate(acta.fecha_fallecimiento)}
                                    </p>
                                </div>
                            )}

                            <div className="border-b border-slate-100 pb-2">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Lugar de Procedencia</p>
                                <p className="text-base font-black text-slate-900 uppercase">{acta.direccion || 'DISTRITO DE LA UNIÓN'}</p>
                            </div>
                        </div>
                    </section>

                    {/* Section 1b: Cónyuge — solo MATRIMONIO */}
                    {acta.tipo_acta === 'MATRIMONIO' && acta.p2_nombres && (
                        <section>
                            <div className="flex items-center gap-2 mb-2">
                                <div className="bg-slate-700 text-white px-2 py-0.5 font-black text-[10px] uppercase tracking-widest">01B</div>
                                <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-900 underline underline-offset-4 decoration-2">
                                    Contrayente 2
                                </h4>
                            </div>
                            <div className="grid grid-cols-2 gap-x-12 gap-y-4 px-2">
                                <div className="col-span-2 border-b border-slate-100 pb-2">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Apellidos y Nombres Completos</p>
                                    <p className="text-lg font-black text-slate-900 uppercase">{acta.p2_apellido_paterno} {acta.p2_apellido_materno}, {acta.p2_nombres}</p>
                                </div>
                                <div className="border-b border-slate-100 pb-2">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">DNI / Documento</p>
                                    <p className="text-base font-black text-slate-900 font-mono tracking-widest">{acta.p2_dni || '—'}</p>
                                </div>
                                <div className="border-b border-slate-100 pb-2">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Sexo / Género</p>
                                    <p className="text-base font-black text-slate-900 uppercase">{acta.p2_sexo === 'M' ? 'Masculino' : 'Femenino'}</p>
                                </div>
                                {acta.p2_fecha_nacimiento && (
                                    <div className="border-b border-slate-100 pb-2">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Fecha de Nacimiento</p>
                                        <p className="text-base font-black text-slate-900">
                                            {dateUtils.formatDisplayDate(acta.p2_fecha_nacimiento)}
                                        </p>
                                    </div>
                                )}
                                {acta.p2_fecha_fallecimiento && (
                                    <div className="border-b border-slate-100 pb-2">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Fecha de Fallecimiento</p>
                                        <p className="text-base font-black text-slate-900">
                                            {dateUtils.formatDisplayDate(acta.p2_fecha_fallecimiento)}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </section>
                    )}

                    {/* Section 2: Datos del Acta */}
                    <section>
                        <div className="flex items-center gap-2 mb-2">
                            <div className="bg-slate-900 text-white px-2 py-0.5 font-black text-[10px] uppercase tracking-widest">02</div>
                            <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-900 underline underline-offset-4 decoration-2">
                                Detalles Técnicos del Acta
                            </h4>
                        </div>

                        <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 grid grid-cols-2 gap-x-12 gap-y-6">
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tipo de Registro</p>
                                <div className="inline-block bg-slate-900 text-white px-4 py-1 text-xs font-black uppercase tracking-widest rounded">
                                    {acta.tipo_acta}
                                </div>
                            </div>

                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Numero Correlativo</p>
                                <p className="text-lg font-black text-slate-900 uppercase">ACTA-RNV-{acta.numero_acta}</p>
                            </div>

                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Año de Inscripción</p>
                                <p className="text-lg font-black text-slate-900">{acta.anio}</p>
                            </div>

                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Fecha de Registro</p>
                                <p className="text-lg font-black text-slate-900">
                                    {format(new Date(acta.fecha_acta), "dd/MM/yyyy")}
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Section 3: Observaciones si existen */}
                    {acta.observaciones && (
                        <section>
                            <div className="flex items-center gap-2 mb-4">
                                <div className="bg-slate-900 text-white px-3 py-1 font-black text-xs uppercase tracking-widest">03</div>
                                <h4 className="text-sm font-black uppercase tracking-widest text-slate-900 underline underline-offset-4 decoration-2">
                                    Observaciones y Notas
                                </h4>
                            </div>
                            <div className="p-4 border border-slate-200 rounded font-serif italic text-slate-700 text-sm leading-relaxed">
                                "{acta.observaciones}"
                            </div>
                        </section>
                    )}
                </div>

                {/* Footer with Seal Space Compacto */}
                <div className="mt-12 pt-6 flex justify-between items-end border-t border-slate-100">
                    <div className="text-center w-48">
                        <div className="h-16 flex items-center justify-center opacity-10 grayscale">
                            <img src="/Logo_MDUnion.svg" alt="Sello" className="h-full" />
                        </div>
                        <div className="border-t-2 border-slate-900 pt-1 text-[8px] font-black uppercase tracking-[0.2em] text-slate-900">
                            Sello del Registrador Civil
                        </div>
                    </div>

                    <div className="text-right space-y-0.5 leading-tight">
                        <p className="text-[9px] font-black text-slate-900 uppercase tracking-tighter">MUNICIPALIDAD DISTRITAL DE LA UNIÓN</p>
                        <p className="text-[8px] font-medium text-slate-400 italic">
                            Impreso desde STDU Oficial · {format(new Date(), "dd/MM/yyyy HH:mm", { locale: es })}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
