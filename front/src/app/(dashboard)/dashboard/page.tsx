"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import {
    Users,
    FileText,
    Clock,
    CheckCircle2,
    Calendar,
    ArrowRight,
    History as HistoryIcon
} from "lucide-react";
import { reportesService, DashboardResumen, ActaEvolucion, SolicitudEstado } from "@/services/reportes.service";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    Legend,
    PieChart,
    Pie,
    Cell,
} from "recharts";

// Colores para gráficas
const TIPO_COLORS: Record<string, string> = {
    NACIMIENTO: "#3b82f6",
    MATRIMONIO: "#8b5cf6",
    DEFUNCION:  "#6b7280",
};
const ESTADO_COLORS: Record<string, string> = {
    PENDIENTE: "#f59e0b",
    ATENDIDO:  "#10b981",
    ANULADO:   "#ef4444",
};

export default function DashboardPage() {
    const usuario = useAuthStore((state) => state.usuario);
    const [statsData, setStatsData] = useState<DashboardResumen | null>(null);
    const [evolucion, setEvolucion] = useState<ActaEvolucion[]>([]);
    const [solicitudesEstados, setSolicitudesEstados] = useState<SolicitudEstado[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        Promise.all([
            reportesService.getResumen(),
            reportesService.getActasEvolucion(),
            reportesService.getSolicitudesEstados(),
        ])
            .then(([resumen, evol, estados]) => {
                setStatsData(resumen);
                setEvolucion(evol);
                setSolicitudesEstados(estados);
            })
            .catch(() => setError(true))
            .finally(() => setLoading(false));
    }, []);

    // Transformar datos de evolución para BarChart agrupado por mes
    const barData = (() => {
        const map: Record<string, Record<string, number>> = {};
        for (const row of evolucion) {
            if (!map[row.mes]) map[row.mes] = { mes: row.mes };
            map[row.mes][row.tipo_acta] = parseInt(String(row.cantidad));
        }
        return Object.values(map);
    })();

    const stats = [
        {
            title: "Total Actas",
            count: statsData?.totalActas || 0,
            icon: FileText,
            color: "text-blue-600 dark:text-blue-400",
            bg: "bg-blue-100 dark:bg-blue-950/30",
            label: "Registradas"
        },
        {
            title: "Personas",
            count: statsData?.totalPersonas || 0,
            icon: Users,
            color: "text-emerald-600 dark:text-emerald-400",
            bg: "bg-emerald-100 dark:bg-emerald-950/30",
            label: "En base de datos"
        },
        {
            title: "Soli. Pendientes",
            count: statsData?.solicitudesPendientes || 0,
            icon: Clock,
            color: "text-amber-600 dark:text-amber-400",
            bg: "bg-amber-100 dark:bg-amber-950/30",
            label: "Trámites por atender"
        },
        {
            title: "Soli. Atendidas",
            count: statsData?.solicitudesAtendidas || 0,
            icon: CheckCircle2,
            color: "text-emerald-600 dark:text-emerald-400",
            bg: "bg-emerald-100 dark:bg-emerald-950/30",
            label: "Trámites cerrados"
        },
        {
            title: "Total Mes",
            count: statsData?.solicitudesMes || 0,
            icon: Calendar,
            color: "text-primary",
            bg: "bg-primary/10",
            label: "Solicitudes actuales"
        },
    ];

    if (error) {
        return (
            <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
                No se pudo cargar el resumen. Verifique su conexión e intente recargar la página.
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-semibold text-foreground leading-tight">
                        ¡Bienvenido de nuevo, <span className="text-primary border-b-2 border-primary/20">{usuario?.nombres}</span>!
                    </h1>
                    <p className="text-muted-foreground mt-2 font-medium">Aquí tienes un resumen de la gestión municipal al día de hoy.</p>
                </div>
                <div className="text-right hidden md:block">
                    <p className="text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-wider leading-none">Fecha de hoy</p>
                    <p className="text-lg font-bold text-foreground mt-1">{new Date().toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'America/Lima' })}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                {stats.map((stat, i) => (
                    <Card key={i} className={`hover:shadow-md transition-all cursor-default border-border shadow-sm rounded-2xl ${loading ? 'animate-pulse' : ''}`}>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-wider">
                                {stat.title}
                            </CardTitle>
                            <div className={`${stat.bg} p-2 rounded-xl`}>
                                <stat.icon className={`h-4 w-4 ${stat.color}`} />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold tracking-tight text-foreground">
                                {loading ? "..." : stat.count}
                            </div>
                            <p className="text-[10px] text-muted-foreground/60 mt-1 font-semibold uppercase tracking-wide">{stat.label}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* GRÁFICAS */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Evolución de actas (6 meses) */}
                <Card className="lg:col-span-2 border-border shadow-sm rounded-2xl overflow-hidden">
                    <CardHeader className="bg-muted/40 border-b border-border">
                        <CardTitle className="text-base font-semibold text-foreground">Evolución de Actas — Últimos 6 meses</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                        {loading ? (
                            <div className="h-48 flex items-center justify-center text-muted-foreground text-sm animate-pulse">Cargando gráfica...</div>
                        ) : barData.length === 0 ? (
                            <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">Sin datos en el período</div>
                        ) : (
                            <ResponsiveContainer width="100%" height={220}>
                                <BarChart data={barData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                                    <XAxis dataKey="mes" tick={{ fontSize: 11, fontWeight: 600 }} />
                                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: 12, fontSize: 12, border: "1px solid hsl(var(--border))" }}
                                        cursor={{ fill: "hsl(var(--muted))" }}
                                    />
                                    <Legend wrapperStyle={{ fontSize: 11, fontWeight: 600 }} />
                                    <Bar dataKey="NACIMIENTO" name="Nacimiento" fill={TIPO_COLORS.NACIMIENTO} radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="MATRIMONIO" name="Matrimonio" fill={TIPO_COLORS.MATRIMONIO} radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="DEFUNCION"  name="Defunción"  fill={TIPO_COLORS.DEFUNCION}  radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>

                {/* Estado de solicitudes */}
                <Card className="border-border shadow-sm rounded-2xl overflow-hidden">
                    <CardHeader className="bg-muted/40 border-b border-border">
                        <CardTitle className="text-base font-semibold text-foreground">Estado de Trámites</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 flex flex-col items-center gap-4">
                        {loading ? (
                            <div className="h-48 flex items-center justify-center text-muted-foreground text-sm animate-pulse">Cargando...</div>
                        ) : solicitudesEstados.length === 0 ? (
                            <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">Sin datos</div>
                        ) : (
                            <>
                                <ResponsiveContainer width="100%" height={180}>
                                    <PieChart>
                                        <Pie
                                            data={solicitudesEstados}
                                            dataKey="cantidad"
                                            nameKey="estado"
                                            cx="50%"
                                            cy="50%"
                                            outerRadius={75}
                                            innerRadius={42}
                                            paddingAngle={3}
                                        >
                                            {solicitudesEstados.map((entry) => (
                                                <Cell key={entry.estado} fill={ESTADO_COLORS[entry.estado] ?? "#94a3b8"} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{ borderRadius: 12, fontSize: 12, border: "1px solid hsl(var(--border))" }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="flex flex-wrap justify-center gap-3">
                                    {solicitudesEstados.map((e) => (
                                        <div key={e.estado} className="flex items-center gap-1.5 text-xs font-semibold">
                                            <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: ESTADO_COLORS[e.estado] ?? "#94a3b8" }} />
                                            <span className="text-muted-foreground">{e.estado}</span>
                                            <span className="font-bold text-foreground">{e.cantidad}</span>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Accesos directos */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 border-border shadow-sm overflow-hidden rounded-2xl">
                    <CardHeader className="bg-muted/40 border-b border-border">
                        <CardTitle className="text-lg font-semibold text-foreground">Accesos Directos</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Link href="/dashboard/digitalizacion" className="p-4 rounded-2xl border border-border bg-card hover:border-primary hover:shadow-xl hover:shadow-primary/5 transition-all cursor-pointer group flex items-center gap-4">
                            <div className="h-12 w-12 rounded-xl bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center group-hover:bg-primary transition-colors">
                                <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400 group-hover:text-white transition-colors" />
                            </div>
                            <div className="flex-1">
                                <p className="font-semibold text-[15px] text-foreground leading-none">Nueva Digitalización</p>
                                <p className="text-xs text-muted-foreground/70 mt-1">Registrar acta y ciudadano</p>
                            </div>
                            <ArrowRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-primary transition-all group-hover:translate-x-1" />
                        </Link>

                        <Link href="/dashboard/solicitudes" className="p-4 rounded-2xl border border-border bg-card hover:border-primary hover:shadow-xl hover:shadow-primary/5 transition-all cursor-pointer group flex items-center gap-4">
                            <div className="h-12 w-12 rounded-xl bg-orange-50 dark:bg-orange-950/30 flex items-center justify-center group-hover:bg-primary transition-colors">
                                <Calendar className="h-6 w-6 text-orange-600 dark:text-orange-400 group-hover:text-white transition-colors" />
                            </div>
                            <div className="flex-1">
                                <p className="font-semibold text-[15px] text-foreground leading-none">Nuevo Trámite</p>
                                <p className="text-xs text-muted-foreground/70 mt-1">Copias certificadas</p>
                            </div>
                            <ArrowRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-primary transition-all group-hover:translate-x-1" />
                        </Link>
                    </CardContent>
                </Card>

                <Card className="border-border shadow-sm rounded-2xl overflow-hidden">
                    <CardHeader className="bg-muted/40 border-b border-border">
                        <CardTitle className="text-lg font-semibold text-foreground">Atajos Rápidos</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 space-y-2">
                        <Button variant="outline" asChild className="w-full justify-start gap-2 border-border hover:bg-blue-50 dark:hover:bg-blue-950/20 hover:text-blue-600 hover:border-blue-200 dark:hover:border-blue-800 py-6 text-sm font-semibold rounded-xl">
                            <Link href="/dashboard/actas"><FileText size={18} /> Ver Todas las Actas</Link>
                        </Button>
                        <Button variant="outline" asChild className="w-full justify-start gap-2 border-border hover:bg-green-50 dark:hover:bg-green-950/20 hover:text-green-600 hover:border-green-200 dark:hover:border-green-800 py-6 text-sm font-semibold rounded-xl">
                            <Link href="/dashboard/personas"><Users size={18} /> Padrón de Personas</Link>
                        </Button>
                        {usuario?.rol_id === 1 && (
                            <>
                                <Button variant="outline" asChild className="w-full justify-start gap-2 border-border hover:bg-indigo-50 dark:hover:bg-indigo-950/20 hover:text-indigo-600 hover:border-indigo-200 dark:hover:border-indigo-800 py-6 text-sm font-semibold rounded-xl">
                                    <Link href="/dashboard/usuarios"><Users size={18} /> Gestión de Usuarios</Link>
                                </Button>
                                <Button variant="outline" asChild className="w-full justify-start gap-2 border-border hover:bg-muted hover:text-foreground py-6 text-sm font-semibold rounded-xl">
                                    <Link href="/dashboard/auditoria"><HistoryIcon size={18} /> Bitácora de Auditoría</Link>
                                </Button>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
