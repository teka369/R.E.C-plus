"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import { getErrorMessage } from "@/lib/errors";

type UserProfile = {
  id: number;
  nombres: string;
  apellidos: string;
  email: string;
  codigo: string;
  role: string;
  institutionId?: number | null;
};

type UpdateFormData = {
  nombres: string;
  apellidos: string;
  email: string;
};

type PasswordFormData = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

export default function ProfilePage() {
  const router = useRouter();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form states
  const [updateForm, setUpdateForm] = useState<UpdateFormData>({
    nombres: "",
    apellidos: "",
    email: "",
  });

  const [passwordForm, setPasswordForm] = useState<PasswordFormData>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [updating, setUpdating] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  // Fetch profile on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await api.get<UserProfile>("/users/me");
        setProfile(res.data);
        setUpdateForm({
          nombres: res.data.nombres,
          apellidos: res.data.apellidos,
          email: res.data.email,
        });
      } catch (err: unknown) {
        const errorMsg = getErrorMessage(err, "No se pudo cargar tu perfil");
        setError(errorMsg);
        // Simple check for 401
        if (errorMsg.includes("401") || errorMsg.includes("Unauthorized")) {
          router.push("/");
        }
      } finally {
        setLoading(false);
      }
    };

    void fetchProfile();
  }, [router]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    setSuccess(null);
    setError(null);

    try {
      const updated = await api.patch<UserProfile>("/users/me", updateForm);
      setProfile(updated.data);
      setSuccess("Perfil actualizado correctamente.");
      setUpdateForm({
        nombres: updated.data.nombres,
        apellidos: updated.data.apellidos,
        email: updated.data.email,
      });
    } catch (err: unknown) {
      setError(getErrorMessage(err, "No se pudo actualizar el perfil"));
    } finally {
      setUpdating(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangingPassword(true);
    setSuccess(null);
    setError(null);

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError("Las contraseñas no coinciden");
      setChangingPassword(false);
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres");
      setChangingPassword(false);
      return;
    }

    try {
      await api.patch(`/users/${profile?.id}/password`, {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setSuccess("Contraseña actualizada correctamente.");
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setShowPasswordForm(false);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "No se pudo cambiar la contraseña"));
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 p-6 md:p-8">
        <div className="mx-auto max-w-2xl">
          <p className="text-sm text-slate-500">Cargando perfil...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-8">
      <section className="mx-auto max-w-2xl space-y-6">
        <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-3xl font-black text-slate-900">Mi Perfil</h1>
          <p className="mt-2 text-sm text-slate-600">
            Actualiza tu información personal y contraseña
          </p>
        </header>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
            {success}
          </div>
        )}

        {/* Update Profile Form */}
        <form onSubmit={handleUpdateProfile} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">Información Personal</h2>
          <p className="mt-1 text-sm text-slate-500">Actualiza tus datos</p>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700">Nombres</label>
              <input
                type="text"
                value={updateForm.nombres}
                onChange={(e) => setUpdateForm((p) => ({ ...p, nombres: e.target.value }))}
                className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm w-full"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Apellidos</label>
              <input
                type="text"
                value={updateForm.apellidos}
                onChange={(e) => setUpdateForm((p) => ({ ...p, apellidos: e.target.value }))}
                className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm w-full"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Correo</label>
              <input
                type="email"
                value={updateForm.email}
                onChange={(e) => setUpdateForm((p) => ({ ...p, email: e.target.value }))}
                className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm w-full"
                required
              />
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              type="submit"
              disabled={updating}
              className="rounded-lg bg-sky-700 px-6 py-2 text-sm font-semibold text-white hover:bg-sky-800 disabled:opacity-60"
            >
              {updating ? "Guardando..." : "Guardar Cambios"}
            </button>
          </div>
        </form>

        {/* Change Password Form */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">Seguridad</h2>
          <p className="mt-1 text-sm text-slate-500">Cambia tu contraseña</p>

          {!showPasswordForm ? (
            <button
              onClick={() => setShowPasswordForm(true)}
              className="mt-6 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cambiar Contraseña
            </button>
          ) : (
            <form onSubmit={handleChangePassword} className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">Contraseña Actual</label>
                <input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) =>
                    setPasswordForm((p) => ({ ...p, currentPassword: e.target.value }))
                  }
                  placeholder="Ingresa tu contraseña actual"
                  className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm w-full"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Nueva Contraseña</label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) =>
                    setPasswordForm((p) => ({ ...p, newPassword: e.target.value }))
                  }
                  placeholder="Mínimo 8 caracteres"
                  className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm w-full"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Confirmar Nueva Contraseña</label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) =>
                    setPasswordForm((p) => ({ ...p, confirmPassword: e.target.value }))
                  }
                  placeholder="Repite la nueva contraseña"
                  className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm w-full"
                  required
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={changingPassword}
                  className="rounded-lg bg-emerald-700 px-6 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
                >
                  {changingPassword ? "Actualizando..." : "Actualizar Contraseña"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordForm(false);
                    setPasswordForm({
                      currentPassword: "",
                      newPassword: "",
                      confirmPassword: "",
                    });
                  }}
                  className="rounded-lg border border-slate-300 px-6 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Profile Info Display */}
        {profile && (
          <div className="rounded-2xl border border-slate-200 bg-blue-50 p-6 shadow-sm">
            <h3 className="font-semibold text-slate-900">Información de tu Cuenta</h3>
            <div className="mt-4 space-y-2 text-sm">
              <p>
                <span className="font-medium text-slate-700">Rol:</span>{" "}
                <span className="text-slate-600 uppercase font-semibold">{profile.role}</span>
              </p>
              <p>
                <span className="font-medium text-slate-700">ID Usuario:</span>{" "}
                <span className="text-slate-600">{profile.id}</span>
              </p>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
