import unittest

from scripts.regenerate_manuals import convertir_capturas


class CapturasComplementariasTest(unittest.TestCase):
    def test_conserva_ruta_de_figura_existente(self):
        entrada = (
            "<blockquote><p><strong>Captura pendiente — Figura 4.15.</strong> "
            "Resumen de importación.</p></blockquote>"
        )

        salida = convertir_capturas(entrada)

        self.assertIn('id="figura-4-15"', salida)
        self.assertIn("figura-4-15.png", salida)
        self.assertIn("<strong>Figura 4.15.</strong>", salida)

    def test_convierte_sufijo_alfabetico_en_ruta_estable(self):
        entrada = (
            "<blockquote><p><strong>Captura pendiente — Figura 2.1-A.</strong> "
            "Advertencia del navegador.</p></blockquote>"
        )

        salida = convertir_capturas(entrada)

        self.assertIn('id="figura-2-1a"', salida)
        self.assertIn("figura-2-1a.png", salida)
        self.assertIn("<strong>Figura 2.1-A.</strong>", salida)


if __name__ == "__main__":
    unittest.main()
