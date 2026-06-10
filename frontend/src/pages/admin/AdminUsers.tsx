import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle, Shield, ShieldOff, Trash2, XCircle } from "lucide-react";
import toast from "react-hot-toast";
import { adminApi } from "../../api/admin";
import { getErrorMessage } from "../../api/client";
import { useAuthStore } from "../../store/authStore";
import type { User } from "../../types";
import { format, parseISO } from "date-fns";

function UserRow({ user }: { user: User }) {
  const queryClient = useQueryClient();
  const selfId = useAuthStore((s) => s.user?.id);
  const isSelf = user.id === selfId;

  const approveMutation = useMutation({
    mutationFn: () => adminApi.updateUser(user.id, { status: "approved" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success(`${user.nickname} approved`);
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const rejectMutation = useMutation({
    mutationFn: () => adminApi.updateUser(user.id, { status: "rejected" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success(`${user.nickname} rejected`);
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const roleMutation = useMutation({
    mutationFn: () => adminApi.updateUser(user.id, {
      role: user.role === "admin" ? "regular_user" : "admin",
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success(user.role === "admin"
        ? `${user.nickname} is no longer an admin`
        : `${user.nickname} is now an admin`
      );
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: () => adminApi.deleteUser(user.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success(`${user.nickname} deleted`);
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const statusBadge: Record<string, string> = {
    pending: "badge-pending",
    approved: "badge-approved",
    rejected: "badge-rejected",
  };

  return (
    <tr className="border-b border-gray-800 hover:bg-gray-800/30 transition-colors">
      <td className="py-3 pr-4">
        <div className="font-semibold text-black">{user.nickname}</div>
        <div className="text-xs text-gray-500">{user.real_name}</div>
      </td>
      <td className="py-3 pr-4">
        <span className={statusBadge[user.status]}>{user.status}</span>
      </td>
      <td className="py-3 pr-4 text-sm">
        {user.role === "admin"
          ? <span className="text-amber-400 font-medium">Admin{isSelf && " (you)"}</span>
          : <span className="text-gray-400">Player</span>}
      </td>
      <td className="py-3 pr-4 text-gray-500 text-xs">
        {format(parseISO(user.created_at + (user.created_at.endsWith("Z") ? "" : "Z")), "d MMM yyyy")}
      </td>
      <td className="py-3">
        <div className="flex items-center gap-2">
          {user.status === "pending" && (
            <>
              <button
                onClick={() => approveMutation.mutate()}
                disabled={approveMutation.isPending}
                className="text-green-400 hover:text-green-300 transition-colors"
                title="Approve"
              >
                <CheckCircle size={18} />
              </button>
              <button
                onClick={() => rejectMutation.mutate()}
                disabled={rejectMutation.isPending}
                className="text-red-400 hover:text-red-300 transition-colors"
                title="Reject"
              >
                <XCircle size={18} />
              </button>
            </>
          )}
          {user.status === "rejected" && (
            <button
              onClick={() => approveMutation.mutate()}
              disabled={approveMutation.isPending}
              className="text-green-400 hover:text-green-300 transition-colors text-xs"
              title="Approve"
            >
              <CheckCircle size={18} />
            </button>
          )}
          {user.status === "approved" && (
            <button
              onClick={() => rejectMutation.mutate()}
              disabled={rejectMutation.isPending}
              className="text-yellow-500 hover:text-yellow-400 transition-colors"
              title="Suspend"
            >
              <XCircle size={18} />
            </button>
          )}
          {!isSelf && (
            <button
              onClick={() => {
                const msg = user.role === "admin"
                  ? `Remove admin rights from "${user.nickname}"?`
                  : `Give admin rights to "${user.nickname}"?`;
                if (confirm(msg)) roleMutation.mutate();
              }}
              disabled={roleMutation.isPending}
              className={user.role === "admin"
                ? "text-amber-500 hover:text-amber-300 transition-colors"
                : "text-gray-500 hover:text-amber-400 transition-colors"}
              title={user.role === "admin" ? "Remove admin" : "Make admin"}
            >
              {user.role === "admin" ? <ShieldOff size={16} /> : <Shield size={16} />}
            </button>
          )}
          {user.role !== "admin" && (
            <button
              onClick={() => {
                if (confirm(`Delete user "${user.nickname}"? This cannot be undone.`)) {
                  deleteMutation.mutate();
                }
              }}
              disabled={deleteMutation.isPending}
              className="text-red-600 hover:text-red-400 transition-colors"
              title="Delete"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

export default function AdminUsers() {
  const { data: users = [], isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: adminApi.listUsers,
  });

  const pending = users.filter((u) => u.status === "pending");
  const others = users.filter((u) => u.status !== "pending");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black text-white">Users</h1>

      {isLoading ? (
        <p className="text-gray-500">Loading...</p>
      ) : (
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-gray-400">{users.length} total users</span>
            {pending.length > 0 && (
              <span className="badge-pending">{pending.length} pending</span>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-gray-500 uppercase tracking-wider border-b border-gray-800">
                  <th className="pb-3 pr-4">User</th>
                  <th className="pb-3 pr-4">Status</th>
                  <th className="pb-3 pr-4">Role</th>
                  <th className="pb-3 pr-4">Joined</th>
                  <th className="pb-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {/* Pending first */}
                {pending.map((u) => <UserRow key={u.id} user={u} />)}
                {others.map((u) => <UserRow key={u.id} user={u} />)}
              </tbody>
            </table>
          </div>

          {users.length === 0 && (
            <p className="text-gray-500 text-center py-8">No users yet.</p>
          )}
        </div>
      )}
    </div>
  );
}
