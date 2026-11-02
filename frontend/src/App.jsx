import React, { useState, useEffect, useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  AreaChart,
  Area,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
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
  LinearProgress,
  Collapse,
  Switch,
  FormControlLabel,
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
import SearchIcon from '@mui/icons-material/Search';
import PlaceIcon from '@mui/icons-material/Place';
import MapIcon from '@mui/icons-material/Map';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import HexagonIcon from '@mui/icons-material/Hexagon';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import RepeatIcon from '@mui/icons-material/Repeat';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

// Helper inteligente de API: usa proxy /api em produção (porta 8080/HTTPS) ou porta 8000 no dev Vite (5173)
const getApiUrl = (path) => {
  if (window.location.port === '5173') {
    return `http://${window.location.hostname}:8000${path}`;
  }
  return path;
};

const getGoogleMapsUrl = (localizacao) => {
  if (!localizacao) return '';
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(localizacao.trim())}`;
};

const getGoogleMapsEmbedUrl = (localizacao) => {
  if (!localizacao) return '';
  return `https://maps.google.com/maps?q=${encodeURIComponent(localizacao.trim())}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
};

const NEON_COLORS = [
  '#10B981', '#38BDF8', '#A855F7', '#F59E0B', '#F43F5E',
  '#14B8A6', '#6366F1', '#EC4899', '#84CC16', '#06B6D4',
  '#F97316', '#8B5CF6', '#22C55E', '#EAB308', '#3B82F6'
];

const gerarCorDarkPorString = (str) => {
  let hash = 0;
  for (let i = 0; i < (str || '').length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash % 360);
  return {
    bg: `hsla(${hue}, 75%, 55%, 0.14)`,
    border: `hsla(${hue}, 75%, 60%, 0.42)`,
    text: `hsl(${hue}, 85%, 78%)`,
    main: `hsl(${hue}, 75%, 58%)`
  };
};

const formatarMoeda = (val) =>
  Number(val || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const MESES_NOMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const MESES_CURTOS = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
];

// Badge de Filtro Dark Mode
const FilterBadge = ({ label, isSelected, cores, onClick, onDelete }) => {
  return (
    <Box
      onClick={onClick}
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.75,
        px: 1.4,
        py: 0.55,
        borderRadius: '14px',
        cursor: 'pointer',
        userSelect: 'none',
        fontSize: '0.78rem',
        fontWeight: isSelected ? 700 : 500,
        whiteSpace: 'nowrap',
        transition: 'all 0.15s ease',
        bgcolor: isSelected ? cores.bg : 'rgba(15, 23, 42, 0.6)',
        color: isSelected ? cores.text : '#64748B',
        border: isSelected ? `1.5px solid ${cores.main}` : '1px solid rgba(148, 163, 184, 0.16)',
        boxShadow: isSelected ? `0 0 12px ${cores.bg}` : 'none',
        '&:hover': {
          bgcolor: isSelected ? cores.bg : 'rgba(30, 41, 59, 0.8)',
          borderColor: isSelected ? cores.main : 'rgba(148, 163, 184, 0.35)',
          transform: 'translateY(-1px)'
        }
      }}
    >
      <Box
        sx={{
          width: 7,
          height: 7,
          borderRadius: '50%',
          bgcolor: isSelected ? cores.main : '#475569',
          boxShadow: isSelected ? `0 0 6px ${cores.main}` : 'none',
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
            p: 0.15,
            ml: 0.2,
            color: cores.text,
            '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
          }}
        >
          <CloseIcon style={{ fontSize: 12 }} />
        </IconButton>
      )}
    </Box>
  );
};

const CustomChartTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const item = payload[0];
    const dataObj = item.payload || {};
    const title = dataObj.fullName || dataObj.name || label || item.name || 'Item';
    const val = dataObj.rawValor !== undefined ? dataObj.rawValor : (item.value || 0);
    const color = item.color || dataObj.fill || '#10B981';

    return (
      <Paper
        elevation={12}
        sx={{
          bgcolor: 'rgba(15, 23, 42, 0.96)',
          backdropFilter: 'blur(12px)',
          p: 1.5,
          border: `1.5px solid ${color}`,
          borderRadius: 2.5,
          minWidth: 190,
          boxShadow: '0 8px 32px rgba(0,0,0,0.6)'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
          <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: color, boxShadow: `0 0 8px ${color}` }} />
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#F8FAFC' }}>
            {title}
          </Typography>
        </Box>
        <Typography variant="body2" sx={{ color: '#10B981', fontWeight: 800, fontSize: '0.95rem' }}>
          R$ {formatarMoeda(val)}
        </Typography>
        {dataObj.count !== undefined && (
          <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block', mt: 0.25 }}>
            {dataObj.count} lançamento(s) • {dataObj.percent}% do total
          </Typography>
        )}
        {dataObj.score !== undefined && (
          <Typography variant="caption" sx={{ color: '#38BDF8', fontWeight: 700, display: 'block', mt: 0.25 }}>
            Índice de Dominância: {dataObj.score}/99
          </Typography>
        )}
      </Paper>
    );
  }
  return null;
};

