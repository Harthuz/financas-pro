import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Collapse,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  InputAdornment,
  LinearProgress,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography
} from '@mui/material';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ReferenceLine
} from 'recharts';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SyncIcon from '@mui/icons-material/Sync';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import FlagIcon from '@mui/icons-material/Flag';

const api = path => (window.location.port === '5173' ? `http://${window.location.hostname}:8000` : '') + path;
const money = v => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v) || 0);
const moneyCompact = v => new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 }).format(Number(v) || 0);
const dataBR = iso => (iso ? iso.split('-').reverse().join('/') : '-');

const BORDER = '1px solid rgba(148, 163, 184, 0.14)';
const AXIS_TICK = { fill: '#94A3B8', fontSize: 11 };

const labelSx = color => ({
  color,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: 0.8,
  fontSize: '0.7rem'
});

function ChartTooltip({ active, payload, label, formatter = money }) {
  if (!active || !payload?.length) return null;
  return (
    <Box sx={{ bgcolor: '#15181D', border: '1px solid rgba(148, 163, 184, 0.25)', borderRadius: 1.5, px: 1.5, py: 1 }}>
      <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 700, display: 'block' }}>{label}</Typography>
      {payload.map(p => (
        <Typography key={p.dataKey} variant="body2" sx={{ color: p.color, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
          {p.name}: {formatter(p.value)}
        </Typography>
      ))}
    </Box>
  );
}

function KpiCard({ label, value, caption, color, highlight, children }) {
  return (
    <Card
      sx={{
        height: '100%',
        border: `1px solid ${color}40`,
        ...(highlight && { bgcolor: `${color}14` })
      }}
    >
      <CardContent sx={{ py: 2, px: 2.25, '&:last-child': { pb: 2 } }}>
        <Typography variant="caption" sx={labelSx(color)}>{label}</Typography>
        <Typography
          sx={{
            fontWeight: 800,
            color: '#F8FAFC',
            mt: 0.5,
            fontSize: { xs: '1.35rem', sm: '1.6rem' },
            fontVariantNumeric: 'tabular-nums',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
        >
          {value}
        </Typography>
        {caption && (
          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.25 }}>
            {caption}
          </Typography>
        )}
        {children}
      </CardContent>
    </Card>
  );
}

function SectionTitle({ title, subtitle, action }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1.5, mb: 2, flexWrap: 'wrap' }}>
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 800, color: '#F8FAFC', fontSize: { xs: '1.05rem', sm: '1.2rem' } }}>
          {title}
        </Typography>
        {subtitle && <Typography variant="caption" color="text.secondary">{subtitle}</Typography>}
      </Box>
      {action}
    </Box>
  );
}

