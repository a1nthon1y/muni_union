"use client";

import { useEffect, useState } from "react";
import { Solicitud } from "@/types/solicitud";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { configuracionService } from "@/services/configuracion.service";

interface SolicitudPrintViewProps {
    solicitud: Solicitud;
}

const DEFAULT_URL = "https://172.16.3.21";

export function SolicitudPrintView({ solicitud }: SolicitudPrintViewProps) {
    const total = solicitud.detalles?.reduce((acc, curr) => acc + Number(curr.total), 0) || 0;
    const [baseUrl, setBaseUrl] = useState(DEFAULT_URL);

    useEffect(() => {
        let mounted = true;
        configuracionService.get()
            .then((data) => {
                if (mounted && data.url_verificacion_publica) {
                    setBaseUrl(data.url_verificacion_publica.replace(/\/+$/, ""));
                }
            })
            .catch(() => {
                // Si falla, se mantiene la IP de producción actual.
            });
        return () => { mounted = false; };
    }, []);

    return (
        <div className="print-container bg-white text-black p-0 font-serif leading-relaxed block overflow-visible">
            <div className="max-w-[190mm] mx-auto p-8 border-2 border-slate-900 rounded-sm m-3 relative overflow-hidden">

                {/* Decorative corner */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-slate-900 text-white flex items-center justify-center transform rotate-45 translate-x-16 -translate-y-16">
                    <span className="transform -rotate-45 font-black text-xs tracking-widest mt-12 mr-1">OFICIAL</span>
                </div>

                {/* Header Compacto */}
                <div className="flex flex-col items-center text-center space-y-1 border-b-2 border-slate-900 pb-3 mb-4">
                    <img src="/Logo_MDUnion.svg" alt="Logo" className="w-16 h-16 mb-1" />
                    <h1 className="text-xl font-black uppercase tracking-widest text-slate-900">Municipalidad Distrital de La Unión</h1>
                    <h2 className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-500">Constancia de Trámite Municipal</h2>
                    <div className="mt-2 px-4 py-1.5 bg-slate-900 text-white font-black text-sm tracking-[0.2em] rounded-full">
                        N° {solicitud.id.toString().padStart(6, '0')}
                    </div>
                </div>

                {/* Introduction Compacta */}
                <div className="mb-4 text-justify">
                    <p className="text-[11px] font-semibold text-slate-800 leading-normal uppercase">
                        La Oficina de Registro Civil de la Municipalidad Distrital de la Unión, certifica que se ha recibido y procesado satisfactoriamente el trámite bajo la modalidad de <span className="font-black text-slate-900">"{solicitud.tipo_solicitud}"</span>, registrado en nuestro sistema oficial STDU con la siguiente información:
                    </p>
                </div>

                {/* Info Grid Compacto */}
                <div className="grid grid-cols-1 gap-4 mb-4">

                    {/* Solicitante Compacto */}
                    <section className="border rounded-xl p-4 bg-slate-50 border-slate-200">
                        <h4 className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 mb-3 flex items-center gap-3">
                            <span className="h-px bg-slate-200 flex-1"></span>
                            Información del Solicitante
                            <span className="h-px bg-slate-200 flex-1"></span>
                        </h4>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Nombre Completo</p>
                                <p className="text-base font-black text-slate-900 uppercase">{solicitud.solicitante_apellidos}, {solicitud.solicitante_nombres}</p>
                            </div>

                            <div>
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">DNI / Documento</p>
                                <p className="text-sm font-black text-slate-900 font-mono tracking-widest">{solicitud.solicitante_dni}</p>
                            </div>

                            <div>
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Fecha de Solicitud</p>
                                <p className="text-sm font-black text-slate-900">{format(new Date(solicitud.fecha_solicitud), "dd/MM/yyyy")}</p>
                            </div>
                        </div>
                    </section>

                    {/* Detalles del Trámite */}
                    <section className="px-2">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-3 flex items-center gap-4">
                            <span className="h-px bg-slate-200 flex-1"></span>
                            Detalle de Documentos Solicitados
                            <span className="h-px bg-slate-200 flex-1"></span>
                        </h4>

                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b-2 border-slate-900 uppercase">
                                    <th className="py-2 text-[9px] font-black tracking-widest text-slate-900">Tipo de Acta</th>
                                    <th className="py-2 text-[9px] font-black tracking-widest text-slate-900">N° Acta</th>
                                    <th className="py-2 text-[9px] font-black tracking-widest text-slate-900 text-center">Cant.</th>
                                    <th className="py-2 text-[9px] font-black tracking-widest text-slate-900 text-right">P. Unit</th>
                                    <th className="py-2 text-[9px] font-black tracking-widest text-slate-900 text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {solicitud.detalles?.map((det, i) => (
                                    <tr key={i} className="border-b border-slate-100 font-bold text-slate-700">
                                        <td className="py-2 text-[10px] uppercase italic">{det.tipo_acta}</td>
                                        <td className="py-2 text-[10px] font-mono">{det.numero_acta}</td>
                                        <td className="py-2 text-[10px] text-center">{det.cantidad}</td>
                                        <td className="py-2 text-[10px] text-right italic">S/ {Number(det.precio_unitario).toFixed(2)}</td>
                                        <td className="py-2 text-[10px] text-right font-black text-slate-900">S/ {Number(det.total).toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr>
                                    <td colSpan={3}></td>
                                    <td className="py-4 text-[9px] font-black uppercase text-right tracking-widest text-slate-400">Total Liquidado:</td>
                                    <td className="py-4 text-xl font-black text-right text-slate-900 italic">S/ {total.toFixed(2)}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </section>
                </div>

                {/* Footer info Compacto */}
                <div className="bg-slate-900 text-white p-4 rounded-xl flex justify-between items-center mb-5">
                    <div className="space-y-0.5">
                        <p className="text-[9px] font-black uppercase tracking-widest opacity-60">Estado Actual:</p>
                        <p className="text-base font-black italic tracking-widest uppercase">{solicitud.estado}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[9px] font-black uppercase tracking-widest opacity-60">Atendido por:</p>
                        <p className="text-xs font-black uppercase">
                            {solicitud.usuario_atencion_nombres ? `${solicitud.usuario_atencion_nombres} ${solicitud.usuario_atencion_apellidos}` : 'Oficina de Sistemas'}
                        </p>
                    </div>
                </div>

                {/* Signatures Compacto */}
                <div className="mt-8 flex justify-between px-10">
                    <div className="text-center w-40 border-t-2 border-slate-900 pt-2">
                        <p className="text-[9px] font-black uppercase tracking-widest">Solicitante</p>
                        <p className="text-[7px] text-slate-400 mt-0.5 uppercase italic tracking-tighter">(Firma y Huella)</p>
                    </div>
                    <div className="text-center w-40 border-t-2 border-slate-900 pt-2">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-900">Secretario de Registro</p>
                        <p className="text-[7px] text-slate-400 mt-0.5 uppercase italic tracking-tighter">(Sello Oficial)</p>
                    </div>
                </div>

                <div className="mt-5 border-t border-slate-100 pt-4 text-center space-y-1.5">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                        Verifique la autenticidad de este documento en:
                    </p>
                    <p className="text-[10px] font-black text-slate-800 font-mono tracking-wider break-all">
                        {baseUrl}/verificar/{solicitud.id.toString().padStart(6, "0")}
                    </p>
                    <p className="text-[8px] font-black uppercase tracking-[0.4em] text-slate-300 mt-2">
                        Sistema Unificado · Unión V2.0 · {format(new Date(), "yyyy")}
                    </p>
                </div>
            </div>
        </div>
    );
}
