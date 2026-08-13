export const ROL_ADMIN = 1;
export const ROL_REGISTRADOR = 2;
export const ROL_CONSULTA = 3;

export const allowRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.rol_id)) {
      return res.status(403).json({ message: "Acceso denegado" });
    }
    next();
  };
};

/** Bloquea usuarios CONSULTA en operaciones de escritura (POST/PUT/PATCH/DELETE). */
export const requireOperador = (req, res, next) => {
  if (req.user.rol_id === ROL_CONSULTA) {
    return res.status(403).json({
      message: "Su perfil es de solo consulta. No puede realizar esta operación.",
    });
  }
  next();
};
