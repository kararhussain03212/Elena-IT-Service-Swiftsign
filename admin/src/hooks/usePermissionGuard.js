import { useAuth } from "../context/useAuth";

const EVENT_NAME = "permission-denied";

export default function usePermissionGuard() {
  const { user } = useAuth();

  const permissionSet = new Set(
    Array.isArray(user?.permissions) ? user.permissions : [],
  );

  const can = (permission) => permissionSet.has(permission);

  const guard = (permission, message = "You don't have permission.") => {
    if (can(permission)) return true;
    window.dispatchEvent(
      new CustomEvent(EVENT_NAME, {
        detail: { message },
      }),
    );
    return false;
  };

  return { can, guard };
}
