import React, { useState, useEffect, useMemo } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { 
  Box, Card, CardContent, Typography, Chip, Paper, 
  TextField, MenuItem, Stack, IconButton, Tooltip,
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button
} from '@mui/material';
import FilterAltOffIcon from '@mui/icons-material/FilterAltOff';
// import axios from 'axios';
import api from '../services/api'; // Usa a instancia do axios com baseURL e interceptor

// Mapeamento de cores para o Nivel de Risco
const getRiskColor = (risk) => {
  const r = risk ? risk.toLowerCase() : '';
  if (r.includes('alto')) return 'error';
  if (r.includes('médio') || r.includes('medio')) return 'warning';
  return 'success';
};

// Estrutura inicial das colunas
const columnsFromBackend = {
  'Pendente': { name: 'Informados (Entrada)', items: [], color: '#f5f5f5' },
  'Em Análise': { name: 'Em Análise', items: [], color: '#e3f2fd' },
  'Em Monitoramento': { name: 'Em Monitoramento', items: [], color: '#fff3e0' },
  'Evento': { name: 'Eventos Confirmados', items: [], color: '#e8f5e9' },
  'Descartado': { name: 'Descartados', items: [], color: '#ffebee' }
};

const KanbanBoard = () => {
  const [columns, setColumns] = useState(columnsFromBackend);
  const [filterFonte, setFilterFonte] = useState('');
  const [filterRisco, setFilterRisco] = useState('');

  // Estados para o Dialog de Acao 
  const [openDialog, setOpenDialog] = useState(false);
  const [acaoText, setAcaoText] = useState('');
  const [pendingMove, setPendingMove] = useState(null); // Guarda a movimentacao pendente

  // Carregar dados
  useEffect(() => {
    const fetchSinais = async () => {
      try {
        const response = await api.get('/sinais');
        const data = response.data;
        const newColumns = { ...columnsFromBackend };
        // Limpar para evitar duplicatas em hot reload
        Object.keys(newColumns).forEach(key => newColumns[key].items = []);

        data.forEach(sinal => {
          if (newColumns[sinal.status]) {
            newColumns[sinal.status].items.push(sinal);
          } else {
            newColumns['Pendente'].items.push(sinal);
          }
        });
        setColumns(newColumns);
      } catch (error) {
        console.error("Erro ao buscar sinais:", error);
      }
    };
    fetchSinais();
  }, []);

  // Extrair opcoes unicas para os Selects (Dinamico)
  const { uniqueFontes, uniqueRiscos } = useMemo(() => {
    const fontes = new Set();
    const riscos = new Set();

    Object.values(columns).forEach(col => {
      col.items.forEach(item => {
        if (item.nomeFonte) fontes.add(item.nomeFonte);
        if (item.nivelRisco) riscos.add(item.nivelRisco);
      });
    });

    return {
      uniqueFontes: Array.from(fontes).sort(),
      uniqueRiscos: Array.from(riscos).sort()
    };
  }, [columns]);

  // Criar a "View" filtrada
  const filteredColumns = useMemo(() => {
    if (!filterFonte && !filterRisco) return columns;

    const newFiltered = {};
    Object.keys(columns).forEach(key => {
      newFiltered[key] = {
        ...columns[key],
        items: columns[key].items.filter(item => {
          const matchFonte = filterFonte ? item.nomeFonte === filterFonte : true;
          const matchRisco = filterRisco ? item.nivelRisco === filterRisco : true;
          return matchFonte && matchRisco;
        })
      };
    });

    return newFiltered;
  }, [columns, filterFonte, filterRisco]);

  // Funcao auxiliar para executar a movimentacao (usada diretamente ou apos o Dialog)
  const executeMove = async (source, destination, draggableId, acaoDescricao = null) => {
    // Clonar o estado mestre
    const newColumns = { ...columns };
    const sourceColumn = newColumns[source.droppableId];
    const destColumn = newColumns[destination.droppableId];

    // Encontrar o item na lista original pelo ID
    const itemIndex = sourceColumn.items.findIndex(item => String(item.id) === draggableId);
    
    if (itemIndex === -1) return;

    const [removed] = sourceColumn.items.splice(itemIndex, 1);
    
    // Atualizar status
    const novoStatus = destination.droppableId;
    removed.status = novoStatus;

    // Se houver descricao de acao, adiciona ao card
    if (acaoDescricao) {
        const timestamp = new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR');
        removed.descricao = (removed.descricao || '') + `\n\n-------------------\n[AÇÃO TOMADA em ${timestamp}]: ${acaoDescricao}`;
    }

    // Inserir no destino
    if (filterFonte || filterRisco) {
        destColumn.items.push(removed);
    } else {
        destColumn.items.splice(destination.index, 0, removed);
    }

    setColumns(newColumns);

    // API Call
    try {
      await api.put(`/sinais/${removed.id}/status`, novoStatus, {
        headers: { 'Content-Type': 'text/plain' }
      });
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      alert("Erro ao salvar no servidor!");
    }
  };

  // Logica inicial do Drag and Drop
  const onDragEnd = (result) => {
    if (!result.destination) return;
    const { source, destination, draggableId } = result;

    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const novoStatus = destination.droppableId;

    // Se for para Evento, intercepta e abre o Dialog
    if (novoStatus === 'Evento' && source.droppableId !== 'Evento') {
        setPendingMove({ source, destination, draggableId });
        setAcaoText(''); // Limpa o texto anterior
        setOpenDialog(true);
        return; // pausa aqui e espera o usuario confirmar no Dialog
    }
    
    // Se for qualquer outra movimentacao normal, executa direto
    executeMove(source, destination, draggableId);
  };

  // Handler para quando o usuario clica em "Salvar Acao" no Dialog
  const handleConfirmAction = () => {
    if (pendingMove) {
        executeMove(pendingMove.source, pendingMove.destination, pendingMove.draggableId, acaoText);
        setPendingMove(null);
        setOpenDialog(false);
    }
  };

  // Handler para cancelar (nao move o card)
  const handleCancelAction = () => {
    setPendingMove(null);
    setOpenDialog(false);
    // O card volta sozinho visualmente pois nao atualizamos o estado 'columns'
  };

  const clearFilters = () => {
    setFilterFonte('');
    setFilterRisco('');
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      
      {/* --- BARRA DE FILTROS --- */}
      <Paper elevation={1} sx={{ p: 2, m: 2, mb: 0, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
        <Typography variant="h6" sx={{ mr: 2, fontWeight: 'bold', color: '#555' }}>
          Filtros:
        </Typography>

        <TextField
          select
          label="Fonte"
          size="small"
          value={filterFonte}
          onChange={(e) => setFilterFonte(e.target.value)}
          sx={{ minWidth: 200 }}
        >
          <MenuItem value=""><em>Todas</em></MenuItem>
          {uniqueFontes.map(fonte => (
            <MenuItem key={fonte} value={fonte}>{fonte}</MenuItem>
          ))}
        </TextField>

        <TextField
          select
          label="Nível de Risco"
          size="small"
          value={filterRisco}
          onChange={(e) => setFilterRisco(e.target.value)}
          sx={{ minWidth: 200 }}
        >
          <MenuItem value=""><em>Todos</em></MenuItem>
          {uniqueRiscos.map(risco => (
            <MenuItem key={risco} value={risco}>{risco}</MenuItem>
          ))}
        </TextField>

        {(filterFonte || filterRisco) && (
            <Tooltip title="Limpar Filtros">
                <IconButton onClick={clearFilters} color="primary">
                    <FilterAltOffIcon />
                </IconButton>
            </Tooltip>
        )}
        
        {(filterFonte || filterRisco) && (
            <Typography variant="caption" color="warning.main" sx={{ ml: 'auto' }}>
               * Arraste ativado (posicionamento automático ao filtrar)
            </Typography>
        )}
      </Paper>

      {/* --- KANBAN BOARD --- */}
      <Box sx={{ display: 'flex', flexGrow: 1, overflowX: 'auto', p: 2 }}>
        <DragDropContext onDragEnd={onDragEnd}>
          {Object.entries(filteredColumns).map(([columnId, column]) => {
            return (
              <Box
                key={columnId}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  minWidth: '280px',
                  margin: '0 10px',
                }}
              >
                <Paper 
                  elevation={3} 
                  sx={{ 
                      width: '100%', 
                      backgroundColor: column.color, 
                      p: 1, 
                      textAlign: 'center', 
                      mb: 2, 
                      fontWeight: 'bold',
                      borderTop: `4px solid ${column.items.length > 0 ? '#1976d2' : '#ccc'}`
                  }}
                >
                  {column.name} ({column.items.length})
                </Paper>
                
                <Box sx={{ width: '100%', height: '100%' }}>
                  <Droppable droppableId={columnId} key={columnId}>
                    {(provided, snapshot) => (
                      <Box
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        sx={{
                          background: snapshot.isDraggingOver ? '#e0f7fa' : '#f4f5f7',
                          padding: 1,
                          width: '100%',
                          minHeight: 500,
                          borderRadius: 2
                        }}
                      >
                        {column.items.map((item, index) => {
                          return (
                            <Draggable key={String(item.id)} draggableId={String(item.id)} index={index}>
                              {(provided, snapshot) => (
                                <Card
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  sx={{
                                    userSelect: 'none',
                                    mb: 2,
                                    backgroundColor: snapshot.isDragging ? '#fffde7' : '#fff',
                                    transition: 'background-color 0.2s ease',
                                    '&:hover': { boxShadow: 6 },
                                    ...provided.draggableProps.style
                                  }}
                                >
                                  <CardContent>
                                    <Typography variant="subtitle2" component="div" gutterBottom>
                                      {item.titulo}
                                    </Typography>
                                    
                                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                                      <Chip 
                                          label={item.nivelRisco || 'N/A'} 
                                          color={getRiskColor(item.nivelRisco)} 
                                          size="small" 
                                      />
                                      <Chip 
                                          label={item.nomeFonte || 'Fonte'} 
                                          size="small" 
                                          variant="outlined" 
                                      />
                                    </Box>
                                    
                                    <Typography variant="body2" color="text.secondary" sx={{fontSize: '0.8rem', whiteSpace: 'pre-line'}}>
                                      {/* Mostra a descricao cortada se for muito longa, mas a acao aparece se for recente */}
                                      {item.descricao && item.descricao.length > 100 && !item.descricao.includes("AÇÃO TOMADA")
                                        ? item.descricao.substring(0, 100) + "..." 
                                        : item.descricao}
                                    </Typography>

                                    <Typography variant="caption" display="block" sx={{ mt: 1, color: '#999' }}>
                                      📍 {item.localizacaoBairro || 'Manaus'}
                                    </Typography>
                                  </CardContent>
                                </Card>
                              )}
                            </Draggable>
                          );
                        })}
                        {provided.placeholder}
                      </Box>
                    )}
                  </Droppable>
                </Box>
              </Box>
            );
          })}
        </DragDropContext>
      </Box>

      {/* --- DIALOG DE REGISTRO DE ACAO --- */}
      <Dialog open={openDialog} onClose={handleCancelAction} fullWidth maxWidth="sm">
        <DialogTitle>⚠️ Protocolo de Resposta</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Você está movendo este sinal para <strong>Eventos Confirmados</strong>. 
            Por favor, descreva a ação de saúde pública tomada para este evento.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            id="acao"
            label="Descrição da Ação"
            type="text"
            fullWidth
            multiline
            rows={4}
            variant="outlined"
            value={acaoText}
            onChange={(e) => setAcaoText(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelAction} color="secondary">
            Cancelar Movimentação
          </Button>
          <Button onClick={handleConfirmAction} variant="contained" color="primary" disabled={!acaoText.trim()}>
            Confirmar e Salvar
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
};

export default KanbanBoard;