function CadastroGastoForm({ metadados, onSuccess, onCancel, gastoParaEditar }) {
  const hojeStr = new Date().toISOString().split('T')[0];
  const [form, setForm] = useState({
    nome: '',
    descricao: '',
    localizacao: '',
    valor: '',
    tipo: '',
    conta: '',
    data: hojeStr,
    fixo: false,
    atualizar_grupo: false
  });
  const [submitting, setSubmitting] = useState(false);
  const [gettingGps, setGettingGps] = useState(false);

  const [opcoesTipos, setOpcoesTipos] = useState(metadados.tipos || []);
  const [opcoesContas, setOpcoesContas] = useState(metadados.contas || []);
  const [opcoesLocais, setOpcoesLocais] = useState(metadados.locais || []);

  useEffect(() => {
    if (metadados.tipos) setOpcoesTipos(metadados.tipos);
    if (metadados.contas) setOpcoesContas(metadados.contas);
    if (metadados.locais) setOpcoesLocais(metadados.locais);
  }, [metadados]);

  useEffect(() => {
    if (gastoParaEditar) {
      setForm({
        nome: gastoParaEditar.nome || '',
        descricao: gastoParaEditar.descricao || '',
        localizacao: gastoParaEditar.localizacao || '',
        valor: gastoParaEditar.valor ? gastoParaEditar.valor.toString() : '',
        tipo: gastoParaEditar.tipo || '',
        conta: gastoParaEditar.conta || '',
        data: gastoParaEditar.data || hojeStr,
        fixo: Boolean(gastoParaEditar.fixo),
        atualizar_grupo: false
      });
    } else {
      setForm({
        nome: '',
        descricao: '',
        localizacao: '',
        valor: '',
        tipo: '',
        conta: '',
        data: hojeStr,
        fixo: false,
        atualizar_grupo: false
      });
    }
  }, [gastoParaEditar, hojeStr]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleObterGpsAtual = () => {
    if (!navigator.geolocation) {
      onCancel('Geolocalização não suportada neste navegador.');
      return;
    }
    setGettingGps(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
          );
          if (res.ok) {
            const data = await res.json();
            const addr = data.address || {};
            const parts = [
              data.name || addr.shop || addr.amenity || addr.building || addr.road,
              addr.suburb || addr.neighbourhood,
              addr.city || addr.town || addr.municipality
            ].filter(Boolean);
            const localFormatado = parts.length > 0 ? parts.join(', ') : `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
            setForm(prev => ({ ...prev, localizacao: localFormatado }));
          } else {
            setForm(prev => ({ ...prev, localizacao: `${latitude.toFixed(5)}, ${longitude.toFixed(5)}` }));
          }
        } catch {
          setForm(prev => ({ ...prev, localizacao: `${latitude.toFixed(5)}, ${longitude.toFixed(5)}` }));
        } finally {
          setGettingGps(false);
        }
      },
      () => {
        setGettingGps(false);
        onCancel('Não foi possível obter o GPS. Verifique as permissões de localização.');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
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
      onCancel('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    setSubmitting(true);
    try {
      const url = gastoParaEditar
        ? getApiUrl(`/api/gastos/${gastoParaEditar.id}`)
        : getApiUrl('/api/gastos');

      const method = gastoParaEditar ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: form.nome,
          descricao: form.descricao,
          localizacao: form.localizacao,
          valor: parseFloat(form.valor),
          tipo: form.tipo,
          conta: form.conta,
          data: form.data,
          fixo: form.fixo,
          atualizar_grupo: form.atualizar_grupo
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Erro ao salvar gasto');
      }

      setForm({
        nome: '',
        descricao: '',
        localizacao: '',
        valor: '',
        tipo: '',
        conta: '',
        data: hojeStr,
        fixo: false,
        atualizar_grupo: false
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
    <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 1.75 }}>
      <TextField
        label="Nome do Gasto (use 1/N p/ parcelar)"
        name="nome"
        variant="outlined"
        size="small"
        placeholder="Ex: Supermercado, Tênis - 1/6"
        value={form.nome}
        onChange={handleInputChange}
        required
        fullWidth
      />

      <TextField
        label="Descrição / Detalhes (Opcional)"
        name="descricao"
        variant="outlined"
        size="small"
        placeholder="Ex: Itens de limpeza e hortifruti..."
        value={form.descricao}
        onChange={handleInputChange}
        multiline
        maxRows={2}
        fullWidth
      />

      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
        <Autocomplete
          freeSolo
          fullWidth
          options={opcoesLocais}
          value={form.localizacao}
          onChange={(e, newVal) => setForm(prev => ({ ...prev, localizacao: newVal || '' }))}
          onInputChange={(e, newInput) => {
            if (e && e.type === 'change') {
              setForm(prev => ({ ...prev, localizacao: newInput }));
            }
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Localização / Estabelecimento"
              size="small"
              placeholder="Ex: Oxxo Rebouças, Shopping..."
              slotProps={{
                ...params.slotProps,
                input: {
                  ...params.slotProps.input,
                  startAdornment: (
                    <>
                      <InputAdornment position="start">
                        <PlaceIcon sx={{ color: '#F43F5E', fontSize: 18 }} />
                      </InputAdornment>
                      {params.slotProps.input.startAdornment}
                    </>
                  )
                }
              }}
            />
          )}
        />
        <IconButton
          color="primary"
          onClick={handleObterGpsAtual}
          disabled={gettingGps}
          title="Usar minha localização GPS atual"
          sx={{
            border: '1px solid rgba(16, 185, 129, 0.35)',
            borderRadius: 2,
            p: 1
          }}
        >
          {gettingGps ? <CircularProgress size={18} /> : <MyLocationIcon fontSize="small" />}
        </IconButton>
        {form.localizacao && (
          <IconButton
            component="a"
            href={getGoogleMapsUrl(form.localizacao)}
            target="_blank"
            rel="noopener noreferrer"
            title="Testar no Google Maps"
            sx={{
              border: '1px solid rgba(56, 189, 248, 0.35)',
              color: '#38BDF8',
              borderRadius: 2,
              p: 1
            }}
          >
            <MapIcon fontSize="small" />
          </IconButton>
        )}
      </Box>

      <Grid container spacing={1.5}>
        <Grid size={{ xs: 6 }}>
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
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <MoneyIcon sx={{ color: 'primary.main', fontSize: 18 }} />
                  </InputAdornment>
                )
              },
              htmlInput: { step: '0.01', min: '0', inputMode: 'decimal' }
            }}
          />
        </Grid>
        <Grid size={{ xs: 6 }}>
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
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </Grid>
      </Grid>

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

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
        <FormControlLabel
          control={
            <Switch
              size="small"
              checked={form.fixo}
              onChange={(e) => setForm(prev => ({ ...prev, fixo: e.target.checked }))}
              color="primary"
            />
          }
          label={<Typography variant="caption" sx={{ color: 'text.secondary' }}>Gasto Fixo / Recorrente Mensal</Typography>}
        />

        {gastoParaEditar && gastoParaEditar.parcela_grupo_id && (
          <FormControlLabel
            control={
              <Switch
                size="small"
                checked={form.atualizar_grupo}
                onChange={(e) => setForm(prev => ({ ...prev, atualizar_grupo: e.target.checked }))}
                color="secondary"
              />
            }
            label={<Typography variant="caption" sx={{ color: '#38BDF8' }}>Aplicar valor/categoria/local a todas as parcelas</Typography>}
          />
        )}
      </Box>

      <Button
        type="submit"
        variant="contained"
        color="primary"
        size="large"
        disabled={submitting}
        startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : <AddCircleIcon />}
        sx={{ mt: 0.5, py: 1.2, fontWeight: 700 }}
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
  const [novoOrcamento, setNovoOrcamento] = useState('');
  const [editandoId, setEditandoId] = useState(null);
  const [editandoNome, setEditandoNome] = useState('');
  const [editandoOrcamento, setEditandoOrcamento] = useState('');
  const [erroMsg, setErroMsg] = useState('');

  const fetchCategorias = async () => {
    setLoading(true);
    try {
      const res = await fetch(getApiUrl('/api/categorias'));
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
      const res = await fetch(getApiUrl('/api/categorias'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: novoNome.trim(),
          orcamento_mensal: novoOrcamento ? parseFloat(novoOrcamento) : 0
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Erro ao criar categoria.');
      setNovoNome('');
      setNovoOrcamento('');
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
      const res = await fetch(getApiUrl(`/api/categorias/${id}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: editandoNome.trim(),
          orcamento_mensal: editandoOrcamento !== '' ? parseFloat(editandoOrcamento) : 0
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Erro ao atualizar categoria.');
      setEditandoId(null);
      showToast('Categoria e orçamento atualizados!');
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
      const res = await fetch(getApiUrl(`/api/categorias/${cat.id}`), { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Erro ao excluir categoria.');
      showToast(`Categoria "${cat.nome}" excluída!`);
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
          <Typography variant="h6">Categorias & Metas Mensais</Typography>
        </Box>
        <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {erroMsg && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErroMsg('')}>
            {erroMsg}
          </Alert>
        )}

        <Box component="form" onSubmit={handleCriar} sx={{ display: 'flex', gap: 1, mb: 2.5, flexWrap: { xs: 'wrap', sm: 'nowrap' } }}>
          <TextField
            label="Nova Categoria"
            size="small"
            fullWidth
            value={novoNome}
            onChange={(e) => setNovoNome(e.target.value)}
            placeholder="Ex: Mercado, Lazer..."
          />
          <TextField
            label="Meta Mensal (R$)"
            size="small"
            type="number"
            value={novoOrcamento}
            onChange={(e) => setNovoOrcamento(e.target.value)}
            placeholder="Opcional"
            sx={{ minWidth: 140 }}
          />
          <Button type="submit" variant="contained" startIcon={<AddIcon />} sx={{ flexShrink: 0 }}>
            Criar
          </Button>
        </Box>

        <Divider sx={{ mb: 2 }} />

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}><CircularProgress size={30} /></Box>
        ) : (
          <List dense sx={{ maxHeight: { xs: '65vh', sm: 380 }, overflowY: 'auto' }}>
            {categorias.map((cat) => (
              <ListItem key={cat.id} divider sx={{ py: 1 }}>
                {editandoId === cat.id ? (
                  <Box sx={{ display: 'flex', gap: 1, width: '100%', alignItems: 'center', flexWrap: 'wrap' }}>
                    <TextField
                      size="small"
                      label="Nome"
                      value={editandoNome}
                      onChange={(e) => setEditandoNome(e.target.value)}
                      sx={{ flexGrow: 1, minWidth: 140 }}
                    />
                    <TextField
                      size="small"
                      label="Meta Mensal (R$)"
                      type="number"
                      value={editandoOrcamento}
                      onChange={(e) => setEditandoOrcamento(e.target.value)}
                      sx={{ width: 140 }}
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
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>{cat.nome}</Typography>
                          {cat.orcamento_mensal > 0 && (
                            <Chip
                              size="small"
                              label={`Meta: R$ ${formatarMoeda(cat.orcamento_mensal)}`}
                              sx={{ height: 20, fontSize: '0.68rem', bgcolor: 'rgba(16, 185, 129, 0.15)', color: '#34D399' }}
                            />
                          )}
                        </Box>
                      }
                      secondary={`${cat.gastos_count} compra(s) vinculada(s)`}
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        onClick={() => {
                          setEditandoId(cat.id);
                          setEditandoNome(cat.nome);
                          setEditandoOrcamento(cat.orcamento_mensal ? String(cat.orcamento_mensal) : '');
                        }}
                      >
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
      const res = await fetch(getApiUrl('/api/contas'));
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
      const res = await fetch(getApiUrl('/api/contas'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: novoNome.trim() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Erro ao criar método de pagamento.');
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
      const res = await fetch(getApiUrl(`/api/contas/${id}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: editandoNome.trim() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Erro ao atualizar método de pagamento.');
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
      const res = await fetch(getApiUrl(`/api/contas/${conta.id}`), { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Erro ao excluir método de pagamento.');
      showToast(`Método "${conta.nome}" excluído!`);
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
          <Typography variant="h6">Métodos de Pagamento</Typography>
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
            placeholder="Ex: Crédito Nubank, Pix, VR..."
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

export default function App({ onNavigateStage }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [gastos, setGastos] = useState([]);
  const [stageCount, setStageCount] = useState(0);
  const [metadados, setMetadados] = useState({ tipos: [], contas: [], locais: [], orcamentos: {} });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [modalCategoriasAberto, setModalCategoriasAberto] = useState(false);
  const [modalContasAberto, setModalContasAberto] = useState(false);

  // Busca + Filtros de Período
  const [termoBusca, setTermoBusca] = useState('');
  const [filtroDataDe, setFiltroDataDe] = useState('');
  const [filtroDataAte, setFiltroDataAte] = useState('');
  const [periodoPreset, setPeriodoPreset] = useState('todos'); // 'todos', 'este_mes', 'mes_passado', '30d', 'ano', 'custom'
  const [mesNavegacao, setMesNavegacao] = useState(() => {
    const d = new Date();
    return { ano: d.getFullYear(), mes: d.getMonth() }; // mes 0-11
  });
  const [filtrosAvancadosAbertos, setFiltrosAvancadosAbertos] = useState(false);

  // Filtros Interativos por Labels
  const [selectedTipos, setSelectedTipos] = useState([]);
  const [selectedContas, setSelectedContas] = useState([]);

  // Modo de Exibição do Gráfico: 'hexagono' | 'mensal' | 'barras' | 'pizza' | 'contas'
  const [tipoGrafico, setTipoGrafico] = useState('hexagono');
  // Dimensão do Hexágono de Futebol: 'categorias' | 'contas' | 'locais'
  const [dimensaoHexagono, setDimensaoHexagono] = useState('categorias');

  // Ordenação e Paginação
  const [campoOrdenacao, setCampoOrdenacao] = useState('data');
  const [ordemDirecao, setOrdemDirecao] = useState('desc');
  const [limiteExibicao, setLimiteExibicao] = useState(30);
  const [isGroupedByCategory, setIsGroupedByCategory] = useState(false);

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

  const aplicarMes = (ano, mesIndex) => {
    const primeiroDia = `${ano}-${String(mesIndex + 1).padStart(2, '0')}-01`;
    const ultimoDiaDate = new Date(ano, mesIndex + 1, 0);
    const ultimoDia = `${ano}-${String(mesIndex + 1).padStart(2, '0')}-${String(ultimoDiaDate.getDate()).padStart(2, '0')}`;
    setMesNavegacao({ ano, mes: mesIndex });
    setFiltroDataDe(primeiroDia);
    setFiltroDataAte(ultimoDia);
  };

  const handlePresetPeriodo = (preset) => {
    const hoje = new Date();
    setPeriodoPreset(preset);
    if (preset === 'todos') {
      setFiltroDataDe('');
      setFiltroDataAte('');
    } else if (preset === 'este_mes') {
      aplicarMes(hoje.getFullYear(), hoje.getMonth());
    } else if (preset === 'mes_passado') {
      const ant = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
      aplicarMes(ant.getFullYear(), ant.getMonth());
    } else if (preset === '30d') {
      const ate = hoje.toISOString().split('T')[0];
      const deDate = new Date(hoje);
      deDate.setDate(deDate.getDate() - 30);
      setFiltroDataDe(deDate.toISOString().split('T')[0]);
      setFiltroDataAte(ate);
    } else if (preset === 'ano') {
      const ano = hoje.getFullYear();
      setFiltroDataDe(`${ano}-01-01`);
      setFiltroDataAte(`${ano}-12-31`);
    }
  };

  const navegarMes = (delta) => {
    const novaData = new Date(mesNavegacao.ano, mesNavegacao.mes + delta, 1);
    setPeriodoPreset('custom_mes');
    aplicarMes(novaData.getFullYear(), novaData.getMonth());
  };

  const fetchDados = async (isInitial = false) => {
    if (isInitial) setLoading(true);
    else setRefreshing(true);

    try {
      const [resGastos, resMeta, resStage] = await Promise.all([
        fetch(getApiUrl('/api/gastos')),
        fetch(getApiUrl('/api/metadados')),
        fetch(getApiUrl('/api/stage')).catch(() => null)
      ]);

      if (!resGastos.ok) throw new Error('Falha ao buscar gastos do servidor');

      const dataGastos = await resGastos.json();
      const dataMeta = resMeta.ok ? await resMeta.json() : { tipos: [], contas: [], locais: [], orcamentos: {} };
      if (resStage && resStage.ok) {
        const dataStage = await resStage.json();
        setStageCount(dataStage.total || 0);
      }

      setGastos(dataGastos);
      setMetadados({
        tipos: dataMeta.tipos || [],
        contas: dataMeta.contas || [],
        locais: dataMeta.locais || [],
        orcamentos: dataMeta.orcamentos || {}
      });

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
    window.location.href = getApiUrl('/api/exportar');
  };

  const handleResetFiltros = () => {
    setTermoBusca('');
    setPeriodoPreset('todos');
    setFiltroDataDe('');
    setFiltroDataAte('');
    setSelectedTipos(metadados.tipos || []);
    setSelectedContas(metadados.contas || []);
  };

  const handleSort = (campo) => {
    if (campoOrdenacao === campo) {
      setOrdemDirecao(prev => (prev === 'asc' ? 'desc' : 'asc'));
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

  const handleExcluirClick = async (excluirGrupo = false) => {
    if (!selectedGasto) return;

    const msgConfirm = excluirGrupo
      ? `Deseja excluir TODAS as parcelas vinculadas a "${selectedGasto.nome}"?`
      : `Deseja realmente excluir o gasto "${selectedGasto.nome}"?`;

    if (!window.confirm(msgConfirm)) return;

    try {
      const url = getApiUrl(`/api/gastos/${selectedGasto.id}${excluirGrupo ? '?excluir_grupo=true' : ''}`);
      const res = await fetch(url, { method: 'DELETE' });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Erro ao excluir gasto');
      }

      const dataRes = await res.json();
      showToast(dataRes.message || 'Gasto excluído com sucesso!');
      setModalDetalhesAberto(false);
      setSelectedGasto(null);
      fetchDados(false);
    } catch (error) {
      console.error(error);
      showToast(error.message || 'Erro ao excluir gasto.', 'error');
    }
  };

  const normalizarTexto = (txt) =>
    (txt || '')
      .toString()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();

  // Gastos filtrados por Busca, Categorias e Contas (mas SEM filtro de data para alimentar o gráfico de Progressão Mensal!)
  const gastosBaseSemData = useMemo(() => {
    const buscaNorm = normalizarTexto(termoBusca.trim());
    return gastos.filter(g => {
      if (buscaNorm) {
        const nomeNorm = normalizarTexto(g.nome);
        const descNorm = normalizarTexto(g.descricao);
        const locNorm = normalizarTexto(g.localizacao);
        if (!nomeNorm.includes(buscaNorm) && !descNorm.includes(buscaNorm) && !locNorm.includes(buscaNorm)) {
          return false;
        }
      }
      if (selectedTipos.length > 0 && !selectedTipos.includes(g.tipo || 'Sem Categoria')) return false;
      if (selectedContas.length > 0 && !selectedContas.includes(g.conta)) return false;
      return true;
    });
  }, [gastos, termoBusca, selectedTipos, selectedContas]);

  // Gastos filtrados completos (incluindo período de datas)
  const gastosFiltrados = useMemo(() => {
    return gastosBaseSemData.filter(g => {
      if (filtroDataDe && g.data < filtroDataDe) return false;
      if (filtroDataAte && g.data > filtroDataAte) return false;
      return true;
    });
  }, [gastosBaseSemData, filtroDataDe, filtroDataAte]);

  const valorTotal = useMemo(() => {
    return gastosFiltrados.reduce((sum, g) => sum + g.valor, 0);
  }, [gastosFiltrados]);

  const maiorGastoPeriodo = useMemo(() => {
    if (gastosFiltrados.length === 0) return null;
    return gastosFiltrados.reduce((max, g) => (g.valor > max.valor ? g : max), gastosFiltrados[0]);
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

  // Dados por Categoria
  const dadosGrafico = useMemo(() => {
    const agrupado = {};
    const contagens = {};
    gastosFiltrados.forEach(g => {
      const cat = g.tipo || 'Sem Categoria';
      agrupado[cat] = (agrupado[cat] || 0) + g.valor;
      contagens[cat] = (contagens[cat] || 0) + 1;
    });
    return Object.entries(agrupado)
      .map(([name, value]) => ({
        name,
        value: Number(value.toFixed(2)),
        rawValor: Number(value.toFixed(2)),
        count: contagens[name] || 0,
        percent: valorTotal > 0 ? ((value / valorTotal) * 100).toFixed(1) : '0.0',
        orcamento: metadados.orcamentos?.[name] || 0
      }))
      .sort((a, b) => b.value - a.value);
  }, [gastosFiltrados, valorTotal, metadados.orcamentos]);

  // Chips de categoria: mesmos filtros (busca, contas, período) exceto o de categoria,
  // para todas as categorias continuarem na tela e poderem ser (de)selecionadas.
  const dadosChipsCategorias = useMemo(() => {
    const buscaNorm = normalizarTexto(termoBusca.trim());
    const agrupado = {};
    gastos.forEach(g => {
      if (buscaNorm) {
        const alvo = `${normalizarTexto(g.nome)} ${normalizarTexto(g.descricao)} ${normalizarTexto(g.localizacao)}`;
        if (!alvo.includes(buscaNorm)) return;
      }
      if (selectedContas.length > 0 && !selectedContas.includes(g.conta)) return;
      if (filtroDataDe && g.data < filtroDataDe) return;
      if (filtroDataAte && g.data > filtroDataAte) return;
      const cat = g.tipo || 'Sem Categoria';
      agrupado[cat] = (agrupado[cat] || 0) + g.valor;
    });
    const total = Object.values(agrupado).reduce((acc, v) => acc + v, 0);
    return Object.entries(agrupado)
      .map(([name, value]) => ({
        name,
        value: Number(value.toFixed(2)),
        percent: total > 0 ? ((value / total) * 100).toFixed(1) : '0.0'
      }))
      .sort((a, b) => b.value - a.value);
  }, [gastos, termoBusca, selectedContas, filtroDataDe, filtroDataAte]);

  const todasCategoriasSelecionadas =
    metadados.tipos.length > 0 && metadados.tipos.every(t => selectedTipos.includes(t));

  // Com todas selecionadas (padrão), o clique isola a categoria; depois disso cada clique
  // adiciona/remove. Desmarcar a última volta para "todas".
  const alternarCategoria = cat =>
    setSelectedTipos(prev => {
      if (metadados.tipos.length > 0 && metadados.tipos.every(t => prev.includes(t))) return [cat];
      const proximo = prev.includes(cat) ? prev.filter(t => t !== cat) : [...prev, cat];
      return proximo.length > 0 ? proximo : metadados.tipos || [];
    });

  // Dados por Método de Pagamento / Conta
  const dadosPorConta = useMemo(() => {
    const agrupado = {};
    const contagens = {};
    gastosFiltrados.forEach(g => {
      const cta = g.conta || 'Sem Conta';
      agrupado[cta] = (agrupado[cta] || 0) + g.valor;
      contagens[cta] = (contagens[cta] || 0) + 1;
    });
    return Object.entries(agrupado)
      .map(([name, value]) => ({
        name,
        value: Number(value.toFixed(2)),
        rawValor: Number(value.toFixed(2)),
        count: contagens[name] || 0,
        percent: valorTotal > 0 ? ((value / valorTotal) * 100).toFixed(1) : '0.0'
      }))
      .sort((a, b) => b.value - a.value);
  }, [gastosFiltrados, valorTotal]);

  // Dados para o Gráfico de Progressão Mês a Mês
  const dadosProgressaoMensal = useMemo(() => {
    const mapaMes = {};
    const contagensMes = {};
    gastosBaseSemData.forEach(g => {
      if (!g.data || g.data.length < 7) return;
      const anoMes = g.data.slice(0, 7); // YYYY-MM
      mapaMes[anoMes] = (mapaMes[anoMes] || 0) + g.valor;
      contagensMes[anoMes] = (contagensMes[anoMes] || 0) + 1;
    });
    const entries = Object.entries(mapaMes).sort((a, b) => a[0].localeCompare(b[0]));
    const somaTotal = entries.reduce((s, [, v]) => s + v, 0);
    return entries.map(([anoMes, val]) => {
      const [ano, mes] = anoMes.split('-').map(Number);
      const labelCurto = `${MESES_CURTOS[(mes || 1) - 1]}/${String(ano).slice(2)}`;
      return {
        anoMes,
        ano,
        mesIndex: (mes || 1) - 1,
        name: labelCurto,
        fullName: `${MESES_NOMES[(mes || 1) - 1]} ${ano}`,
        value: Number(val.toFixed(2)),
        rawValor: Number(val.toFixed(2)),
        count: contagensMes[anoMes] || 0,
        percent: somaTotal > 0 ? ((val / somaTotal) * 100).toFixed(1) : '0.0'
      };
    });
  }, [gastosBaseSemData]);

  // Dados para o Hexágono estilo Jogo de Futebol (EA FC / FIFA Radar Attribute Chart)
  const dadosHexagonoFutebol = useMemo(() => {
    let fonte = [];
    if (dimensaoHexagono === 'categorias') {
      fonte = dadosGrafico;
    } else if (dimensaoHexagono === 'contas') {
      fonte = dadosPorConta;
    } else {
      // Agrupado por Localização (ou Estabelecimento / Nome se sem localização)
      const agrupadoLoc = {};
      const contagensLoc = {};
      gastosFiltrados.forEach(g => {
        const chave = (g.localizacao && g.localizacao.trim()) ? g.localizacao.trim() : g.nome.split(' - ')[0].trim();
        agrupadoLoc[chave] = (agrupadoLoc[chave] || 0) + g.valor;
        contagensLoc[chave] = (contagensLoc[chave] || 0) + 1;
      });
      fonte = Object.entries(agrupadoLoc)
        .map(([name, value]) => ({
          name,
          value: Number(value.toFixed(2)),
          rawValor: Number(value.toFixed(2)),
          count: contagensLoc[name] || 0,
          percent: valorTotal > 0 ? ((value / valorTotal) * 100).toFixed(1) : '0.0'
        }))
        .sort((a, b) => b.value - a.value);
    }

    // No estilo Futebol (EA FC / FIFA), um hexágono/octógono tem entre 6 e 8 pontas principais
    const topItens = fonte.slice(0, 6);
    const maxValor = topItens.length > 0 ? Math.max(...topItens.map(i => i.value), 1) : 1;

    // Preenche pelo menos 6 vértices para formar o hexágono clássico se houver menos
    const preenchidos = [...topItens];
    while (preenchidos.length > 0 && preenchidos.length < 6) {
      preenchidos.push({
        name: `Eixo ${preenchidos.length + 1}`,
        value: 0,
        rawValor: 0,
        count: 0,
        percent: '0.0'
      });
    }

    return preenchidos.map(item => {
      // Score estilo FIFA (0 a 99) proporcional ao maior gasto
      const score = item.value > 0 ? Math.max(18, Math.round((item.value / maxValor) * 99)) : 0;
      const shortLabel = item.name.length > 14 ? item.name.slice(0, 13) + '…' : item.name;
      return {
        ...item,
        shortName: shortLabel,
        fullName: item.name,
        score
      };
    });
  }, [dimensaoHexagono, dadosGrafico, dadosPorConta, gastosFiltrados, valorTotal]);

  const topAtributoHexagono = dadosHexagonoFutebol.length > 0 ? dadosHexagonoFutebol[0] : null;

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 3.5 }, px: { xs: 1.5, sm: 3 }, pb: { xs: 11, sm: 6 } }}>
      {/* Toast Snackbar */}
      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} variant="filled" sx={{ width: '100%', fontWeight: 600 }}>
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

      {/* Top Header Mobile-First Dark Fintech */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: { xs: 'stretch', sm: 'center' },
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 1.5,
          mb: 2.5
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: '12px',
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.25) 0%, rgba(56, 189, 248, 0.15) 100%)',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 20px rgba(16, 185, 129, 0.2)'
              }}
            >
              <TrendingUpIcon sx={{ color: '#10B981', fontSize: 24 }} />
            </Box>
            <Box>
              <Typography variant={isMobile ? 'h6' : 'h5'} component="h1" sx={{ fontWeight: 800, color: '#F8FAFC', lineHeight: 1.15 }}>
                Finanças <span style={{ color: '#10B981' }}>Pro</span>
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                Analytics • Radar • Google Maps
              </Typography>
            </Box>
          </Box>

          {isMobile && (
            <Box sx={{ display: 'flex', gap: 0.75 }}>
              <IconButton
                onClick={handleRefresh}
                disabled={refreshing || loading}
                color="primary"
                size="small"
                sx={{ border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: 2 }}
              >
                <SyncIcon fontSize="small" className={refreshing ? 'spin-anim' : ''} />
              </IconButton>
              <IconButton
                onClick={handleExportCSV}
                color="secondary"
                size="small"
                title="Exportar Backup CSV"
                sx={{ border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: 2 }}
              >
                <DownloadIcon fontSize="small" />
              </IconButton>
            </Box>
          )}
        </Box>

        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button
            variant={stageCount > 0 ? 'contained' : 'outlined'}
            color="warning"
            size="small"
            onClick={() => (onNavigateStage ? onNavigateStage() : (window.location.href = '/stage'))}
            sx={{
              flexGrow: { xs: 1, sm: 0 },
              fontWeight: 700,
              borderColor: 'rgba(245, 158, 11, 0.5)',
              color: stageCount > 0 ? '#090D16' : '#FBBF24',
              bgcolor: stageCount > 0 ? '#F59E0B' : 'rgba(245, 158, 11, 0.08)',
              '&:hover': {
                bgcolor: stageCount > 0 ? '#D97706' : 'rgba(245, 158, 11, 0.18)'
              }
            }}
          >
            Stage / Extratos {stageCount > 0 ? `(${stageCount})` : ''}
          </Button>
          <Button
            variant="outlined"
            color="primary"
            size="small"
            startIcon={<CategoryIcon />}
            onClick={() => setModalCategoriasAberto(true)}
            sx={{ flexGrow: { xs: 1, sm: 0 }, borderColor: 'rgba(16, 185, 129, 0.35)' }}
          >
            Categorias & Metas
          </Button>
          <Button
            variant="outlined"
            color="secondary"
            size="small"
            startIcon={<CreditCardIcon />}
            onClick={() => setModalContasAberto(true)}
            sx={{ flexGrow: { xs: 1, sm: 0 }, borderColor: 'rgba(56, 189, 248, 0.35)' }}
          >
            Métodos
          </Button>
          {!isMobile && (
            <>
              <IconButton
                onClick={handleRefresh}
                disabled={refreshing || loading}
                color="primary"
                size="small"
                sx={{ border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: 2.5, px: 1 }}
              >
                <SyncIcon className={refreshing ? 'spin-anim' : ''} />
              </IconButton>
              <Button
                variant="contained"
                color="primary"
                size="small"
                startIcon={<DownloadIcon />}
                onClick={handleExportCSV}
              >
                Backup CSV
              </Button>
            </>
          )}
        </Box>
      </Box>

      {/* BARRA DE NAVEGAÇÃO RÁPIDA DE MÊS & BUSCA INSTANTÂNEA (Mobile-First) */}
      <Card
        sx={{
          mb: 2.5,
          p: { xs: 1.5, sm: 2 },
          background: 'linear-gradient(180deg, rgba(17, 24, 39, 0.92) 0%, rgba(15, 23, 42, 0.85) 100%)',
          border: '1px solid rgba(16, 185, 129, 0.2)'
        }}
      >
        <Grid container spacing={1.5} alignItems="center">
          {/* Busca por Nome, Descrição ou Localização */}
          <Grid size={{ xs: 12, md: 5 }}>
            <TextField
              size="small"
              fullWidth
              placeholder="Buscar por nome, descrição ou local (ex: mercado, uber, oxxo)..."
              value={termoBusca}
              onChange={(e) => setTermoBusca(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: '#10B981', fontSize: 20 }} />
                    </InputAdornment>
                  ),
                  endAdornment: termoBusca ? (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setTermoBusca('')}>
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ) : null
                }
              }}
            />
          </Grid>

          {/* Navegador de Mês (< Outubro 2026 >) */}
          <Grid size={{ xs: 12, sm: 6, md: 3.5 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                bgcolor: 'rgba(9, 13, 22, 0.7)',
                border: '1px solid rgba(148, 163, 184, 0.2)',
                borderRadius: 2.5,
                px: 0.75,
                py: 0.35
              }}
            >
              <IconButton size="small" onClick={() => navegarMes(-1)} color="primary">
                <ChevronLeftIcon fontSize="small" />
              </IconButton>
              <Typography variant="body2" sx={{ fontWeight: 700, color: '#F8FAFC', fontSize: '0.85rem' }}>
                {filtroDataDe || filtroDataAte
                  ? `${MESES_NOMES[mesNavegacao.mes]} ${mesNavegacao.ano}`
                  : 'Todos os Períodos'}
              </Typography>
              <IconButton size="small" onClick={() => navegarMes(1)} color="primary">
                <ChevronRightIcon fontSize="small" />
              </IconButton>
            </Box>
          </Grid>

          {/* Atalhos Rápidos de Período */}
          <Grid size={{ xs: 12, sm: 6, md: 3.5 }}>
            <Box sx={{ display: 'flex', gap: 0.75, overflowX: 'auto', pb: { xs: 0.25, sm: 0 } }}>
              {[
                { id: 'todos', label: 'Tudo' },
                { id: 'este_mes', label: 'Este Mês' },
                { id: 'mes_passado', label: 'Mês Ant.' },
                { id: '30d', label: '30 Dias' }
              ].map((p) => (
                <Chip
                  key={p.id}
                  label={p.label}
                  size="small"
                  clickable
                  onClick={() => handlePresetPeriodo(p.id)}
                  sx={{
                    fontWeight: 700,
                    fontSize: '0.73rem',
                    bgcolor: periodoPreset === p.id ? 'rgba(16, 185, 129, 0.22)' : 'rgba(15, 23, 42, 0.7)',
                    color: periodoPreset === p.id ? '#34D399' : '#94A3B8',
                    border: periodoPreset === p.id ? '1px solid #10B981' : '1px solid rgba(148,163,184,0.18)'
                  }}
                />
              ))}
            </Box>
          </Grid>
        </Grid>

        {/* Botão para expandir filtros detalhados (Datas exatas, Categorias, Métodos) */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1.25, pt: 1, borderTop: '1px solid rgba(148,163,184,0.1)' }}>
          <Button
            size="small"
            color="inherit"
            startIcon={<FilterAltIcon fontSize="small" sx={{ color: '#38BDF8' }} />}
            endIcon={filtrosAvancadosAbertos ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            onClick={() => setFiltrosAvancadosAbertos(!filtrosAvancadosAbertos)}
            sx={{ fontSize: '0.78rem', color: '#94A3B8', py: 0.25 }}
          >
            {filtrosAvancadosAbertos ? 'Ocultar Filtros Avançados' : `Filtros por Categoria (${selectedTipos.length}) & Conta (${selectedContas.length})`}
          </Button>
          {(termoBusca || filtroDataDe || filtroDataAte || selectedTipos.length !== metadados.tipos.length || selectedContas.length !== metadados.contas.length) && (
            <Button
              size="small"
              color="error"
              startIcon={<ResetIcon fontSize="small" />}
              onClick={handleResetFiltros}
              sx={{ fontSize: '0.75rem', py: 0.25 }}
            >
              Resetar Filtros
            </Button>
          )}
        </Box>

        <Collapse in={filtrosAvancadosAbertos}>
          <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid rgba(148,163,184,0.12)' }}>
            {/* Datas Personalizadas */}
            <Grid container spacing={2} sx={{ mb: 2.5 }}>
              <Grid size={{ xs: 6 }}>
                <TextField
                  label="Data Inicial"
                  type="date"
                  size="small"
                  fullWidth
                  value={filtroDataDe}
                  onChange={(e) => { setPeriodoPreset('custom'); setFiltroDataDe(e.target.value); }}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <TextField
                  label="Data Final"
                  type="date"
                  size="small"
                  fullWidth
                  value={filtroDataAte}
                  onChange={(e) => { setPeriodoPreset('custom'); setFiltroDataAte(e.target.value); }}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Grid>
            </Grid>

            {/* Categorias Multi-Seleção */}
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' }}>
                  Categorias ({selectedTipos.length}/{metadados.tipos.length})
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button size="small" onClick={() => setSelectedTipos(metadados.tipos || [])} sx={{ fontSize: '0.7rem', py: 0 }}>Todas</Button>
                  <Button size="small" color="error" onClick={() => setSelectedTipos([])} sx={{ fontSize: '0.7rem', py: 0 }}>Nenhuma</Button>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                {metadados.tipos?.map((cat) => {
                  const isSelected = selectedTipos.includes(cat);
                  const cores = gerarCorDarkPorString(cat);
                  return (
                    <FilterBadge
                      key={cat}
                      label={cat}
                      isSelected={isSelected}
                      cores={cores}
                      onClick={() => alternarCategoria(cat)}
                    />
                  );
                })}
              </Box>
            </Box>

            {/* Métodos de Pagamento Multi-Seleção */}
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' }}>
                  Métodos de Pagamento ({selectedContas.length}/{metadados.contas.length})
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button size="small" onClick={() => setSelectedContas(metadados.contas || [])} sx={{ fontSize: '0.7rem', py: 0 }}>Todos</Button>
                  <Button size="small" color="error" onClick={() => setSelectedContas([])} sx={{ fontSize: '0.7rem', py: 0 }}>Nenhum</Button>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                {metadados.contas?.map((cta) => {
                  const isSelected = selectedContas.includes(cta);
                  const cores = gerarCorDarkPorString(cta);
                  return (
                    <FilterBadge
                      key={cta}
                      label={cta}
                      isSelected={isSelected}
                      cores={cores}
                      onClick={() =>
                        setSelectedContas(prev => (prev.includes(cta) ? prev.filter(c => c !== cta) : [...prev, cta]))
                      }
                    />
                  );
                })}
              </Box>
            </Box>
          </Box>
        </Collapse>
      </Card>

      {loading ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '320px', gap: 2 }}>
          <CircularProgress color="primary" size={45} />
          <Typography variant="body2" color="text.secondary">
            Carregando inteligência financeira...
          </Typography>
        </Box>
      ) : (
        <>
          {/* BENTO GRID KPI CARDS (Mobile-First) */}
          <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Card
                sx={{
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.22) 0%, rgba(6, 78, 59, 0.35) 100%)',
                  border: '1px solid rgba(16, 185, 129, 0.45)',
                  boxShadow: '0 8px 30px rgba(16, 185, 129, 0.14)',
                  height: '100%'
                }}
              >
                <CardContent sx={{ py: 2, px: 2.5 }}>
                  <Typography variant="caption" sx={{ color: '#6EE7B7', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>
                    Total no Período
                  </Typography>
                  <Typography variant={isMobile ? 'h4' : 'h4'} sx={{ fontWeight: 800, color: '#F8FAFC', mt: 0.5, fontVariantNumeric: 'tabular-nums' }}>
                    R$ {formatarMoeda(valorTotal)}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#A7F3D0', display: 'block', mt: 0.5 }}>
                    {gastosFiltrados.length} compras • Ticket médio R$ {formatarMoeda(gastosFiltrados.length ? valorTotal / gastosFiltrados.length : 0)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 6, sm: 4 }}>
              <Card sx={{ height: '100%', border: '1px solid rgba(56, 189, 248, 0.25)' }}>
                <CardContent sx={{ py: 2, px: 2 }}>
                  <Typography variant="caption" sx={{ color: '#38BDF8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                    Onde Mais Gasta
                  </Typography>
                  <Typography variant={isMobile ? 'subtitle1' : 'h6'} sx={{ fontWeight: 800, color: '#F8FAFC', mt: 0.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {dadosGrafico[0]?.name || '-'}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.25 }}>
                    {dadosGrafico[0] ? `R$ ${formatarMoeda(dadosGrafico[0].value)} (${dadosGrafico[0].percent}%)` : 'Sem dados'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 6, sm: 4 }}>
              <Card sx={{ height: '100%', border: '1px solid rgba(168, 85, 247, 0.25)' }}>
                <CardContent sx={{ py: 2, px: 2 }}>
                  <Typography variant="caption" sx={{ color: '#C084FC', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                    Maior Compra
                  </Typography>
                  <Typography variant={isMobile ? 'subtitle1' : 'h6'} sx={{ fontWeight: 800, color: '#F8FAFC', mt: 0.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {maiorGastoPeriodo ? `R$ ${formatarMoeda(maiorGastoPeriodo.valor)}` : '-'}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.25, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {maiorGastoPeriodo ? maiorGastoPeriodo.nome : 'Sem dados'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* CENTRAL DE VISUALIZAÇÃO GRÁFICA: HEXÁGONO FUTEBOL + MÊS A MÊS + BARRAS + PIZZA + CONTAS */}
          <Card sx={{ mb: 2.5, p: { xs: 1.75, sm: 3 } }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5, flexWrap: 'wrap', gap: 1.5 }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#F8FAFC', fontSize: { xs: '1.05rem', sm: '1.25rem' } }}>
                  {tipoGrafico === 'hexagono' && '⚽ Radar Hexagonal de Gastos (Estilo Futebol)'}
                  {tipoGrafico === 'mensal' && '📈 Progressão de Gastos Mês a Mês'}
                  {tipoGrafico === 'barras' && '📊 Ranking por Categoria & Orçamento'}
                  {tipoGrafico === 'pizza' && '🍩 Distribuição Percentual'}
                  {tipoGrafico === 'contas' && '💳 Gastos por Método / Fatura'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {tipoGrafico === 'hexagono'
                    ? 'Mapa tático das áreas onde o seu dinheiro mais se concentra (escala 0–99)'
                    : tipoGrafico === 'mensal'
                    ? 'Toque em qualquer mês no gráfico para filtrar os lançamentos daquele mês'
                    : `Baseado em ${gastosFiltrados.length} lançamentos filtrados`}
                </Typography>
              </Box>

              <ToggleButtonGroup
                value={tipoGrafico}
                exclusive
                size="small"
                onChange={(e, val) => { if (val) setTipoGrafico(val); }}
                sx={{
                  flexWrap: 'wrap',
                  justifyContent: { xs: 'center', sm: 'flex-start' },
                  width: { xs: '100%', sm: 'auto' },
                  bgcolor: 'rgba(9, 13, 22, 0.7)',
                  '& .MuiToggleButton-root': {
                    color: '#94A3B8',
                    borderColor: 'rgba(148,163,184,0.15)',
                    px: { xs: 1.1, sm: 1.5 },
                    py: 0.6,
                    fontSize: { xs: '0.72rem', sm: '0.8rem' },
                    fontWeight: 700,
                    '&.Mui-selected': {
                      bgcolor: 'rgba(16, 185, 129, 0.2)',
                      color: '#34D399',
                      borderColor: '#10B981'
                    }
                  }
                }}
              >
                <ToggleButton value="hexagono">
                  <HexagonIcon sx={{ mr: 0.5, fontSize: 16 }} /> Hexágono
                </ToggleButton>
                <ToggleButton value="mensal">
                  <ShowChartIcon sx={{ mr: 0.5, fontSize: 16 }} /> Mês a Mês
                </ToggleButton>
                <ToggleButton value="barras">
                  <BarChartIcon sx={{ mr: 0.5, fontSize: 16 }} /> Barras
                </ToggleButton>
                <ToggleButton value="pizza">
                  <PieChartIcon sx={{ mr: 0.5, fontSize: 16 }} /> Rosca
                </ToggleButton>
                <ToggleButton value="contas">
                  <CreditCardIcon sx={{ mr: 0.5, fontSize: 16 }} /> Cartões
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>

            {gastosFiltrados.length === 0 && tipoGrafico !== 'mensal' ? (
              <Box sx={{ py: 6, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Nenhum lançamento encontrado para os filtros atuais.
                </Typography>
              </Box>
            ) : (
              <>
                {/* MODO 1: HEXÁGONO ESTILO JOGO DE FUTEBOL (EA FC / FIFA RADAR) */}
                {tipoGrafico === 'hexagono' && (
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                      {[
                        { id: 'categorias', label: 'Top Categorias' },
                        { id: 'contas', label: 'Top Cartões/Contas' },
                        { id: 'locais', label: 'Top Locais / Lojas' }
                      ].map(dim => (
                        <Chip
                          key={dim.id}
                          label={dim.label}
                          size="small"
                          clickable
                          onClick={() => setDimensaoHexagono(dim.id)}
                          sx={{
                            fontWeight: 700,
                            bgcolor: dimensaoHexagono === dim.id ? 'rgba(56, 189, 248, 0.2)' : 'rgba(15, 23, 42, 0.7)',
                            color: dimensaoHexagono === dim.id ? '#38BDF8' : '#94A3B8',
                            border: dimensaoHexagono === dim.id ? '1px solid #38BDF8' : '1px solid rgba(148,163,184,0.18)'
                          }}
                        />
                      ))}
                    </Box>

                    <Grid container spacing={2} alignItems="center">
                      <Grid size={{ xs: 12, md: 7 }}>
                        <Box
                          sx={{
                            background: 'radial-gradient(circle, rgba(16, 185, 129, 0.12) 0%, rgba(9, 13, 22, 0) 70%)',
                            borderRadius: 3,
                            py: 1
                          }}
                        >
                          <ResponsiveContainer width="100%" height={isMobile ? 300 : 370}>
                            <RadarChart cx="50%" cy="50%" outerRadius={isMobile ? '68%' : '76%'} data={dadosHexagonoFutebol}>
                              <PolarGrid stroke="rgba(148, 163, 184, 0.25)" strokeDasharray="3 3" />
                              <PolarAngleAxis
                                dataKey="shortName"
                                tick={{ fill: '#E2E8F0', fontSize: isMobile ? 11 : 12, fontWeight: 700 }}
                              />
                              <PolarRadiusAxis
                                angle={30}
                                domain={[0, 100]}
                                tick={{ fill: '#64748B', fontSize: 10 }}
                                axisLine={false}
                              />
                              <Radar
                                name="Dominância de Gasto"
                                dataKey="score"
                                stroke="#10B981"
                                strokeWidth={3}
                                fill="#10B981"
                                fillOpacity={0.35}
                                dot={{ r: 5, fill: '#34D399', stroke: '#052E16', strokeWidth: 2 }}
                                activeDot={{ r: 7, fill: '#38BDF8' }}
                              />
                              <RechartsTooltip content={<CustomChartTooltip />} />
                            </RadarChart>
                          </ResponsiveContainer>
                        </Box>
                      </Grid>

                      {/* Card Estilo Atributos de Jogador (FIFA / EA FC) */}
                      <Grid size={{ xs: 12, md: 5 }}>
                        <Box
                          sx={{
                            p: 2,
                            borderRadius: 3,
                            background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.95) 0%, rgba(9, 13, 22, 0.95) 100%)',
                            border: '1px solid rgba(16, 185, 129, 0.3)',
                            boxShadow: 'inset 0 0 24px rgba(16, 185, 129, 0.08)'
                          }}
                        >
                          {topAtributoHexagono && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, pb: 1.5, borderBottom: '1px solid rgba(148,163,184,0.15)' }}>
                              <Box
                                sx={{
                                  width: 54,
                                  height: 54,
                                  borderRadius: 2.5,
                                  background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                                  color: '#04130D',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontWeight: 900,
                                  boxShadow: '0 0 16px rgba(16, 185, 129, 0.4)'
                                }}
                              >
                                <Typography sx={{ fontSize: '1.25rem', fontWeight: 900, lineHeight: 1 }}>99</Typography>
                                <Typography sx={{ fontSize: '0.55rem', fontWeight: 800, letterSpacing: 0.5 }}>TOP #1</Typography>
                              </Box>
                              <Box sx={{ minWidth: 0 }}>
                                <Typography variant="caption" sx={{ color: '#34D399', fontWeight: 700, textTransform: 'uppercase' }}>
                                  Maior Foco de Gasto
                                </Typography>
                                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#F8FAFC', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {topAtributoHexagono.fullName}
                                </Typography>
                                <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                                  R$ {formatarMoeda(topAtributoHexagono.rawValor)} ({topAtributoHexagono.percent}% do total)
                                </Typography>
                              </Box>
                            </Box>
                          )}

                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2 }}>
                            {dadosHexagonoFutebol.filter(d => d.rawValor > 0).map((attr, i) => {
                              const cor = NEON_COLORS[i % NEON_COLORS.length];
                              return (
                                <Box key={attr.fullName}>
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.35 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                                      <Box
                                        sx={{
                                          px: 0.7,
                                          py: 0.1,
                                          borderRadius: 1,
                                          bgcolor: 'rgba(16, 185, 129, 0.18)',
                                          color: cor,
                                          fontWeight: 800,
                                          fontSize: '0.72rem',
                                          fontVariantNumeric: 'tabular-nums'
                                        }}
                                      >
                                        {attr.score}
                                      </Box>
                                      <Typography variant="caption" sx={{ fontWeight: 700, color: '#E2E8F0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {attr.fullName}
                                      </Typography>
                                    </Box>
                                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#94A3B8', flexShrink: 0 }}>
                                      R$ {formatarMoeda(attr.rawValor)}
                                    </Typography>
                                  </Box>
                                  <LinearProgress
                                    variant="determinate"
                                    value={attr.score}
                                    sx={{
                                      height: 6,
                                      borderRadius: 3,
                                      bgcolor: 'rgba(148, 163, 184, 0.12)',
                                      '& .MuiLinearProgress-bar': {
                                        bgcolor: cor,
                                        borderRadius: 3
                                      }
                                    }}
                                  />
                                </Box>
                              );
                            })}
                          </Box>
                        </Box>
                      </Grid>
                    </Grid>
                  </Box>
                )}

                {/* MODO 2: PROGRESSÃO DE GASTO MÊS A MÊS */}
                {tipoGrafico === 'mensal' && (
                  <Box>
                    <ResponsiveContainer width="100%" height={isMobile ? 280 : 340}>
                      <AreaChart
                        data={dadosProgressaoMensal}
                        margin={{ top: 10, right: 20, left: isMobile ? 0 : 10, bottom: 5 }}
                        onClick={(state) => {
                          if (state && state.activePayload && state.activePayload[0]) {
                            const clicked = state.activePayload[0].payload;
                            if (clicked && clicked.ano && clicked.mesIndex !== undefined) {
                              setPeriodoPreset('custom_mes');
                              aplicarMes(clicked.ano, clicked.mesIndex);
                              showToast(`Filtrado para ${clicked.fullName}`);
                            }
                          }
                        }}
                      >
                        <defs>
                          <linearGradient id="colorMensal" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10B981" stopOpacity={0.5} />
                            <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.12)" />
                        <XAxis dataKey="name" tick={{ fill: '#94A3B8', fontSize: 12, fontWeight: 600 }} />
                        <YAxis tick={{ fill: '#94A3B8', fontSize: 11 }} tickFormatter={(v) => `R$${v}`} />
                        <RechartsTooltip content={<CustomChartTooltip />} />
                        <Area
                          type="monotone"
                          dataKey="value"
                          stroke="#10B981"
                          strokeWidth={3}
                          fillOpacity={1}
                          fill="url(#colorMensal)"
                          dot={{ r: 5, fill: '#10B981', stroke: '#090D16', strokeWidth: 2, cursor: 'pointer' }}
                          activeDot={{ r: 7, fill: '#38BDF8', cursor: 'pointer' }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>

                    {/* Cards Horizontais dos Meses */}
                    <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto', mt: 2, pb: 1 }}>
                      {dadosProgressaoMensal.map((m) => {
                        const ativo = filtroDataDe.startsWith(m.anoMes);
                        return (
                          <Box
                            key={m.anoMes}
                            onClick={() => {
                              setPeriodoPreset('custom_mes');
                              aplicarMes(m.ano, m.mesIndex);
                            }}
                            sx={{
                              minWidth: 125,
                              p: 1.25,
                              borderRadius: 2.5,
                              cursor: 'pointer',
                              bgcolor: ativo ? 'rgba(16, 185, 129, 0.18)' : 'rgba(9, 13, 22, 0.6)',
                              border: ativo ? '1.5px solid #10B981' : '1px solid rgba(148, 163, 184, 0.14)',
                              flexShrink: 0,
                              '&:hover': { borderColor: '#10B981' }
                            }}
                          >
                            <Typography variant="caption" sx={{ color: ativo ? '#34D399' : '#94A3B8', fontWeight: 700, display: 'block' }}>
                              {m.fullName}
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 800, color: '#F8FAFC', mt: 0.25 }}>
                              R$ {formatarMoeda(m.value)}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.68rem' }}>
                              {m.count} itens
                            </Typography>
                          </Box>
                        );
                      })}
                    </Box>
                  </Box>
                )}

                {/* MODO 3: BARRAS POR CATEGORIA + PROGRESSO DE ORÇAMENTO */}
                {tipoGrafico === 'barras' && (
                  <Box>
                    <ResponsiveContainer width="100%" height={Math.max(280, dadosGrafico.length * 36)}>
                      <BarChart
                        data={dadosGrafico}
                        layout="vertical"
                        margin={{ top: 5, right: 25, left: isMobile ? 75 : 130, bottom: 5 }}
                      >
                        <XAxis type="number" tick={{ fill: '#94A3B8', fontSize: 11 }} tickFormatter={(v) => `R$${v}`} />
                        <YAxis
                          type="category"
                          dataKey="name"
                          tick={{ fontSize: isMobile ? 11 : 12, fontWeight: 600, fill: '#E2E8F0' }}
                        />
                        <RechartsTooltip content={<CustomChartTooltip />} />
                        <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                          {dadosGrafico.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={NEON_COLORS[index % NEON_COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>

                    {/* Metas de Orçamento configuradas */}
                    {dadosGrafico.some(d => d.orcamento > 0) && (
                      <Box sx={{ mt: 2.5, pt: 2, borderTop: '1px solid rgba(148,163,184,0.12)' }}>
                        <Typography variant="subtitle2" sx={{ mb: 1.5, color: '#34D399', fontWeight: 700 }}>
                          🎯 Acompanhamento de Metas Mensais
                        </Typography>
                        <Grid container spacing={1.5}>
                          {dadosGrafico.filter(d => d.orcamento > 0).map(d => {
                            const pct = Math.min(100, Math.round((d.value / d.orcamento) * 100));
                            const estourou = d.value > d.orcamento;
                            const corBarra = estourou ? '#F43F5E' : pct >= 80 ? '#F59E0B' : '#10B981';
                            return (
                              <Grid size={{ xs: 12, sm: 6 }} key={d.name}>
                                <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'rgba(9,13,22,0.6)', border: '1px solid rgba(148,163,184,0.14)' }}>
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#F8FAFC' }}>{d.name}</Typography>
                                    <Typography variant="caption" sx={{ fontWeight: 700, color: corBarra }}>
                                      R$ {formatarMoeda(d.value)} / R$ {formatarMoeda(d.orcamento)} ({ Math.round((d.value / d.orcamento) * 100)}%)
                                    </Typography>
                                  </Box>
                                  <LinearProgress
                                    variant="determinate"
                                    value={pct}
                                    sx={{
                                      height: 7,
                                      borderRadius: 4,
                                      bgcolor: 'rgba(148,163,184,0.15)',
                                      '& .MuiLinearProgress-bar': { bgcolor: corBarra }
                                    }}
                                  />
                                </Box>
                              </Grid>
                            );
                          })}
                        </Grid>
                      </Box>
                    )}
                  </Box>
                )}

                {/* MODO 4: ROSCA / PIZZA */}
                {tipoGrafico === 'pizza' && (
                  <ResponsiveContainer width="100%" height={isMobile ? 300 : 360}>
                    <PieChart>
                      <Pie
                        data={dadosGrafico}
                        cx="50%"
                        cy="50%"
                        innerRadius={isMobile ? 55 : 80}
                        outerRadius={isMobile ? 95 : 130}
                        paddingAngle={3}
                        dataKey="value"
                        nameKey="name"
                        label={isMobile ? false : ({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      >
                        {dadosGrafico.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={NEON_COLORS[index % NEON_COLORS.length]} stroke="rgba(9,13,22,0.8)" strokeWidth={2} />
                        ))}
                      </Pie>
                      <RechartsTooltip content={<CustomChartTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                )}

                {/* MODO 5: POR CARTÃO / MÉTODO DE PAGAMENTO */}
                {tipoGrafico === 'contas' && (
                  <Grid container spacing={1.5}>
                    {dadosPorConta.map((cta, idx) => {
                      const cor = NEON_COLORS[idx % NEON_COLORS.length];
                      return (
                        <Grid size={{ xs: 12, sm: 6, md: 4 }} key={cta.name}>
                          <Box
                            sx={{
                              p: 2,
                              borderRadius: 3,
                              bgcolor: 'rgba(9, 13, 22, 0.65)',
                              border: `1px solid ${cor}55`,
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 0.75
                            }}
                          >
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#F8FAFC' }}>
                                {cta.name}
                              </Typography>
                              <Chip
                                size="small"
                                label={`${cta.percent}%`}
                                sx={{ height: 20, fontSize: '0.7rem', fontWeight: 800, bgcolor: `${cor}22`, color: cor }}
                              />
                            </Box>
                            <Typography variant="h6" sx={{ fontWeight: 800, color: cor }}>
                              R$ {formatarMoeda(cta.value)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {cta.count} lançamento(s) no período
                            </Typography>
                            <LinearProgress
                              variant="determinate"
                              value={Number(cta.percent)}
                              sx={{
                                height: 5,
                                borderRadius: 3,
                                bgcolor: 'rgba(148,163,184,0.12)',
                                '& .MuiLinearProgress-bar': { bgcolor: cor }
                              }}
                            />
                          </Box>
                        </Grid>
                      );
                    })}
                  </Grid>
                )}

                {/* Chips de Categorias: todas ficam visíveis; as fora do filtro aparecem esmaecidas */}
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8, justifyContent: 'center', mt: 2.5, pt: 2, borderTop: '1px solid rgba(148,163,184,0.1)' }}>
                  {!todasCategoriasSelecionadas && (
                    <Chip
                      size="small"
                      label="Todas"
                      onClick={() => setSelectedTipos(metadados.tipos || [])}
                      sx={{
                        bgcolor: 'rgba(16, 185, 129, 0.12)',
                        color: '#34D399',
                        border: '1px solid rgba(16, 185, 129, 0.45)',
                        fontWeight: 700,
                        fontSize: '0.72rem'
                      }}
                    />
                  )}
                  {dadosChipsCategorias.map((cat, idx) => {
                    const color = NEON_COLORS[idx % NEON_COLORS.length];
                    const ativo = selectedTipos.includes(cat.name);
                    return (
                      <Chip
                        key={cat.name}
                        size="small"
                        onClick={() => alternarCategoria(cat.name)}
                        aria-pressed={ativo}
                        avatar={<Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: ativo ? color : '#475569', ml: '6px !important' }} />}
                        label={`${cat.name}: R$ ${formatarMoeda(cat.value)} (${cat.percent}%)`}
                        sx={{
                          bgcolor: ativo ? 'rgba(9, 13, 22, 0.7)' : 'transparent',
                          color: ativo ? '#E2E8F0' : '#64748B',
                          border: ativo ? `1px solid ${color}66` : '1px dashed rgba(148, 163, 184, 0.25)',
                          fontWeight: 600,
                          fontSize: '0.72rem',
                          cursor: 'pointer',
                          transition: 'all 0.15s',
                          '&:hover': { color: '#E2E8F0', borderColor: `${color}AA` }
                        }}
                      />
                    );
                  })}
                </Box>
              </>
            )}
          </Card>

          {/* HISTÓRICO DE COMPRAS (CARDS MOBILE-FIRST NO CELULAR & TABELA NO DESKTOP) */}
          <Card sx={{ p: { xs: 1.5, sm: 3 } }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1.5 }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#F8FAFC', fontSize: { xs: '1.05rem', sm: '1.25rem' } }}>
                  Lançamentos ({gastosOrdenados.length})
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Toque em um lançamento para detalhes ou no pino 📍 para abrir no Google Maps
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                <Button
                  size="small"
                  variant={campoOrdenacao === 'data' ? 'contained' : 'outlined'}
                  onClick={() => handleSort('data')}
                  sx={{ fontSize: '0.75rem', py: 0.5 }}
                >
                  Data {campoOrdenacao === 'data' ? (ordemDirecao === 'asc' ? '↑' : '↓') : ''}
                </Button>
                <Button
                  size="small"
                  variant={campoOrdenacao === 'valor' ? 'contained' : 'outlined'}
                  onClick={() => handleSort('valor')}
                  sx={{ fontSize: '0.75rem', py: 0.5 }}
                >
                  Valor {campoOrdenacao === 'valor' ? (ordemDirecao === 'asc' ? '↑' : '↓') : ''}
                </Button>
                {!isMobile && (
                  <Button
                    size="small"
                    variant={isGroupedByCategory ? 'contained' : 'outlined'}
                    color="secondary"
                    onClick={() => setIsGroupedByCategory(!isGroupedByCategory)}
                    sx={{ fontSize: '0.75rem', py: 0.5 }}
                  >
                    {isGroupedByCategory ? 'Desagrupar' : 'Agrupar'}
                  </Button>
                )}
              </Box>
            </Box>

            {/* VISÃO MOBILE-FIRST: CARDS ESTILO FINTECH NO CELULAR */}
            {isMobile ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
                {gastosExibidos.map((gasto) => {
                  const coresCat = gerarCorDarkPorString(gasto.tipo || '');
                  return (
                    <Box
                      key={gasto.id}
                      onClick={() => handleAbrirDetalhes(gasto)}
                      sx={{
                        p: 1.6,
                        borderRadius: 3,
                        bgcolor: 'rgba(9, 13, 22, 0.72)',
                        border: '1px solid rgba(148, 163, 184, 0.14)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        gap: 1.5,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        '&:active': { transform: 'scale(0.99)', borderColor: '#10B981' }
                      }}
                    >
                      <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.4, flexWrap: 'wrap' }}>
                          <Chip
                            label={gasto.tipo || 'Sem Categoria'}
                            size="small"
                            sx={{
                              height: 20,
                              bgcolor: coresCat.bg,
                              color: coresCat.text,
                              border: `1px solid ${coresCat.border}`,
                              fontSize: '0.68rem',
                              fontWeight: 700
                            }}
                          />
                          <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
                            {gasto.data ? new Date(gasto.data + 'T00:00:00').toLocaleDateString('pt-BR') : '-'}
                          </Typography>
                          {gasto.fixo && (
                            <RepeatIcon sx={{ fontSize: 14, color: '#38BDF8' }} titleAccess="Gasto Fixo" />
                          )}
                        </Box>

                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#F8FAFC', wordBreak: 'break-word' }}>
                          {gasto.nome}
                        </Typography>

                        {gasto.descricao && (
                          <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block', mt: 0.2 }}>
                            {gasto.descricao}
                          </Typography>
                        )}

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.75, flexWrap: 'wrap' }}>
                          <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
                            💳 {gasto.conta}
                          </Typography>

                          {gasto.localizacao && (
                            <Chip
                              icon={<PlaceIcon style={{ fontSize: 13, color: '#F43F5E' }} />}
                              label={gasto.localizacao}
                              size="small"
                              component="a"
                              href={getGoogleMapsUrl(gasto.localizacao)}
                              target="_blank"
                              rel="noopener noreferrer"
                              clickable
                              onClick={(e) => e.stopPropagation()}
                              sx={{
                                height: 22,
                                maxWidth: 210,
                                fontSize: '0.68rem',
                                bgcolor: 'rgba(244, 63, 94, 0.12)',
                                color: '#FDA4AF',
                                border: '1px solid rgba(244, 63, 94, 0.3)'
                              }}
                            />
                          )}
                        </Box>
                      </Box>

                      <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#10B981', fontVariantNumeric: 'tabular-nums' }}>
                          R$ {formatarMoeda(gasto.valor)}
                        </Typography>
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            ) : (
              /* VISÃO DESKTOP: TABELA DARK ELEGANT */
              <TableContainer component={Paper} elevation={0} sx={{ maxHeight: 620, overflowX: 'auto', bgcolor: 'transparent' }}>
                <Table stickyHeader size="medium">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ minWidth: 100 }}>
                        <TableSortLabel
                          active={campoOrdenacao === 'data'}
                          direction={campoOrdenacao === 'data' ? ordemDirecao : 'asc'}
                          onClick={() => handleSort('data')}
                        >
                          Data
                        </TableSortLabel>
                      </TableCell>
                      <TableCell sx={{ minWidth: 220 }}>Nome / Descrição</TableCell>
                      <TableCell sx={{ minWidth: 150 }}>Local (Google Maps)</TableCell>
                      <TableCell sx={{ minWidth: 120 }}>Categoria</TableCell>
                      <TableCell sx={{ minWidth: 130 }}>Método</TableCell>
                      <TableCell align="right" sx={{ minWidth: 120 }}>
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
                    {(isGroupedByCategory
                      ? Object.entries(
                          gastosExibidos.reduce((acc, g) => {
                            const cat = g.tipo || 'Sem Categoria';
                            if (!acc[cat]) acc[cat] = [];
                            acc[cat].push(g);
                            return acc;
                          }, {})
                        ).sort((a, b) => a[0].localeCompare(b[0]))
                      : [['Todos', gastosExibidos]]
                    ).map(([catGroup, items]) => (
                      <React.Fragment key={catGroup}>
                        {isGroupedByCategory && (
                          <TableRow sx={{ bgcolor: 'rgba(16, 185, 129, 0.08)' }}>
                            <TableCell colSpan={6} sx={{ fontWeight: 800, color: '#34D399' }}>
                              {catGroup} ({items.length} itens)
                            </TableCell>
                          </TableRow>
                        )}
                        {items.map((gasto) => {
                          const coresCat = gerarCorDarkPorString(gasto.tipo || '');
                          return (
                            <TableRow
                              key={gasto.id}
                              hover
                              onClick={() => handleAbrirDetalhes(gasto)}
                              sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'rgba(255,255,255,0.03)' } }}
                            >
                              <TableCell sx={{ whiteSpace: 'nowrap', color: '#94A3B8', fontWeight: 500 }}>
                                {gasto.data ? new Date(gasto.data + 'T00:00:00').toLocaleDateString('pt-BR') : '-'}
                              </TableCell>
                              <TableCell sx={{ maxWidth: 280, wordBreak: 'break-word' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#F8FAFC' }}>
                                    {gasto.nome}
                                  </Typography>
                                  {gasto.fixo && (
                                    <RepeatIcon sx={{ fontSize: 15, color: '#38BDF8' }} titleAccess="Gasto Fixo" />
                                  )}
                                </Box>
                                {gasto.descricao && (
                                  <Typography variant="caption" sx={{ display: 'block', color: '#94A3B8', mt: 0.25 }}>
                                    {gasto.descricao}
                                  </Typography>
                                )}
                              </TableCell>
                              <TableCell>
                                {gasto.localizacao ? (
                                  <Chip
                                    icon={<PlaceIcon style={{ fontSize: 14, color: '#F43F5E' }} />}
                                    label={gasto.localizacao}
                                    size="small"
                                    component="a"
                                    href={getGoogleMapsUrl(gasto.localizacao)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    clickable
                                    onClick={(e) => e.stopPropagation()}
                                    sx={{
                                      maxWidth: 190,
                                      bgcolor: 'rgba(244, 63, 94, 0.12)',
                                      color: '#FDA4AF',
                                      border: '1px solid rgba(244, 63, 94, 0.3)',
                                      fontSize: '0.72rem',
                                      '&:hover': { bgcolor: 'rgba(244, 63, 94, 0.24)' }
                                    }}
                                  />
                                ) : (
                                  <Typography variant="caption" sx={{ color: '#475569' }}>—</Typography>
                                )}
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={gasto.tipo || 'Sem Categoria'}
                                  size="small"
                                  sx={{
                                    bgcolor: coresCat.bg,
                                    color: coresCat.text,
                                    border: `1px solid ${coresCat.border}`,
                                    fontWeight: 700,
                                    fontSize: '0.72rem'
                                  }}
                                />
                              </TableCell>
                              <TableCell sx={{ color: '#CBD5E1', fontSize: '0.85rem' }}>
                                {gasto.conta}
                              </TableCell>
                              <TableCell align="right" sx={{ fontWeight: 800, color: '#10B981', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
                                R$ {formatarMoeda(gasto.valor)}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </React.Fragment>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {gastosOrdenados.length > limiteExibicao && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2.5 }}>
                <Button variant="outlined" size="small" onClick={() => setLimiteExibicao(prev => prev + 50)}>
                  Carregar Mais ({gastosOrdenados.length - limiteExibicao} restantes)
                </Button>
              </Box>
            )}
          </Card>
        </>
      )}

      {/* BARRA INFERIOR FLUTUANTE NO MOBILE (Thumb-Zone Navigation) */}
      {isMobile && !formAberto && (
        <Paper
          elevation={16}
          sx={{
            position: 'fixed',
            bottom: 12,
            left: 12,
            right: 12,
            zIndex: 1000,
            borderRadius: 4,
            py: 1,
            px: 2,
            bgcolor: 'rgba(15, 23, 42, 0.92)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(16, 185, 129, 0.35)',
            display: 'flex',
            justifyContent: 'space-around',
            alignItems: 'center',
            boxShadow: '0 10px 30px rgba(0,0,0,0.65)'
          }}
        >
          <IconButton
            color={tipoGrafico === 'hexagono' ? 'primary' : 'default'}
            onClick={() => { setTipoGrafico('hexagono'); window.scrollTo({ top: 250, behavior: 'smooth' }); }}
          >
            <HexagonIcon />
          </IconButton>
          <IconButton
            color={tipoGrafico === 'mensal' ? 'primary' : 'default'}
            onClick={() => { setTipoGrafico('mensal'); window.scrollTo({ top: 250, behavior: 'smooth' }); }}
          >
            <ShowChartIcon />
          </IconButton>
          <Fab
            color="primary"
            size="medium"
            aria-label="adicionar gasto"
            onClick={() => { setGastoParaEditar(null); setFormAberto(true); }}
            sx={{
              mt: -3,
              boxShadow: '0 0 20px rgba(16, 185, 129, 0.6)'
            }}
          >
            <AddIcon />
          </Fab>
          <IconButton onClick={() => setModalCategoriasAberto(true)}>
            <CategoryIcon />
          </IconButton>
          <IconButton onClick={() => setModalContasAberto(true)}>
            <CreditCardIcon />
          </IconButton>
        </Paper>
      )}

      {/* Botão Flutuante Desktop */}
      {!isMobile && !formAberto && (
        <Fab
          color="primary"
          aria-label="add"
          onClick={() => { setGastoParaEditar(null); setFormAberto(true); }}
          sx={{ position: 'fixed', bottom: 28, right: 28, zIndex: 1000 }}
        >
          <AddIcon />
        </Fab>
      )}

      {/* Dialog / Drawer de Adicionar ou Editar Gasto */}
      <Dialog
        open={formAberto}
        onClose={() => { setFormAberto(false); setGastoParaEditar(null); }}
        maxWidth="xs"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AddCircleIcon color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              {gastoParaEditar ? 'Editar Gasto' : 'Novo Lançamento'}
            </Typography>
          </Box>
          <IconButton onClick={() => { setFormAberto(false); setGastoParaEditar(null); }} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ pt: 2 }}>
          <CadastroGastoForm
            metadados={metadados}
            gastoParaEditar={gastoParaEditar}
            onSuccess={(msg) => {
              showToast(msg);
              setFormAberto(false);
              setGastoParaEditar(null);
              fetchDados(false);
            }}
            onCancel={(msg) => showToast(msg, 'error')}
          />
        </DialogContent>
      </Dialog>

      {/* Modal de Detalhes do Gasto + Integração Google Maps */}
      <Dialog
        open={modalDetalhesAberto}
        onClose={() => setModalDetalhesAberto(false)}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
          <Typography variant="h6" component="div" sx={{ fontWeight: 800, color: '#10B981' }}>
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
                <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 700 }}>
                  Nome do Gasto
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#F8FAFC', mt: 0.25, wordBreak: 'break-word' }}>
                  {selectedGasto.nome}
                </Typography>
              </Box>

              {selectedGasto.descricao && (
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 700 }}>
                    Descrição / Detalhes
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#CBD5E1', mt: 0.25, wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
                    {selectedGasto.descricao}
                  </Typography>
                </Box>
              )}

              <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, p: 1.5, borderRadius: 2.5, bgcolor: 'rgba(9,13,22,0.65)', border: '1px solid rgba(148,163,184,0.14)' }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 700 }}>
                    Valor
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: '#10B981', mt: 0.25 }}>
                    R$ {formatarMoeda(selectedGasto.valor)}
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>
                    Data
                  </Typography>
                  <Typography variant="body1" sx={{ mt: 0.25, color: '#F8FAFC', fontWeight: 700 }}>
                    {selectedGasto.data ? new Date(selectedGasto.data + 'T00:00:00').toLocaleDateString('pt-BR') : 'Sem data'}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 700, display: 'block', mb: 0.5 }}>
                    Categoria
                  </Typography>
                  <Chip
                    label={selectedGasto.tipo || 'Sem Categoria'}
                    size="small"
                    sx={{
                      bgcolor: gerarCorDarkPorString(selectedGasto.tipo || '').bg,
                      border: `1px solid ${gerarCorDarkPorString(selectedGasto.tipo || '').border}`,
                      color: gerarCorDarkPorString(selectedGasto.tipo || '').text,
                      fontWeight: 700
                    }}
                  />
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 700, display: 'block', mb: 0.5 }}>
                    Método de Pagamento
                  </Typography>
                  <Chip
                    label={selectedGasto.conta}
                    size="small"
                    sx={{
                      bgcolor: 'rgba(56, 189, 248, 0.14)',
                      border: '1px solid rgba(56, 189, 248, 0.35)',
                      color: '#7DD3FC',
                      fontWeight: 700
                    }}
                  />
                </Box>
              </Box>

              {/* SEÇÃO DE LOCALIZAÇÃO E GOOGLE MAPS INTEGRADO */}
              <Box
                sx={{
                  p: 1.75,
                  borderRadius: 3,
                  bgcolor: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid rgba(244, 63, 94, 0.3)'
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: selectedGasto.localizacao ? 1.25 : 0 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    <PlaceIcon sx={{ color: '#F43F5E', fontSize: 20 }} />
                    <Box>
                      <Typography variant="caption" sx={{ color: '#FDA4AF', fontWeight: 700, textTransform: 'uppercase', display: 'block' }}>
                        Local da Compra
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#F8FAFC' }}>
                        {selectedGasto.localizacao || 'Localização não informada (clique em Editar para adicionar)'}
                      </Typography>
                    </Box>
                  </Box>

                  {selectedGasto.localizacao && (
                    <Button
                      variant="contained"
                      size="small"
                      component="a"
                      href={getGoogleMapsUrl(selectedGasto.localizacao)}
                      target="_blank"
                      rel="noopener noreferrer"
                      endIcon={<OpenInNewIcon fontSize="small" />}
                      sx={{
                        background: 'linear-gradient(135deg, #F43F5E 0%, #E11D48 100%)',
                        color: '#fff',
                        fontWeight: 700
                      }}
                    >
                      Abrir no Google Maps
                    </Button>
                  )}
                </Box>

                {selectedGasto.localizacao && (
                  <Box sx={{ borderRadius: 2, overflow: 'hidden', border: '1px solid rgba(148,163,184,0.2)', height: 190 }}>
                    <iframe
                      title="Mapa do Local da Compra"
                      width="100%"
                      height="100%"
                      style={{ border: 0, filter: 'invert(90%) hue-rotate(180deg) contrast(95%)' }}
                      loading="lazy"
                      allowFullScreen
                      src={getGoogleMapsEmbedUrl(selectedGasto.localizacao)}
                    />
                  </Box>
                )}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 2, py: 1.5, justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              color="error"
              size="small"
              startIcon={<DeleteIcon />}
              onClick={() => handleExcluirClick(false)}
            >
              Excluir
            </Button>
            {selectedGasto?.parcela_grupo_id && (
              <Button
                variant="outlined"
                color="error"
                size="small"
                onClick={() => handleExcluirClick(true)}
              >
                Excluir Todas Parcelas
              </Button>
            )}
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              color="primary"
              size="small"
              startIcon={<EditIcon />}
              onClick={handleEditarDoModal}
            >
              Editar
            </Button>
            <Button
              variant="contained"
              size="small"
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
