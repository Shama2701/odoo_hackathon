import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  CircularProgress,
  Alert,
  InputAdornment,
  Avatar,
  Card,
  CardContent,
  Divider,
  Switch,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
} from '@mui/material';
import {
  Save,
  Edit,
  Person,
  Email,
  Phone,
  Business,
  AdminPanelSettings,
  SupervisorAccount,
  Badge,
  Security,
  Visibility,
  VisibilityOff,
  Lock,
  CheckCircle,
  Warning,
  Info,
  CalendarToday,
  LocationOn,
} from '@mui/icons-material';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    department: '',
    manager: '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [passwordError, setPasswordError] = useState(null);
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [passwordDialog, setPasswordDialog] = useState(false);
  const [managers, setManagers] = useState([]);
  const [userStats, setUserStats] = useState({
    totalExpenses: 0,
    pendingExpenses: 0,
    approvedExpenses: 0,
    rejectedExpenses: 0,
    totalAmount: 0,
  });

  const departments = [
    'Engineering',
    'Sales',
    'Marketing',
    'HR',
    'Finance',
    'Operations',
    'Customer Support',
    'Product',
    'Design',
    'Other'
  ];

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        department: user.department || '',
        manager: user.manager?._id || '',
      });
      fetchUserStats();
      fetchManagers();
    }
  }, [user]);

  const fetchUserStats = async () => {
    try {
      const response = await api.get('/expenses?limit=1000');
      const expenses = response.data.data.expenses;
      
      const stats = {
        totalExpenses: expenses.length,
        pendingExpenses: expenses.filter(e => e.status === 'pending_approval').length,
        approvedExpenses: expenses.filter(e => e.status === 'approved').length,
        rejectedExpenses: expenses.filter(e => e.status === 'rejected').length,
        totalAmount: expenses.reduce((sum, e) => sum + (e.amountInBaseCurrency || 0), 0),
      };
      
      setUserStats(stats);
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  const fetchManagers = async () => {
    try {
      const response = await api.get('/users');
      const allUsers = response.data.data.users;
      const managersList = allUsers.filter(u => 
        (u.role === 'manager' || u.role === 'admin') && u._id !== user?._id
      );
      setManagers(managersList);
    } catch (error) {
      console.error('Error fetching managers:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError(null);
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
    if (passwordError) setPasswordError(null);
  };

  const handleManagerChange = (event, newValue) => {
    setFormData(prev => ({
      ...prev,
      manager: newValue ? newValue._id : ''
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email) {
      setError('Name and email are required');
      return;
    }

    try {
      setSaving(true);
      const response = await api.put('/users/profile', formData);
      
      // Update the user context with new data
      updateUser(response.data.data.user);
      
      toast.success('Profile updated successfully');
      setError(null);
    } catch (error) {
      console.error('Error updating profile:', error);
      const message = error.response?.data?.message || 'Failed to update profile';
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setPasswordError('All password fields are required');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long');
      return;
    }

    try {
      setSaving(true);
      await api.put('/users/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      
      toast.success('Password changed successfully');
      setPasswordDialog(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setPasswordError(null);
    } catch (error) {
      console.error('Error changing password:', error);
      const message = error.response?.data?.message || 'Failed to change password';
      setPasswordError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPassword(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
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

  const formatCurrency = (amount, currency = user?.company?.currency) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD'
    }).format(amount);
  };

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
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
              My Profile
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage your account information and preferences
            </Typography>
          </Box>
          <Avatar sx={{ width: 80, height: 80, bgcolor: 'primary.main', fontSize: '2rem' }}>
            {user?.name?.charAt(0)}
          </Avatar>
        </Box>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Profile Information */}
        <Grid item xs={12} md={8}>
          <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
            <Box display="flex" alignItems="center" mb={3}>
              <Person sx={{ mr: 2, color: 'primary.main' }} />
              <Typography variant="h6" fontWeight="bold">
                Personal Information
              </Typography>
            </Box>

            <Box component="form" onSubmit={handleSubmit}>
              <Grid container spacing={3}>
                {/* Name */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Full Name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Person />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                {/* Email */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Email Address"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Email />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                {/* Phone */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Phone Number"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Phone />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                {/* Department */}
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Department</InputLabel>
                    <Select
                      value={formData.department}
                      label="Department"
                      onChange={handleChange}
                      name="department"
                    >
                      {departments.map((dept) => (
                        <MenuItem key={dept} value={dept}>
                          {dept}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                {/* Manager (only for employees) */}
                {user?.role === 'employee' && (
                  <Grid item xs={12}>
                    <FormControl fullWidth>
                      <InputLabel>Manager</InputLabel>
                      <Select
                        value={formData.manager}
                        label="Manager"
                        onChange={(e) => setFormData(prev => ({ ...prev, manager: e.target.value }))}
                        name="manager"
                      >
                        {managers.map((manager) => (
                          <MenuItem key={manager._id} value={manager._id}>
                            <Box display="flex" alignItems="center">
                              <Avatar sx={{ mr: 2, width: 24, height: 24, bgcolor: 'primary.main' }}>
                                {manager.name.charAt(0)}
                              </Avatar>
                              <Box>
                                <Typography variant="body2">{manager.name}</Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {manager.role} • {manager.email}
                                </Typography>
                              </Box>
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                )}

                {/* Save Button */}
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Box display="flex" gap={2} justifyContent="flex-end">
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={saving}
                      startIcon={saving ? <CircularProgress size={20} /> : <Save />}
                    >
                      {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </Paper>

          {/* Change Password */}
          <Paper elevation={2} sx={{ p: 3, mt: 3, borderRadius: 2 }}>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
              <Box display="flex" alignItems="center">
                <Security sx={{ mr: 2, color: 'primary.main' }} />
                <Typography variant="h6" fontWeight="bold">
                  Security
                </Typography>
              </Box>
              <Button
                variant="outlined"
                startIcon={<Lock />}
                onClick={() => setPasswordDialog(true)}
              >
                Change Password
              </Button>
            </Box>

            <Typography variant="body2" color="text.secondary">
              Keep your account secure by regularly updating your password.
            </Typography>
          </Paper>
        </Grid>

        {/* Profile Summary & Stats */}
        <Grid item xs={12} md={4}>
          {/* Profile Summary */}
          <Card elevation={2} sx={{ borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Profile Summary
              </Typography>
              
              <Box sx={{ mt: 2 }}>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2" color="text.secondary">
                    Name:
                  </Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {formData.name || 'N/A'}
                  </Typography>
                </Box>

                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2" color="text.secondary">
                    Email:
                  </Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {formData.email || 'N/A'}
                  </Typography>
                </Box>

                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2" color="text.secondary">
                    Role:
                  </Typography>
                  <Chip
                    icon={getRoleIcon(user?.role)}
                    label={user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
                    color={getRoleColor(user?.role)}
                    size="small"
                  />
                </Box>

                {user?.role === 'employee' && formData.manager && (
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2" color="text.secondary">
                      Manager:
                    </Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {managers.find(m => m._id === formData.manager)?.name || 'N/A'}
                    </Typography>
                  </Box>
                )}

                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2" color="text.secondary">
                    Department:
                  </Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {formData.department || 'N/A'}
                  </Typography>
                </Box>

                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2" color="text.secondary">
                    Phone:
                  </Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {formData.phone || 'N/A'}
                  </Typography>
                </Box>

                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2" color="text.secondary">
                    Company:
                  </Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {user?.company?.name || 'N/A'}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Expense Statistics */}
          <Card elevation={2} sx={{ mt: 2, borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                My Expense Statistics
              </Typography>
              
              <Box sx={{ mt: 2 }}>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2" color="text.secondary">
                    Total Expenses:
                  </Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {userStats.totalExpenses}
                  </Typography>
                </Box>

                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2" color="text.secondary">
                    Pending:
                  </Typography>
                  <Typography variant="body2" fontWeight="medium" color="warning.main">
                    {userStats.pendingExpenses}
                  </Typography>
                </Box>

                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2" color="text.secondary">
                    Approved:
                  </Typography>
                  <Typography variant="body2" fontWeight="medium" color="success.main">
                    {userStats.approvedExpenses}
                  </Typography>
                </Box>

                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2" color="text.secondary">
                    Rejected:
                  </Typography>
                  <Typography variant="body2" fontWeight="medium" color="error.main">
                    {userStats.rejectedExpenses}
                  </Typography>
                </Box>

                <Divider sx={{ my: 1 }} />

                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2" color="text.secondary">
                    Total Amount:
                  </Typography>
                  <Typography variant="body2" fontWeight="bold" color="primary.main">
                    {formatCurrency(userStats.totalAmount)}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Account Information */}
          <Card elevation={2} sx={{ mt: 2, borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Account Information
              </Typography>
              
              <Box sx={{ mt: 2 }}>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2" color="text.secondary">
                    Member Since:
                  </Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                  </Typography>
                </Box>

                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2" color="text.secondary">
                    Last Updated:
                  </Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {user?.updatedAt ? new Date(user.updatedAt).toLocaleDateString() : 'N/A'}
                  </Typography>
                </Box>

                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2" color="text.secondary">
                    Status:
                  </Typography>
                  <Chip
                    label={user?.isActive ? 'Active' : 'Inactive'}
                    color={user?.isActive ? 'success' : 'error'}
                    size="small"
                  />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Change Password Dialog */}
      <Dialog open={passwordDialog} onClose={() => setPasswordDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Change Password</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handlePasswordSubmit} sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Current Password"
              name="currentPassword"
              type={showPassword.current ? 'text' : 'password'}
              value={passwordData.currentPassword}
              onChange={handlePasswordChange}
              required
              sx={{ mb: 2 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => togglePasswordVisibility('current')}>
                      {showPassword.current ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              fullWidth
              label="New Password"
              name="newPassword"
              type={showPassword.new ? 'text' : 'password'}
              value={passwordData.newPassword}
              onChange={handlePasswordChange}
              required
              sx={{ mb: 2 }}
              helperText="Minimum 6 characters"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => togglePasswordVisibility('new')}>
                      {showPassword.new ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              fullWidth
              label="Confirm New Password"
              name="confirmPassword"
              type={showPassword.confirm ? 'text' : 'password'}
              value={passwordData.confirmPassword}
              onChange={handlePasswordChange}
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => togglePasswordVisibility('confirm')}>
                      {showPassword.confirm ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            {passwordError && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {passwordError}
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPasswordDialog(false)}>
            Cancel
          </Button>
          <Button
            onClick={handlePasswordSubmit}
            variant="contained"
            disabled={saving}
          >
            {saving ? <CircularProgress size={20} /> : 'Change Password'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Profile;
