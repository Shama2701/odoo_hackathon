import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
  Autocomplete,
  Card,
  CardContent,
  Divider,
  Switch,
  FormControlLabel,
  Avatar,
} from '@mui/material';
import {
  Save,
  Cancel,
  Person,
  Email,
  Lock,
  AdminPanelSettings,
  SupervisorAccount,
  Badge,
  Phone,
  Business,
} from '@mui/icons-material';
import toast from 'react-hot-toast';

const UserForm = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'employee',
    manager: '',
    phone: '',
    department: '',
    isActive: true,
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [managers, setManagers] = useState([]);
  const [users, setUsers] = useState([]);

  const roles = [
    { value: 'admin', label: 'Admin', icon: <AdminPanelSettings />, color: 'error' },
    { value: 'manager', label: 'Manager', icon: <SupervisorAccount />, color: 'warning' },
    { value: 'employee', label: 'Employee', icon: <Badge />, color: 'info' },
  ];

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
    if (isEdit) {
      fetchUser();
    }
    fetchUsers();
  }, [id]);

  const fetchUser = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/users/${id}`);
      const userData = response.data.data.user;
      
      setFormData({
        name: userData.name || '',
        email: userData.email || '',
        password: '',
        confirmPassword: '',
        role: userData.role || 'employee',
        manager: userData.manager?._id || '',
        phone: userData.phone || '',
        department: userData.department || '',
        isActive: userData.isActive ?? true,
      });
    } catch (error) {
      console.error('Error fetching user:', error);
      toast.error('Failed to fetch user details');
      navigate('/users');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      const allUsers = response.data.data.users;
      setUsers(allUsers);
      
      // Filter managers and admins for manager selection
      const managersList = allUsers.filter(u => 
        (u.role === 'manager' || u.role === 'admin') && u._id !== id
      );
      setManagers(managersList);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (error) setError(null);
  };

  const handleManagerChange = (event, newValue) => {
    setFormData(prev => ({
      ...prev,
      manager: newValue ? newValue._id : ''
    }));
  };

  const validateForm = () => {
    if (!formData.name || !formData.email) {
      setError('Name and email are required');
      return false;
    }

    if (!isEdit && (!formData.password || !formData.confirmPassword)) {
      setError('Password and confirm password are required');
      return false;
    }

    if (formData.password && formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    if (formData.password && formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);
      const submitData = { ...formData };
      
      // Remove password fields if they're empty (for edit mode)
      if (isEdit && !submitData.password) {
        delete submitData.password;
        delete submitData.confirmPassword;
      }

      if (isEdit) {
        await api.put(`/users/${id}`, submitData);
        toast.success('User updated successfully');
      } else {
        await api.post('/users', submitData);
        toast.success('User created successfully');
      }

      navigate('/users');
    } catch (error) {
      console.error('Error saving user:', error);
      const message = error.response?.data?.message || 'Failed to save user';
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const getRoleIcon = (role) => {
    const roleData = roles.find(r => r.value === role);
    return roleData ? roleData.icon : <Person />;
  };

  const getRoleColor = (role) => {
    const roleData = roles.find(r => r.value === role);
    return roleData ? roleData.color : 'default';
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
        <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
          {isEdit ? 'Edit User' : 'Add New User'}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {isEdit ? 'Update user information and permissions' : 'Fill in the details below to create a new user'}
        </Typography>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Form */}
        <Grid item xs={12} md={8}>
          <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
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

                {/* Password */}
                {!isEdit && (
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Password"
                      name="password"
                      type="password"
                      value={formData.password}
                      onChange={handleChange}
                      required={!isEdit}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Lock />
                          </InputAdornment>
                        ),
                      }}
                      helperText="Minimum 6 characters"
                    />
                  </Grid>
                )}

                {/* Confirm Password */}
                {!isEdit && (
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Confirm Password"
                      name="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required={!isEdit}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Lock />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                )}

                {/* Role */}
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Role</InputLabel>
                    <Select
                      value={formData.role}
                      label="Role"
                      onChange={handleChange}
                      name="role"
                    >
                      {roles.map((role) => (
                        <MenuItem key={role.value} value={role.value}>
                          <Box display="flex" alignItems="center">
                            {role.icon}
                            <Typography sx={{ ml: 1 }}>{role.label}</Typography>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                {/* Manager */}
                {formData.role === 'employee' && (
                  <Grid item xs={12} sm={6}>
                    <Autocomplete
                      fullWidth
                      options={managers}
                      getOptionLabel={(option) => option.name}
                      value={managers.find(manager => manager._id === formData.manager) || null}
                      onChange={handleManagerChange}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Manager"
                          placeholder="Select a manager"
                        />
                      )}
                      renderOption={(props, option) => (
                        <Box component="li" {...props}>
                          <Box display="flex" alignItems="center">
                            <Avatar sx={{ mr: 2, width: 24, height: 24, bgcolor: 'primary.main' }}>
                              {option.name.charAt(0)}
                            </Avatar>
                            <Box>
                              <Typography variant="body2">{option.name}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                {option.role} • {option.email}
                              </Typography>
                            </Box>
                          </Box>
                        </Box>
                      )}
                    />
                  </Grid>
                )}

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

                {/* Status */}
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.isActive}
                        onChange={handleChange}
                        name="isActive"
                      />
                    }
                    label="Active User"
                  />
                  <Typography variant="caption" display="block" color="text.secondary">
                    Inactive users cannot log in to the system
                  </Typography>
                </Grid>

                {/* Action Buttons */}
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Box display="flex" gap={2} justifyContent="flex-end">
                    <Button
                      variant="outlined"
                      onClick={() => navigate('/users')}
                      disabled={saving}
                    >
                      <Cancel sx={{ mr: 1 }} />
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={saving}
                    >
                      {saving ? (
                        <CircularProgress size={20} />
                      ) : (
                        <>
                          <Save sx={{ mr: 1 }} />
                          {isEdit ? 'Update User' : 'Create User'}
                        </>
                      )}
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </Paper>
        </Grid>

        {/* Summary Card */}
        <Grid item xs={12} md={4}>
          <Card elevation={2} sx={{ borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                User Summary
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
                  <Box display="flex" alignItems="center">
                    {getRoleIcon(formData.role)}
                    <Typography variant="body2" fontWeight="medium" sx={{ ml: 1 }}>
                      {formData.role.charAt(0).toUpperCase() + formData.role.slice(1)}
                    </Typography>
                  </Box>
                </Box>

                {formData.role === 'employee' && formData.manager && (
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
                    Status:
                  </Typography>
                  <Typography 
                    variant="body2" 
                    fontWeight="medium"
                    color={formData.isActive ? 'success.main' : 'error.main'}
                  >
                    {formData.isActive ? 'Active' : 'Inactive'}
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Typography variant="body2" color="text.secondary">
                <strong>Note:</strong> {isEdit ? 'Changes will be applied immediately.' : 'The user will receive an email with login credentials.'}
              </Typography>
            </CardContent>
          </Card>

          {/* Role Permissions */}
          <Card elevation={2} sx={{ mt: 2, borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Role Permissions
              </Typography>
              
              <Box sx={{ mt: 2 }}>
                {formData.role === 'admin' && (
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      <strong>Admin</strong> can:
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      • Manage all users and roles<br/>
                      • Configure approval rules<br/>
                      • View all expenses<br/>
                      • Override approvals<br/>
                      • Manage company settings
                    </Typography>
                  </Box>
                )}
                
                {formData.role === 'manager' && (
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      <strong>Manager</strong> can:
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      • Approve/reject expenses<br/>
                      • View team expenses<br/>
                      • Manage team members<br/>
                      • View approval rules
                    </Typography>
                  </Box>
                )}
                
                {formData.role === 'employee' && (
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      <strong>Employee</strong> can:
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      • Submit expenses<br/>
                      • View own expenses<br/>
                      • Check approval status<br/>
                      • Upload receipts
                    </Typography>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default UserForm;
