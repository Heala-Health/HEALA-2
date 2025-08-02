const jwt = require('jsonwebtoken');
const supabase = require('../lib/supabaseClient');

const auth = (allowedRoles) => {
  return async (req, res, next) => {
    try {
      const token = req.header('Authorization').replace('Bearer ', '');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      const { data: user, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', decoded.id)
        .single();

      if (error || !user) {
        throw new Error();
      }

      if (allowedRoles && !allowedRoles.includes(user.role)) {
        return res.status(403).send({ error: 'Forbidden' });
      }

      req.token = token;
      req.user = user;
      next();
    } catch (error) {
      res.status(401).send({ error: 'Please authenticate.' });
    }
  };
};

module.exports = auth;
