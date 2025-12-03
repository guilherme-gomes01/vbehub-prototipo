import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Box, Card, CardContent, Typography, Chip, Paper } from '@mui/material';
import axios from 'axios';

// Mapeamento de cores para o Nível de Risco
const getRiskColor = (risk) => {
  const r = risk ? risk.toLowerCase() : '';
  if (r.includes('alto')) return 'error';
  if (r.includes('médio') || r.includes('medio')) return 'warning';
  return 'success';
};

// Estrutura inicial das colunas (deve bater com os status do Banco de Dados)
const columnsFromBackend = {
  'Pendente': { name: 'Informados (Entrada)', items: [], color: '#f5f5f5' },
  'Em Análise': { name: 'Em Análise', items: [], color: '#e3f2fd' },
  'Em Monitoramento': { name: 'Em Monitoramento', items: [], color: '#fff3e0' },
  'Evento': { name: 'Eventos Confirmados', items: [], color: '#e8f5e9' },
  'Descartado': { name: 'Descartados', items: [], color: '#ffebee' }
};

const KanbanBoard = () => {
  const [columns, setColumns] = useState(columnsFromBackend);

  // 1. Carregar dados do Java ao iniciar
  useEffect(() => {
    const fetchSinais = async () => {
      try {
        const response = await axios.get('http://72.61.222.85:8081/api/sinais');
        const data = response.data;

        // Organizar a lista plana da API dentro das colunas do Kanban
        const newColumns = { ...columnsFromBackend };
        
        // Limpar itens antigos para evitar duplicação no Hot Reload
        Object.keys(newColumns).forEach(key => newColumns[key].items = []);

        data.forEach(sinal => {
          // Se o status do banco bater com a coluna, adiciona
          if (newColumns[sinal.status]) {
            newColumns[sinal.status].items.push(sinal);
          } else {
            // Fallback: se vier um status estranho, joga em Pendente
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

  // 2. Lógica de quando soltar o card
  const onDragEnd = async (result, columns, setColumns) => {
    if (!result.destination) return;
    const { source, destination } = result;

    // Se soltou na mesma coluna e mesma posição, não faz nada
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    // Movimentação Visual (Otimista)
    const sourceColumn = columns[source.droppableId];
    const destColumn = columns[destination.droppableId];
    const sourceItems = [...sourceColumn.items];
    const destItems = [...destColumn.items];
    const [removed] = sourceItems.splice(source.index, 1);
    
    // Atualiza o status do objeto movido
    const novoStatus = destination.droppableId;
    removed.status = novoStatus; 
    
    destItems.splice(destination.index, 0, removed);

    setColumns({
      ...columns,
      [source.droppableId]: { ...sourceColumn, items: sourceItems },
      [destination.droppableId]: { ...destColumn, items: destItems }
    });

    // 3. Chamar a API Java para salvar a mudança
    try {
      await axios.put(`http://72.61.222.85:8081/api/sinais/${removed.id}/status`, novoStatus, {
        headers: { 'Content-Type': 'text/plain' } // Importante para o Controller Java ler a String crua
      });
      console.log(`Status do Sinal ${removed.id} atualizado para ${novoStatus}`);
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      alert("Erro ao salvar no servidor!");
    }
  };

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', height: '100%', overflowX: 'auto', p: 2 }}>
      <DragDropContext onDragEnd={result => onDragEnd(result, columns, setColumns)}>
        {Object.entries(columns).map(([columnId, column], index) => {
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
                    fontWeight: 'bold' 
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
  );
};

export default KanbanBoard;
