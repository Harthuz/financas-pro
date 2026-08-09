import React, { useState, useEffect, useMemo } from 'react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip as RechartsTooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis
} from 'recharts';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  TableHead,
  Paper,
  Chip,
  InputAdornment,
  IconButton,
  Snackbar,
  Alert,
  CircularProgress,
  TableSortLabel,
  Fab,
  Zoom,
  Autocomplete,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  ToggleButton,
  ToggleButtonGroup,
  useMediaQuery,
  useTheme
} from '@mui/material';
import AddCircleIcon from '@mui/icons-material/AddCircleOutlined';
import DownloadIcon from '@mui/icons-material/CloudDownload';
import MoneyIcon from '@mui/icons-material/AttachMoney';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import SyncIcon from '@mui/icons-material/Sync';
import ResetIcon from '@mui/icons-material/RestartAlt';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import CategoryIcon from '@mui/icons-material/Category';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import SaveIcon from '@mui/icons-material/Save';
import BarChartIcon from '@mui/icons-material/BarChart';
import PieChartIcon from '@mui/icons-material/PieChart';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import FilterAltIcon from '@mui/icons-material/FilterAlt';

const COLORS = [
  '#2E5A44', '#3E7D5C', '#556B2F', '#8FBC8F', '#4E785F',
  '#7F9E4B', '#6B8E23', '#2E7D32', '#A9DFBF', '#1C3A2B',
  '#A0B8A5', '#B2C4B7', '#D4AC0D', '#CA6F1E', '#884EA0',
  '#2471A3', '#17A589', '#D98880', '#F1948A', '#BB8FCE'
];

const gerarCorPorString = (str) => {
  let hash = 0;
  for (let i = 0; i < (str || '').length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash % 360);
  return {
    bg: `hsl(${hue}, 60%, 94%)`,
    border: `hsl(${hue}, 50%, 75%)`,
    text: `hsl(${hue}, 65%, 20%)`,
    main: `hsl(${hue}, 55%, 38%)`
  };
};

// Componente Customizado de Label de Filtro (Sem cortes de texto)
const FilterBadge = ({ label, isSelected, cores, onClick, onDelete }) => {
  return (
    <Box
      onClick={onClick}
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.75,
        px: 1.5,
        py: 0.6,
        borderRadius: '16px',
        cursor: 'pointer',
        userSelect: 'none',
        fontSize: '0.8125rem',
        fontWeight: isSelected ? 700 : 500,
        whiteSpace: 'nowrap',
        transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
        bgcolor: isSelected ? cores.bg : '#f1f5f9',
        color: isSelected ? cores.text : '#475569',
        border: isSelected ? `2px solid ${cores.main}` : '1px solid #cbd5e1',
        boxShadow: isSelected ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
        '&:hover': {
          bgcolor: isSelected ? cores.bg : '#e2e8f0',
          borderColor: isSelected ? cores.main : '#94a3b8',
          transform: 'translateY(-1px)'
        }
      }}
    >
      <Box 
        sx={{ 
          width: 8, 
          height: 8, 
          borderRadius: '50%', 
          bgcolor: isSelected ? cores.main : '#94a3b8', 
          flexShrink: 0 
        }} 
      />
      <span style={{ lineHeight: 1.2 }}>{label}</span>
      {isSelected && onDelete && (
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          sx={{
            p: 0.2,
            ml: 0.2,
            color: cores.text,
            '&:hover': { bgcolor: 'rgba(0,0,0,0.1)' }
          }}
        >
          <CloseIcon style={{ fontSize: 13 }} />
        </IconButton>
      )}
    </Box>
  );
};

const CustomChartTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const item = payload[0];
    const catName = item.name || item.payload?.name || 'Sem Categoria';
    const val = item.value || 0;
    const color = item.color || item.payload?.fill || '#2E5A44';

    return (
      <Paper 
        elevation={8}
        sx={{ 
          bgcolor: '#ffffff', 
          p: 1.5, 
          border: `2px solid ${color}`, 
          borderRadius: 2, 
          minWidth: 180,
          zIndex: 9999
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
          <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: color, flexShrink: 0 }} />
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary' }}>
            {catName}
          </Typography>
        </Box>
        <Typography variant="body2" sx={{ color: 'primary.main', fontWeight: 700 }}>
          Valor Total: R$ {Number(val).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </Typography>
      </Paper>
    );
  }
  return null;
};

