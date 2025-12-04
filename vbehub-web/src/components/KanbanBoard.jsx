import React, { useState, useEffect, useMemo } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { 
  Box, Card, CardContent, Typography, Chip, Paper, 
  TextField, MenuItem, Stack, IconButton, Tooltip 
} from '@mui/material';
import FilterAltOffIcon from '@mui/icons-material/FilterAltOff';
import axios from 'axios';

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

  // Carregar dados
  useEffect(() => {
    const fetchSinais = async () => {
      try {
        const response = await axios.get('http://72.61.222.85:8081/api/sinais');
        const data = response.data;
        const newColumns = { ...columnsFromBackend };
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
    // Se nao tem filtro, retorna o original (performance)
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

  // Logica de Drag and Drop (Adaptada para Filtros)
  const onDragEnd = async (result) => {
    if (!result.destination) return;
    const { source, destination, draggableId } = result;

    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    // Quando filtrado, usamos o ID para achar o item na lista MESTRE, 
    // pois o index visual pode nao bater com o index real.
    
    // Clonar o estado mestre
    const newColumns = { ...columns };
    const sourceColumn = newColumns[source.droppableId];
    const destColumn = newColumns[destination.droppableId];

    // Encontrar o item na lista original pelo ID (mais seguro que index)
    const itemIndex = sourceColumn.items.findIndex(item => String(item.id) === draggableId);
    
    if (itemIndex === -1) return; // Segurança

    const [removed] = sourceColumn.items.splice(itemIndex, 1);
    
    // Atualizar status
    const novoStatus = destination.droppableId;
    removed.status = novoStatus;

    // Inserir no destino
    // Se tiver filtro ativo, joga pro final pra evitar confusao de index visual vs real
    // Se nao tiver filtro, usa o destination.index normal
    if (filterFonte || filterRisco) {
        destColumn.items.push(removed);
    } else {
        destColumn.items.splice(destination.index, 0, removed);
    }

    setColumns(newColumns);

    // API Call
    try {
      await axios.put(`http://72.61.222.85:8081/api/sinais/${removed.id}/status`, novoStatus, {
        headers: { 'Content-Type': 'text/plain' }
      });
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      alert("Erro ao salvar no servidor!");
    }
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
                                    
                                    <Typography variant="body2" color="text.secondary" sx={{fontSize: '0.8rem'}}>
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
    </Box>
  );
};

export default KanbanBoard;