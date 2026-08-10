'use client';

import { CONTENT_VIEW_ROLES, ROLE_LABELS, type Role } from '@/lib/roles';

interface Props {
  visibility: string;
  setVisibility: (v: string) => void;
  viewRoles: string[];
  setViewRoles: (r: string[]) => void;
}

const selectCls =
  'w-full rounded-md border border-input bg-background px-3 py-2 text-sm';

export function VisibilityField({ visibility, setVisibility, viewRoles, setViewRoles }: Props) {
  const toggleRole = (role: string) => {
    if (viewRoles.includes(role)) {
      setViewRoles(viewRoles.filter((r) => r !== role));
    } else {
      setViewRoles([...viewRoles, role]);
    }
  };

  return (
    <div className="rounded-xl border border-border p-4 bg-card">
      <label className="block text-sm font-medium mb-2">Đối tượng được xem</label>
      <select
        className={selectCls}
        value={visibility}
        onChange={(e) => setVisibility(e.target.value)}
      >
        <option value="public">Tất cả mọi người (công khai)</option>
        <option value="roles">Theo phân quyền (cần đăng nhập đúng vai trò)</option>
      </select>

      {visibility === 'roles' && (
        <div className="mt-3">
          <p className="text-xs text-muted-foreground mb-2">
            Chỉ những vai trò được chọn (sau khi đăng nhập) mới xem được trang này. Quản trị viên luôn xem được.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {CONTENT_VIEW_ROLES.map((role: Role) => (
              <label key={role} className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={viewRoles.includes(role)}
                  onChange={() => toggleRole(role)}
                  className="h-4 w-4"
                />
                {ROLE_LABELS[role].vi}
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
