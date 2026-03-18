"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { BrainCircuit, Loader2, FileDigit, Sparkles } from "lucide-react";
import { toast } from "sonner";
import api from "@/utils/api";
import { cn } from "@/lib/utils";

interface OCRScannerProps {
    onDataExtracted: (data: any) => void;
}

export function OCRScanner({ onDataExtracted }: OCRScannerProps) {
    const [isLoading, setIsLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.type !== "application/pdf") {
            toast.error("Por favor, seleccione un archivo PDF.");
            return;
        }

        processFile(file);
    };

    const processFile = async (file: File) => {
        setIsLoading(true);
        const toastId = toast.loading("Analizando documento con IA...");

        try {
            const formData = new FormData();
            formData.append("pdf", file);

            const { data } = await api.post("/ocr/process", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            if (data.success) {
                toast.success("Datos extraídos correctamente", { id: toastId });
                onDataExtracted(data.data);
            } else {
                throw new Error("No se pudo extraer información del documento.");
            }
        } catch (error: any) {
            console.error("Error en OCR:", error);
            const message = error.response?.data?.message || "Error al procesar el documento con IA.";
            toast.error(message, { id: toastId });
        } finally {
            setIsLoading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    return (
        <div className="relative">
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="application/pdf"
                className="hidden"
            />
            
            <Button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                className={cn(
                    "relative overflow-hidden group h-12 px-6 rounded-2xl transition-all duration-300",
                    "bg-gradient-to-r from-indigo-600 via-purple-600 to-primary hover:scale-[1.02] active:scale-95 shadow-lg shadow-indigo-500/20 text-white font-bold border-none"
                )}
            >
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                
                {isLoading ? (
                    <div className="flex items-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span className="text-xs uppercase tracking-widest">Analizando...</span>
                    </div>
                ) : (
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <BrainCircuit className="h-5 w-5" />
                            <Sparkles className="absolute -top-1 -right-1 h-2.5 w-2.5 text-yellow-300 animate-pulse" />
                        </div>
                        <span className="text-xs uppercase tracking-widest">Escanear PDF con IA</span>
                    </div>
                )}
                
                {/* Micro-animación de brillo */}
                <div className="absolute -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:animate-shine" />
            </Button>
            
            <p className="mt-2 text-[10px] text-muted-foreground font-medium flex items-center gap-1.5 px-1 uppercase tracking-wider">
                <FileDigit className="h-3 w-3" /> Extrae datos automáticamente del acta
            </p>
        </div>
    );
}
