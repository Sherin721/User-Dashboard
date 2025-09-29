import React, { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";
import { UserContext } from "../context/UserContext";

type Vehicle = {
  type: string;
  color: string;
};

type User = {
  id: number;
  username: string;
  email: string;
  role: string;
  active: boolean;
  vehicles?: Vehicle[];
  groups?: any[];
};

export default function Dashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);

  const { loggedInUser, loginTime, logout } = useContext(UserContext);
  const navigate = useNavigate();

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await API.get("/users");
      setUsers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm("Delete user?")) return;
    await API.delete(`/users/${id}`);
    fetchUsers();
  };

  const toggleActive = async (id: number) => {
    await API.patch(`/users/${id}/toggle-active`);
    fetchUsers();
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div>
      {/* Top bar */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, alignItems: "center" }}>
        <div>
          <strong>Total Users:</strong> {users.length}
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <span>
            Logged in as: <strong>{loggedInUser}</strong>
            {loginTime && <> | Login time: <strong>{loginTime}</strong></>}
          </span>
          <button onClick={() => { setEditing(null); setShowForm(true); }}>Add User</button>
          <button onClick={fetchUsers}>Refresh</button>
          <button onClick={handleLogout} style={{ backgroundColor: "#e74c3c", color: "white" }}>Logout</button>
        </div>
      </div>

      {showForm && (
        <UserForm
          editing={editing}
          onClose={() => { setShowForm(false); fetchUsers(); }}
        />
      )}

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "1px solid #ccc" }}>
            <th>Username</th>
            <th>Email</th>
            <th>Role</th>
            <th>Active</th>
            <th>Vehicles</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={6}>Loading...</td></tr>
          ) : users.length === 0 ? (
            <tr><td colSpan={6}>No users</td></tr>
          ) : (
            users.map(u => (
              <tr key={u.id} style={{ borderBottom: "1px solid #eee" }}>
                <td>{u.username}</td>
                <td>{u.email}</td>
                <td>{u.role}</td>
                <td>{u.active ? "Active" : "Inactive"}</td>
                <td>
                  {u.vehicles?.length
                    ? u.vehicles.map(v => `${v.type} (${v.color})`).join(", ")
                    : "None"}
                </td>
                <td>
                  <div style={{ display: "flex", gap: 4 }}>
                    <button onClick={() => { setEditing(u); setShowForm(true); }}>Edit</button>
                    <button onClick={() => toggleActive(u.id)}>
                      {u.active ? "Deactivate" : "Activate"}
                    </button>
                    <button onClick={() => handleDelete(u.id)} style={{ backgroundColor: "#e74c3c", color: "white" }}>Delete</button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function UserForm({ editing, onClose }: { editing: User | null; onClose: () => void }) {
  const [username, setUsername] = useState(editing?.username ?? "");
  const [email, setEmail] = useState(editing?.email ?? "");
  const [role, setRole] = useState(editing?.role ?? "user");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setUsername(editing?.username ?? "");
    setEmail(editing?.email ?? "");
    setRole(editing?.role ?? "user");
    setPassword("");
  }, [editing]);

  const save = async () => {
    setSaving(true);
    try {
      if (editing) {
        await API.put(`/users/${editing.id}`, {
          username,
          email,
          role,
          ...(password ? { password } : {})
        });
      } else {
        await API.post("/users", {
          username,
          email,
          role,
          password: password || "password123"
        });
      }
      onClose();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Error saving user");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: 12, border: "1px solid #eee", marginBottom: 12 }}>
      <h4>{editing ? "Edit User" : "Add User"}</h4>
      <div style={{ display: "grid", gap: 8 }}>
        <input className="input" value={username} onChange={e => setUsername(e.target.value)} placeholder="username" />
        <input className="input" value={email} onChange={e => setEmail(e.target.value)} placeholder="email" />
        <select className="input" value={role} onChange={e => setRole(e.target.value)}>
          <option value="user">user</option>
          <option value="admin">admin</option>
        </select>
        <input className="input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="password (optional when editing)" />
        <div style={{ display: "flex", gap: 4 }}>
          <button onClick={save} disabled={saving}>{saving ? "Saving..." : "Save"}</button>
          <button onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
