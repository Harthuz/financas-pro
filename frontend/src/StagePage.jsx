import React, { useState, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import {
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Button,
  ButtonGroup,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  TableHead,
  TableSortLabel,
  Chip,
  IconButton,
  Snackbar,
  Alert,
  CircularProgress,
  Autocomplete,
  Checkbox,
  Switch,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Collapse
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import DeleteIcon from '@mui/icons-material/Delete';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import AddIcon from '@mui/icons-material/Add';
import SyncIcon from '@mui/icons-material/Sync';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import ContentPasteIcon from '@mui/icons-material/ContentPaste';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import CodeIcon from '@mui/icons-material/Code';
import SearchIcon from '@mui/icons-material/Search';
import TuneIcon from '@mui/icons-material/Tune';
import SelectAllIcon from '@mui/icons-material/SelectAll';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';

// Grade estilo planilha: linhas compactas, bordas em todas as células e cores sólidas
// (necessárias para as colunas/cabeçalho fixos não deixarem o conteúdo vazar por baixo).
const GRID = {
  rowHeight: 36,
  border: '1px solid rgba(148, 163, 184, 0.14)',
  headBg: '#0D1320',
  rowBg: '#111827',
  rowAltBg: '#0F1522',
  rowSelectedBg: '#10231F',
  rowHoverBg: '#162033',
  missingBg: 'rgba(245, 158, 11, 0.12)',
  focusRing: 'inset 0 0 0 2px #10B981'
};

// Colunas na ordem exibida. As duas primeiras ficam fixas à esquerda durante a rolagem horizontal.
const COLUNAS = [
  { key: 'sel', label: '', width: 44, sticky: 0, align: 'center' },
  { key: 'num', label: '#', width: 48, sticky: 44, align: 'center' },
  { key: 'status', label: 'Status', width: 150, sortValue: item => (item.completo ? 1 : 0) },
  { key: 'data', label: 'Data *', width: 148, sortValue: item => item.data },
  { key: 'nome', label: 'Nome da Compra *', width: 240, sortValue: item => item.nome },
  { key: 'valor', label: 'Valor (R$) *', width: 148, align: 'right', sortValue: item => (item.valor === '' || item.valor === null ? null : Number(item.valor)) },
  { key: 'tipo', label: 'Categoria *', width: 200, sortValue: item => item.tipo },
  { key: 'conta', label: 'Conta / Método *', width: 200, sortValue: item => item.conta },
  { key: 'extrato', label: 'Extrato Original', width: 260, sortValue: item => item.texto_extrato },
  { key: 'observacao', label: 'Nota do Agente', width: 220, sortValue: item => item.observacao_agente },
  { key: 'descricao', label: 'Descrição', width: 200, sortValue: item => item.descricao },
  { key: 'localizacao', label: 'Localização', width: 170, sortValue: item => item.localizacao },
  { key: 'fixo', label: 'Fixo', width: 64, align: 'center', sortValue: item => (item.fixo ? 1 : 0) },
  { key: 'acao', label: '', width: 52, align: 'center' }
];
const LARGURA_TABELA = COLUNAS.reduce((acc, c) => acc + c.width, 0);

// Input sem borda que ocupa a célula inteira; a célula ganha anel verde ao focar (como numa planilha).
const cellInputSx = (falta, align = 'left') => ({
  '& .MuiInputBase-root': {
    height: GRID.rowHeight - 1,
    px: 1,
    fontSize: '0.8125rem',
    borderRadius: 0,
    bgcolor: falta ? GRID.missingBg : 'transparent',
    transition: 'box-shadow 0.1s'
  },
  '& .MuiInputBase-root.Mui-focused': {
    boxShadow: GRID.focusRing,
    bgcolor: 'rgba(16, 185, 129, 0.06)'
  },
  '& .MuiInputBase-input': {
    p: 0,
    textAlign: align,
    fontVariantNumeric: 'tabular-nums',
    '&::placeholder': { color: falta ? '#FBBF24' : '#64748B', opacity: falta ? 0.75 : 1 }
  },
  '& input[type=number]': { MozAppearance: 'textfield' },
  '& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button': {
    WebkitAppearance: 'none',
    m: 0
  }
});

// Navegação estilo planilha. Cada <td> do corpo tem data-cell="linha:coluna" e tabIndex -1.
// - Modo navegação (foco na célula): setas/Tab/Home/End movem; Enter/F2 ou digitar entram em edição;
//   Espaço/Enter alternam checkbox e switch.
// - Modo edição (foco no input): setas ficam com o campo; Esc volta à navegação;
//   Enter/Tab confirmam e movem (como no Excel).
const focarCelula = (container, row, col) => {
  const td = container.querySelector(`td[data-cell="${row}:${col}"]`);
  if (!td) return false;
  td.focus({ preventScroll: true });
  td.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  return true;
};

const handleGridKeyDown = e => {
  const container = e.currentTarget;
  const td = e.target.closest?.('td[data-cell]');
  if (!td || !container.contains(td)) return;
  const [row, col] = td.dataset.cell.split(':').map(Number);
  const mover = (dr, dc) => {
    e.preventDefault();
    focarCelula(container, row + dr, col + dc);
  };

  const campo = e.target.closest('input, textarea');
  const editando = campo && campo.type !== 'checkbox';

  if (editando) {
    if (e.defaultPrevented) return; // ex.: Autocomplete fechando a lista com Esc / escolhendo opção com Enter
    if (e.key === 'Escape') {
      e.preventDefault();
      td.focus({ preventScroll: true });
    } else if (e.key === 'Enter') mover(e.shiftKey ? -1 : 1, 0);
    else if (e.key === 'Tab') mover(0, e.shiftKey ? -1 : 1);
    return;
  }

  switch (e.key) {
    case 'ArrowUp': return mover(-1, 0);
    case 'ArrowDown': return mover(1, 0);
    case 'ArrowLeft': return mover(0, -1);
    case 'ArrowRight': return mover(0, 1);
    case 'Tab': return mover(0, e.shiftKey ? -1 : 1);
    case 'Home':
      e.preventDefault();
      return focarCelula(container, e.ctrlKey ? 0 : row, 0);
    case 'End': {
      e.preventDefault();
      const ultimaLinha = e.ctrlKey ? container.querySelectorAll('tbody tr').length - 1 : row;
      return focarCelula(container, ultimaLinha, COLUNAS.length - 1);
    }
    default:
      break;
  }

  const toggle = td.querySelector('input[type=checkbox]');
  if (toggle && (e.key === ' ' || e.key === 'Enter')) {
    e.preventDefault();
    toggle.click();
    return;
  }

  const input = td.querySelector('input:not([type=checkbox]), textarea');
  if (!input) return;
  const digitavel = e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey;
  if (e.key === 'Enter' || e.key === 'F2') {
    e.preventDefault();
    input.focus();
    if (input.type !== 'date') input.setSelectionRange?.(input.value.length, input.value.length);
  } else if (digitavel && input.type !== 'date') {
    // Igual a planilha: começar a digitar substitui o conteúdo (o caractere cai no input já selecionado).
    input.focus();
    input.select();
  }
};

// Valor monetário: exibe formatado (2 casas, pt-BR) e vira campo numérico ao entrar em edição.
function ValorCell({ valor, falta, onChange }) {
  const [editando, setEditando] = useState(false);
  const inputRef = useRef(null);

  // Ao entrar em edição o texto troca de "1.234,50" para "1234.5"; re-seleciona para a digitação substituir tudo.
  useLayoutEffect(() => {
    if (editando) inputRef.current?.select();
  }, [editando]);

  const vazio = valor === '' || valor === null || valor === undefined;
  const baseSx = cellInputSx(falta, 'right');
  return (
    <TextField
      variant="standard"
      fullWidth
      placeholder="0,00 *"
      value={editando ? String(valor ?? '') : vazio ? '' : formatarMoeda(valor)}
      onFocus={() => setEditando(true)}
      onBlur={() => setEditando(false)}
      onChange={e => onChange(e.target.value.replace(',', '.').replace(/[^\d.-]/g, ''))}
      inputRef={inputRef}
      InputProps={{ disableUnderline: true }}
      inputProps={{ inputMode: 'decimal' }}
      sx={{
        ...baseSx,
        '& .MuiInputBase-input': {
          ...baseSx['& .MuiInputBase-input'],
          fontWeight: 600,
          color: Number(valor) < 0 ? '#F43F5E' : '#F8FAFC'
        }
      }}
    />
  );
}

const getApiUrl = (path) => {
  if (window.location.port === '5173') {
    return `http://${window.location.hostname}:8000${path}`;
  }
  return path;
};

const formatarMoeda = (val) =>
  Number(val || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const calcularStatusItem = (item) => {
  const nome = (item.nome || '').trim();
  const tipo = (item.tipo || '').trim();
  const conta = (item.conta || '').trim();
  const data = (item.data || '').trim();
  const valorNum = item.valor !== null && item.valor !== undefined && item.valor !== '' ? Number(item.valor) : NaN;
  const valorValido = !Number.isNaN(valorNum) && valorNum > 0;

  const faltantes = [];
  if (!data) faltantes.push('data');
  if (!nome) faltantes.push('nome');
  if (!valorValido) faltantes.push('valor');
  if (!tipo) faltantes.push('tipo');
  if (!conta) faltantes.push('conta');

  return {
    completo: faltantes.length === 0,
    campos_faltantes: faltantes
  };
};

export default function StagePage({ onNavigateHome }) {
  const [itens, setItens] = useState([]);
  const [metadados, setMetadados] = useState({ tipos: [], contas: [], locais: [] });
  const [loading, setLoading] = useState(true);
  const [savingStatus, setSavingStatus] = useState({});
  const [committing, setCommitting] = useState(false);
  const [filtroStatus, setFiltroStatus] = useState('todos'); // 'todos' | 'incompletos' | 'prontos'
  const [busca, setBusca] = useState('');
  const [baixarCsvAutomatico, setBaixarCsvAutomatico] = useState(true);

  // Lote (Bulk apply)
  const [loteTipo, setLoteTipo] = useState('');
  const [loteConta, setLoteConta] = useState('');

  // Modal colar JSON em lote
  const [modalJsonAberto, setModalJsonAberto] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const [mostrarDocMcp, setMostrarDocMcp] = useState(false);
  const [mostrarLoteMobile, setMostrarLoteMobile] = useState(false);
  const [ordenacao, setOrdenacao] = useState({ coluna: null, direcao: 'asc' });

  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const debounceTimers = useRef({});

  const showToast = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const carregarStage = async (silencioso = false) => {
    if (!silencioso) setLoading(true);
    try {
      const [resStage, resMeta] = await Promise.all([
        fetch(getApiUrl('/api/stage')),
        fetch(getApiUrl('/api/metadados'))
      ]);
      if (resStage.ok) {
        const dataStage = await resStage.json();
        setItens(dataStage.itens || []);
      }
      if (resMeta.ok) {
        const dataMeta = await resMeta.json();
        setMetadados({
          tipos: dataMeta.tipos || [],
          contas: dataMeta.contas || [],
          locais: dataMeta.locais || []
        });
      }
    } catch (err) {
      console.error(err);
      showToast('Erro ao carregar dados do Stage.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarStage(false);
  }, []);

  const salvarItemNoServidor = async (id, patchFields) => {
    setSavingStatus(prev => ({ ...prev, [id]: 'saving' }));
    try {
      const res = await fetch(getApiUrl(`/api/stage/${id}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patchFields)
      });
      if (!res.ok) throw new Error('Falha ao salvar item no stage');
      setSavingStatus(prev => ({ ...prev, [id]: 'saved' }));
    } catch (err) {
      console.error(err);
      setSavingStatus(prev => ({ ...prev, [id]: 'error' }));
      showToast(`Erro ao salvar item #${id}`, 'error');
    }
  };

  const handleCampoChange = (id, campo, valor, imediato = false) => {
    setItens(prev =>
      prev.map(item => {
        if (item.id !== id) return item;
        const atualizado = { ...item, [campo]: valor };
        const status = calcularStatusItem(atualizado);
        return { ...atualizado, ...status };
      })
    );

    const timerKey = `${id}_${campo}`;
    if (debounceTimers.current[timerKey]) {
      clearTimeout(debounceTimers.current[timerKey]);
    }

    if (imediato) {
      salvarItemNoServidor(id, { [campo]: valor });
    } else {
      debounceTimers.current[timerKey] = setTimeout(() => {
        salvarItemNoServidor(id, { [campo]: valor });
      }, 450);
    }
  };

  const handleAdicionarLinhaManual = async () => {
    const hoje = new Date().toISOString().split('T')[0];
    try {
      const res = await fetch(getApiUrl('/api/stage'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: hoje,
          nome: '',
          valor: '',
          tipo: '',
          conta: loteConta || '',
          descricao: '',
          localizacao: '',
          texto_extrato: 'Adicionado manualmente no Stage',
          selecionado: true
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.stage && data.stage.itens) {
          setItens(data.stage.itens);
        } else {
          carregarStage(true);
        }
        showToast('Nova linha adicionada ao Stage!');
      }
    } catch (err) {
      showToast('Erro ao criar nova linha.', 'error');
    }
  };

  const handleExcluirItem = async (id) => {
    try {
      const res = await fetch(getApiUrl(`/api/stage/${id}`), { method: 'DELETE' });
      if (res.ok) {
        setItens(prev => prev.filter(i => i.id !== id));
        showToast('Item removido do Stage.');
      }
    } catch (err) {
      showToast('Erro ao remover item.', 'error');
    }
  };

  const handleLimparStage = async () => {
    if (!window.confirm('Tem certeza que deseja limpar TODOS os itens do Stage?')) return;
    try {
      const res = await fetch(getApiUrl('/api/stage'), { method: 'DELETE' });
      if (res.ok) {
        setItens([]);
        showToast('Stage limpo com sucesso!');
      }
    } catch (err) {
      showToast('Erro ao limpar Stage.', 'error');
    }
  };

  const handleSelecionarTodos = async (marcar) => {
    const idsVisiveis = itensFiltrados.map(i => Number(i.id));
    setItens(prev =>
      prev.map(i => (idsVisiveis.includes(Number(i.id)) ? { ...i, selecionado: marcar } : i))
    );
    await fetch(getApiUrl('/api/stage'), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: idsVisiveis, campos: { selecionado: marcar } })
    });
  };

  // Marca só os itens prontos (visíveis no filtro atual) e desmarca os incompletos, deixando a baixa pronta para 1 clique.
  const handleSelecionarProntos = async () => {
    const prontosIds = itensFiltrados.filter(i => i.completo).map(i => Number(i.id));
    const incompletosIds = itensFiltrados.filter(i => !i.completo).map(i => Number(i.id));
    if (prontosIds.length === 0) {
      showToast('Nenhum item pronto no filtro atual.', 'warning');
      return;
    }
    setItens(prev =>
      prev.map(i => {
        const id = Number(i.id);
        if (prontosIds.includes(id)) return { ...i, selecionado: true };
        if (incompletosIds.includes(id)) return { ...i, selecionado: false };
        return i;
      })
    );
    try {
      await Promise.all(
        [
          [prontosIds, true],
          [incompletosIds, false]
        ]
          .filter(([ids]) => ids.length > 0)
          .map(([ids, marcar]) =>
            fetch(getApiUrl('/api/stage'), {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ids, campos: { selecionado: marcar } })
            })
          )
      );
      showToast(`${prontosIds.length} item(ns) pronto(s) selecionado(s).`);
    } catch (err) {
      console.error(err);
      showToast('Erro ao salvar seleção.', 'error');
    }
  };

  const handleAplicarLote = async (campo, valor) => {
    if (!valor) return;
    const selecionadosIds = itensFiltrados.filter(i => i.selecionado).map(i => Number(i.id));
    if (selecionadosIds.length === 0) {
      showToast('Selecione pelo menos um item para aplicar em lote.', 'warning');
      return;
    }
    try {
      const res = await fetch(getApiUrl('/api/stage'), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selecionadosIds, campos: { [campo]: valor } })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.stage && data.stage.itens) setItens(data.stage.itens);
        showToast(`Campo "${campo}" aplicado para ${selecionadosIds.length} item(ns)!`);
      }
    } catch (err) {
      showToast('Erro ao aplicar alteração em lote.', 'error');
    }
  };

  const handleImportarJson = async () => {
    if (!jsonInput.trim()) return;
    try {
      const parsed = JSON.parse(jsonInput);
      const res = await fetch(getApiUrl('/api/stage'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Erro ao importar JSON');
      setItens(data.stage.itens || []);
      setModalJsonAberto(false);
      setJsonInput('');
      showToast(`${data.inseridos_count} item(ns) importado(s) para o Stage!`);
    } catch (err) {
      showToast(`JSON inválido ou erro: ${err.message}`, 'error');
    }
  };

  const handleComitarStage = async (apenasCompletos = false) => {
    const selecionados = itens.filter(i => i.selecionado);
    const prontosSelecionados = selecionados.filter(i => i.completo);

    if (selecionados.length === 0) {
      showToast('Nenhum item selecionado para dar baixa.', 'warning');
      return;
    }

    if (!apenasCompletos && prontosSelecionados.length < selecionados.length) {
      const faltamCount = selecionados.length - prontosSelecionados.length;
      if (prontosSelecionados.length > 0) {
        const confirmarParcial = window.confirm(
          `Existem ${faltamCount} item(ns) selecionado(s) ainda incompletos.\n\nDeseja dar baixa agora nos ${prontosSelecionados.length} item(ns) que JÁ ESTÃO PRONTOS e manter os ${faltamCount} incompletos no Stage para terminar depois?`
        );
        if (!confirmarParcial) return;
        apenasCompletos = true;
      } else {
        showToast(
          `Preencha os campos obrigatórios (Data, Nome, Valor, Categoria e Conta) antes de dar baixa.`,
          'warning'
        );
        return;
      }
    }

    const alvo = apenasCompletos ? prontosSelecionados : selecionados;
    const soma = alvo.reduce((acc, i) => acc + (Number(i.valor) || 0), 0);

    if (
      !window.confirm(
        `Confirmar baixa definitiva de ${alvo.length} compra(s) totalizando R$ ${formatarMoeda(soma)} no banco principal?`
      )
    ) {
      return;
    }

    setCommitting(true);
    try {
      if (baixarCsvAutomatico) {
        const link = document.createElement('a');
        link.href = getApiUrl('/api/exportar');
        link.download = `gastos_backup_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '_')}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      const res = await fetch(getApiUrl('/api/stage/commit'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ids: alvo.map(i => Number(i.id)),
          apenas_completos: apenasCompletos
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Erro ao dar baixa no Stage');

      showToast(data.message || 'Baixa realizada com sucesso!', 'success');
      await carregarStage(true);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setCommitting(false);
    }
  };

  const estatisticas = useMemo(() => {
    const total = itens.length;
    const prontos = itens.filter(i => i.completo).length;
    const incompletos = total - prontos;
    const valorTotal = itens.reduce((acc, i) => acc + (Number(i.valor) || 0), 0);
    const selecionados = itens.filter(i => i.selecionado);
    const prontosSelecionados = selecionados.filter(i => i.completo);
    const valorSelecionado = prontosSelecionados.reduce((acc, i) => acc + (Number(i.valor) || 0), 0);
    return {
      total,
      prontos,
      incompletos,
      valorTotal,
      selecionadosCount: selecionados.length,
      prontosSelecionadosCount: prontosSelecionados.length,
      valorSelecionado
    };
  }, [itens]);

  const itensFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return itens.filter(item => {
      if (filtroStatus === 'incompletos' && item.completo) return false;
      if (filtroStatus === 'prontos' && !item.completo) return false;
      if (termo) {
        const texto = `${item.nome} ${item.texto_extrato} ${item.observacao_agente} ${item.tipo} ${item.conta} ${item.descricao} ${item.localizacao}`.toLowerCase();
        if (!texto.includes(termo)) return false;
      }
      return true;
    });
  }, [itens, filtroStatus, busca]);

  // Ordenação congelada: só é recalculada ao trocar de coluna/direção ou quando entram/saem itens,
  // para a linha não "pular" de lugar enquanto o usuário edita a coluna ordenada.
  const idsKey = itens.map(i => i.id).join(',');
  const rankOrdenacao = useMemo(() => {
    const col = COLUNAS.find(c => c.key === ordenacao.coluna);
    if (!col) return null;
    const vazio = v => v === null || v === undefined || v === '' || Number.isNaN(v);
    const sinal = ordenacao.direcao === 'asc' ? 1 : -1;
    const ordenados = [...itens].sort((a, b) => {
      const va = col.sortValue(a);
      const vb = col.sortValue(b);
      if (vazio(va) || vazio(vb)) return vazio(va) - vazio(vb); // vazios sempre no fim
      const cmp =
        typeof va === 'number' && typeof vb === 'number'
          ? va - vb
          : String(va).localeCompare(String(vb), 'pt-BR', { numeric: true, sensitivity: 'base' });
      return cmp * sinal;
    });
    return new Map(ordenados.map((item, idx) => [item.id, idx]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ordenacao, idsKey]);

  const itensVisiveis = useMemo(() => {
    if (!rankOrdenacao) return itensFiltrados;
    const rank = id => rankOrdenacao.get(id) ?? Number.MAX_SAFE_INTEGER;
    return [...itensFiltrados].sort((a, b) => rank(a.id) - rank(b.id));
  }, [itensFiltrados, rankOrdenacao]);

  // Clique no título: asc → desc → sem ordenação (ordem original do Stage).
  const alternarOrdenacao = coluna =>
    setOrdenacao(prev =>
      prev.coluna !== coluna
        ? { coluna, direcao: 'asc' }
        : prev.direcao === 'asc'
          ? { coluna, direcao: 'desc' }
          : { coluna: null, direcao: 'asc' }
    );

  const todosVisiveisSelecionados = itensFiltrados.length > 0 && itensFiltrados.every(i => i.selecionado);

  const valorFiltrado = itensFiltrados.reduce((acc, i) => acc + (Number(i.valor) || 0), 0);

  const filtros = [
    { key: 'todos', label: 'Todos', count: estatisticas.total, color: '#38BDF8' },
    { key: 'incompletos', label: 'Pendentes', count: estatisticas.incompletos, color: '#F59E0B' },
    { key: 'prontos', label: 'Prontos', count: estatisticas.prontos, color: '#10B981' }
  ];

  const stickySx = col =>
    col.sticky !== undefined
      ? {
          position: 'sticky',
          left: col.sticky,
          zIndex: 2,
          bgcolor: 'inherit',
          ...(col.key === 'num' && { boxShadow: '2px 0 0 rgba(148, 163, 184, 0.18)' })
        }
      : {};

  return (
    <Box sx={{ height: '100dvh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4500}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%', fontWeight: 600 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Modal para Colar Lote JSON */}
      <Dialog open={modalJsonAberto} onClose={() => setModalJsonAberto(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Importar Lote JSON para o Stage</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" sx={{ mb: 1.5, color: 'text.secondary' }}>
            Seu agente MCP pode enviar os itens diretamente via <code>POST /api/stage</code> ou usando a ferramenta MCP <code>adicionar_stage</code>. Se preferir, cole abaixo uma lista JSON de compras extraídas do extrato:
          </Typography>
          <TextField
            multiline
            rows={10}
            fullWidth
            placeholder={`[\n  {\n    "data": "2026-11-02",\n    "nome": "Mercado",\n    "valor": 89.90,\n    "tipo": "",\n    "conta": "Crédito Nubank",\n    "texto_extrato": "02/11 PAG*MERCADO R$ 89,90",\n    "observacao_agente": "Qual categoria usar?"\n  }\n]`}
            value={jsonInput}
            onChange={e => setJsonInput(e.target.value)}
            sx={{ fontFamily: 'monospace' }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setModalJsonAberto(false)}>Cancelar</Button>
          <Button variant="contained" color="primary" onClick={handleImportarJson}>
            Enviar para o Stage
          </Button>
        </DialogActions>
      </Dialog>

      {/* Cabeçalho fixo: não rola junto com a planilha */}
      <Box
        component="header"
        sx={{
          flexShrink: 0,
          px: { xs: 1.5, sm: 2.5 },
          pt: { xs: 1.5, sm: 2 },
          pb: 1.5,
          borderBottom: GRID.border,
          bgcolor: 'rgba(9, 13, 22, 0.92)',
          backdropFilter: 'blur(16px)',
          zIndex: 5
        }}
      >
        {/* Linha 1: título + ações */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 1.5,
            mb: 1.5
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
            <Tooltip title="Painel Principal">
              <IconButton
                onClick={onNavigateHome}
                sx={{ border: '1px solid rgba(148, 163, 184, 0.3)', color: '#E2E8F0', borderRadius: 2.5 }}
              >
                <ArrowBackIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Box sx={{ minWidth: 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#F8FAFC', lineHeight: 1.2, fontSize: { xs: '1.05rem', sm: '1.25rem' } }}>
                  Stage de Extratos{' '}
                  <Box component="span" sx={{ color: '#F59E0B', display: { xs: 'none', sm: 'inline' } }}>• Playground MCP</Box>
                </Typography>
                <Chip
                  size="small"
                  label="/stage"
                  sx={{
                    display: { xs: 'none', sm: 'inline-flex' },
                    bgcolor: 'rgba(245, 158, 11, 0.15)',
                    color: '#FBBF24',
                    border: '1px solid rgba(245, 158, 11, 0.35)',
                    fontWeight: 700
                  }}
                />
              </Box>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: { xs: 'none', sm: 'block' } }}>
                Revise o que o agente inferiu dos extratos, complete as células em amarelo e dê baixa com 1 clique.
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', '& .MuiButton-startIcon': { mr: { xs: 0, sm: 1 } }, '& .MuiButton-root': { minWidth: { xs: 40, sm: 64 } } }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<CodeIcon />}
              onClick={() => setMostrarDocMcp(prev => !prev)}
              sx={{ borderColor: 'rgba(56, 189, 248, 0.4)', color: '#38BDF8' }}
            >
              <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Como o Agente Envia</Box>
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<ContentPasteIcon />}
              onClick={() => setModalJsonAberto(true)}
              sx={{ borderColor: 'rgba(168, 85, 247, 0.4)', color: '#C084FC' }}
            >
              <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Colar JSON</Box>
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<AddIcon />}
              onClick={handleAdicionarLinhaManual}
              sx={{ borderColor: 'rgba(16, 185, 129, 0.4)', color: '#10B981' }}
            >
              <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Nova Linha</Box>
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<TuneIcon />}
              onClick={() => setMostrarLoteMobile(prev => !prev)}
              sx={{ display: { xs: 'inline-flex', sm: 'none' }, borderColor: 'rgba(148, 163, 184, 0.3)', color: mostrarLoteMobile ? '#10B981' : '#94A3B8' }}
            >
              Lote
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<SyncIcon />}
              onClick={() => carregarStage(false)}
              sx={{ borderColor: 'rgba(148, 163, 184, 0.3)', color: '#94A3B8' }}
            >
              <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Atualizar</Box>
            </Button>
          </Box>
        </Box>

        {/* Linha 2: barra de ferramentas da planilha (filtros, busca, lote, baixa) */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, flexWrap: 'wrap' }}>
          <Box
            role="tablist"
            sx={{
              display: 'flex',
              border: '1px solid rgba(148, 163, 184, 0.22)',
              borderRadius: 2.5,
              overflow: 'hidden',
              flexShrink: 0
            }}
          >
            {filtros.map((f, idx) => {
              const ativo = filtroStatus === f.key;
              return (
                <Box
                  key={f.key}
                  component="button"
                  role="tab"
                  aria-selected={ativo}
                  onClick={() => setFiltroStatus(f.key)}
                  sx={{
                    all: 'unset',
                    cursor: 'pointer',
                    px: 1.5,
                    height: 38,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.75,
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    color: ativo ? f.color : '#94A3B8',
                    bgcolor: ativo ? `${f.color}1F` : 'transparent',
                    borderLeft: idx > 0 ? '1px solid rgba(148, 163, 184, 0.22)' : 'none',
                    boxShadow: ativo ? `inset 0 -2px 0 ${f.color}` : 'none',
                    '&:hover': { bgcolor: `${f.color}14` },
                    '&:focus-visible': { outline: `2px solid ${f.color}`, outlineOffset: -2 }
                  }}
                >
                  {f.label}
                  <Box
                    component="span"
                    sx={{
                      px: 0.75,
                      borderRadius: 1,
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      fontVariantNumeric: 'tabular-nums',
                      bgcolor: `${f.color}26`,
                      color: f.color
                    }}
                  >
                    {f.count}
                  </Box>
                </Box>
              );
            })}
          </Box>

          <TextField
            size="small"
            placeholder="Buscar no extrato, nome, nota do agente..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
            InputProps={{ startAdornment: <SearchIcon fontSize="small" sx={{ color: '#64748B', mr: 1 }} /> }}
            sx={{ flex: '1 1 220px', maxWidth: { md: 300 } }}
          />

          <Box sx={{ display: { xs: mostrarLoteMobile ? 'flex' : 'none', sm: 'flex' }, gap: 0.75, alignItems: 'center', flex: '1 1 220px', maxWidth: { md: 250 } }}>
            <Autocomplete
              size="small"
              fullWidth
              freeSolo
              options={metadados.tipos}
              value={loteTipo}
              onInputChange={(_, val) => setLoteTipo(val)}
              renderInput={params => <TextField {...params} label="Categoria em Lote" />}
            />
            <Button
              variant="outlined"
              size="small"
              onClick={() => handleAplicarLote('tipo', loteTipo)}
              sx={{ whiteSpace: 'nowrap', minWidth: 'auto', px: 1.5, height: 40 }}
            >
              Aplicar
            </Button>
          </Box>

          <Box sx={{ display: { xs: mostrarLoteMobile ? 'flex' : 'none', sm: 'flex' }, gap: 0.75, alignItems: 'center', flex: '1 1 220px', maxWidth: { md: 250 } }}>
            <Autocomplete
              size="small"
              fullWidth
              freeSolo
              options={metadados.contas}
              value={loteConta}
              onInputChange={(_, val) => setLoteConta(val)}
              renderInput={params => <TextField {...params} label="Conta em Lote" />}
            />
            <Button
              variant="outlined"
              size="small"
              onClick={() => handleAplicarLote('conta', loteConta)}
              sx={{ whiteSpace: 'nowrap', minWidth: 'auto', px: 1.5, height: 40 }}
            >
              Aplicar
            </Button>
          </Box>

          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', ml: { lg: 'auto' }, flexWrap: 'wrap' }}>
            <ButtonGroup variant="outlined" size="small" sx={{ height: 40, '& .MuiButton-root': { borderColor: 'rgba(148, 163, 184, 0.3)', whiteSpace: 'nowrap' } }}>
              <Button
                startIcon={todosVisiveisSelecionados ? <CheckBoxOutlineBlankIcon /> : <SelectAllIcon />}
                disabled={itensFiltrados.length === 0}
                onClick={() => handleSelecionarTodos(!todosVisiveisSelecionados)}
                sx={{ color: '#CBD5E1' }}
              >
                {todosVisiveisSelecionados ? 'Desmarcar todos' : 'Selecionar todos'}
              </Button>
              <Button
                startIcon={<CheckCircleIcon />}
                disabled={itensFiltrados.every(i => !i.completo)}
                onClick={handleSelecionarProntos}
                sx={{ color: '#10B981' }}
              >
                Só prontos
              </Button>
            </ButtonGroup>
            <Button
              variant="outlined"
              color="error"
              size="small"
              startIcon={<DeleteSweepIcon />}
              disabled={itens.length === 0}
              onClick={handleLimparStage}
              sx={{ height: 40 }}
            >
              <Box component="span" sx={{ display: { xs: 'none', xl: 'inline' } }}>Limpar</Box>
            </Button>
            <FormControlLabel
              sx={{ mx: 0 }}
              control={
                <Checkbox
                  size="small"
                  checked={baixarCsvAutomatico}
                  onChange={e => setBaixarCsvAutomatico(e.target.checked)}
                />
              }
              label={
                <Typography variant="caption" sx={{ color: '#CBD5E1' }}>
                  Backup CSV
                </Typography>
              }
            />
            <Button
              variant="contained"
              color="primary"
              disabled={committing || estatisticas.prontosSelecionadosCount === 0}
              startIcon={committing ? <CircularProgress size={18} color="inherit" /> : <DoneAllIcon />}
              onClick={() => handleComitarStage(false)}
              sx={{ fontWeight: 800, height: 40, whiteSpace: 'nowrap' }}
            >
              {committing
                ? 'Dando Baixa...'
                : `Dar Baixa (${estatisticas.prontosSelecionadosCount} • R$ ${formatarMoeda(estatisticas.valorSelecionado)})`}
            </Button>
          </Box>
        </Box>

        {/* Instruções para o Agente MCP (Colapsável) */}
        <Collapse in={mostrarDocMcp}>
          <Card sx={{ mt: 1.5, border: '1px solid rgba(56, 189, 248, 0.35)', bgcolor: 'rgba(15, 23, 42, 0.9)', maxHeight: '40vh', overflow: 'auto' }}>
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#38BDF8', mb: 1 }}>
                🤖 Como o Agente em Outros Computadores se Comunica com este Stage (HTTP / HTTPS / MCP)
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" sx={{ color: '#E2E8F0', mb: 1 }}>
                    <strong>Fluxo recomendado para o seu Agente:</strong>
                  </Typography>
                  <ol style={{ margin: 0, paddingLeft: 20, color: '#CBD5E1', fontSize: '0.85rem', lineHeight: 1.6 }}>
                    <li>Dar <code>GET /api/tudo</code> (ou <code>GET /api/gastos</code> + <code>GET /api/metadados</code>) para ler todas as baixas já feitas e categorias/contas existentes.</li>
                    <li>Comparar com os extratos bancários locais para filtrar apenas o que <strong>ainda não foi dado baixa</strong>.</li>
                    <li>Inferir o que conseguir e enviar o lote para <code>POST /api/stage</code> (ou ferramenta MCP <code>adicionar_stage</code>). Campos que o agente não souber podem vir vazios (<code>""</code>) junto com <code>texto_extrato</code> e <code>observacao_agente</code>!</li>
                  </ol>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box
                    component="pre"
                    sx={{
                      m: 0,
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: '#090D16',
                      border: '1px solid rgba(148, 163, 184, 0.2)',
                      color: '#E2E8F0',
                      fontSize: '0.75rem',
                      overflowX: 'auto'
                    }}
                  >
{`POST ${window.location.origin}/api/stage
Content-Type: application/json

{
  "limpar_anterior": false,
  "itens": [
    {
      "data": "2026-11-02",
      "nome": "",
      "valor": 64.90,
      "tipo": "",
      "conta": "Crédito Nubank",
      "texto_extrato": "02/11 PAG*JOSE SILVA R$ 64,90",
      "observacao_agente": "Não identifiquei o item nem a categoria"
    }
  ]
}`}
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Collapse>
      </Box>

      {/* Área da planilha: única região que rola (vertical e horizontal) */}
      <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
            <CircularProgress color="primary" />
          </Box>
        ) : itensFiltrados.length === 0 ? (
          <Box sx={{ flex: 1, overflow: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
            <Card sx={{ p: 5, textAlign: 'center', border: '1px dashed rgba(148, 163, 184, 0.3)', maxWidth: 720 }}>
              <ReceiptLongIcon sx={{ fontSize: 52, color: '#64748B', mb: 1.5 }} />
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#E2E8F0', mb: 0.5 }}>
                {itens.length === 0
                  ? 'Nenhum item no Stage no momento'
                  : 'Nenhum item corresponde ao filtro selecionado'}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 620, mx: 'auto', mb: 2.5 }}>
                Peça para o seu agente ler seus extratos bancários, comparar com <code>GET /api/gastos</code> e enviar os lançamentos novos para <code>POST /api/stage</code> (ou usar a ferramenta MCP <code>adicionar_stage</code>).
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                <Button variant="contained" startIcon={<AddIcon />} onClick={handleAdicionarLinhaManual}>
                  Adicionar Linha Manualmente
                </Button>
                <Button variant="outlined" startIcon={<ContentPasteIcon />} onClick={() => setModalJsonAberto(true)}>
                  Colar Lote JSON
                </Button>
              </Box>
            </Card>
          </Box>
        ) : (
          <TableContainer
            onKeyDown={handleGridKeyDown}
            sx={{
              flex: 1,
              overflow: 'auto',
              bgcolor: GRID.rowBg,
              // scrollIntoView não deixa a célula focada escondida sob o cabeçalho/colunas fixas
              scrollPaddingTop: GRID.rowHeight + 2,
              scrollPaddingLeft: COLUNAS[0].width + COLUNAS[1].width
            }}
          >
            <Table
              stickyHeader
              size="small"
              sx={{
                tableLayout: 'fixed',
                width: '100%',
                minWidth: LARGURA_TABELA,
                borderCollapse: 'separate',
                '& th, & td': {
                  borderBottom: GRID.border,
                  borderRight: GRID.border,
                  p: 0,
                  height: GRID.rowHeight,
                  fontSize: '0.8125rem'
                },
                '& th': { px: 1 },
                '& td[data-cell]': { outline: 'none', cursor: 'cell' },
                '& td[data-cell]:focus': { boxShadow: `${GRID.focusRing} !important`, bgcolor: 'rgba(16, 185, 129, 0.08)' },
                '& th:first-of-type': { px: 0 }
              }}
            >
              <colgroup>
                {COLUNAS.map(c => (
                  <col key={c.key} style={{ width: c.width }} />
                ))}
              </colgroup>
              <TableHead>
                <TableRow sx={{ bgcolor: GRID.headBg }}>
                  {COLUNAS.map(col => (
                    <TableCell
                      key={col.key}
                      align={col.align || 'left'}
                      padding={col.key === 'sel' ? 'checkbox' : 'none'}
                      aria-sort={
                        ordenacao.coluna === col.key ? (ordenacao.direcao === 'asc' ? 'ascending' : 'descending') : undefined
                      }
                      sx={{
                        whiteSpace: 'nowrap',
                        overflow: col.key === 'sel' ? 'visible' : 'hidden',
                        textOverflow: 'ellipsis',
                        bgcolor: GRID.headBg,
                        borderBottom: '2px solid rgba(148, 163, 184, 0.28) !important',
                        ...stickySx(col),
                        ...(col.sticky !== undefined && { zIndex: 4, bgcolor: GRID.headBg })
                      }}
                    >
                      {col.key === 'sel' ? (
                        <Checkbox
                          size="small"
                          checked={itensFiltrados.length > 0 && itensFiltrados.every(i => i.selecionado)}
                          indeterminate={
                            itensFiltrados.some(i => i.selecionado) && !itensFiltrados.every(i => i.selecionado)
                          }
                          onChange={e => handleSelecionarTodos(e.target.checked)}
                        />
                      ) : col.sortValue ? (
                        <TableSortLabel
                          active={ordenacao.coluna === col.key}
                          direction={ordenacao.coluna === col.key ? ordenacao.direcao : 'asc'}
                          onClick={() => alternarOrdenacao(col.key)}
                          sx={{
                            maxWidth: '100%',
                            flexDirection: col.align === 'right' ? 'row-reverse' : 'row',
                            '&.Mui-active': { color: '#10B981' },
                            '&.Mui-active .MuiTableSortLabel-icon': { color: '#10B981 !important' }
                          }}
                        >
                          <Box component="span" sx={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {col.label}
                          </Box>
                        </TableSortLabel>
                      ) : col.key === 'num' ? (
                        <Tooltip title="Restaurar ordem original">
                          <Box
                            component="button"
                            onClick={() => setOrdenacao({ coluna: null, direcao: 'asc' })}
                            sx={{ all: 'unset', cursor: 'pointer', color: ordenacao.coluna ? '#10B981' : 'inherit' }}
                          >
                            #
                          </Box>
                        </Tooltip>
                      ) : (
                        col.label
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {itensVisiveis.map((item, rowIdx) => {
                  const faltaData = !item.data || !String(item.data).trim();
                  const faltaNome = !item.nome || !String(item.nome).trim();
                  const faltaValor = item.valor === '' || item.valor === null || !(Number(item.valor) > 0);
                  const faltaTipo = !item.tipo || !String(item.tipo).trim();
                  const faltaConta = !item.conta || !String(item.conta).trim();
                  const matchParcela = String(item.nome || '').match(/^(.*?)(?:\s*-\s*|\s+)\(?1\/(\d+)\)?$/);
                  const saveState = savingStatus[item.id];
                  const rowBg = item.selecionado ? GRID.rowSelectedBg : rowIdx % 2 ? GRID.rowAltBg : GRID.rowBg;
                  const cellAttrs = colIdx => ({ tabIndex: -1, 'data-cell': `${rowIdx}:${colIdx}` });

                  return (
                    <TableRow
                      key={item.id}
                      sx={{
                        bgcolor: rowBg,
                        '&:hover': { bgcolor: GRID.rowHoverBg },
                        '& td': { verticalAlign: 'middle' }
                      }}
                    >
                      <TableCell {...cellAttrs(0)} padding="checkbox" align="center" sx={stickySx(COLUNAS[0])}>
                        <Checkbox
                          size="small"
                          checked={Boolean(item.selecionado)}
                          onChange={e => handleCampoChange(item.id, 'selecionado', e.target.checked, true)}
                        />
                      </TableCell>

                      {/* Número da linha */}
                      <TableCell {...cellAttrs(1)}
                        align="center"
                        sx={{
                          ...stickySx(COLUNAS[1]),
                          color: '#64748B',
                          fontSize: '0.72rem !important',
                          fontWeight: 600,
                          fontVariantNumeric: 'tabular-nums',
                          borderLeft: `3px solid ${item.completo ? '#10B981' : '#F59E0B'}`
                        }}
                      >
                        <Tooltip
                          title={
                            saveState === 'saving'
                              ? 'Salvando...'
                              : saveState === 'saved'
                                ? 'Salvo ✓'
                                : saveState === 'error'
                                  ? 'Erro ao salvar'
                                  : `ID ${item.id}`
                          }
                        >
                          <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.4 }}>
                            {rowIdx + 1}
                            {saveState === 'saving' && <CircularProgress size={8} thickness={6} sx={{ color: '#94A3B8' }} />}
                            {saveState === 'error' && <Box component="span" sx={{ color: '#F43F5E' }}>!</Box>}
                          </Box>
                        </Tooltip>
                      </TableCell>

                      {/* Status */}
                      <TableCell {...cellAttrs(2)} sx={{ px: '6px !important' }}>
                        {item.completo ? (
                          <Chip
                            size="small"
                            icon={<CheckCircleIcon />}
                            label="Pronto"
                            color="success"
                            variant="outlined"
                            sx={{ fontWeight: 700, fontSize: '0.7rem', height: 22 }}
                          />
                        ) : (
                          <Tooltip title={`Campos obrigatórios pendentes: ${item.campos_faltantes.join(', ')}`}>
                            <Chip
                              size="small"
                              icon={<WarningAmberIcon />}
                              label={`Falta: ${item.campos_faltantes.join(', ')}`}
                              color="warning"
                              variant="outlined"
                              sx={{ fontWeight: 700, fontSize: '0.7rem', height: 22, maxWidth: '100%' }}
                            />
                          </Tooltip>
                        )}
                      </TableCell>

                      {/* Data */}
                      <TableCell {...cellAttrs(3)}>
                        <TextField
                          type="date"
                          variant="standard"
                          fullWidth
                          value={item.data || ''}
                          onChange={e => handleCampoChange(item.id, 'data', e.target.value, true)}
                          InputProps={{ disableUnderline: true }}
                          sx={cellInputSx(faltaData)}
                        />
                      </TableCell>

                      {/* Nome da Compra */}
                      <TableCell {...cellAttrs(4)}>
                        <Tooltip
                          title={matchParcela ? `Gera ${matchParcela[2]} parcelas automáticas` : ''}
                          placement="top-start"
                        >
                          <TextField
                            variant="standard"
                            fullWidth
                            placeholder="O que foi comprado? *"
                            value={item.nome || ''}
                            onChange={e => handleCampoChange(item.id, 'nome', e.target.value)}
                            InputProps={{
                              disableUnderline: true,
                              endAdornment: matchParcela ? (
                                <Chip
                                  size="small"
                                  label={`${matchParcela[2]}x`}
                                  sx={{
                                    height: 18,
                                    ml: 0.5,
                                    fontSize: '0.65rem',
                                    fontWeight: 700,
                                    bgcolor: 'rgba(56, 189, 248, 0.15)',
                                    color: '#38BDF8'
                                  }}
                                />
                              ) : null
                            }}
                            sx={cellInputSx(faltaNome)}
                          />
                        </Tooltip>
                      </TableCell>

                      {/* Valor */}
                      <TableCell {...cellAttrs(5)}>
                        <ValorCell
                          valor={item.valor}
                          falta={faltaValor}
                          onChange={v => handleCampoChange(item.id, 'valor', v)}
                        />
                      </TableCell>

                      {/* Categoria (Tipo) */}
                      <TableCell {...cellAttrs(6)}>
                        <Autocomplete
                          size="small"
                          freeSolo
                          options={metadados.tipos}
                          value={item.tipo || ''}
                          onChange={(_, newVal) => handleCampoChange(item.id, 'tipo', newVal || '', true)}
                          onInputChange={(_, newInput, reason) => {
                            if (reason === 'input') handleCampoChange(item.id, 'tipo', newInput || '');
                          }}
                          renderInput={params => (
                            <TextField
                              {...params}
                              variant="standard"
                              placeholder="Selecionar *"
                              InputProps={{ ...params.InputProps, disableUnderline: true }}
                              sx={cellInputSx(faltaTipo)}
                            />
                          )}
                        />
                      </TableCell>

                      {/* Conta / Método */}
                      <TableCell {...cellAttrs(7)}>
                        <Autocomplete
                          size="small"
                          freeSolo
                          options={metadados.contas}
                          value={item.conta || ''}
                          onChange={(_, newVal) => handleCampoChange(item.id, 'conta', newVal || '', true)}
                          onInputChange={(_, newInput, reason) => {
                            if (reason === 'input') handleCampoChange(item.id, 'conta', newInput || '');
                          }}
                          renderInput={params => (
                            <TextField
                              {...params}
                              variant="standard"
                              placeholder="Selecionar *"
                              InputProps={{ ...params.InputProps, disableUnderline: true }}
                              sx={cellInputSx(faltaConta)}
                            />
                          )}
                        />
                      </TableCell>

                      {/* Extrato Original (somente leitura) */}
                      <TableCell {...cellAttrs(8)} sx={{ px: '8px !important' }}>
                        {item.texto_extrato ? (
                          <Tooltip title={item.texto_extrato} placement="top-start">
                            <Box
                              sx={{
                                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                                fontSize: '0.72rem',
                                color: '#CBD5E1',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                              }}
                            >
                              {item.texto_extrato}
                            </Box>
                          </Tooltip>
                        ) : (
                          <Box component="span" sx={{ color: '#475569' }}>—</Box>
                        )}
                      </TableCell>

                      {/* Nota do Agente */}
                      <TableCell {...cellAttrs(9)}>
                        <TextField
                          variant="standard"
                          fullWidth
                          placeholder="Nota (opcional)"
                          value={item.observacao_agente || ''}
                          onChange={e => handleCampoChange(item.id, 'observacao_agente', e.target.value)}
                          InputProps={{ disableUnderline: true }}
                          sx={{
                            ...cellInputSx(false),
                            '& .MuiInputBase-input': {
                              ...cellInputSx(false)['& .MuiInputBase-input'],
                              fontSize: '0.75rem',
                              color: '#FBBF24'
                            }
                          }}
                        />
                      </TableCell>

                      {/* Descrição */}
                      <TableCell {...cellAttrs(10)}>
                        <TextField
                          variant="standard"
                          fullWidth
                          placeholder="Opcional"
                          value={item.descricao || ''}
                          onChange={e => handleCampoChange(item.id, 'descricao', e.target.value)}
                          InputProps={{ disableUnderline: true }}
                          sx={cellInputSx(false)}
                        />
                      </TableCell>

                      {/* Localização */}
                      <TableCell {...cellAttrs(11)}>
                        <TextField
                          variant="standard"
                          fullWidth
                          placeholder="Opcional"
                          value={item.localizacao || ''}
                          onChange={e => handleCampoChange(item.id, 'localizacao', e.target.value)}
                          InputProps={{ disableUnderline: true }}
                          sx={cellInputSx(false)}
                        />
                      </TableCell>

                      {/* Fixo */}
                      <TableCell {...cellAttrs(12)} align="center">
                        <Switch
                          size="small"
                          checked={Boolean(item.fixo)}
                          onChange={e => handleCampoChange(item.id, 'fixo', e.target.checked, true)}
                        />
                      </TableCell>

                      {/* Excluir */}
                      <TableCell {...cellAttrs(13)} align="center">
                        <Tooltip title="Descartar / Remover do Stage">
                          <IconButton size="small" color="error" onClick={() => handleExcluirItem(item.id)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Barra de status (rodapé fixo da planilha) */}
        <Box
          component="footer"
          sx={{
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            gap: { xs: 1.5, sm: 3 },
            flexWrap: 'wrap',
            px: { xs: 1.5, sm: 2.5 },
            py: 0.75,
            borderTop: GRID.border,
            bgcolor: GRID.headBg,
            fontSize: '0.75rem',
            color: '#94A3B8',
            fontVariantNumeric: 'tabular-nums',
            '& strong': { color: '#E2E8F0', fontWeight: 700 }
          }}
        >
          <span>
            Linhas: <strong>{itensFiltrados.length}</strong>
            {itensFiltrados.length !== estatisticas.total && ` de ${estatisticas.total}`}
          </span>
          <span>
            Soma: <strong>R$ {formatarMoeda(valorFiltrado)}</strong>
          </span>
          <span>
            Selecionados: <strong>{estatisticas.selecionadosCount}</strong>
          </span>
          <span>
            Prontos selecionados: <strong style={{ color: '#10B981' }}>R$ {formatarMoeda(estatisticas.valorSelecionado)}</strong>
          </span>
          <Box component="span" sx={{ ml: 'auto', display: { xs: 'none', md: 'inline' }, color: '#64748B' }}>
            Setas navegam · Enter/F2 ou digitar edita · Esc sai da edição · Espaço marca · Clique no título ordena
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
