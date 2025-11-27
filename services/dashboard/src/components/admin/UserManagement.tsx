import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  Filter,
  UserPlus,
  MoreVertical,
  Shield,
  Mail,
  Clock,
  Activity,
  X,
  Lock,
  Unlock,
  Eye
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface User {
  id: string;
  email: string;
  username: string;
  status: "active" | "locked" | "pending";
  created_at: string;
  last_login: string | null;
  createdAt: string; // Display formatted
  lastLogin: string; // Display formatted
  loginCount: number; // Note: Backend doesn't send this yet, defaulting to 0
  role: "admin" | "user" | "moderator";
  is_active: boolean;
  is_admin: boolean;
  failed_login_attempts: number;
  account_locked_until: string | null;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

const statusStyles = {
  active: "bg-success/20 text-success border-success/30",
  locked: "bg-destructive/20 text-destructive border-destructive/30",
  pending: "bg-warning/20 text-warning border-warning/30",
};

const roleStyles = {
  admin: "bg-primary/20 text-primary border-primary/30",
  moderator: "bg-info/20 text-info border-info/30",
  user: "bg-muted text-muted-foreground border-border",
};

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // New state for actions
  const [isEmailOpen, setIsEmailOpen] = useState(false);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailMessage, setEmailMessage] = useState("");

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({ username: "", email: "" });

  useEffect(() => {
    if (selectedUser) {
      setEditForm({ username: selectedUser.username, email: selectedUser.email });
    }
  }, [selectedUser]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleStatusChange = async (userId: string, action: 'lock' | 'unlock') => {
    try {
      const token = localStorage.getItem("auth_token");
      const res = await fetch(`${API_BASE_URL}/api/users/${userId}/${action}`, {
        method: 'POST',
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success(`User ${action}ed successfully`);
        fetchUsers();
        setSelectedUser(null);
      } else {
        toast.error(`Failed to ${action} user`);
      }
    } catch (error) {
      toast.error("Error updating user status");
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      const token = localStorage.getItem("auth_token");
      const res = await fetch(`${API_BASE_URL}/api/users/${userId}`, {
        method: 'DELETE',
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success("User deleted successfully");
        fetchUsers();
        setSelectedUser(null);
      } else {
        toast.error("Failed to delete user");
      }
    } catch (error) {
      toast.error("Error deleting user");
    }
  };

  const handleSendEmail = async () => {
    if (!selectedUser) return;
    try {
      const token = localStorage.getItem("auth_token");
      const res = await fetch(`${API_BASE_URL}/api/users/${selectedUser.id}/email`, {
        method: 'POST',
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ subject: emailSubject, message: emailMessage })
      });
      if (res.ok) {
        toast.success("Email sent successfully");
        setIsEmailOpen(false);
        setEmailSubject("");
        setEmailMessage("");
      } else {
        toast.error("Failed to send email");
      }
    } catch (error) {
      toast.error("Error sending email");
    }
  };

  const handleEditUser = async () => {
    if (!selectedUser) return;
    try {
      const token = localStorage.getItem("auth_token");
      const res = await fetch(`${API_BASE_URL}/api/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(editForm)
      });
      if (res.ok) {
        toast.success("User updated successfully");
        fetchUsers();
        setIsEditOpen(false);
        // Update selected user to reflect changes immediately in modal if we kept it open
        // But we close it, so fetchUsers is enough
        setSelectedUser(null);
      } else {
        toast.error("Failed to update user");
      }
    } catch (error) {
      toast.error("Error updating user");
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        // If no token, we can't fetch. Just show empty or maybe a message?
        // For now, let's just stop loading.
        setLoading(false);
        return;
      }

      const res = await fetch(`${API_BASE_URL}/api/users/`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (res.ok) {
        const data = await res.json();
        // Transform data to match interface if needed
        const transformedUsers = data.map((u: any) => ({
          ...u,
          status: u.account_locked_until && new Date(u.account_locked_until) > new Date() ? "locked" : (u.is_active ? "active" : "pending"),
          role: u.is_admin ? "admin" : "user",
          loginCount: 0, // Not provided by backend yet
          lastLogin: u.last_login ? new Date(u.last_login).toLocaleString() : "Never",
          createdAt: new Date(u.created_at).toLocaleDateString()
        }));
        setUsers(transformedUsers);
      } else {
        console.error("Failed to fetch users");
        if (res.status === 401) {
          toast.error("Unauthorized. Please login via API Tester.");
        }
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.username.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || user.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: users.length,
    active: users.filter(u => u.status === "active").length,
    locked: users.filter(u => u.status === "locked").length,
    pending: users.filter(u => u.status === "pending").length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold gradient-text">User Management</h1>
          <p className="text-muted-foreground mt-1">Manage user accounts and permissions</p>
        </div>
        <Button className="glow" onClick={fetchUsers}>
          <UserPlus className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Users", value: stats.total, color: "text-foreground" },
          { label: "Active", value: stats.active, color: "text-success" },
          { label: "Locked", value: stats.locked, color: "text-destructive" },
          { label: "Pending", value: stats.pending, color: "text-warning" },
        ].map((stat, index) => (
          <div
            key={stat.label}
            className="glass rounded-xl p-4 animate-fade-in-up gradient-border"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <p className="text-sm text-muted-foreground">{stat.label}</p>
            <p className={cn("text-2xl font-bold", stat.color)}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 animate-fade-in-up" style={{ animationDelay: "400ms" }}>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search users by email or username..."
            className="pl-10 bg-muted/50 border-border/50"
          />
        </div>
        <div className="flex gap-2">
          {["all", "active", "locked", "pending"].map((status) => (
            <Button
              key={status}
              variant={statusFilter === status ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(status)}
              className={cn(
                statusFilter === status && "glow"
              )}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div className="glass rounded-xl overflow-hidden animate-fade-in-up gradient-border" style={{ animationDelay: "500ms" }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left py-4 px-4 text-sm font-medium text-muted-foreground">User</th>
                <th className="text-left py-4 px-4 text-sm font-medium text-muted-foreground">Status</th>
                <th className="text-left py-4 px-4 text-sm font-medium text-muted-foreground">Role</th>
                <th className="text-left py-4 px-4 text-sm font-medium text-muted-foreground">Last Login</th>
                <th className="text-right py-4 px-4 text-sm font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-muted-foreground">
                    Loading users...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-muted-foreground">
                    No users found. {localStorage.getItem("auth_token") ? "" : "Please login via API Tester first."}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user, index) => (
                  <tr
                    key={user.id}
                    className="border-b border-border/30 hover:bg-muted/30 transition-colors animate-fade-in"
                    style={{ animationDelay: `${600 + index * 50}ms` }}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-info flex items-center justify-center text-primary-foreground font-semibold">
                          {user.email[0]?.toUpperCase() || "U"}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{user.username}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={cn(
                        "px-2 py-1 rounded-md text-xs font-medium border",
                        statusStyles[user.status]
                      )}>
                        {user.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={cn(
                        "px-2 py-1 rounded-md text-xs font-medium border",
                        roleStyles[user.role]
                      )}>
                        {user.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">{user.lastLogin}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSelectedUser(user)}
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Details Modal */}
      <Dialog open={!!selectedUser} onOpenChange={() => { setSelectedUser(null); setIsEmailOpen(false); setIsEditOpen(false); }}>
        <DialogContent className="glass-strong border-border/50 max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-info flex items-center justify-center text-primary-foreground font-bold text-lg">
                {selectedUser?.email[0]?.toUpperCase() || "U"}
              </div>
              <div>
                <p className="font-semibold text-foreground">{selectedUser?.username}</p>
                <p className="text-sm text-muted-foreground font-normal">{selectedUser?.email}</p>
              </div>
            </DialogTitle>
          </DialogHeader>

          {selectedUser && !isEmailOpen && !isEditOpen && (
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="glass rounded-lg p-3">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Shield className="w-4 h-4" />
                    <span className="text-xs">Status</span>
                  </div>
                  <span className={cn(
                    "px-2 py-1 rounded-md text-xs font-medium border",
                    statusStyles[selectedUser.status]
                  )}>
                    {selectedUser.status}
                  </span>
                </div>
                <div className="glass rounded-lg p-3">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Activity className="w-4 h-4" />
                    <span className="text-xs">Role</span>
                  </div>
                  <span className={cn(
                    "px-2 py-1 rounded-md text-xs font-medium border",
                    roleStyles[selectedUser.role]
                  )}>
                    {selectedUser.role}
                  </span>
                </div>
                <div className="glass rounded-lg p-3">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Clock className="w-4 h-4" />
                    <span className="text-xs">Last Login</span>
                  </div>
                  <p className="text-sm font-medium text-foreground">{selectedUser.lastLogin}</p>
                </div>
                <div className="glass rounded-lg p-3">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Mail className="w-4 h-4" />
                    <span className="text-xs">Joined</span>
                  </div>
                  <p className="text-sm font-medium text-foreground font-mono">{selectedUser.createdAt}</p>
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t border-border/50">
                {selectedUser.status === "locked" ? (
                  <Button variant="success" className="flex-1" onClick={() => handleStatusChange(selectedUser.id, 'unlock')}>
                    <Unlock className="w-4 h-4 mr-2" />
                    Unlock Account
                  </Button>
                ) : (
                  <Button variant="destructive" className="flex-1" onClick={() => handleStatusChange(selectedUser.id, 'lock')}>
                    <Lock className="w-4 h-4 mr-2" />
                    Lock Account
                  </Button>
                )}
                <Button variant="outline" className="flex-1" onClick={() => setIsEmailOpen(true)}>
                  <Mail className="w-4 h-4 mr-2" />
                  Send Email
                </Button>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" className="flex-1" onClick={() => setIsEditOpen(true)}>
                  Edit User
                </Button>
                <Button variant="destructive" className="flex-1" onClick={() => handleDeleteUser(selectedUser.id)}>
                  Delete User
                </Button>
              </div>
            </div>
          )}

          {selectedUser && isEmailOpen && (
            <div className="space-y-4 mt-4">
              <h3 className="text-lg font-medium">Send Email</h3>
              <Input
                placeholder="Subject"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
              />
              <textarea
                className="w-full h-32 p-3 rounded-md bg-muted/50 border border-border/50 focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="Message..."
                value={emailMessage}
                onChange={(e) => setEmailMessage(e.target.value)}
              />
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setIsEmailOpen(false)}>Cancel</Button>
                <Button onClick={handleSendEmail}>Send</Button>
              </div>
            </div>
          )}

          {selectedUser && isEditOpen && (
            <div className="space-y-4 mt-4">
              <h3 className="text-lg font-medium">Edit User</h3>
              <div className="space-y-2">
                <label className="text-sm font-medium">Username</label>
                <Input
                  value={editForm.username}
                  onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="ghost" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                <Button onClick={handleEditUser}>Save Changes</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
