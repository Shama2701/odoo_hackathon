import React, { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';
import {
  Box,
  Typography,
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  CircularProgress,
  Alert,
  Grid,
  Card,
  CardContent,
  TextField,
  FormControl,
  InputLabel,
  Select,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Add,
  MoreVert,
  Edit,
  Delete,
  Search,
  Person,
  AdminPanelSettings,
  SupervisorAccount,
  Badge,
  Email,
  Phone,
} from '@mui/icons-material';
import toast from 'react-hot-toast';

const Users = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [filters, setFilters] = useState({
    role: '',
    isActive: '',
    search: '',
  });

  useEffect(() => {
    fetchUsers();
  }, [filters]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.role) params.append('role', filters.role);
      if (filters.isActive !== '') params.append('isActive', filters.isActive);
      
      const response = await api.get(`/users?${params.toString()}`);
      setUsers(response.data.data.users);
      setError(null);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleMenuOpen = (event, user) => {
    setAnchorEl(event.currentTarget);
    setSelectedUser(user);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedUser(null);
  };

  const handleDeleteClick = () => {
    setDeleteDialog(true);
    handleMenuClose();
  };

  const handleDeleteConfirm = async () => {
    if (!selectedUser) return;

    try {
      setProcessing(true);
      await api.delete(`/users/${selectedUser._id}`);
      
      toast.success('User deleted successfully');
      setDeleteDialog(false);
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    } finally {
      setProcessing(false);
    }
  };

  const handleToggleActive = async (userId, isActive) => {
    try {
      await api.put(`/users/${userId}`, { isActive: !isActive });
      toast.success(`User ${!isActive ? 'activated' : 'deactivated'} successfully`);
      fetchUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Failed to update user');
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin':
        return 'error';
      case 'manager':
        return 'warning';
      case 'employee':
        return 'info';
      default:
        return 'default';
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin':
        return <AdminPanelSettings />;
      case 'manager':
        return <SupervisorAccount />;
      case 'employee':
        return <Badge />;
      default:
        return <Person />;
    }
  };

  const getStats = () => {
    const total = users.length;
    const admins = users.filter(u => u.role === 'admin').length;
    const managers = users.filter(u => u.role === 'manager').length;
    const employees = users.filter(u => u.role === 'employee').length;
    const active = users.filter(u => u.isActive).length;

    return { total, admins, managers, employees, active };
  };

  const stats = getStats();

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box sx={{ py: 2 }}>
      {/* Header */}
      <Paper elevation={2} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
              Users
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage company users, roles, and permissions
            </Typography>
          </Box>
          <Button
            component={RouterLink}
            to="/users/new"
            variant="contained"
            startIcon={<Add />}
            size="large"
          >
            Add New User
          </Button>
        </Box>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card elevation={2}>
            <CardContent sx={{ p: 2 }}>
              <Box display="flex" alignItems="center">
                <Person sx={{ color: 'primary.main', mr: 2, fontSize: 32 }} />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Total Users
                  </Typography>
                  <Typography variant="h5" fontWeight="bold">
                    {stats.total}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={2.4}>
          <Card elevation={2}>
            <CardContent sx={{ p: 2 }}>
              <Box display="flex" alignItems="center">
                <AdminPanelSettings sx={{ color: 'error.main', mr: 2, fontSize: 32 }} />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Admins
                  </Typography>
                  <Typography variant="h5" fontWeight="bold">
                    {stats.admins}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={2.4}>
          <Card elevation={2}>
            <CardContent sx={{ p: 2 }}>
              <Box display="flex" alignItems="center">
                <SupervisorAccount sx={{ color: 'warning.main', mr: 2, fontSize: 32 }} />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Managers
                  </Typography>
                  <Typography variant="h5" fontWeight="bold">
                    {stats.managers}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={2.4}>
          <Card elevation={2}>
            <CardContent sx={{ p: 2 }}>
              <Box display="flex" alignItems="center">
                <Badge sx={{ color: 'info.main', mr: 2, fontSize: 32 }} />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Employees
                  </Typography>
                  <Typography variant="h5" fontWeight="bold">
                    {stats.employees}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={2.4}>
          <Card elevation={2}>
            <CardContent sx={{ p: 2 }}>
              <Box display="flex" alignItems="center">
                <Person sx={{ color: 'success.main', mr: 2, fontSize: 32 }} />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Active
                  </Typography>
                  <Typography variant="h5" fontWeight="bold">
                    {stats.active}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Paper elevation={2} sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Search users..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>
              <Select
                value={filters.role}
                label="Role"
                onChange={(e) => setFilters({ ...filters, role: e.target.value })}
              >
                <MenuItem value="">All Roles</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
                <MenuItem value="manager">Manager</MenuItem>
                <MenuItem value="employee">Employee</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={filters.isActive}
                label="Status"
                onChange={(e) => setFilters({ ...filters, isActive: e.target.value })}
              >
                <MenuItem value="">All Status</MenuItem>
                <MenuItem value="true">Active</MenuItem>
                <MenuItem value="false">Inactive</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Users Table */}
      <Paper elevation={2} sx={{ borderRadius: 2 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>User</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Manager</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <Typography variant="body1" color="text.secondary">
                      No users found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                users.map((userItem) => (
                  <TableRow key={userItem._id} hover>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                          {userItem.name?.charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2" fontWeight="medium">
                            {userItem.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            ID: {userItem._id.slice(-8)}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <Email sx={{ mr: 1, fontSize: 16 }} />
                        <Typography variant="body2">
                          {userItem.email}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={getRoleIcon(userItem.role)}
                        label={userItem.role}
                        color={getRoleColor(userItem.role)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {userItem.manager?.name || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={userItem.isActive}
                            onChange={() => handleToggleActive(userItem._id, userItem.isActive)}
                            size="small"
                          />
                        }
                        label={userItem.isActive ? 'Active' : 'Inactive'}
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton
                        onClick={(e) => handleMenuOpen(e, userItem)}
                        size="small"
                      >
                        <MoreVert />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem
          component={RouterLink}
          to={`/users/${selectedUser?._id}/edit`}
          onClick={handleMenuClose}
        >
          <Edit sx={{ mr: 1 }} />
          Edit User
        </MenuItem>
        {selectedUser?._id !== user?._id && (
          <MenuItem onClick={handleDeleteClick}>
            <Delete sx={{ mr: 1 }} />
            Delete User
          </MenuItem>
        )}
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
        <DialogTitle>Delete User</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete <strong>{selectedUser?.name}</strong>? 
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            variant="contained"
            color="error"
            disabled={processing}
          >
            {processing ? <CircularProgress size={20} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Users;
