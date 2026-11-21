import { createContext, useContext, useState, useEffect, useCallback } from "react";
import API_BASE_URL, { apiClient, clearApiCache } from "@/shared/api/apiClient";
import { loadSessionUser, saveSessionUser, clearSessionUser } from "@/shared/utils/secureStorage";

export const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const parsed = loadSessionUser();
      if (!parsed) return null;
      // Sanitize stale JSON-encoded direccion from old sessions
      if (parsed && parsed.direccion && typeof parsed.direccion === 'string' && parsed.direccion.trim().startsWith('{')) {
        try { const d = JSON.parse(parsed.direccion); parsed.direccion = d.direccion || parsed.direccion; } catch (e) { /* keep */ }
      }
      return parsed;
    } catch (e) {
      return null;
    }
  });

  const refreshUser = useCallback(async () => {
    try {
      const saved = loadSessionUser();
      const token = saved?.token || null;
      if (!token) return null;

      const profileData = await apiClient.get("/usuarios/perfil");
      if (profileData) {
        setUser((prev) => {
          if (prev && Object.keys(profileData).every(k => prev[k] === profileData[k])) {
            return prev;
          }
          const merged = { ...prev, ...profileData, token: prev?.token || token };
          saveSessionUser(merged);
          return merged;
        });
        return profileData;
      }
    } catch (err) {
      // Silently fail if unauthenticated or network error
    }
    return null;
  }, []);

  useEffect(() => {
    if (user?.token || loadSessionUser()?.token) {
      refreshUser();
    }
  }, [refreshUser]);

  const login = async (correo, contraseña) => {
    try {
      const userData = await apiClient.post("/usuarios/login", { email: correo, contrasena: contraseña });
      if (userData) {
        clearApiCache();
        setUser(userData);
        saveSessionUser(userData);
        return { success: true, user: userData };
      }
      return { success: false, message: "Error al iniciar sesión" };
    } catch (err) {
      console.error("Error en login:", err);
      return { success: false, message: err.message || "Correo o contraseña incorrectos", status: err.status };
    }
  };

  const register = async (userData) => {
    try {
      const data = await apiClient.post("/usuarios/registro", userData);
      if (data) {
        clearApiCache();
        setUser(data);
        saveSessionUser(data);
        return { success: true, user: data, message: "¡Cuenta creada exitosamente!" };
      }
      return { success: false, message: "Error al crear la cuenta" };
    } catch (err) {
      console.error("Error en register:", err);
      return { success: false, message: err.message || "Fallo de conexión al registrar cuenta" };
    }
  };

  const updateProfile = async (profileData) => {
    try {
      const updated = await apiClient.put("/autenticacion/perfil", profileData);
      if (updated) {
        // Sanitize direccion if needed
        if (updated.direccion && typeof updated.direccion === "string" && updated.direccion.trim().startsWith("{")) {
          try { const d = JSON.parse(updated.direccion); updated.direccion = d.direccion || updated.direccion; } catch (e) { /* keep */ }
        }
        setUser(updated);
        saveSessionUser(updated);
        return { success: true, user: updated };
      }
      return { success: false, message: "No se pudo actualizar el perfil" };
    } catch (err) {
      console.error("Error en updateProfile:", err);
      return { success: false, message: err.message || "Error al actualizar el perfil" };
    }
  };

  const loginWithGoogle = async (credential, options = {}) => {
    try {
      const tokenStr = typeof credential === "string"
        ? credential
        : (credential?.credential || credential?.token || "");
      const payload = { credential: tokenStr, ...options };
      const userData = await apiClient.post("/usuarios/google", payload);
      if (userData) {
        clearApiCache();
        setUser(userData);
        saveSessionUser(userData);
        return { success: true, user: userData, message: "¡Autenticación con Google exitosa!" };
      }
      return { success: false, message: "Error al iniciar sesión con Google" };
    } catch (err) {
      console.error("Error en loginWithGoogle:", err);
      return { success: false, message: err.message || "Fallo al conectar con Google", status: err.status };
    }
  };

  const logout = () => {
    // Seguridad (AUD-021): revocar el JWT en el servidor antes de limpiar la sesión local
    try {
      const saved = loadSessionUser();
      if (saved?.token) {
        fetch(`${API_BASE_URL}/autenticacion/logout`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${saved.token}`
          },
          keepalive: true
        }).catch(() => {});
      }
    } catch (_) {}
    clearApiCache();
    setUser(null);
    clearSessionUser();
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      register,
      loginWithGoogle,
      logout,
      updateProfile,
      refreshUser,
      isAuthenticated: !!user
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
