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
} from '@mui/material';
import {
  Add,
  MoreVert,
  Visibility,
  Edit,
  Delete,
  Search,
  FilterList,
  AttachMoney,
  Schedule,
  CheckCircle,
  Cancel,
} from '@mui/icons-material';

const Expenses = () => {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    category: '',
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
      if (filters.category) params.append('category', filters.category);
      
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
    const total = expenses.length;
    const pending = expenses.filter(e => e.status === 'pending_approval').length;
    const approved = expenses.filter(e => e.status === 'approved').length;
    const rejected = expenses.filter(e => e.status === 'rejected').length;
    const totalAmount = expenses.reduce((sum, e) => sum + (e.amountInBaseCurrency || 0), 0);

    return { total, pending, approved, rejected, totalAmount };
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
              Expenses
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage your expense submissions and track their status
            </Typography>
          </Box>
          <Button
            component={RouterLink}
            to="/expenses/new"
            variant="contained"
            startIcon={<Add />}
            size="large"
          >
            Submit New Expense
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
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent sx={{ p: 2 }}>
              <Box display="flex" alignItems="center">
                <AttachMoney sx={{ color: 'primary.main', mr: 2, fontSize: 32 }} />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Total Expenses
                  </Typography>
                  <Typography variant="h5" fontWeight="bold">
                    {stats.total}
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
                <Schedule sx={{ color: 'warning.main', mr: 2, fontSize: 32 }} />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Pending
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
          <Grid item xs={12} md={4}>
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
                <MenuItem value="submitted">Submitted</MenuItem>
                <MenuItem value="pending_approval">Pending Approval</MenuItem>
                <MenuItem value="approved">Approved</MenuItem>
                <MenuItem value="rejected">Rejected</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={filters.category}
                label="Category"
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              >
                <MenuItem value="">All Categories</MenuItem>
                <MenuItem value="travel">Travel</MenuItem>
                <MenuItem value="meals">Meals</MenuItem>
                <MenuItem value="office">Office Supplies</MenuItem>
                <MenuItem value="transportation">Transportation</MenuItem>
                <MenuItem value="other">Other</MenuItem>
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
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <Typography variant="body1" color="text.secondary">
                      No expenses found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                expenses.map((expense) => (
                  <TableRow key={expense._id} hover>
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
                      <IconButton
                        onClick={(e) => handleMenuOpen(e, expense)}
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
          to={`/expenses/${selectedExpense?._id}`}
          onClick={handleMenuClose}
        >
          <Visibility sx={{ mr: 1 }} />
          View Details
        </MenuItem>
        {selectedExpense?.status === 'submitted' && (
          <MenuItem
            component={RouterLink}
            to={`/expenses/${selectedExpense?._id}/edit`}
            onClick={handleMenuClose}
          >
            <Edit sx={{ mr: 1 }} />
            Edit
          </MenuItem>
        )}
      </Menu>
    </Box>
  );
};

export default Expenses;
