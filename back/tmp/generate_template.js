import XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';

const columns = [
    "tipo_acta", 
    "cui", 
    "libro", 
    "numero_acta", 
    "anio", 
    "fecha_acta", 
    "dni", 
    "tipo_documento",
    "nombres", 
    "apellido_paterno", 
    "apellido_materno", 
    "sexo", 
    "fecha_nacimiento", 
    "telefono", 
    "acta_observaciones", 
    "persona_observaciones",
    "nombre_archivo_pdf", 
    "carpeta_ruta"
];

const data = [
    {
        tipo_acta: "NACIMIENTO",
        cui: "12345678",
        libro: "",
        numero_acta: "",
        anio: 2024,
        fecha_acta: "2024-03-11",
        dni: "12345678",
        tipo_documento: "DNI",
        nombres: "JUAN ALBERTO",
        apellido_paterno: "PEREZ",
        apellido_materno: "GARCIA",
        sexo: "M",
        fecha_nacimiento: "2024-01-01",
        telefono: "987654321",
        acta_observaciones: "Registro masivo CUI",
        persona_observaciones: "",
        nombre_archivo_pdf: "ejemplo_cui.pdf",
        carpeta_ruta: ""
    },
    {
        tipo_acta: "NACIMIENTO",
        cui: "",
        libro: "45",
        numero_acta: "123",
        anio: 1995,
        fecha_acta: "1995-05-20",
        dni: "87654321",
        tipo_documento: "DNI",
        nombres: "MARIA ELENA",
        apellido_paterno: "ROJAS",
        apellido_materno: "VILCA",
        sexo: "F",
        fecha_nacimiento: "1995-05-15",
        telefono: "",
        acta_observaciones: "Registro masivo Clásico",
        persona_observaciones: "",
        nombre_archivo_pdf: "ejemplo_libro.pdf",
        carpeta_ruta: "actas/1995"
    }
];

const ws = XLSX.utils.json_to_sheet(data, { header: columns });
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, "Actas");

// Destination path
const destPath = 'c:/proyectos/muni_union/front/public/templates/plantilla_carga_masiva.xlsx';

// Ensure directory exists
const dir = path.dirname(destPath);
if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
}

XLSX.writeFile(wb, destPath);
console.log(`Plantilla creada exitosamente en: ${destPath}`);
