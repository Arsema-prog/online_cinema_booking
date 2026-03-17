import React from "react";
import { useUsers } from "../hooks/useUsers";

export const UserListPage: React.FC = () => {
  const { page, loading, error, setSearch, load } = useUsers();

  return (
    <div>
      <h1 style={{ fontSize: 22, marginBottom: 12 }}>Users</h1>
      <div style={{ marginBottom: 12, display: "flex", gap: 8 }}>
        <input
          placeholder="Search users"
          onChange={e => setSearch(e.target.value)}
          style={{
            padding: "6px 8px",
            borderRadius: 4,
            border: "1px solid #4b5563",
            background: "#020617",
            color: "#e5e7eb",
            minWidth: 220
          }}
        />
      </div>
      {loading && <div>Loading users...</div>}
      {error && (
        <div style={{ color: "#f97373", marginBottom: 8 }}>{error}</div>
      )}
      {page && (
        <>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: 14
            }}
          >
            <thead>
              <tr
                style={{
                  textAlign: "left",
                  borderBottom: "1px solid #1e293b",
                  color: "#e5e7eb"
                }}
              >
                <th style={{ padding: "8px 4px" }}>Username</th>
                <th style={{ padding: "8px 4px" }}>Email</th>
                <th style={{ padding: "8px 4px" }}>Enabled</th>
              </tr>
            </thead>
            <tbody>
              {page.content.map(user => (
                <tr
                  key={user.id}
                  style={{
                    borderBottom: "1px solid #111827",
                    color: "#e5e7eb"
                  }}
                >
                  <td style={{ padding: "8px 4px" }}>{user.username}</td>
                  <td style={{ padding: "8px 4px" }}>{user.email}</td>
                  <td style={{ padding: "8px 4px" }}>
                    {user.enabled ? "Yes" : "No"}
                  </td>
                </tr>
              ))}
              {page.content.length === 0 && (
                <tr>
                  <td
                    colSpan={3}
                    style={{
                      padding: "12px 4px",
                      textAlign: "center",
                      color: "#9ca3af"
                    }}
                  >
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <div
            style={{
              marginTop: 12,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: 13
            }}
          >
            <span>
              Page {page.number + 1} of {page.totalPages || 1}
            </span>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                disabled={page.number === 0}
                onClick={() => load(page.number - 1)}
                style={{
                  padding: "4px 8px",
                  borderRadius: 4,
                  border: "1px solid #4b5563",
                  background: "transparent",
                  color: "#e5e7eb",
                  cursor: page.number === 0 ? "default" : "pointer",
                  opacity: page.number === 0 ? 0.5 : 1
                }}
              >
                Previous
              </button>
              <button
                disabled={page.number + 1 >= page.totalPages}
                onClick={() => load(page.number + 1)}
                style={{
                  padding: "4px 8px",
                  borderRadius: 4,
                  border: "1px solid #4b5563",
                  background: "transparent",
                  color: "#e5e7eb",
                  cursor:
                    page.number + 1 >= page.totalPages
                      ? "default"
                      : "pointer",
                  opacity: page.number + 1 >= page.totalPages ? 0.5 : 1
                }}
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

