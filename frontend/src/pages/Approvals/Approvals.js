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
  TextareaAutosize,
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  MoreVert,
  Visibility,
  Search,
  AttachMoney,
  Schedule,
  Person,
  Warning,
} from '@mui/icons-material';
import toast from 'react-hot-toast';

const Approvals = () => {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [approvalDialog, setApprovalDialog] = useState(false);
  const [approvalAction, setApprovalAction] = useState('');
  const [approvalComment, setApprovalComment] = useState('');
  const [processing, setProcessing] = useState(false);
  const [filters, setFilters] = useState({
    status: 'pending_approval',
    search: '',
  });

  useEffect(() => {
    fetchExpenses();
  }, [filters]);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      
      const response = await api.get(`/expenses?${params.toString()}`);
      setExpenses(response.data.data.expenses);
      setError(null);
    } catch (error) {
      console.error('Error fetching expenses:', error);
      setError('Failed to fetch expenses');
    } finally {
      setLoading(false);
    }
  };

  const handleMenuOpen = (event, expense) => {
    setAnchorEl(event.currentTarget);
    setSelectedExpense(expense);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedExpense(null);
  };

  const handleApprovalClick = (action) => {
    setApprovalAction(action);
    setApprovalDialog(true);
    handleMenuClose();
  };

  const handleApprovalSubmit = async () => {
    if (!selectedExpense) return;

    try {
      setProcessing(true);
      await api.put(`/expenses/${selectedExpense._id}/approve`, {
        action: approvalAction,
        comment: approvalComment,
      });

      toast.success(`Expense ${approvalAction === 'approve' ? 'approved' : 'rejected'} successfully`);
      setApprovalDialog(false);
      setApprovalComment('');
      fetchExpenses();
    } catch (error) {
      console.error('Error processing approval:', error);
      toast.error('Failed to process approval');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'success';
      case 'rejected':
        return 'error';
      case 'pending_approval':
        return 'warning';
      case 'submitted':
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

  const getStats = () => {
    const pending = expenses.filter(e => e.status === 'pending_approval').length;
    const approved = expenses.filter(e => e.status === 'approved').length;
    const rejected = expenses.filter(e => e.status === 'rejected').length;
    const totalAmount = expenses.reduce((sum, e) => sum + (e.amountInBaseCurrency || 0), 0);

    return { pending, approved, rejected, totalAmount };
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
              Approvals
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Review and approve expense requests from your team
            </Typography>
          </Box>
        </Box>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent sx={{ p: 2 }}>
              <Box display="flex" alignItems="center">
                <Schedule sx={{ color: 'warning.main', mr: 2, fontSize: 32 }} />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Pending Approval
                  </Typography>
                  <Typography variant="h5" fontWeight="bold">
                    {stats.pending}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent sx={{ p: 2 }}>
              <Box display="flex" alignItems="center">
                <CheckCircle sx={{ color: 'success.main', mr: 2, fontSize: 32 }} />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Approved
                  </Typography>
                  <Typography variant="h5" fontWeight="bold">
                    {stats.approved}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent sx={{ p: 2 }}>
              <Box display="flex" alignItems="center">
                <Cancel sx={{ color: 'error.main', mr: 2, fontSize: 32 }} />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Rejected
                  </Typography>
                  <Typography variant="h5" fontWeight="bold">
                    {stats.rejected}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent sx={{ p: 2 }}>
              <Box display="flex" alignItems="center">
                <AttachMoney sx={{ color: 'secondary.main', mr: 2, fontSize: 32 }} />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Total Amount
                  </Typography>
                  <Typography variant="h5" fontWeight="bold">
                    {formatCurrency(stats.totalAmount)}
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
              placeholder="Search expenses..."
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
                value={filters.status}
                label="Status"
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              >
                <MenuItem value="">All Status</MenuItem>
                <MenuItem value="pending_approval">Pending Approval</MenuItem>
                <MenuItem value="approved">Approved</MenuItem>
                <MenuItem value="rejected">Rejected</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Expenses Table */}
      <Paper elevation={2} sx={{ borderRadius: 2 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Employee</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {expenses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <Box textAlign="center">
                      <Warning sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                      <Typography variant="body1" color="text.secondary">
                        No expenses pending approval
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                expenses.map((expense) => (
                  <TableRow key={expense._id} hover>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <Person sx={{ mr: 1, fontSize: 20 }} />
                        <Typography variant="body2" fontWeight="medium">
                          {expense.employee?.name || 'Unknown'}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="subtitle2" fontWeight="medium">
                        {expense.description}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {formatCurrency(expense.amountInBaseCurrency)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                        {expense.category}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(expense.expenseDate).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={expense.status.replace('_', ' ')}
                        color={getStatusColor(expense.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Box display="flex" gap={1}>
                        {expense.status === 'pending_approval' && (
                          <>
                            <Button
                              size="small"
                              variant="contained"
                              color="success"
                              startIcon={<CheckCircle />}
                              onClick={() => handleApprovalClick('approve')}
                            >
                              Approve
                            </Button>
                            <Button
                              size="small"
                              variant="contained"
                              color="error"
                              startIcon={<Cancel />}
                              onClick={() => handleApprovalClick('reject')}
                            >
                              Reject
                            </Button>
                          </>
                        )}
                        <IconButton
                          onClick={(e) => handleMenuOpen(e, expense)}
                          size="small"
                        >
                          <MoreVert />
                        </IconButton>
                      </Box>
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
          to={`/expenses/${selectedExpense?._id}`}
          onClick={handleMenuClose}
        >
          <Visibility sx={{ mr: 1 }} />
          View Details
        </MenuItem>
      </Menu>

      {/* Approval Dialog */}
      <Dialog open={approvalDialog} onClose={() => setApprovalDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {approvalAction === 'approve' ? 'Approve Expense' : 'Reject Expense'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Expense: {selectedExpense?.description}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Amount: {formatCurrency(selectedExpense?.amountInBaseCurrency)}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Employee: {selectedExpense?.employee?.name}
            </Typography>
            
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Comments"
              value={approvalComment}
              onChange={(e) => setApprovalComment(e.target.value)}
              placeholder={`Add your ${approvalAction === 'approve' ? 'approval' : 'rejection'} comments...`}
              sx={{ mt: 2 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApprovalDialog(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleApprovalSubmit}
            variant="contained"
            color={approvalAction === 'approve' ? 'success' : 'error'}
            disabled={processing}
          >
            {processing ? <CircularProgress size={20} /> : `${approvalAction === 'approve' ? 'Approve' : 'Reject'} Expense`}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Approvals;