function DividasDialog({ open, onClose, dividas, onChanged, showToast }) {
  const [nome, setNome] = useState('');
  const [valor, setValor] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function request(method, id) {
    setSaving(true);
    setError('');
    try {
      const amount = Number(String(valor).replace(/\./g, '').replace(',', '.'));
      if (method === 'POST' && (!nome.trim() || !Number.isFinite(amount) || amount <= 0)) {
        throw new Error('Informe nome e valor positivo.');
      }
      const res = await fetch(api('/api/dividas' + (id ? `/${id}` : '')), {
        method,
        headers: { 'Content-Type': 'application/json' },
        ...(method === 'POST' ? { body: JSON.stringify({ nome: nome.trim(), valor: amount }) } : {})
      });
      if (!res.ok) throw new Error('Não foi possível atualizar a dívida.');
      setNome('');
      setValor('');
      showToast(method === 'POST' ? 'Dívida adicionada.' : 'Dívida removida.');
      await onChanged();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  const total = dividas.reduce((s, d) => s + Number(d.valor || 0), 0);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 700 }}>Minhas dívidas</DialogTitle>
      <DialogContent dividers>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
          Informe o saldo total ainda devido, incluindo faturas e empréstimos. Não cadastre a mesma dívida duas vezes.
        </Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Box
          component="form"
          onSubmit={e => { e.preventDefault(); request('POST'); }}
          sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 180px auto' }, gap: 1.5, mb: 2.5 }}
        >
          <TextField size="small" label="Nome da dívida" value={nome} onChange={e => setNome(e.target.value)} required />
          <TextField
            size="small"
            label="Valor devido"
            value={valor}
            onChange={e => setValor(e.target.value)}
            required
            slotProps={{
              htmlInput: { inputMode: 'decimal' },
              input: { startAdornment: <InputAdornment position="start">R$</InputAdornment> }
            }}
          />
          <Button type="submit" variant="contained" disabled={saving} startIcon={<AddIcon />}>
            Adicionar
          </Button>
        </Box>

        {dividas.length === 0 ? (
          <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', py: 2 }}>
            Nenhuma dívida cadastrada.
          </Typography>
        ) : (
          <Box sx={{ border: BORDER, borderRadius: 1.5, overflow: 'hidden' }}>
            {dividas.map(d => (
              <Box
                key={d.id}
                sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, px: 2, py: 1, borderBottom: BORDER }}
              >
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{d.nome}</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" sx={{ color: '#FDA4AF', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                    {money(d.valor)}
                  </Typography>
                  <Tooltip title="Remover">
                    <span>
                      <IconButton size="small" color="error" disabled={saving} onClick={() => request('DELETE', d.id)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                </Box>
              </Box>
            ))}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', px: 2, py: 1.25, bgcolor: '#111418' }}>
              <Typography variant="caption" sx={labelSx('#94A3B8')}>Total</Typography>
              <Typography variant="body2" sx={{ color: '#F43F5E', fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>
                {money(total)}
              </Typography>
            </Box>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose}>Fechar</Button>
      </DialogActions>
    </Dialog>
  );
}

function PlanoCard({ plano, data }) {
  const [mostrarTabela, setMostrarTabela] = useState(false);
  const p = plano;
  const usaPatrimonio = p.base_calculo === 'patrimonio_liquido';
  const saldoAtual = usaPatrimonio ? data.patrimonio_liquido : data.saldo?.saldo;
  const saldoBase = usaPatrimonio ? p.saldo_base?.patrimonio_liquido : p.saldo_base?.saldo;
  const final = p.projecao?.at(-1)?.saldo ?? 0;
  const atinge = final >= p.valor_meta;
  const progresso = saldoAtual != null && p.valor_meta > 0 ? Math.max(0, (saldoAtual / p.valor_meta) * 100) : null;
  const dividasMudaram = usaPatrimonio && data.total_dividas !== p.saldo_base?.total_dividas;
  const statusColor = atinge ? '#3A9C74' : '#F59E0B';

  return (
    <Card sx={{ mb: 2.5, p: { xs: 1.75, sm: 3 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1.5, flexWrap: 'wrap', mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 1.25, alignItems: 'center', minWidth: 0 }}>
          <Box
            sx={{
              width: 36, height: 36, flexShrink: 0, borderRadius: '6px',
              bgcolor: `${statusColor}1F`, border: `1px solid ${statusColor}66`,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
          >
            <FlagIcon sx={{ color: statusColor, fontSize: 20 }} />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#F8FAFC', lineHeight: 1.2, fontSize: { xs: '1.05rem', sm: '1.2rem' } }}>
              {p.nome}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Análise de {new Date(p.analisado_em).toLocaleString('pt-BR')} • Base {usaPatrimonio ? 'patrimônio líquido' : 'saldo em conta'} de {money(saldoBase)}
            </Typography>
          </Box>
        </Box>
        <Chip
          size="small"
          label={atinge ? 'Alcança a meta' : 'Abaixo da meta'}
          sx={{ bgcolor: `${statusColor}26`, color: atinge ? '#8CCBB0' : '#FBBF24', border: `1px solid ${statusColor}59`, fontWeight: 700 }}
        />
      </Box>

      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        <Grid size={{ xs: 6, md: 3 }}>
          <KpiCard label="Meta" value={money(p.valor_meta)} caption={`até ${dataBR(p.data_meta)}`} color="#5B9BD5" />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <KpiCard
            label="Projeção final"
            value={money(final)}
            caption={atinge ? `Sobra ${money(final - p.valor_meta)}` : `Faltam ${money(p.valor_meta - final)}`}
            color={statusColor}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <KpiCard
            label="Progresso atual"
            value={progresso != null ? `${progresso.toFixed(1)}%` : 'Indisponível'}
            caption={saldoAtual != null ? `Faltam ${money(Math.max(0, p.valor_meta - saldoAtual))} a partir de hoje` : undefined}
            color="#3A9C74"
          >
            {progresso != null && (
              <LinearProgress
                variant="determinate"
                value={Math.min(100, progresso)}
                sx={{ mt: 1.25, height: 8, borderRadius: 4, bgcolor: 'rgba(148, 163, 184, 0.12)' }}
              />
            )}
          </KpiCard>
        </Grid>
      </Grid>

      {dividasMudaram && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          As dívidas mudaram desde esta análise. Peça uma atualização da previsão na conversa.
        </Alert>
      )}

      {p.analise && (
        <Box sx={{ bgcolor: 'rgba(13, 16, 20, 0.6)', border: BORDER, borderRadius: 1.5, p: 2, mb: 2 }}>
          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', color: '#E2E8F0', lineHeight: 1.6 }}>{p.analise}</Typography>
          {p.premissas && (
            <Typography variant="caption" sx={{ whiteSpace: 'pre-wrap', color: 'text.secondary', display: 'block', mt: 1.5 }}>
              <b>Premissas:</b> {p.premissas}
            </Typography>
          )}
        </Box>
      )}

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 7 }}>
          <Typography variant="caption" sx={labelSx('#8CCBB0')}>Saldo previsto</Typography>
          <Box sx={{ height: 260, mt: 1 }}>
            <ResponsiveContainer>
              <AreaChart data={p.projecao} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id={`grad-${plano.id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3A9C74" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="#3A9C74" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.12)" />
                <XAxis dataKey="mes" tick={AXIS_TICK} />
                <YAxis width={56} tick={AXIS_TICK} tickFormatter={v => `R$${moneyCompact(v)}`} />
                <RechartsTooltip content={<ChartTooltip />} />
                <ReferenceLine
                  y={p.valor_meta}
                  stroke="#F59E0B"
                  strokeDasharray="4 4"
                  label={{ value: 'Meta', fill: '#FBBF24', fontSize: 11, position: 'insideTopLeft' }}
                />
                <Area type="monotone" dataKey="saldo" name="Saldo previsto" stroke="#3A9C74" strokeWidth={2.5} fill={`url(#grad-${plano.id})`} />
              </AreaChart>
            </ResponsiveContainer>
          </Box>
        </Grid>
        <Grid size={{ xs: 12, md: 5 }}>
          <Typography variant="caption" sx={labelSx('#5B9BD5')}>Rendimentos mensais projetados</Typography>
          <Box sx={{ height: 260, mt: 1 }}>
            <ResponsiveContainer>
              <BarChart data={p.projecao} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.12)" vertical={false} />
                <XAxis dataKey="mes" tick={AXIS_TICK} />
                <YAxis width={56} tick={AXIS_TICK} tickFormatter={v => `R$${moneyCompact(v)}`} />
                <RechartsTooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(148, 163, 184, 0.08)' }} />
                <Bar dataKey="rendimentos" name="Rendimento previsto" fill="#5B9BD5" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </Grid>
      </Grid>

      <Button
        size="small"
        onClick={() => setMostrarTabela(v => !v)}
        endIcon={mostrarTabela ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        sx={{ mt: 2, color: '#94A3B8' }}
      >
        {mostrarTabela ? 'Ocultar' : 'Ver'} projeção mês a mês
      </Button>
      {mostrarTabela && (
        <TableContainer sx={{ mt: 1, border: BORDER, borderRadius: 1.5, maxHeight: 420 }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                {['Mês', 'Entradas', 'Saídas', 'Rendimentos', 'Saldo previsto'].map((t, i) => (
                  <TableCell key={t} align={i ? 'right' : 'left'}>{t}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {p.projecao.map(m => (
                <TableRow key={m.mes} hover>
                  <TableCell sx={{ fontWeight: 600 }}>{m.mes}</TableCell>
                  <TableCell align="right" sx={{ color: '#8CCBB0', fontVariantNumeric: 'tabular-nums' }}>{money(m.entradas)}</TableCell>
                  <TableCell align="right" sx={{ color: '#FDA4AF', fontVariantNumeric: 'tabular-nums' }}>{money(m.saidas)}</TableCell>
                  <TableCell align="right" sx={{ color: '#93BDE3', fontVariantNumeric: 'tabular-nums' }}>{money(m.rendimentos)}</TableCell>
                  <TableCell
                    align="right"
                    sx={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: m.saldo >= p.valor_meta ? '#3A9C74' : '#F8FAFC' }}
                  >
                    {money(m.saldo)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
        Previsão baseada nas premissas da análise; atualize pela conversa quando sua situação mudar. Metas compartilham o saldo exibido e não representam reservas separadas.
      </Typography>
    </Card>
  );
}

export default function PlanningPage({ onNavigateHome }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [menuDividas, setMenuDividas] = useState(false);
  const [carteiraAberta, setCarteiraAberta] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const showToast = (message, severity = 'success') => setSnackbar({ open: true, message, severity });

  async function load() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(api('/api/planejamento'));
      if (!res.ok) throw new Error('Não foi possível carregar o planejamento.');
      setData(await res.json());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const saldo = data?.saldo;
  // Política: investimentos com saldo zerado não são exibidos.
  const investimentos = useMemo(() => {
    const inv = saldo?.investimentos;
    return inv ? { ...inv, ativos: (inv.ativos || []).filter(a => Math.abs(Number(a.saldo) || 0) >= 0.005) } : null;
  }, [saldo]);
  const ativosComTaxa = useMemo(
    () => (investimentos?.ativos || []).filter(a => Number.isFinite(a.taxa_mes)),
    [investimentos]
  );
  // Uma análise por data-meta (a mais recente vem primeiro na API).
  const planos = useMemo(
    () => (data?.planos || []).filter((p, i, all) => all.findIndex(o => o.documento.data_meta === p.documento.data_meta) === i),
    [data]
  );

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 3.5 }, px: { xs: 1.5, sm: 3 }, pb: { xs: 6, sm: 6 } }}>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackbar(s => ({ ...s, open: false }))} severity={snackbar.severity} variant="filled" sx={{ width: '100%', fontWeight: 600 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      <DividasDialog
        open={menuDividas}
        onClose={() => setMenuDividas(false)}
        dividas={data?.dividas || []}
        onChanged={load}
        showToast={showToast}
      />

      {/* Cabeçalho */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1.5, mb: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
          <Tooltip title="Painel Principal">
            <IconButton
              onClick={onNavigateHome}
              sx={{ border: '1px solid rgba(148, 163, 184, 0.3)', color: '#E2E8F0', borderRadius: 1.5 }}
            >
              <ArrowBackIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h6" component="h1" sx={{ fontWeight: 800, color: '#F8FAFC', lineHeight: 1.2, fontSize: { xs: '1.1rem', sm: '1.35rem' } }}>
              Meu futuro <Box component="span" sx={{ color: '#3A9C74' }}>financeiro</Box>
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: { xs: 'none', sm: 'block' } }}>
              Saldo atual, planos e progresso. As análises consideram as entradas, despesas e premissas informadas na conversa.
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            color="secondary"
            size="small"
            startIcon={<CreditCardIcon />}
            onClick={() => setMenuDividas(true)}
            sx={{ borderColor: 'rgba(91, 155, 213, 0.35)' }}
          >
            Minhas dívidas
          </Button>
          <Tooltip title="Atualizar saldos">
            <span>
              <IconButton
                onClick={load}
                disabled={loading}
                color="primary"
                size="small"
                sx={{ border: '1px solid rgba(58, 156, 116, 0.3)', borderRadius: 1.5, px: 1 }}
              >
                <SyncIcon className={loading ? 'spin-anim' : ''} />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
      </Box>

      {loading && !data && <LinearProgress sx={{ mb: 2 }} />}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {data?.erro_saldo && <Alert severity="warning" sx={{ mb: 2 }}>{data.erro_saldo}</Alert>}

      {/* KPIs de patrimônio */}
      <Grid container spacing={1.5} sx={{ mb: 1 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <KpiCard
            highlight
            label="Patrimônio líquido"
            value={data?.patrimonio_liquido != null ? money(data.patrimonio_liquido) : 'Indisponível'}
            caption="Conta + poupança + investimentos − dívidas cadastradas"
            color="#3A9C74"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KpiCard
            label="Conta corrente"
            value={saldo ? money(saldo.saldo_conta ?? saldo.saldo) : 'Indisponível'}
            caption={saldo?.contas?.length ? saldo.contas.map(c => `${c.nome}: ${money(c.saldo)}`).join(' • ') : 'Pluggy • BRL'}
            color="#5B9BD5"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KpiCard
            label="Poupança"
            value={saldo ? money(saldo.saldo_poupanca ?? 0) : 'Indisponível'}
            caption="Contas identificadas como poupança"
            color="#C084FC"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <KpiCard
            label="Investimentos"
            value={investimentos ? money(investimentos.total) : 'Indisponível'}
            caption="Saldo líquido • Pluggy"
            color="#93BDE3"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Box onClick={() => setMenuDividas(true)} sx={{ cursor: 'pointer', height: '100%' }}>
            <KpiCard
              label="Dívidas cadastradas"
              value={money(data?.total_dividas ?? 0)}
              caption={`${data?.dividas?.length ?? 0} dívida(s) • clique para gerenciar`}
              color="#F43F5E"
            />
          </Box>
        </Grid>
      </Grid>
      {saldo?.consultado_em && (
        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 2.5 }}>
          Consultado em {new Date(saldo.consultado_em).toLocaleString('pt-BR')}. A atualização bancária depende do Pluggy.
        </Typography>
      )}

      {/* Investimentos */}
      {investimentos && (
        <Card sx={{ mb: 2.5, p: { xs: 1.75, sm: 3 } }}>
          <Box
            onClick={() => setCarteiraAberta(v => !v)}
            sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1.5, cursor: 'pointer', userSelect: 'none' }}
          >
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#F8FAFC', fontSize: { xs: '1.05rem', sm: '1.2rem' } }}>
                Carteira de investimentos
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {investimentos.ativos.length} ativo(s) • {money(investimentos.total)} • Pluggy
              </Typography>
            </Box>
            <Button
              size="small"
              endIcon={carteiraAberta ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              sx={{ color: '#94A3B8', flexShrink: 0 }}
            >
              {carteiraAberta ? 'Recolher' : 'Expandir'}
            </Button>
          </Box>
          {saldo?.erro_investimentos && <Alert severity="warning" sx={{ mt: 2 }}>{saldo.erro_investimentos}</Alert>}
          <Collapse in={carteiraAberta} unmountOnExit>
          <Box sx={{ mt: 2 }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: ativosComTaxa.length ? 5 : 12 }}>
              <Box sx={{ border: BORDER, borderRadius: 1.5, overflow: 'hidden' }}>
                {investimentos.ativos.map(a => (
                  <Box key={a.id} sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, px: 2, py: 1, borderBottom: BORDER }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {a.nome}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1.5, flexShrink: 0 }}>
                      {Number.isFinite(a.taxa_mes) && (
                        <Typography variant="caption" sx={{ color: a.taxa_mes >= 0 ? '#8CCBB0' : '#FDA4AF', fontWeight: 700, alignSelf: 'center' }}>
                          {a.taxa_mes >= 0 ? '+' : ''}{a.taxa_mes}%
                        </Typography>
                      )}
                      <Typography variant="body2" sx={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{money(a.saldo)}</Typography>
                    </Box>
                  </Box>
                ))}
                {!investimentos.ativos.length && (
                  <Typography variant="body2" sx={{ color: 'text.secondary', p: 2 }}>Nenhum investimento com saldo.</Typography>
                )}
              </Box>
            </Grid>
            {ativosComTaxa.length > 0 && (
              <Grid size={{ xs: 12, md: 7 }}>
                <Typography variant="caption" sx={labelSx('#8CCBB0')}>Rentabilidade no último mês (%)</Typography>
                <Box sx={{ height: 240, mt: 1 }}>
                  <ResponsiveContainer>
                    <BarChart data={ativosComTaxa} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.12)" vertical={false} />
                      <XAxis dataKey="nome" tick={AXIS_TICK} interval={0} tickFormatter={v => (v.length > 12 ? `${v.slice(0, 12)}…` : v)} />
                      <YAxis width={40} tick={AXIS_TICK} tickFormatter={v => `${v}%`} />
                      <RechartsTooltip content={<ChartTooltip formatter={v => `${v}%`} />} cursor={{ fill: 'rgba(148, 163, 184, 0.08)' }} />
                      <Bar dataKey="taxa_mes" name="Rentabilidade mensal" fill="#3A9C74" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </Grid>
            )}
          </Grid>
          {!ativosComTaxa.length && investimentos.ativos.length > 0 && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5 }}>
              O Pluggy não forneceu taxas de rendimento mensal para estes ativos.
            </Typography>
          )}
          </Box>
          </Collapse>
        </Card>
      )}

      {/* Planos */}
      {data && (
        <SectionTitle
          title="Planos e metas"
          subtitle={planos.length ? `${planos.length} análise(s) ativa(s)` : undefined}
        />
      )}
      {data && !planos.length && (
        <Alert severity="info">
          Você ainda não tem análises. Peça na conversa, por exemplo: “Quero juntar R$ 40 mil até dezembro de 2028”. Informe suas entradas e despesas previstas para montar a projeção.
        </Alert>
      )}
      {planos.map(({ id, documento }) => (
        <PlanoCard key={id} plano={{ ...documento, id }} data={data} />
      ))}
    </Container>
  );
}
