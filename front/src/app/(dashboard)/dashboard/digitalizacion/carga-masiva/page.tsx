"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
    FileSpreadsheet, Upload, ArrowLeft, Download,
    CheckCircle2, XCircle, AlertTriangle,
    Info, Package, RefreshCw
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import api from "@/utils/api";
import * as XLSX from "xlsx";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ResultadoFila {
    fila: number;
    estado: "OK" | "ERROR" | "OMITIDO" | "OMITIDO_DOC";
    acta: string;
    persona: string;
    con_documento: boolean;
    error?: string;
    mensaje?: string;
}

interface ResumenImportacion {
    total: number;
    exitosos: number;
    omitidos: number;
    docs_vinculados: number;
    errores: number;
    resultados: ResultadoFila[];
}

export default function CargaMasivaPage() {
    const router = useRouter();

    const [excelFile, setExcelFile] = useState<File | null>(null);
    const [zipFile, setZipFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [resumen, setResumen] = useState<ResumenImportacion | null>(null);
    const [dragOverExcel, setDragOverExcel] = useState(false);
    const [dragOverZip, setDragOverZip] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    const excelRef = useRef<HTMLInputElement>(null);
    const zipRef = useRef<HTMLInputElement>(null);

    const handleDrop = (e: React.DragEvent, tipo: "excel" | "zip") => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (!file) return;
        if (tipo === "excel") {
            if (![".xlsx", ".xls"].some(ext => file.name.endsWith(ext))) {
                toast.error("Solo archivos Excel (.xlsx o .xls)");
                return;
            }
            setExcelFile(file);
        } else {
            if (!file.name.endsWith(".zip")) {
                toast.error("Solo archivos ZIP");
                return;
            }
            setZipFile(file);
        }
        tipo === "excel" ? setDragOverExcel(false) : setDragOverZip(false);
    };

    const handleImportar = async () => {
        if (!excelFile) {
            toast.error("Seleccione el archivo Excel antes de continuar.");
            return;
        }

        setLoading(true);
        setResumen(null);

        try {
            const formData = new FormData();
            formData.append("excel", excelFile);
            if (zipFile) formData.append("zip", zipFile);

            const { data } = await api.post<ResumenImportacion>("/importacion", formData, {
                headers: { "Content-Type": "multipart/form-data" },
                timeout: 1000000, // 10 minutos para archivos grandes
                onUploadProgress: (progressEvent) => {
                    const progress = progressEvent.total
                        ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
                        : 0;
                    setUploadProgress(progress);
                }
            });

            setResumen(data);

            if (data.errores === 0 && data.docs_vinculados === 0) {
                toast.success(`✅ Importación completada: ${data.exitosos} actas nuevas, ${data.omitidos} omitidas.`);
            } else if (data.docs_vinculados > 0) {
                toast.info(`📎 ${data.docs_vinculados} documentos vinculados a actas existentes sin PDF.`);
            } else {
                toast.warning(`Importación: ${data.exitosos} nuevas, ${data.docs_vinculados} docs vinculados, ${data.errores} errores.`);
            }
        } catch (error: any) {
            const msg = error?.response?.data?.message || "Error inesperado durante la importación.";
            toast.error(msg);
        } finally {
            setLoading(false);
            setUploadProgress(0);
        }
    };

    const exportarExcelReporte = () => {
        if (!resumen) return;

        const dataArr = resumen.resultados.map(r => ({
            "FILA": r.fila,
            "ESTADO": r.estado,
            "ACTA": r.acta,
            "CIUDADANO": r.persona,
            "VINCULO PDF": r.con_documento ? "SI" : "NO",
            "DETALLE/ERROR": r.error || r.mensaje || "Operación exitosa"
        }));

        const ws = XLSX.utils.json_to_sheet(dataArr);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Reporte Importación");

        // Ajustar anchos
        ws["!cols"] = [
            { wch: 8 },
            { wch: 10 },
            { wch: 30 },
            { wch: 40 },
            { wch: 15 },
            { wch: 60 }
        ];

        XLSX.writeFile(wb, `Reporte_Importacion_${Date.now()}.xlsx`);
    };

    const porcentajeExito = resumen
        ? Math.round(((resumen.exitosos + resumen.omitidos + resumen.docs_vinculados) / resumen.total) * 100)
        : 0;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500 max-w-5xl mx-auto">
            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-3 text-foreground">
                        <div className="bg-emerald-600 p-2.5 rounded-xl shadow-emerald-200 shadow-lg">
                            <FileSpreadsheet className="h-6 w-6 text-white" />
                        </div>
                        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Carga Masiva de Actas</h1>
                    </div>
                    <p className="text-muted-foreground font-medium text-xs ml-1">
                        Importa miles de registros desde Excel + PDFs escaneados de forma segura.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        className="h-10 hover:bg-muted font-medium"
                        onClick={() => router.back()}
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Volver
                    </Button>
                    <Button
                        variant="outline"
                        className="h-10 font-bold border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400"
                        onClick={() => window.open('/templates/plantilla_carga_masiva.xlsx', '_blank')}
                    >
                        <Download className="h-4 w-4 mr-2" />
                        Descargar Plantilla
                    </Button>
                </div>
            </div>

            {/* GUÍA RÁPIDA DE IMPORTACIÓN */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { step: "01", title: "PREPARA EL EXCEL", desc: "Usa la plantilla oficial. Soporta Modo Clásico (Libro) y CUI." },
                    { step: "02", title: "ORGANIZA EL ZIP", desc: "Pon tus PDFs en la raíz o en carpetas. El nombre debe coincidir." },
                    { step: "03", title: "CAMPOS MÍNIMOS", desc: "Nombres, Apellidos, Tipo de Acta y Fecha son estrictos." },
                    { step: "04", title: "VERIFICA Y CARGA", desc: "Revisa el reporte final de cada fila al terminar." }
                ].map((item, i) => (
                    <div key={i} className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-sm border border-slate-200/60 dark:border-slate-800 p-4 rounded-2xl flex gap-4 items-start group hover:border-emerald-500/30 transition-all">
                        <span className="text-xl font-black text-emerald-500/20 group-hover:text-emerald-500/40 transition-colors leading-none mt-1">{item.step}</span>
                        <div className="space-y-1">
                            <h4 className="text-[10px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest">{item.title}</h4>
                            <p className="text-[10px] text-slate-500 font-medium leading-relaxed">{item.desc}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* DETALLES DEL FORMATO EXCEL */}
            <Card className="border-none shadow-sm bg-blue-50/30 dark:bg-blue-950/10 rounded-3xl overflow-hidden">
                <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                        <Info className="h-4 w-4 text-blue-600" />
                        <CardTitle className="text-sm font-bold text-blue-900 dark:text-blue-300">Guía de Columnas del Excel</CardTitle>
                    </div>
                    <CardDescription className="text-[10px] font-medium uppercase tracking-tight">
                        El sistema procesa automáticamente los siguientes encabezados (insensible a mayúsculas):
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 p-6 pt-2">
                    <div className="space-y-3">
                        <h5 className="text-[10px] font-black text-blue-800/60 uppercase tracking-widest border-b border-blue-100 pb-1">Identificación del Acta</h5>
                        <ul className="space-y-2">
                            <li className="flex flex-col">
                                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                    cui <Badge className="h-3 text-[8px] px-1 bg-amber-500">NUEVO</Badge>
                                </span>
                                <span className="text-[9px] text-slate-500">Identificador RENIEC. Si se usa, no requiere Libro/Número.</span>
                            </li>
                            <li className="flex flex-col">
                                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">tipo_acta <Badge variant="outline" className="h-3 text-[8px] px-1 border-rose-400 text-rose-500 font-black">REQ</Badge></span>
                                <span className="text-[9px] text-slate-500">NACIMIENTO, MATRIMONIO o DEFUNCION.</span>
                            </li>
                            <li className="flex flex-col">
                                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">libro / numero_acta</span>
                                <span className="text-[9px] text-slate-500">Obligatorios si NO hay CUI (Modo Clásico).</span>
                            </li>
                        </ul>
                    </div>

                    <div className="space-y-3">
                        <h5 className="text-[10px] font-black text-blue-800/60 uppercase tracking-widest border-b border-blue-100 pb-1">Datos del Ciudadano</h5>
                        <ul className="space-y-2">
                            <li className="flex flex-col">
                                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">nombres / apellido_paterno <Badge variant="outline" className="h-3 text-[8px] px-1 border-rose-400 text-rose-500 font-black">REQ</Badge></span>
                                <span className="text-[9px] text-slate-500">Identidad básica del titular.</span>
                            </li>
                            <li className="flex flex-col">
                                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">apellido_materno <Badge variant="outline" className="h-3 text-[8px] px-1 border-rose-400 text-rose-500 font-black">REQ</Badge></span>
                                <span className="text-[9px] text-slate-500">Segundo apellido del titular.</span>
                            </li>
                            <li className="flex flex-col">
                                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">dni / tipo_documento / sexo / fecha_nacimiento</span>
                                <span className="text-[9px] text-slate-500">Datos adicionales. tipo_documento: DNI, CARNET EXTR., PASAPORTE, etc.</span>
                            </li>
                        </ul>
                    </div>
                    <div className="space-y-3">
                        <h5 className="text-[10px] font-black text-purple-700/60 uppercase tracking-widest border-b border-purple-100 pb-1">Cónyuge (solo MATRIMONIO)</h5>
                        <ul className="space-y-2">
                            <li className="flex flex-col">
                                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                                    conyuge_nombres / conyuge_apellido_paterno / conyuge_apellido_materno
                                </span>
                                <span className="text-[9px] text-slate-500">Obligatorios para actas de MATRIMONIO. Se busca o crea automáticamente.</span>
                            </li>
                            <li className="flex flex-col">
                                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">conyuge_dni / conyuge_sexo / conyuge_fecha_nacimiento</span>
                                <span className="text-[9px] text-slate-500">Datos opcionales del cónyuge.</span>
                            </li>
                        </ul>
                    </div>

                    <div className="space-y-3">
                        <h5 className="text-[10px] font-black text-blue-800/60 uppercase tracking-widest border-b border-blue-100 pb-1">Vínculo con Archivos</h5>
                        <ul className="space-y-2">
                            <li className="flex flex-col">
                                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">nombre_archivo_pdf</span>
                                <span className="text-[9px] text-slate-500">Ejm: "acta_123.pdf". Debe estar dentro del ZIP.</span>
                            </li>
                            <li className="flex flex-col">
                                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">carpeta_ruta</span>
                                <span className="text-[9px] text-slate-500">Subcarpeta dentro del ZIP (opcional).</span>
                            </li>
                        </ul>
                    </div>
                </CardContent>
            </Card>

            {/* BARRA DE PROGRESO ESTRATÉGICA (DURANTE LA CARGA) */}
            {loading && (
                <div className="w-full bg-slate-900/95 backdrop-blur-xl p-6 rounded-[32px] border border-emerald-500/20 shadow-2xl space-y-4 animate-in slide-in-from-top-4 duration-500">
                    <div className="flex justify-between items-end px-1">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                <p className="text-[10px] font-black text-emerald-400/80 uppercase tracking-widest">
                                    {uploadProgress < 100 ? "Fase 1: Transmisión de Datos" : "Fase 2: Registro en Servidor"}
                                </p>
                            </div>
                            <p className="text-xs font-bold text-slate-300">
                                {uploadProgress < 100
                                    ? "Sincronizando archivos con el sistema central..."
                                    : "Procesando registros de acta, por favor espere."}
                            </p>
                        </div>
                        <div className="text-right">
                            <span className="text-2xl font-black text-emerald-400">{uploadProgress}%</span>
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Progreso</p>
                        </div>
                    </div>
                    <div className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700/50">
                        <div
                            className={cn(
                                "h-full rounded-full transition-all duration-700",
                                uploadProgress < 100
                                    ? "bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                                    : "bg-blue-500 animate-pulse shadow-[0_0_15px_rgba(59,130,246,0.3)]"
                            )}
                            style={{ width: `${uploadProgress}%` }}
                        />
                    </div>
                </div>
            )}

            {/* ZONA DE CARGA */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* EXCEL */}
                <Card
                    className={cn(
                        "group relative overflow-hidden transition-all duration-300 border-2 border-dashed cursor-pointer hover:shadow-2xl hover:shadow-emerald-500/10 rounded-3xl",
                        dragOverExcel ? "border-emerald-500 bg-emerald-50/50 scale-[1.02]" : excelFile ? "border-emerald-500 bg-emerald-50/20" : "border-slate-200 dark:border-slate-800 hover:border-emerald-400"
                    )}
                    onDragOver={(e) => { e.preventDefault(); setDragOverExcel(true); }}
                    onDragLeave={() => setDragOverExcel(false)}
                    onDrop={(e) => handleDrop(e, "excel")}
                    onClick={() => excelRef.current?.click()}
                >
                    <CardContent className="p-8 text-center">
                        <input ref={excelRef} type="file" className="hidden" accept=".xlsx,.xls"
                            onChange={(e) => e.target.files?.[0] && setExcelFile(e.target.files[0])} />

                        <div className={cn(
                            "mb-4 mx-auto w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:rotate-6",
                            excelFile ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30" : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                        )}>
                            <FileSpreadsheet className="h-8 w-8" />
                        </div>

                        {excelFile ? (
                            <div className="space-y-1.5 animate-in zoom-in-95 duration-300">
                                <h4 className="font-bold text-slate-800 dark:text-slate-100 truncate w-full px-4">{excelFile.name}</h4>
                                <p className="text-xs text-emerald-600 font-bold uppercase tracking-tighter">Archivo Excel Detectado</p>
                                <Button variant="ghost" size="sm" className="mt-4 text-rose-500 h-7 text-[10px] font-bold uppercase tracking-widest hover:bg-rose-50"
                                    onClick={(e) => { e.stopPropagation(); setExcelFile(null); }}>
                                    <RefreshCw className="h-3 w-3 mr-1" /> Cambiar Archivo
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <h4 className="font-bold text-slate-700 dark:text-slate-200">Datos en Excel</h4>
                                <p className="text-xs text-slate-400 px-8 mx-auto leading-relaxed">Arrastra la plantilla llena aquí o haz click para explorar tus carpetas.</p>
                                <Badge variant="secondary" className="bg-slate-100 text-slate-500 text-[9px] font-bold">REQUERIDO</Badge>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* ZIP */}
                <Card
                    className={cn(
                        "group relative overflow-hidden transition-all duration-300 border-2 border-dashed cursor-pointer hover:shadow-2xl hover:shadow-blue-500/10 rounded-3xl",
                        dragOverZip ? "border-blue-500 bg-blue-50/50 scale-[1.02]" : zipFile ? "border-blue-500 bg-blue-50/20" : "border-slate-200 dark:border-slate-800 hover:border-blue-400"
                    )}
                    onDragOver={(e) => { e.preventDefault(); setDragOverZip(true); }}
                    onDragLeave={() => setDragOverZip(false)}
                    onDrop={(e) => handleDrop(e, "zip")}
                    onClick={() => zipRef.current?.click()}
                >
                    <CardContent className="p-8 text-center">
                        <input ref={zipRef} type="file" className="hidden" accept=".zip"
                            onChange={(e) => e.target.files?.[0] && setZipFile(e.target.files[0])} />

                        <div className={cn(
                            "mb-4 mx-auto w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:-rotate-6",
                            zipFile ? "bg-blue-500 text-white shadow-lg shadow-blue-500/30" : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                        )}>
                            <Package className="h-8 w-8" />
                        </div>

                        {zipFile ? (
                            <div className="space-y-1.5 animate-in zoom-in-95 duration-300">
                                <h4 className="font-bold text-slate-800 dark:text-slate-100 truncate w-full px-4">{zipFile.name}</h4>
                                <p className="text-xs text-blue-600 font-bold uppercase tracking-tighter">Archivo ZIP Listado</p>
                                <Button variant="ghost" size="sm" className="mt-4 text-rose-500 h-7 text-[10px] font-bold uppercase tracking-widest hover:bg-rose-50"
                                    onClick={(e) => { e.stopPropagation(); setZipFile(null); }}>
                                    <RefreshCw className="h-3 w-3 mr-1" /> Cambiar ZIP
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <h4 className="font-bold text-slate-700 dark:text-slate-200">Imágenes y PDFs</h4>
                                <p className="text-xs text-slate-400 px-8 mx-auto leading-relaxed">Si tienes los escaneos en un ZIP, cárgalo aquí para vincularlos automáticamente.</p>
                                <Badge variant="secondary" className="bg-slate-100 text-slate-400 text-[9px] font-bold">OPCIONAL</Badge>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* BOTÓN IMPORTAR */}
            <div className="flex flex-col items-center gap-6 py-6 w-full max-w-lg mx-auto">
                {!resumen && !loading && (
                    <Button
                        onClick={handleImportar}
                        disabled={!excelFile}
                        className={cn(
                            "h-16 px-16 group relative overflow-hidden transition-all duration-500 rounded-3xl shadow-2xl",
                            excelFile ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/25" : "bg-slate-200 text-slate-400 shadow-none border-none"
                        )}
                    >
                        <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                        <div className="relative flex items-center gap-4 text-lg font-black uppercase tracking-[0.2em]">
                            <Upload className="h-6 w-6 group-hover:-translate-y-1 transition-transform" />
                            <span>INICIAR CARGA</span>
                        </div>
                    </Button>
                )}

                {!excelFile && !loading && (
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest animate-pulse">Debes cargar al menos el archivo Excel</p>
                )}
            </div>

            {/* RESULTADOS */}
            {resumen && (
                <Card className="border-none bg-slate-50/50 dark:bg-slate-900/50 rounded-[40px] overflow-hidden animate-in fade-in slide-in-from-top-4 duration-700">
                    <CardContent className="p-8 space-y-8">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                            <div className="space-y-2 text-center md:text-left">
                                <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100">Resultado de la Operación</h2>
                                <p className="text-sm text-slate-500 font-medium italic">La importación se procesó de forma atómica y segura.</p>
                            </div>

                            <div className="flex gap-3">
                                <Button
                                    variant="outline"
                                    className="h-11 px-7 border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-bold text-xs rounded-2xl shadow-sm transition-all active:scale-95 flex items-center gap-2"
                                    onClick={exportarExcelReporte}
                                >
                                    <Download className="h-5 w-5" /> GENERAR REPORTE EXCEL
                                </Button>
                            </div>
                        </div>

                        {/* RESUMEN ESTADÍSTICO */}
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            {[
                                { label: 'TOTAL FILAS', value: resumen.total, icon: FileSpreadsheet, color: 'slate' },
                                { label: 'ACTAS NUEVAS', value: resumen.exitosos, icon: CheckCircle2, color: 'emerald' },
                                { label: 'YA EXISTÍAN', value: resumen.omitidos, icon: AlertTriangle, color: 'blue' },
                                { label: 'DOCS VINCULADOS', value: resumen.docs_vinculados, icon: AlertTriangle, color: 'amber' },
                                { label: 'ERRORES', value: resumen.errores, icon: XCircle, color: 'rose' }
                            ].map((stat, i) => (
                                <div key={i} className={cn(
                                    "p-6 rounded-[28px] border flex flex-col items-center justify-center gap-2 transition-all hover:translate-y-[-4px]",
                                    stat.color === 'slate' ? "bg-white dark:bg-slate-800 border-slate-100" :
                                        stat.color === 'emerald' ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-100/50" :
                                            stat.color === 'blue' ? "bg-blue-50/50 dark:bg-blue-950/20 border-blue-100/50" :
                                                stat.color === 'amber' ? "bg-amber-50/50 dark:bg-amber-950/20 border-amber-100/50" :
                                                    "bg-rose-50/50 dark:bg-rose-950/20 border-rose-100/50"
                                )}>
                                    <div className={cn("p-3 rounded-2xl mb-1 shadow-sm",
                                        stat.color === 'slate' ? "bg-slate-50 text-slate-400" :
                                            stat.color === 'emerald' ? "bg-white text-emerald-500" :
                                                stat.color === 'blue' ? "bg-white text-blue-500" :
                                                    stat.color === 'amber' ? "bg-white text-amber-500" :
                                                        "bg-white text-rose-500"
                                    )}>
                                        <stat.icon className="h-6 w-6" />
                                    </div>
                                    <p className={cn("text-4xl font-black tracking-tight",
                                        stat.color === 'slate' ? "text-slate-800" :
                                            stat.color === 'emerald' ? "text-emerald-700" :
                                                stat.color === 'blue' ? "text-blue-700" :
                                                    stat.color === 'amber' ? "text-amber-700" :
                                                        "text-rose-700"
                                    )}>{stat.value}</p>
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{stat.label}</p>
                                </div>
                            ))}
                        </div>

                        {/* ESTADO FINAL DE LA CARGA */}
                        <div className="space-y-4 bg-white dark:bg-slate-800/50 p-6 rounded-[32px] border border-slate-100 shadow-inner">
                            <div className="flex items-center justify-between px-2">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Resumen de Integridad</span>
                                <Badge className={cn("h-7 px-4 rounded-full font-black text-[10px]",
                                    porcentajeExito === 100 ? "bg-emerald-500" : "bg-amber-500"
                                )}>
                                    {porcentajeExito}% DE LOS DATOS CORRECTOS
                                </Badge>
                            </div>
                            <div className="h-3 w-full bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
                                <div
                                    className="h-full rounded-full bg-linear-to-r from-emerald-500 to-teal-400 transition-all duration-1000"
                                    style={{ width: `${porcentajeExito}%` }}
                                />
                            </div>
                        </div>

                        {/* TABLAS DE DETALLES */}
                        <div className="grid grid-cols-1 gap-6">

                            {/* DOCS VINCULADOS A ACTAS SIN DOCUMENTO */}
                            {resumen.docs_vinculados > 0 && (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3 px-2">
                                        <AlertTriangle className="h-5 w-5 text-amber-500" />
                                        <h3 className="font-black text-amber-700 dark:text-amber-400 uppercase tracking-widest text-sm">Documentos Vinculados ({resumen.docs_vinculados})</h3>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-2">
                                        {resumen.resultados.filter(r => r.estado === "OMITIDO_DOC").map((r) => (
                                            <div key={r.fila} className="flex gap-4 p-4 bg-white dark:bg-slate-800 border border-amber-100 dark:border-amber-900/30 rounded-2xl shadow-sm">
                                                <div className="bg-amber-50 dark:bg-amber-950/40 w-12 h-12 rounded-xl flex items-center justify-center shrink-0">
                                                    <span className="font-black text-amber-600 text-xs">#{r.fila}</span>
                                                </div>
                                                <div className="flex-1 space-y-1">
                                                    <p className="font-black text-slate-800 dark:text-slate-200 text-sm">{r.persona}</p>
                                                    <p className="text-[10px] text-amber-700 dark:text-amber-400 font-bold">{r.acta}</p>
                                                    <p className="text-[10px] text-amber-600 font-medium">📎 PDF vinculado correctamente</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* LISTA DE ERRORES */}
                            {resumen.errores > 0 && (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 px-2">
                                        <AlertTriangle className="h-5 w-5 text-rose-500" />
                                        <h3 className="font-black text-rose-700 uppercase tracking-widest text-sm">Detalle de Incidencias ({resumen.errores})</h3>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                                        {resumen.resultados.filter(r => r.estado === "ERROR").map((r) => (
                                            <div key={r.fila} className="flex gap-4 p-4 bg-white dark:bg-slate-800 border border-rose-100 dark:border-rose-900/30 rounded-2xl shadow-sm hover:shadow-md transition-shadow group">
                                                <div className="bg-rose-50 dark:bg-rose-950/40 w-12 h-12 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                                                    <span className="font-black text-rose-600 text-xs">#{r.fila}</span>
                                                </div>
                                                <div className="flex-1 space-y-1">
                                                    <p className="font-black text-slate-800 dark:text-slate-200 text-sm">{r.persona || 'Dato no identificado'}</p>
                                                    <p className="text-[11px] text-rose-600 bg-rose-50 dark:bg-rose-950/20 px-2 py-1 rounded-lg border border-rose-100 dark:border-rose-900/30 font-medium">{r.error}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* ACCIONES FINALES */}
                        <div className="flex flex-col md:flex-row gap-4 justify-center pt-4">
                            <Button
                                variant="outline"
                                size="lg"
                                className="h-14 px-10 border-slate-200 text-slate-500 hover:text-slate-800 font-bold rounded-2xl transition-all hover:bg-white active:scale-95"
                                onClick={() => { setResumen(null); setExcelFile(null); setZipFile(null); }}
                            >
                                <RefreshCw className="h-4 w-4 mr-3" /> VOLVER A EMPEZAR
                            </Button>
                            <Button
                                size="lg"
                                className="h-14 px-10 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-2xl shadow-xl active:scale-95"
                                onClick={() => router.push("/dashboard/actas")}
                            >
                                IR AL REGISTRO DE ACTAS <ArrowLeft className="h-4 w-4 ml-3 rotate-180" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
