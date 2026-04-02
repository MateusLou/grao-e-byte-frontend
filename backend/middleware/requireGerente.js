module.exports = (req, res, next) => {
  if (req.userRole !== 'gerente') {
    return res.status(403).json({ erro: 'Acesso restrito a gerentes' });
  }
  next();
};
