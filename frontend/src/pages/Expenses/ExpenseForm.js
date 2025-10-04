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
} from '@mui/material';
import {
  Save,
  Cancel,
  AttachMoney,
  Description,
  Category,
  CalendarToday,
  CloudUpload,
  Receipt,
} from '@mui/icons-material';
import toast from 'react-hot-toast';

const ExpenseForm = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState({
    amount: '',
    currency: user?.company?.currency || 'USD',
    category: '',
    description: '',
    expenseDate: new Date().toISOString().split('T')[0],
    receipt: null,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currencies, setCurrencies] = useState([]);
  const [convertedAmount, setConvertedAmount] = useState(0);

  const categories = [
    'travel',
    'meals',
    'office',
    'transportation',
    'accommodation',
    'entertainment',
    'training',
    'software',
    'hardware',
    'other'
  ];

  useEffect(() => {
    if (isEdit) {
      fetchExpense();
    }
    fetchCurrencies();
  }, [id]);

  useEffect(() => {
    if (formData.amount && formData.currency && user?.company?.currency) {
      convertCurrency();
    }
  }, [formData.amount, formData.currency]);

  const fetchExpense = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/expenses/${id}`);
      const expense = response.data.data.expense;
      
      setFormData({
        amount: expense.amount.toString(),
        currency: expense.currency,
        category: expense.category,
        description: expense.description,
        expenseDate: new Date(expense.expenseDate).toISOString().split('T')[0],
        receipt: null,
      });
    } catch (error) {
      console.error('Error fetching expense:', error);
      toast.error('Failed to fetch expense details');
      navigate('/expenses');
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrencies = async () => {
    try {
      const response = await api.get('/countries');
      const countries = response.data.data.countries;
      const uniqueCurrencies = [...new Set(countries.map(c => c.currency))];
      setCurrencies(uniqueCurrencies);
    } catch (error) {
      console.error('Error fetching currencies:', error);
    }
  };

  const convertCurrency = async () => {
    if (formData.currency === user?.company?.currency) {
      setConvertedAmount(parseFloat(formData.amount) || 0);
      return;
    }

    try {
      const response = await api.get(`/expenses/convert-currency`, {
        params: {
          amount: formData.amount,
          from: formData.currency,
          to: user?.company?.currency
        }
      });
      setConvertedAmount(response.data.data.convertedAmount);
    } catch (error) {
      console.error('Error converting currency:', error);
      setConvertedAmount(parseFloat(formData.amount) || 0);
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

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('File size must be less than 5MB');
        return;
      }
      setFormData(prev => ({
        ...prev,
        receipt: file
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.amount || !formData.category || !formData.description) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      const submitData = new FormData();
      
      submitData.append('amount', formData.amount);
      submitData.append('currency', formData.currency);
      submitData.append('category', formData.category);
      submitData.append('description', formData.description);
      submitData.append('expenseDate', formData.expenseDate);
      
      if (formData.receipt) {
        submitData.append('receipt', formData.receipt);
      }

      if (isEdit) {
        await api.put(`/expenses/${id}`, submitData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('Expense updated successfully');
      } else {
        await api.post('/expenses', submitData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('Expense submitted successfully');
      }

      navigate('/expenses');
    } catch (error) {
      console.error('Error submitting expense:', error);
      const message = error.response?.data?.message || 'Failed to submit expense';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount, currency) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD'
    }).format(amount);
  };

  if (loading && isEdit) {
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
          {isEdit ? 'Edit Expense' : 'Submit New Expense'}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {isEdit ? 'Update your expense details' : 'Fill in the details below to submit a new expense'}
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
                {/* Amount */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Amount"
                    name="amount"
                    type="number"
                    value={formData.amount}
                    onChange={handleChange}
                    required
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <AttachMoney />
                        </InputAdornment>
                      ),
                    }}
                    inputProps={{ min: 0, step: 0.01 }}
                  />
                </Grid>

                {/* Currency */}
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Currency</InputLabel>
                    <Select
                      value={formData.currency}
                      label="Currency"
                      onChange={handleChange}
                      name="currency"
                    >
                      {currencies.map((currency) => (
                        <MenuItem key={currency} value={currency}>
                          {currency}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                {/* Category */}
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Category</InputLabel>
                    <Select
                      value={formData.category}
                      label="Category"
                      onChange={handleChange}
                      name="category"
                    >
                      {categories.map((category) => (
                        <MenuItem key={category} value={category}>
                          {category.charAt(0).toUpperCase() + category.slice(1)}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                {/* Date */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Expense Date"
                    name="expenseDate"
                    type="date"
                    value={formData.expenseDate}
                    onChange={handleChange}
                    required
                    InputLabelProps={{ shrink: true }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <CalendarToday />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                {/* Description */}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Description"
                    name="description"
                    multiline
                    rows={4}
                    value={formData.description}
                    onChange={handleChange}
                    required
                    placeholder="Provide details about this expense..."
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 1 }}>
                          <Description />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                {/* Receipt Upload */}
                <Grid item xs={12}>
                  <Box>
                    <Typography variant="subtitle1" gutterBottom>
                      Receipt (Optional)
                    </Typography>
                    <Button
                      variant="outlined"
                      component="label"
                      startIcon={<CloudUpload />}
                      sx={{ mb: 2 }}
                    >
                      Upload Receipt
                      <input
                        type="file"
                        hidden
                        accept="image/*,.pdf"
                        onChange={handleFileChange}
                      />
                    </Button>
                    {formData.receipt && (
                      <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                        Selected: {formData.receipt.name}
                      </Typography>
                    )}
                  </Box>
                </Grid>

                {/* Action Buttons */}
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Box display="flex" gap={2} justifyContent="flex-end">
                    <Button
                      variant="outlined"
                      onClick={() => navigate('/expenses')}
                      disabled={loading}
                    >
                      <Cancel sx={{ mr: 1 }} />
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={loading}
                    >
                      {loading ? (
                        <CircularProgress size={20} />
                      ) : (
                        <>
                          <Save sx={{ mr: 1 }} />
                          {isEdit ? 'Update Expense' : 'Submit Expense'}
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
                Expense Summary
              </Typography>
              
              <Box sx={{ mt: 2 }}>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2" color="text.secondary">
                    Amount:
                  </Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {formData.amount ? formatCurrency(formData.amount, formData.currency) : '$0.00'}
                  </Typography>
                </Box>

                {formData.currency !== user?.company?.currency && convertedAmount > 0 && (
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2" color="text.secondary">
                      Converted to {user?.company?.currency}:
                    </Typography>
                    <Typography variant="body2" fontWeight="bold" color="primary.main">
                      {formatCurrency(convertedAmount, user?.company?.currency)}
                    </Typography>
                  </Box>
                )}

                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2" color="text.secondary">
                    Category:
                  </Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {formData.category ? formData.category.charAt(0).toUpperCase() + formData.category.slice(1) : 'N/A'}
                  </Typography>
                </Box>

                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2" color="text.secondary">
                    Date:
                  </Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {formData.expenseDate ? new Date(formData.expenseDate).toLocaleDateString() : 'N/A'}
                  </Typography>
                </Box>

                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2" color="text.secondary">
                    Receipt:
                  </Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {formData.receipt ? 'Attached' : 'None'}
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Typography variant="body2" color="text.secondary">
                <strong>Note:</strong> Your expense will be submitted for approval according to your company's approval rules.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ExpenseForm;
