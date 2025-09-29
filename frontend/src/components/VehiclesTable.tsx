import React, { useEffect, useState } from "react";
import API from "../api";

type Vehicle = {
  id: number;
  type: string;
  color?: string;
  wheels?: number;
  user?: { id: number; username: string } | null;
};

type User = { id: number; username: string };

export default function VehiclesTable() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Vehicle | null>(null);

  const fetch = async () => {
    const [vRes, uRes] = await Promise.all([API.get("/vehicles"), API.get("/users")]);
    setVehicles(vRes.data);
    setUsers(uRes.data);
  };

  useEffect(() => { fetch(); }, []);

  const handleDelete = async (id: number) => {
    if (!confirm("Delete vehicle?")) return;
    await API.delete(`/vehicles/${id}`);
    fetch();
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
        <div>Total: {vehicles.length}</div>
        <div className="row">
          <button onClick={() => { setEditing(null); setShowForm(true); }}>Add Vehicle</button>
          <button onClick={fetch} className="small">Refresh</button>
        </div>
      </div>

      {showForm && <VehicleForm users={users} editing={editing} onClose={() => { setShowForm(false); fetch(); }} />}

      <table>
        <thead><tr><th>Type</th><th>Color</th><th>Wheels</th><th>User</th><th>Actions</th></tr></thead>
        <tbody>
          {vehicles.map(v => (
            <tr key={v.id}>
              <td>{v.type}</td>
              <td>{v.color}</td>
              <td>{v.wheels}</td>
              <td>{v.user?.username ?? "—"}</td>
              <td className="row">
                <button className="small" onClick={() => { setEditing(v); setShowForm(true); }}>Edit</button>
                <button className="small" onClick={() => handleDelete(v.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function VehicleForm({ users, editing, onClose }: { users: any[]; editing: any | null; onClose: () => void }) {
  const [type, setType] = useState(editing?.type ?? "");
  const [color, setColor] = useState(editing?.color ?? "");
  const [wheels, setWheels] = useState(editing?.wheels ?? 4);
  const [userId, setUserId] = useState<number | "">(editing?.user?.id ?? "");

  useEffect(() => {
    setType(editing?.type ?? "");
    setColor(editing?.color ?? "");
    setWheels(editing?.wheels ?? 4);
    setUserId(editing?.user?.id ?? "");
  }, [editing]);

  const save = async () => {
    const payload: any = { type, color, wheels: Number(wheels), userId: userId || undefined };
    try {
      if (editing) {
        await API.put(`/vehicles/${editing.id}`, payload);
      } else {
        await API.post("/vehicles", payload);
      }
      onClose();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Error");
    }
  };

  return (
    <div style={{ padding: 12, border: "1px solid #eee", marginBottom: 12 }}>
      <h4>{editing ? "Edit Vehicle" : "Add Vehicle"}</h4>
      <div style={{ display: "grid", gap: 8 }}>
        <input className="input" value={type} onChange={(e) => setType(e.target.value)} placeholder="type" />
        <input className="input" value={color} onChange={(e) => setColor(e.target.value)} placeholder="color" />
        <input className="input" type="number" value={wheels} onChange={(e) => setWheels(Number(e.target.value))} placeholder="wheels" />
        <select className="input" value={userId} onChange={(e) => setUserId(e.target.value ? Number(e.target.value) : "")}>
          <option value="">Unassigned</option>
          {users.map(u => <option key={u.id} value={u.id}>{u.username}</option>)}
        </select>
        <div className="row">
          <button onClick={save}>Save</button>
          <button onClick={onClose} className="small">Cancel</button>
        </div>
      </div>
    </div>
  );
}
