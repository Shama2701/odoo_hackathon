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
  Switch,
  FormControlLabel,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
} from '@mui/material';
import {
  Add,
  MoreVert,
  Edit,
  Delete,
  Search,
  Settings,
  Rule,
  People,
  AttachMoney,
  CheckCircle,
  Warning,
  Info,
} from '@mui/icons-material';
import toast from 'react-hot-toast';

const ApprovalRules = () => {
  const { user } = useAuth();
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedRule, setSelectedRule] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [filters, setFilters] = useState({
    isActive: '',
    search: '',
  });

  useEffect(() => {
    fetchRules();
  }, [filters]);

  const fetchRules = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.isActive !== '') params.append('isActive', filters.isActive);
      
      const response = await api.get(`/approval-rules?${params.toString()}`);
      setRules(response.data.data.rules);
      setError(null);
    } catch (error) {
      console.error('Error fetching approval rules:', error);
      setError('Failed to fetch approval rules');
    } finally {
      setLoading(false);
    }
  };

  const handleMenuOpen = (event, rule) => {
    setAnchorEl(event.currentTarget);
    setSelectedRule(rule);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedRule(null);
  };

  const handleDeleteClick = () => {
    setDeleteDialog(true);
    handleMenuClose();
  };

  const handleDeleteConfirm = async () => {
    if (!selectedRule) return;

    try {
      setProcessing(true);
      await api.delete(`/approval-rules/${selectedRule._id}`);
      
      toast.success('Approval rule deleted successfully');
      setDeleteDialog(false);
      fetchRules();
    } catch (error) {
      console.error('Error deleting approval rule:', error);
      toast.error('Failed to delete approval rule');
    } finally {
      setProcessing(false);
    }
  };

  const handleToggleActive = async (ruleId, isActive) => {
    try {
      await api.put(`/approval-rules/${ruleId}`, { isActive: !isActive });
      toast.success(`Approval rule ${!isActive ? 'activated' : 'deactivated'} successfully`);
      fetchRules();
    } catch (error) {
      console.error('Error updating approval rule:', error);
      toast.error('Failed to update approval rule');
    }
  };

  const getRuleTypeColor = (type) => {
    switch (type) {
      case 'percentage':
        return 'info';
      case 'specific_approver':
        return 'warning';
      case 'hybrid':
        return 'success';
      default:
        return 'default';
    }
  };

  const getRuleTypeIcon = (type) => {
    switch (type) {
      case 'percentage':
        return <AttachMoney />;
      case 'specific_approver':
        return <People />;
      case 'hybrid':
        return <Settings />;
      default:
        return <Rule />;
    }
  };

  const getStats = () => {
    const total = rules.length;
    const active = rules.filter(r => r.isActive).length;
    const percentage = rules.filter(r => r.type === 'percentage').length;
    const specific = rules.filter(r => r.type === 'specific_approver').length;
    const hybrid = rules.filter(r => r.type === 'hybrid').length;

    return { total, active, percentage, specific, hybrid };
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
              Approval Rules
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Configure expense approval workflows and conditions
            </Typography>
          </Box>
          <Button
            component={RouterLink}
            to="/approval-rules/new"
            variant="contained"
            startIcon={<Add />}
            size="large"
          >
            Create New Rule
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
                <Rule sx={{ color: 'primary.main', mr: 2, fontSize: 32 }} />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Total Rules
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
                <CheckCircle sx={{ color: 'success.main', mr: 2, fontSize: 32 }} />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Active Rules
                  </Typography>
                  <Typography variant="h5" fontWeight="bold">
                    {stats.active}
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
                <AttachMoney sx={{ color: 'info.main', mr: 2, fontSize: 32 }} />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Percentage Rules
                  </Typography>
                  <Typography variant="h5" fontWeight="bold">
                    {stats.percentage}
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
                <People sx={{ color: 'warning.main', mr: 2, fontSize: 32 }} />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Specific Approver
                  </Typography>
                  <Typography variant="h5" fontWeight="bold">
                    {stats.specific}
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
                <Settings sx={{ color: 'secondary.main', mr: 2, fontSize: 32 }} />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Hybrid Rules
                  </Typography>
                  <Typography variant="h5" fontWeight="bold">
                    {stats.hybrid}
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
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Search approval rules..."
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

      {/* Rules Table */}
      <Paper elevation={2} sx={{ borderRadius: 2 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Rule Name</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Conditions</TableCell>
                <TableCell>Approvers</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rules.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <Box textAlign="center">
                      <Rule sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                      <Typography variant="body1" color="text.secondary">
                        No approval rules found
                      </Typography>
                      <Button
                        component={RouterLink}
                        to="/approval-rules/new"
                        variant="contained"
                        sx={{ mt: 2 }}
                      >
                        Create Your First Rule
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                rules.map((rule) => (
                  <TableRow key={rule._id} hover>
                    <TableCell>
                      <Box>
                        <Typography variant="subtitle2" fontWeight="medium">
                          {rule.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {rule.description}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={getRuleTypeIcon(rule.type)}
                        label={rule.type.replace('_', ' ')}
                        color={getRuleTypeColor(rule.type)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Box>
                        {rule.type === 'percentage' && (
                          <Typography variant="body2">
                            {rule.percentageThreshold}% approval required
                          </Typography>
                        )}
                        {rule.type === 'specific_approver' && (
                          <Typography variant="body2">
                            Specific approver required
                          </Typography>
                        )}
                        {rule.type === 'hybrid' && (
                          <Typography variant="body2">
                            {rule.percentageThreshold}% OR specific approver
                          </Typography>
                        )}
                        {rule.amountThreshold && (
                          <Typography variant="caption" color="text.secondary">
                            Amount: ${rule.amountThreshold}+
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        {rule.approvalFlow?.approvers?.length > 0 ? (
                          <Typography variant="body2">
                            {rule.approvalFlow.approvers.length} approver(s)
                          </Typography>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            No approvers
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={rule.isActive}
                            onChange={() => handleToggleActive(rule._id, rule.isActive)}
                            size="small"
                          />
                        }
                        label={rule.isActive ? 'Active' : 'Inactive'}
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton
                        onClick={(e) => handleMenuOpen(e, rule)}
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
          to={`/approval-rules/${selectedRule?._id}/edit`}
          onClick={handleMenuClose}
        >
          <Edit sx={{ mr: 1 }} />
          Edit Rule
        </MenuItem>
        <MenuItem onClick={handleDeleteClick}>
          <Delete sx={{ mr: 1 }} />
          Delete Rule
        </MenuItem>
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
        <DialogTitle>Delete Approval Rule</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete <strong>{selectedRule?.name}</strong>? 
            This action cannot be undone and may affect existing expense workflows.
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

export default ApprovalRules;
