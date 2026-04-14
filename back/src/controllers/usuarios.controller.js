import * as usuariosService from "../services/usuarios.service.js";
import { registrarAccion } from "../services/auditoria.service.js";

export const crearUsuario = async (req, res) => {
  try {
    const usuario = await usuariosService.crearUsuario(req.body);

    req.auditHandled = true;
        await registrarAccion({
      usuario_id: req.user.id,
      tabla_afectada: "usuarios",
      operacion: "INSERT",
      registro_id: usuario.id,
      ip: req.ip,
      descripcion: `Se creó el usuario: ${usuario.username}`
    });

    res.status(201).json(usuario);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const listarUsuarios = async (req, res) => {
  try {
    const resultado = await usuariosService.listarUsuarios(req.query);
    res.json(resultado);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const obtenerUsuario = async (req, res) => {
  try {
    const usuario = await usuariosService.obtenerUsuario(req.params.id);
    res.json(usuario);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

export const actualizarUsuario = async (req, res) => {
  try {
    const usuario = await usuariosService.actualizarUsuario(
      req.params.id,
      req.body
    );

    req.auditHandled = true;
        await registrarAccion({
      usuario_id: req.user.id,
      tabla_afectada: "usuarios",
      operacion: "UPDATE",
      registro_id: usuario.id,
      ip: req.ip,
      descripcion: `Se actualizó el usuario: ${usuario.username}`
    });

    res.json(usuario);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const cambiarEstadoUsuario = async (req, res) => {
  try {
    const usuario = await usuariosService.cambiarEstadoUsuario(
      req.params.id,
      req.body.activo
    );

    req.auditHandled = true;
        await registrarAccion({
      usuario_id: req.user.id,
      tabla_afectada: "usuarios",
      operacion: "UPDATE_STATUS",
      registro_id: usuario.id,
      ip: req.ip,
      descripcion: `Se cambió estado del usuario ${usuario.username} a ${req.body.activo ? 'ACTIVO' : 'INACTIVO'}`
    });

    res.json(usuario);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const eliminarUsuario = async (req, res) => {
  try {
    const usuario = await usuariosService.eliminarUsuario(req.params.id);

    req.auditHandled = true;
        await registrarAccion({
      usuario_id: req.user.id,
      tabla_afectada: "usuarios",
      operacion: "DELETE_LOGIC",
      registro_id: usuario.id,
      ip: req.ip,
      descripcion: `Se eliminó (lógicamente) al usuario: ${usuario.username}`
    });

    res.json({ message: "Usuario eliminado correctamente" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const cambiarMiPassword = async (req, res) => {
  try {
    const { passwordActual, passwordNuevo } = req.body;

    if (!passwordActual || !passwordNuevo) {
      return res.status(400).json({ message: "La contraseña actual y nueva son obligatorias" });
    }

    const resultado = await usuariosService.actualizarMiPassword(
      req.user.id,
      passwordActual,
      passwordNuevo
    );

    req.auditHandled = true;
        await registrarAccion({
      usuario_id: req.user.id,
      tabla_afectada: "usuarios",
      operacion: "UPDATE_PASSWORD",
      registro_id: req.user.id,
      ip: req.ip,
      descripcion: "El usuario cambió su propia contraseña"
    });

    res.json(resultado);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