function CadastroGastoForm({ metadados, onSuccess, onCancel, gastoParaEditar }) {
  const [form, setForm] = useState({
    nome: '',
    valor: '',
    tipo: '',
    conta: '',
    data: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const [opcoesTipos, setOpcoesTipos] = useState(metadados.tipos || []);
  const [opcoesContas, setOpcoesContas] = useState(metadados.contas || []);

  useEffect(() => {
    if (metadados.tipos && metadados.tipos.length > 0) {
      setOpcoesTipos(metadados.tipos);
    }
    if (metadados.contas && metadados.contas.length > 0) {
      setOpcoesContas(metadados.contas);
    }
  }, [metadados]);

  useEffect(() => {
    if (gastoParaEditar) {
      setForm({
        nome: gastoParaEditar.nome || '',
        valor: gastoParaEditar.valor ? gastoParaEditar.valor.toString() : '',
        tipo: gastoParaEditar.tipo || '',
        conta: gastoParaEditar.conta || '',
        data: gastoParaEditar.data || ''
      });
    } else {
      setForm({
        nome: '',
        valor: '',
        tipo: '',
        conta: '',
        data: ''
      });
    }
  }, [gastoParaEditar]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleTipoChange = (event, newValue) => {
    const val = typeof newValue === 'string' ? newValue.trim() : newValue;
    if (!val) {
      setForm(prev => ({ ...prev, tipo: '' }));
      return;
    }

    if (val !== form.tipo) {
      const existe = opcoesTipos.some(t => t.toLowerCase() === val.toLowerCase());
      if (!existe) {
        const confirmar = window.confirm(`A Categoria "${val}" não existe. Deseja cadastrá-la no banco de dados?`);
        if (confirmar) {
          setOpcoesTipos(prev => [...prev, val].sort());
          setForm(prev => ({ ...prev, tipo: val }));
        } else {
          setForm(prev => ({ ...prev, tipo: '' }));
        }
      } else {
        const tipoExistente = opcoesTipos.find(t => t.toLowerCase() === val.toLowerCase()) || val;
        setForm(prev => ({ ...prev, tipo: tipoExistente }));
      }
    }
  };

  const handleContaChange = (event, newValue) => {
    const val = typeof newValue === 'string' ? newValue.trim() : newValue;
    if (!val) {
      setForm(prev => ({ ...prev, conta: '' }));
      return;
    }

    if (val !== form.conta) {
      const existe = opcoesContas.some(c => c.toLowerCase() === val.toLowerCase());
      if (!existe) {
        const confirmar = window.confirm(`A Conta Financeira "${val}" não existe. Deseja cadastrá-la no banco de dados?`);
        if (confirmar) {
          setOpcoesContas(prev => [...prev, val].sort());
          setForm(prev => ({ ...prev, conta: val }));
        } else {
          setForm(prev => ({ ...prev, conta: '' }));
        }
      } else {
        const contaExistente = opcoesContas.find(c => c.toLowerCase() === val.toLowerCase()) || val;
        setForm(prev => ({ ...prev, conta: contaExistente }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nome || !form.valor || !form.tipo || !form.conta || !form.data) {
      onCancel('Por favor, preencha todos os campos.');
      return;
    }

    setSubmitting(true);
    try {
      const url = gastoParaEditar
        ? `http://${window.location.hostname}:8000/api/gastos/${gastoParaEditar.id}`
        : `http://${window.location.hostname}:8000/api/gastos`;
      
      const method = gastoParaEditar ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: form.nome,
          valor: parseFloat(form.valor),
          tipo: form.tipo,
          conta: form.conta,
          data: form.data
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Erro ao salvar gasto');
      }

      setForm({
        nome: '',
        valor: '',
        tipo: '',
        conta: '',
        data: ''
      });
      onSuccess(gastoParaEditar ? 'Gasto atualizado com sucesso!' : 'Gasto cadastrado com sucesso!', !!gastoParaEditar);
    } catch (error) {
      console.error(error);
      onCancel(error.message || 'Erro ao enviar dados.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <TextField
        label="Descrição / Item"
        name="nome"
        variant="outlined"
        size="small"
        placeholder="Ex: Mercado, Uber, etc."
        value={form.nome}
        onChange={handleInputChange}
        required
        fullWidth
      />

      <TextField
        label="Valor (R$)"
        name="valor"
        type="number"
        variant="outlined"
        size="small"
        placeholder="0,00"
        value={form.valor}
        onChange={handleInputChange}
        required
        fullWidth
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <MoneyIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
            </InputAdornment>
          ),
          inputProps: { step: "0.01", min: "0" }
        }}
      />

      <Autocomplete
        freeSolo
        options={opcoesTipos}
        value={form.tipo}
        onChange={handleTipoChange}
        onInputChange={(event, newInputValue) => {
          if (event && event.type === 'change') {
            setForm(prev => ({ ...prev, tipo: newInputValue }));
          }
        }}
        renderInput={(params) => (
          <TextField 
            {...params} 
            label="Categoria" 
            size="small" 
            required 
            placeholder="Selecione ou digite"
          />
        )}
      />

      <Autocomplete
        freeSolo
        options={opcoesContas}
        value={form.conta}
        onChange={handleContaChange}
        onInputChange={(event, newInputValue) => {
          if (event && event.type === 'change') {
            setForm(prev => ({ ...prev, conta: newInputValue }));
          }
        }}
        renderInput={(params) => (
          <TextField 
            {...params} 
            label="Método de Pagamento" 
            size="small" 
            required 
            placeholder="Selecione ou digite"
          />
        )}
      />

      <TextField
        label="Data"
        name="data"
        type="date"
        variant="outlined"
        size="small"
        value={form.data}
        onChange={handleInputChange}
        required
        fullWidth
        InputLabelProps={{ shrink: true }}
      />

      <Button
        type="submit"
        variant="contained"
        color="primary"
        size="large"
        disabled={submitting}
        startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : <AddCircleIcon />}
        sx={{ mt: 1, py: 1.2, fontWeight: 600 }}
      >
        {submitting ? 'Salvando...' : (gastoParaEditar ? 'Salvar Alterações' : 'Cadastrar Gasto')}
      </Button>
    </Box>
  );
}

function GerenciarCategoriasDialog({ open, onClose, onUpdated, showToast }) {
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [novoNome, setNovoNome] = useState('');
  const [editandoId, setEditandoId] = useState(null);
  const [editandoNome, setEditandoNome] = useState('');
  const [erroMsg, setErroMsg] = useState('');

  const fetchCategorias = async () => {
    setLoading(true);
    try {
      const res = await fetch(`http://${window.location.hostname}:8000/api/categorias`);
      if (res.ok) {
        const data = await res.json();
        setCategorias(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchCategorias();
      setErroMsg('');
    }
  }, [open]);

  const handleCriar = async (e) => {
    e.preventDefault();
    if (!novoNome.trim()) return;
    try {
      const res = await fetch(`http://${window.location.hostname}:8000/api/categorias`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: novoNome.trim() })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Erro ao criar categoria.');
      }
      setNovoNome('');
      showToast('Categoria adicionada!');
      fetchCategorias();
      onUpdated();
    } catch (err) {
      setErroMsg(err.message);
    }
  };

  const handleSalvarEdicao = async (id) => {
    if (!editandoNome.trim()) return;
    try {
      const res = await fetch(`http://${window.location.hostname}:8000/api/categorias/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: editandoNome.trim() })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Erro ao atualizar categoria.');
      }
      setEditandoId(null);
      showToast('Categoria atualizada!');
      fetchCategorias();
      onUpdated();
    } catch (err) {
      setErroMsg(err.message);
    }
  };

  const handleExcluir = async (cat) => {
    if (!window.confirm(`Deseja realmente excluir a categoria "${cat.nome}"?`)) return;
    setErroMsg('');
    try {
      const res = await fetch(`http://${window.location.hostname}:8000/api/categorias/${cat.id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Erro ao excluir categoria.');
      }
      showToast(`Categoria "${cat.nome}" excluída com sucesso!`);
      fetchCategorias();
      onUpdated();
    } catch (err) {
      setErroMsg(err.message);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth fullScreen={useMediaQuery('(max-width:600px)')}>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CategoryIcon color="primary" />
          <Typography variant="h6">Gerenciar Categorias</Typography>
        </Box>
        <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {erroMsg && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErroMsg('')}>
            {erroMsg}
          </Alert>
        )}

        <Box component="form" onSubmit={handleCriar} sx={{ display: 'flex', gap: 1, mb: 2.5 }}>
          <TextField
            label="Nova Categoria"
            size="small"
            fullWidth
            value={novoNome}
            onChange={(e) => setNovoNome(e.target.value)}
            placeholder="Ex: Vestuário, Viagem, etc."
          />
          <Button type="submit" variant="contained" startIcon={<AddIcon />}>
            Criar
          </Button>
        </Box>

        <Divider sx={{ mb: 2 }} />

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}><CircularProgress size={30} /></Box>
        ) : (
          <List dense sx={{ maxHeight: { xs: '60vh', sm: 350 }, overflowY: 'auto' }}>
            {categorias.map((cat) => (
              <ListItem key={cat.id} divider>
                {editandoId === cat.id ? (
                  <Box sx={{ display: 'flex', gap: 1, width: '100%', alignItems: 'center' }}>
                    <TextField
                      size="small"
                      value={editandoNome}
                      onChange={(e) => setEditandoNome(e.target.value)}
                      fullWidth
                    />
                    <IconButton color="primary" onClick={() => handleSalvarEdicao(cat.id)}>
                      <SaveIcon />
                    </IconButton>
                    <IconButton onClick={() => setEditandoId(null)}>
                      <CloseIcon />
                    </IconButton>
                  </Box>
                ) : (
                  <>
                    <ListItemText 
                      primary={cat.nome} 
                      secondary={`${cat.gastos_count} compra(s) vinculada(s)`} 
                    />
                    <ListItemSecondaryAction>
                      <IconButton edge="end" onClick={() => { setEditandoId(cat.id); setEditandoNome(cat.nome); }}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton edge="end" color="error" onClick={() => handleExcluir(cat)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </>
                )}
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Fechar</Button>
      </DialogActions>
    </Dialog>
  );
}

function GerenciarContasDialog({ open, onClose, onUpdated, showToast }) {
  const [contas, setContas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [novoNome, setNovoNome] = useState('');
  const [editandoId, setEditandoId] = useState(null);
  const [editandoNome, setEditandoNome] = useState('');
  const [erroMsg, setErroMsg] = useState('');

  const fetchContas = async () => {
    setLoading(true);
    try {
      const res = await fetch(`http://${window.location.hostname}:8000/api/contas`);
      if (res.ok) {
        const data = await res.json();
        setContas(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchContas();
      setErroMsg('');
    }
  }, [open]);

  const handleCriar = async (e) => {
    e.preventDefault();
    if (!novoNome.trim()) return;
    try {
      const res = await fetch(`http://${window.location.hostname}:8000/api/contas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: novoNome.trim() })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Erro ao criar método de pagamento.');
      }
      setNovoNome('');
      showToast('Método de pagamento adicionado!');
      fetchContas();
      onUpdated();
    } catch (err) {
      setErroMsg(err.message);
    }
  };

  const handleSalvarEdicao = async (id) => {
    if (!editandoNome.trim()) return;
    try {
      const res = await fetch(`http://${window.location.hostname}:8000/api/contas/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: editandoNome.trim() })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Erro ao atualizar método de pagamento.');
      }
      setEditandoId(null);
      showToast('Método de pagamento atualizado!');
      fetchContas();
      onUpdated();
    } catch (err) {
      setErroMsg(err.message);
    }
  };

  const handleExcluir = async (conta) => {
    if (!window.confirm(`Deseja realmente excluir o método "${conta.nome}"?`)) return;
    setErroMsg('');
    try {
      const res = await fetch(`http://${window.location.hostname}:8000/api/contas/${conta.id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Erro ao excluir método de pagamento.');
      }
      showToast(`Método "${conta.nome}" excluído com sucesso!`);
      fetchContas();
      onUpdated();
    } catch (err) {
      setErroMsg(err.message);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth fullScreen={useMediaQuery('(max-width:600px)')}>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CreditCardIcon color="primary" />
          <Typography variant="h6">Gerenciar Métodos de Pagamento</Typography>
        </Box>
        <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {erroMsg && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErroMsg('')}>
            {erroMsg}
          </Alert>
        )}

        <Box component="form" onSubmit={handleCriar} sx={{ display: 'flex', gap: 1, mb: 2.5 }}>
          <TextField
            label="Novo Método / Conta"
            size="small"
            fullWidth
            value={novoNome}
            onChange={(e) => setNovoNome(e.target.value)}
            placeholder="Ex: Cartão Itaú, VR, etc."
          />
          <Button type="submit" variant="contained" startIcon={<AddIcon />}>
            Criar
          </Button>
        </Box>

        <Divider sx={{ mb: 2 }} />

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}><CircularProgress size={30} /></Box>
        ) : (
          <List dense sx={{ maxHeight: { xs: '60vh', sm: 350 }, overflowY: 'auto' }}>
            {contas.map((cta) => (
              <ListItem key={cta.id} divider>
                {editandoId === cta.id ? (
                  <Box sx={{ display: 'flex', gap: 1, width: '100%', alignItems: 'center' }}>
                    <TextField
                      size="small"
                      value={editandoNome}
                      onChange={(e) => setEditandoNome(e.target.value)}
                      fullWidth
                    />
                    <IconButton color="primary" onClick={() => handleSalvarEdicao(cta.id)}>
                      <SaveIcon />
                    </IconButton>
                    <IconButton onClick={() => setEditandoId(null)}>
                      <CloseIcon />
                    </IconButton>
                  </Box>
                ) : (
                  <>
                    <ListItemText 
                      primary={cta.nome} 
                      secondary={`${cta.gastos_count} compra(s) vinculada(s)`} 
                    />
                    <ListItemSecondaryAction>
                      <IconButton edge="end" onClick={() => { setEditandoId(cta.id); setEditandoNome(cta.nome); }}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton edge="end" color="error" onClick={() => handleExcluir(cta)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </>
                )}
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Fechar</Button>
      </DialogActions>
    </Dialog>
  );
}

export default function App() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [gastos, setGastos] = useState([]);
  const [metadados, setMetadados] = useState({ tipos: [], contas: [] });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [modalCategoriasAberto, setModalCategoriasAberto] = useState(false);
  const [modalContasAberto, setModalContasAberto] = useState(false);

  // Filtros de Data
  const [filtroDataDe, setFiltroDataDe] = useState('');
  const [filtroDataAte, setFiltroDataAte] = useState('');

  // Filtros Interativos por Labels Coloridinhas
  const [selectedTipos, setSelectedTipos] = useState([]);
  const [selectedContas, setSelectedContas] = useState([]);

  // Modo de Exibição do Gráfico: 'barras' ou 'pizza'
  const [tipoGrafico, setTipoGrafico] = useState('barras');

  // Ordenação e Paginação
  const [campoOrdenacao, setCampoOrdenacao] = useState('data');
  const [ordemDirecao, setOrdemDirecao] = useState('desc');
  const [limiteExibicao, setLimiteExibicao] = useState(25);

  // Form Flutuante & Edição
  const [formAberto, setFormAberto] = useState(false);
  const [gastoParaEditar, setGastoParaEditar] = useState(null);

  // Modal de Detalhes
  const [selectedGasto, setSelectedGasto] = useState(null);
  const [modalDetalhesAberto, setModalDetalhesAberto] = useState(false);

  // Toast
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const showToast = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const fetchDados = async (isInitial = false) => {
    if (isInitial) setLoading(true);
    else setRefreshing(true);

    try {
      const resGastos = await fetch(`http://${window.location.hostname}:8000/api/gastos`);
      const resMeta = await fetch(`http://${window.location.hostname}:8000/api/metadados`);

      if (!resGastos.ok) throw new Error('Falha ao buscar gastos do servidor');

      const dataGastos = await resGastos.json();
      const dataMeta = resMeta.ok ? await resMeta.json() : { tipos: [], contas: [] };

      setGastos(dataGastos);
      setMetadados(dataMeta);

      // Inicializa os filtros com TODAS as categorias e contas selecionadas
      if (isInitial || selectedTipos.length === 0) {
        setSelectedTipos(dataMeta.tipos || []);
      }
      if (isInitial || selectedContas.length === 0) {
        setSelectedContas(dataMeta.contas || []);
      }
    } catch (error) {
      console.error(error);
      showToast('Erro ao carregar dados do servidor.', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDados(true);
  }, []);

  const handleRefresh = () => {
    fetchDados(false);
    showToast('Dados sincronizados!');
  };

  const handleExportCSV = () => {
    window.location.href = `http://${window.location.hostname}:8000/api/exportar`;
  };

  const handleResetFiltros = () => {
    setFiltroDataDe('');
    setFiltroDataAte('');
    setSelectedTipos(metadados.tipos || []);
    setSelectedContas(metadados.contas || []);
  };

  const handleSort = (campo) => {
    if (campoOrdenacao === campo) {
      setOrdemDirecao(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setCampoOrdenacao(campo);
      setOrdemDirecao('desc');
    }
  };

  const handleAbrirDetalhes = (gasto) => {
    setSelectedGasto(gasto);
    setModalDetalhesAberto(true);
  };

  const handleEditarDoModal = () => {
    if (!selectedGasto) return;
    setGastoParaEditar(selectedGasto);
    setModalDetalhesAberto(false);
    setFormAberto(true);
  };

  const handleExcluirClick = async () => {
    if (!selectedGasto) return;
    
    const confirmar = window.confirm(`Deseja realmente excluir o gasto "${selectedGasto.nome}"?`);
    if (!confirmar) return;

    try {
      const res = await fetch(`http://${window.location.hostname}:8000/api/gastos/${selectedGasto.id}`, {
        method: 'DELETE'
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Erro ao excluir gasto');
      }

      showToast('Gasto excluído com sucesso!');
      setModalDetalhesAberto(false);
      setSelectedGasto(null);
      fetchDados(false);
    } catch (error) {
      console.error(error);
      showToast(error.message || 'Erro ao excluir gasto.', 'error');
    }
  };

  const gastosFiltrados = useMemo(() => {
    return gastos.filter(g => {
      if (filtroDataDe && g.data < filtroDataDe) return false;
      if (filtroDataAte && g.data > filtroDataAte) return false;
      
      if (selectedTipos.length > 0) {
        if (!selectedTipos.includes(g.tipo || 'Sem Categoria')) return false;
      }
      
      if (selectedContas.length > 0) {
        if (!selectedContas.includes(g.conta)) return false;
      }

      return true;
    });
  }, [gastos, filtroDataDe, filtroDataAte, selectedTipos, selectedContas]);

  const valorTotal = useMemo(() => {
    return gastosFiltrados.reduce((sum, g) => sum + g.valor, 0);
  }, [gastosFiltrados]);

  const gastosOrdenados = useMemo(() => {
    return [...gastosFiltrados].sort((a, b) => {
      if (campoOrdenacao === 'data') {
        const dataA = a.data || '';
        const dataB = b.data || '';
        if (dataA < dataB) return ordemDirecao === 'asc' ? -1 : 1;
        if (dataA > dataB) return ordemDirecao === 'asc' ? 1 : -1;
        return 0;
      } else {
        const valorA = a.valor || 0;
        const valorB = b.valor || 0;
        return ordemDirecao === 'asc' ? valorA - valorB : valorB - valorA;
      }
    });
  }, [gastosFiltrados, campoOrdenacao, ordemDirecao]);

  const gastosExibidos = useMemo(() => {
    return gastosOrdenados.slice(0, limiteExibicao);
  }, [gastosOrdenados, limiteExibicao]);

  const dadosGrafico = useMemo(() => {
    const agrupado = gastosFiltrados.reduce((acc, g) => {
      const cat = g.tipo || 'Sem Categoria';
      acc[cat] = (acc[cat] || 0) + g.valor;
      return acc;
    }, {});
    return Object.entries(agrupado)
      .map(([name, value]) => ({
        name,
        value: Number(value.toFixed(2))
      }))
      .sort((a, b) => b.value - a.value);
  }, [gastosFiltrados]);

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2.5, sm: 4 }, px: { xs: 1.5, sm: 3 } }}>
      {/* Toast Snackbar */}
      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} variant="filled" sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Modais de Gerenciamento CRUD */}
      <GerenciarCategoriasDialog 
        open={modalCategoriasAberto}
        onClose={() => setModalCategoriasAberto(false)}
        onUpdated={() => fetchDados(false)}
        showToast={showToast}
      />

      <GerenciarContasDialog
        open={modalContasAberto}
        onClose={() => setModalContasAberto(false)}
        onUpdated={() => fetchDados(false)}
        showToast={showToast}
      />

      {/* Header Responsivo */}
      <Box sx={{ 
        display: 'flex', 
        justify: 'space-between', 
        alignItems: { xs: 'flex-start', sm: 'center' }, 
        flexDirection: { xs: 'column', sm: 'row' }, 
        gap: 2, 
        mb: 3, 
        pb: 2, 
        borderBottom: '1px solid rgba(0,0,0,0.06)' 
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <TrendingUpIcon sx={{ color: 'primary.main', fontSize: { xs: 30, sm: 36 } }} />
          <Typography variant={isMobile ? 'h5' : 'h4'} component="h1" color="primary.main" sx={{ fontWeight: 700 }}>
            Controle de Débitos (Notion)
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', width: { xs: '100%', sm: 'auto' } }}>
          <Button
            variant="outlined"
            color="primary"
            size={isMobile ? 'small' : 'medium'}
            startIcon={<CategoryIcon />}
            onClick={() => setModalCategoriasAberto(true)}
            sx={{ flexGrow: { xs: 1, sm: 0 } }}
          >
            Categorias
          </Button>
          <Button
            variant="outlined"
            color="primary"
            size={isMobile ? 'small' : 'medium'}
            startIcon={<CreditCardIcon />}
            onClick={() => setModalContasAberto(true)}
            sx={{ flexGrow: { xs: 1, sm: 0 } }}
          >
            Métodos
          </Button>
          <IconButton 
            onClick={handleRefresh} 
            disabled={refreshing || loading}
            color="primary"
            size={isMobile ? 'small' : 'medium'}
            sx={{ border: '1px solid rgba(46, 90, 68, 0.2)' }}
          >
            <SyncIcon className={refreshing ? 'spin-anim' : ''} />
          </IconButton>
          <Button 
            variant="contained" 
            color="primary"
            size={isMobile ? 'small' : 'medium'} 
            startIcon={<DownloadIcon />} 
            onClick={handleExportCSV}
          >
            Exportar CSV
          </Button>
        </Box>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '350px', gap: 2 }}>
          <CircularProgress color="primary" size={45} />
          <Typography variant="body1" color="text.secondary">
            Carregando débitos do servidor Node.js + PostgreSQL...
          </Typography>
        </Box>
      ) : (
        <>
          {/* Somatórios rápidos */}
          <Grid container spacing={{ xs: 1.5, sm: 3 }} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={4}>
              <Card sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', borderRadius: 2 }}>
                <CardContent sx={{ textAlign: 'center', py: { xs: 2, sm: 3 } }}>
                  <Typography variant="caption" sx={{ opacity: 0.85, mb: 0.5, display: 'block', textTransform: 'uppercase', letterSpacing: 1 }}>
                    Total Selecionado
                  </Typography>
                  <Typography variant={isMobile ? 'h5' : 'h4'} sx={{ fontWeight: 700 }}>
                    R$ {valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} sm={4}>
              <Card sx={{ border: '1px solid rgba(0,0,0,0.08)', borderRadius: 2 }}>
                <CardContent sx={{ textAlign: 'center', py: { xs: 2, sm: 3 } }}>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block', textTransform: 'uppercase', letterSpacing: 1 }}>
                    Lançamentos
                  </Typography>
                  <Typography variant={isMobile ? 'h5' : 'h4'} color="text.primary" sx={{ fontWeight: 700 }}>
                    {gastosFiltrados.length}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} sm={4}>
              <Card sx={{ border: '1px solid rgba(0,0,0,0.08)', borderRadius: 2 }}>
                <CardContent sx={{ textAlign: 'center', py: { xs: 2, sm: 3 } }}>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block', textTransform: 'uppercase', letterSpacing: 1 }}>
                    Categorias Ativas
                  </Typography>
                  <Typography variant={isMobile ? 'h5' : 'h4'} color="secondary.main" sx={{ fontWeight: 700 }}>
                    {dadosGrafico.length}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* PAINEL DE FILTROS OTIMIZADO: Layout Limpo + Sem sobreposição de rótulos de data e sem corte de texto */}
          <Card sx={{ mb: 3, p: { xs: 2, sm: 3 }, borderRadius: 2.5, border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,0.03)' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5, flexWrap: 'wrap', gap: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <FilterAltIcon color="primary" />
                <Typography variant="h6" color="primary.main" sx={{ fontWeight: 700, fontSize: { xs: '1.05rem', sm: '1.2rem' } }}>
                  Filtros de Pesquisa
                </Typography>
              </Box>
              <Button
                variant="outlined"
                color="secondary"
                size="small"
                startIcon={<ResetIcon />}
                onClick={handleResetFiltros}
                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
              >
                Limpar Todos os Filtros
              </Button>
            </Box>

            {/* SEÇÃO 1: FILTRO DE DATAS COM RÓTULOS EXTERNOS FIXOS ACIMA DO INPUT */}
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                <CalendarMonthIcon color="action" fontSize="small" />
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#334155' }}>
                  Período Personalizado
                </Typography>
              </Box>

              <Grid container spacing={2.5}>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: 'primary.main', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      Data de Início
                    </Typography>
                    <TextField
                      type="date"
                      size="small"
                      fullWidth
                      value={filtroDataDe}
                      onChange={(e) => setFiltroDataDe(e.target.value)}
                      sx={{
                        bgcolor: '#ffffff',
                        borderRadius: 1.5,
                        '& .MuiInputBase-input': {
                          py: 1,
                          px: 1.5,
                          fontSize: '0.9rem',
                          color: '#1e293b'
                        },
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#cbd5e1'
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#94a3b8'
                        }
                      }}
                    />
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: 'primary.main', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      Data de Fim
                    </Typography>
                    <TextField
                      type="date"
                      size="small"
                      fullWidth
                      value={filtroDataAte}
                      onChange={(e) => setFiltroDataAte(e.target.value)}
                      sx={{
                        bgcolor: '#ffffff',
                        borderRadius: 1.5,
                        '& .MuiInputBase-input': {
                          py: 1,
                          px: 1.5,
                          fontSize: '0.9rem',
                          color: '#1e293b'
                        },
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#cbd5e1'
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#94a3b8'
                        }
                      }}
                    />
                  </Box>
                </Grid>
              </Grid>
            </Box>

            <Divider sx={{ my: 2.5, borderColor: '#e2e8f0' }} />

            {/* SEÇÃO 2: FILTRO DE CATEGORIAS COM BADGES MULTI-SELEÇÃO */}
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CategoryIcon color="primary" fontSize="small" />
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#334155' }}>
                    Categorias de Compras ({selectedTipos.length} / {metadados.tipos.length} selecionadas)
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button 
                    size="small" 
                    variant="text" 
                    onClick={() => setSelectedTipos(metadados.tipos || [])}
                    sx={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'none' }}
                  >
                    Selecionar Todas
                  </Button>
                  <Button 
                    size="small" 
                    variant="text" 
                    color="error" 
                    onClick={() => setSelectedTipos([])}
                    sx={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'none' }}
                  >
                    Desmarcar Todas
                  </Button>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {metadados.tipos?.map((cat) => {
                  const isSelected = selectedTipos.includes(cat);
                  const cores = gerarCorPorString(cat);

                  return (
                    <FilterBadge
                      key={cat}
                      label={cat}
                      isSelected={isSelected}
                      cores={cores}
                      onClick={() => {
                        setSelectedTipos(prev => 
                          prev.includes(cat) 
                            ? prev.filter(t => t !== cat) 
                            : [...prev, cat]
                        );
                      }}
                      onDelete={isSelected ? () => {
                        setSelectedTipos(prev => prev.filter(t => t !== cat));
                      } : undefined}
                    />
                  );
                })}
              </Box>
            </Box>

            <Divider sx={{ my: 2.5, borderColor: '#e2e8f0' }} />

            {/* SEÇÃO 3: FILTRO DE MÉTODOS DE PAGAMENTO COM BADGES MULTI-SELEÇÃO */}
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CreditCardIcon color="primary" fontSize="small" />
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#334155' }}>
                    Métodos de Pagamento ({selectedContas.length} / {metadados.contas.length} selecionados)
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button 
                    size="small" 
                    variant="text" 
                    onClick={() => setSelectedContas(metadados.contas || [])}
                    sx={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'none' }}
                  >
                    Selecionar Todas
                  </Button>
                  <Button 
                    size="small" 
                    variant="text" 
                    color="error" 
                    onClick={() => setSelectedContas([])}
                    sx={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'none' }}
                  >
                    Desmarcar Todas
                  </Button>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {metadados.contas?.map((cta) => {
                  const isSelected = selectedContas.includes(cta);
                  const cores = gerarCorPorString(cta);

                  return (
                    <FilterBadge
                      key={cta}
                      label={cta}
                      isSelected={isSelected}
                      cores={cores}
                      onClick={() => {
                        setSelectedContas(prev => 
                          prev.includes(cta) 
                            ? prev.filter(c => c !== cta) 
                            : [...prev, cta]
                        );
                      }}
                      onDelete={isSelected ? () => {
                        setSelectedContas(prev => prev.filter(c => c !== cta));
                      } : undefined}
                    />
                  );
                })}
              </Box>
            </Box>
          </Card>

          {/* FIXO SUPERIOR: Painel de Visualização Gráfica por Categoria (Barras / Pizza com Legenda) */}
          <Card sx={{ mb: 3, p: { xs: 2, sm: 3 }, borderRadius: 2.5, border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,0.03)', width: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1.5 }}>
              <Box>
                <Typography variant="h6" color="primary.main" sx={{ fontWeight: 700, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                  Gastos por Categoria
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Exibindo {dadosGrafico.length} categoria(s) com gastos no período selecionado
                </Typography>
              </Box>

              {/* Botões de Alternância do Modelo de Gráfico */}
              <ToggleButtonGroup
                value={tipoGrafico}
                exclusive
                size="small"
                onChange={(e, val) => { if (val) setTipoGrafico(val); }}
                aria-label="tipo de gráfico"
              >
                <ToggleButton value="barras" aria-label="gráfico de barras">
                  <BarChartIcon sx={{ mr: 0.5, fontSize: 18 }} /> Barras
                </ToggleButton>
                <ToggleButton value="pizza" aria-label="gráfico de pizza">
                  <PieChartIcon sx={{ mr: 0.5, fontSize: 18 }} /> Pizza
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>

            {dadosGrafico.length === 0 ? (
              <Box sx={{ py: 5, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Nenhum gasto encontrado para os filtros selecionados.
                </Typography>
              </Box>
            ) : (
              <>
                {tipoGrafico === 'barras' ? (
                  // Opção 1: Gráfico de Barras Horizontais (Claro, legível com nomes de categorias no eixo Y)
                  <ResponsiveContainer width="100%" height={Math.max(300, dadosGrafico.length * 36)}>
                    <BarChart
                      data={dadosGrafico}
                      layout="vertical"
                      margin={{ top: 10, right: 30, left: isMobile ? 80 : 140, bottom: 10 }}
                    >
                      <XAxis type="number" tickFormatter={(v) => `R$${v}`} />
                      <YAxis 
                        type="category" 
                        dataKey="name" 
                        tick={{ fontSize: isMobile ? 11 : 13, fontWeight: 600, fill: '#2E5A44' }} 
                      />
                      <RechartsTooltip content={<CustomChartTooltip />} />
                      <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                        {dadosGrafico.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  // Opção 2: Gráfico de Pizza com Tooltip Informativo
                  <ResponsiveContainer width="100%" height={isMobile ? 320 : 380}>
                    <PieChart>
                      <Pie
                        data={dadosGrafico}
                        cx="50%"
                        cy="50%"
                        innerRadius={isMobile ? 50 : 75}
                        outerRadius={isMobile ? 90 : 125}
                        paddingAngle={3}
                        dataKey="value"
                        nameKey="name"
                        label={isMobile ? false : ({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      >
                        {dadosGrafico.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip content={<CustomChartTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                )}

                {/* Grade de Legendas Detalhada de Categorias com Cores, Nomes e Valores Totais */}
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center', mt: 3, pt: 2, borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                  {dadosGrafico.map((cat, idx) => {
                    const color = COLORS[idx % COLORS.length];
                    const percent = valorTotal > 0 ? ((cat.value / valorTotal) * 100).toFixed(1) : 0;
                    return (
                      <Chip
                        key={cat.name}
                        size="small"
                        avatar={<Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: color, ml: '6px !important' }} />}
                        label={`${cat.name}: R$ ${cat.value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${percent}%)`}
                        sx={{
                          bgcolor: 'rgba(0,0,0,0.02)',
                          border: `1px solid ${color}`,
                          fontWeight: 600,
                          fontSize: '0.75rem'
                        }}
                      />
                    );
                  })}
                </Box>
              </>
            )}
          </Card>

          {/* Histórico de Compras - Responsivo */}
          <Card sx={{ p: { xs: 1.5, sm: 3 }, borderRadius: 2.5, border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,0.03)' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, px: 1 }}>
              <Typography variant="h6" color="primary.main" sx={{ fontWeight: 700, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                Histórico de Compras ({gastosOrdenados.length})
              </Typography>
            </Box>
            <TableContainer component={Paper} elevation={0} sx={{ maxHeight: 600, overflowX: 'auto' }}>
              <Table stickyHeader size={isMobile ? 'small' : 'medium'}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ minWidth: 90 }}>
                      <TableSortLabel
                        active={campoOrdenacao === 'data'}
                        direction={campoOrdenacao === 'data' ? ordemDirecao : 'asc'}
                        onClick={() => handleSort('data')}
                      >
                        Data
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ minWidth: 140 }}>Descrição</TableCell>
                    <TableCell sx={{ minWidth: 110 }}>Categoria</TableCell>
                    <TableCell sx={{ minWidth: 110 }}>Método</TableCell>
                    <TableCell align="right" sx={{ minWidth: 100 }}>
                      <TableSortLabel
                        active={campoOrdenacao === 'valor'}
                        direction={campoOrdenacao === 'valor' ? ordemDirecao : 'asc'}
                        onClick={() => handleSort('valor')}
                      >
                        Valor (R$)
                      </TableSortLabel>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {gastosExibidos.map((gasto) => (
                    <TableRow 
                      key={gasto.id}
                      hover
                      onClick={() => handleAbrirDetalhes(gasto)}
                      sx={{ cursor: 'pointer' }}
                    >
                      <TableCell sx={{ whiteSpace: 'nowrap', fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                        {gasto.data ? new Date(gasto.data + 'T00:00:00').toLocaleDateString('pt-BR') : '-'}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 500, maxWidth: 200, wordBreak: 'break-word', fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                        {gasto.nome}
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={gasto.tipo || 'Sem Categoria'} 
                          size="small" 
                          sx={{ 
                            bgcolor: gerarCorPorString(gasto.tipo || '').bg,
                            color: gerarCorPorString(gasto.tipo || '').text,
                            border: `1px solid ${gerarCorPorString(gasto.tipo || '').border}`,
                            fontSize: '0.7rem'
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                        {gasto.conta}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, color: 'primary.main', fontSize: { xs: '0.75rem', sm: '0.875rem' }, whiteSpace: 'nowrap' }}>
                        R$ {gasto.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            {gastosOrdenados.length > limiteExibicao && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                <Button variant="outlined" size="small" onClick={() => setLimiteExibicao(prev => prev + 50)}>
                  Carregar Mais ({gastosOrdenados.length - limiteExibicao} restantes)
                </Button>
              </Box>
            )}
          </Card>
        </>
      )}

      {/* Botão Flutuante Adicionar Gasto */}
      {!formAberto && (
        <Fab
          color="primary"
          aria-label="add"
          onClick={() => { setGastoParaEditar(null); setFormAberto(true); }}
          sx={{ position: 'fixed', bottom: { xs: 16, sm: 24 }, right: { xs: 16, sm: 24 }, zIndex: 1000 }}
        >
          <AddIcon />
        </Fab>
      )}

      {/* Form Flutuante de Adicionar/Editar Gasto */}
      <Zoom in={formAberto}>
        <Card 
          sx={{ 
            position: 'fixed', 
            bottom: { xs: 12, sm: 24 }, 
            right: { xs: 12, sm: 24 }, 
            width: { xs: 'calc(100% - 24px)', sm: 380 },
            zIndex: 1001,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(46, 90, 68, 0.15)',
            display: formAberto ? 'block' : 'none'
          }}
        >
          <CardContent sx={{ p: { xs: 2, sm: 3 }, position: 'relative' }}>
            <IconButton 
              onClick={() => {
                setFormAberto(false);
                setGastoParaEditar(null);
              }}
              sx={{ position: 'absolute', top: 10, right: 10, color: 'text.secondary' }}
              aria-label="close"
            >
              <CloseIcon />
            </IconButton>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, pr: 4 }}>
              <AddCircleIcon sx={{ color: 'success.main' }} />
              <Typography variant="h6" component="h2" color="text.primary" sx={{ fontSize: '1rem' }}>
                {gastoParaEditar ? 'Editar Gasto' : 'Adicionar Novo Gasto'}
              </Typography>
            </Box>

            <CadastroGastoForm
              metadados={metadados}
              gastoParaEditar={gastoParaEditar}
              onSuccess={(msg, isEdit) => {
                showToast(msg);
                if (isEdit) {
                  setFormAberto(false);
                  setGastoParaEditar(null);
                }
                fetchDados(false);
              }}
              onCancel={(msg) => {
                showToast(msg, 'error');
              }}
            />
          </CardContent>
        </Card>
      </Zoom>

      {/* Modal de Detalhes do Gasto */}
      <Dialog 
        open={modalDetalhesAberto} 
        onClose={() => setModalDetalhesAberto(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
          <Typography variant="h6" component="div" sx={{ fontWeight: 700, color: 'primary.main' }}>
            Detalhes do Lançamento
          </Typography>
          <IconButton onClick={() => setModalDetalhesAberto(false)} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ py: 2 }}>
          {selectedGasto && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 600 }}>
                  Descrição / Item
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500, color: 'text.primary', mt: 0.5, wordBreak: 'break-word' }}>
                  {selectedGasto.nome}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 600 }}>
                    Valor
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary', mt: 0.5 }}>
                    R$ {selectedGasto.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 600, display: 'block' }}>
                    Data
                  </Typography>
                  <Typography variant="body1" sx={{ mt: 0.5, color: 'text.primary', fontWeight: 500 }}>
                    {selectedGasto.data ? new Date(selectedGasto.data + 'T00:00:00').toLocaleDateString('pt-BR') : 'Sem data'}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 600, display: 'block', mb: 0.5 }}>
                    Categoria
                  </Typography>
                  <Chip 
                    label={selectedGasto.tipo || 'Sem Categoria'} 
                    size="small" 
                    sx={{ 
                      bgcolor: gerarCorPorString(selectedGasto.tipo || '').bg, 
                      border: `1px solid ${gerarCorPorString(selectedGasto.tipo || '').border}`, 
                      color: gerarCorPorString(selectedGasto.tipo || '').text,
                      fontWeight: 500
                    }} 
                  />
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 600, display: 'block', mb: 0.5 }}>
                    Método de Pagamento
                  </Typography>
                  <Chip 
                    label={selectedGasto.conta} 
                    size="small" 
                    sx={{ 
                      bgcolor: 'rgba(85, 107, 47, 0.06)', 
                      border: '1px solid rgba(85, 107, 47, 0.12)', 
                      color: 'secondary.main',
                      fontWeight: 500
                    }} 
                  />
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 2, py: 1.5, justifyContent: 'space-between' }}>
          <Button 
            variant="outlined" 
            color="error" 
            startIcon={<DeleteIcon />}
            onClick={handleExcluirClick}
          >
            Excluir
          </Button>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button 
              variant="outlined" 
              color="primary" 
              startIcon={<EditIcon />}
              onClick={handleEditarDoModal}
            >
              Editar
            </Button>
            <Button 
              variant="contained" 
              onClick={() => setModalDetalhesAberto(false)}
            >
              Fechar
            </Button>
          </Box>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
