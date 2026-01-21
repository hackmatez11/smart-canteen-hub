import { supabase } from '../config/supabase.js';

// Middleware to verify Supabase JWT token
export const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Unauthorized', 
        message: 'No token provided' 
      });
    }

    const token = authHeader.split(' ')[1];

    // Verify the JWT token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ 
        error: 'Unauthorized', 
        message: 'Invalid or expired token' 
      });
    }

    // Get user profile with role
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      return res.status(500).json({ 
        error: 'Server error', 
        message: 'Failed to fetch user profile' 
      });
    }

    // Attach user and profile to request
    req.user = user;
    req.userProfile = profile;
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({ 
      error: 'Server error', 
      message: 'Authentication failed' 
    });
  }
};

// Middleware to check if user is admin
export const requireAdmin = (req, res, next) => {
  if (!req.userProfile || req.userProfile.role !== 'admin') {
    return res.status(403).json({ 
      error: 'Forbidden', 
      message: 'Admin access required' 
    });
  }
  next();
};

// Middleware to check if user is student
export const requireStudent = (req, res, next) => {
  if (!req.userProfile || req.userProfile.role !== 'student') {
    return res.status(403).json({ 
      error: 'Forbidden', 
      message: 'Student access required' 
    });
  }
  next();
};

// Optional authentication (allows anonymous access)
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      req.userProfile = null;
      return next();
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (!error && user) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      req.user = user;
      req.userProfile = profile;
    } else {
      req.user = null;
      req.userProfile = null;
    }
    
    next();
  } catch (error) {
    req.user = null;
    req.userProfile = null;
    next();
  }
};
