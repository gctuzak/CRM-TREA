const jwt = require('jsonwebtoken');
const { User } = require('../models');

// Verify JWT token
const authenticateToken = async (req, res, next) => {
  // TEMPORARILY DISABLED FOR MVP - AUTO LOGIN AS ADMIN
  // Authentication geçici olarak devre dışı, otomatik admin girişi
  try {
    // Get first active admin user from database
    const adminUser = await User.findOne({
      where: { 
        DATETIMEDEL: null // Active user (not deleted)
      },
      order: [['ID', 'ASC']] // Get first user
    });

    if (adminUser) {
      req.user = {
        id: adminUser.ID,
        email: adminUser.EMAIL,
        name: adminUser.NAME,
        role: 'admin',
        organization: adminUser.ORGANIZATION,
        orid: adminUser.ORID
      };
    } else {
      // Fallback if no user found
      req.user = {
        id: 29606,
        email: 'admin@itemyapi.com',
        name: 'Admin User',
        role: 'admin',
        organization: 'ITEM YAPI',
        orid: 1
      };
    }
    
    next();
  } catch (error) {
    console.error('Auto-login error:', error);
    // Fallback user
    req.user = {
      id: 29606,
      email: 'admin@itemyapi.com', 
      name: 'Admin User',
      role: 'admin',
      organization: 'ITEM YAPI',
      orid: 1
    };
    next();
  }
  
  /* ORIGINAL CODE - COMMENTED OUT
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        message: 'Erişim token\'ı gereklidir',
        error: 'MISSING_TOKEN'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database to ensure they still exist and are active
    const user = await User.findByPk(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ 
        message: 'Kullanıcı bulunamadı',
        error: 'USER_NOT_FOUND'
      });
    }

    if (user.STATUS !== 'active') {
      return res.status(401).json({ 
        message: 'Kullanıcı hesabı aktif değil',
        error: 'USER_INACTIVE'
      });
    }

    // Add user info to request object
    req.user = {
      id: user.ID,
      email: user.EMAIL,
      name: user.NAME,
      role: user.ROLE,
      departmentId: user.DEPARTMENT_ID
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        message: 'Geçersiz token',
        error: 'INVALID_TOKEN'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        message: 'Token süresi dolmuş',
        error: 'TOKEN_EXPIRED'
      });
    }

    console.error('Auth middleware error:', error);
    return res.status(500).json({ 
      message: 'Kimlik doğrulama hatası',
      error: 'AUTH_ERROR'
    });
  }
  */
};

// Check if user has required role
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        message: 'Kimlik doğrulama gereklidir',
        error: 'AUTH_REQUIRED'
      });
    }

    const userRole = req.user.role;
    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ 
        message: 'Yetersiz izinler',
        error: 'INSUFFICIENT_PERMISSIONS',
        required: allowedRoles,
        current: userRole
      });
    }

    next();
  };
};

// Check if user is admin
const requireAdmin = requireRole(['admin']);

// Check if user is admin or manager
const requireManagerOrAdmin = requireRole(['admin', 'manager']);

// Check if user can access resource (own resource or admin)
const requireOwnershipOrAdmin = (getResourceUserId) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ 
          message: 'Kimlik doğrulama gereklidir',
          error: 'AUTH_REQUIRED'
        });
      }

      // Admin can access everything
      if (req.user.role === 'admin') {
        return next();
      }

      // Get the user ID associated with the resource
      const resourceUserId = await getResourceUserId(req);
      
      if (resourceUserId && resourceUserId === req.user.id) {
        return next();
      }

      return res.status(403).json({ 
        message: 'Erişim reddedildi - sadece kendi kaynaklarınıza erişebilirsiniz',
        error: 'ACCESS_DENIED'
      });
    } catch (error) {
      console.error('Ownership check error:', error);
      return res.status(500).json({ 
        message: 'Yetkilendirme hatası',
        error: 'AUTHORIZATION_ERROR'
      });
    }
  };
};

// Optional authentication - doesn't fail if no token
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findByPk(decoded.userId);
      
      if (user && user.STATUS === 'active') {
        req.user = {
          id: user.ID,
          email: user.EMAIL,
          name: user.NAME,
          role: user.ROLE,
          departmentId: user.DEPARTMENT_ID
        };
      }
    }

    next();
  } catch (error) {
    // Ignore token errors in optional auth
    next();
  }
};

module.exports = {
  authenticateToken,
  requireRole,
  requireAdmin,
  requireManagerOrAdmin,
  requireOwnershipOrAdmin,
  optionalAuth
};