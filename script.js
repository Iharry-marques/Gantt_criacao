/**
 * Dashboard de Tarefas - Suno
 * 
 * Correções implementadas:
 * - Consolidação de dados por TaskID para evitar duplicatas
 * - IDs únicos garantidos para o vis-timeline
 * - Filtros por cliente e responsável
 * - Tratamento robusto de datas inválidas
 * - Logs detalhados para debug
 */

// Gerenciamento de abas
function initTabs() {
  const tabButtons = document.querySelectorAll('.nav-tab');
  const tabPanes = document.querySelectorAll('.tab-pane');

  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      if (button.disabled) return;

      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabPanes.forEach(pane => pane.classList.remove('active'));

      button.classList.add('active');
      const targetTab = button.getAttribute('data-tab');
      document.getElementById(targetTab).classList.add('active');
    });
  });
}

let timeline = null;
let allData = [];
let filteredData = [];

async function loadData() {
  try {
    console.log('Carregando dados...');
    const response = await fetch('./dados/dados.json');
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const text = await response.text();
    console.log('Dados carregados (primeiros 500 chars):', text.substring(0, 500));
    
    allData = JSON.parse(text);
    console.log('Total de registros carregados:', allData.length);
    
    // Análise de duplicatas
    const taskIds = allData.map(item => item.TaskID).filter(Boolean);
    const uniqueTaskIds = [...new Set(taskIds)];
    console.log(`TaskIDs únicos: ${uniqueTaskIds.length} de ${taskIds.length} registros`);
    
    if (taskIds.length !== uniqueTaskIds.length) {
      console.warn(`⚠️ Encontradas ${taskIds.length - uniqueTaskIds.length} duplicatas de TaskID`);
      
      // Mostrar alguns exemplos de duplicatas
      const duplicates = taskIds.filter((id, index) => taskIds.indexOf(id) !== index);
      const uniqueDuplicates = [...new Set(duplicates)].slice(0, 5);
      console.log('Exemplos de TaskIDs duplicados:', uniqueDuplicates);
    }
    
    console.log('Primeiro registro:', allData[0]);
    
    populateFilters();
    updateStats();
    filterAndRenderData();
  } catch (error) {
    console.error('Erro ao carregar dados:', error);
    showError(`Erro ao carregar os dados: ${error.message}. Verifique se o arquivo dados.json existe no diretório 'dados/' e está acessível.`);
  }
}

function populateFilters() {
  // Filtro de cliente
  const clientFilter = document.getElementById('clientFilter');
  const clients = [...new Set(allData.map(item => item.ClientNickname))].filter(Boolean).sort();

  clientFilter.innerHTML = '<option value="">Todos os clientes</option>';
  clients.forEach(client => {
    const option = document.createElement('option');
    option.value = client;
    option.textContent = client;
    clientFilter.appendChild(option);
  });

  // Filtro de responsável
  const ownerFilter = document.getElementById('ownerFilter');
  const owners = [...new Set(allData.map(item => item.TaskOwnerDisplayName))].filter(Boolean).sort();

  ownerFilter.innerHTML = '<option value="">Todos os responsáveis</option>';
  owners.forEach(owner => {
    const option = document.createElement('option');
    option.value = owner;
    option.textContent = owner;
    ownerFilter.appendChild(option);
  });

  // Event listeners
  clientFilter.addEventListener('change', filterAndRenderData);
  ownerFilter.addEventListener('change', filterAndRenderData);
}

function updateStats() {
  // Consolidar dados por TaskID para contar tarefas únicas
  const uniqueTasks = new Map();
  allData.forEach(item => {
    const taskId = item.TaskID;
    if (taskId && !uniqueTasks.has(taskId)) {
      uniqueTasks.set(taskId, item);
    }
  });
  
  const totalTasks = uniqueTasks.size;
  const activeProjects = [...new Set(allData.map(item => item.JobNumber))].filter(Boolean).length;

  document.getElementById('total-tasks').textContent = totalTasks;
  document.getElementById('active-projects').textContent = activeProjects;
}

function filterAndRenderData() {
  const clientFilter = document.getElementById('clientFilter').value;
  const ownerFilter = document.getElementById('ownerFilter').value;

  filteredData = allData.filter(item => {
    if (clientFilter && item.ClientNickname !== clientFilter) return false;
    if (ownerFilter && item.TaskOwnerDisplayName !== ownerFilter) return false;
    return true;
  });

  // Contar tarefas únicas nos dados filtrados
  const uniqueFilteredTasks = new Map();
  filteredData.forEach(item => {
    const taskId = item.TaskID;
    if (taskId) {
      uniqueFilteredTasks.set(taskId, item);
    }
  });

  console.log(`Dados filtrados: ${filteredData.length} registros (${uniqueFilteredTasks.size} tarefas únicas)`);
  renderGanttChart();
}

function renderGanttChart() {
  const container = document.getElementById('gantt-container');
  const loading = document.getElementById('loading');
  const emptyState = document.getElementById('empty-state');
  const errorMessage = document.getElementById('error-message');

  // Limpar erro anterior
  errorMessage.style.display = 'none';

  if (filteredData.length === 0) {
    loading.style.display = 'none';
    container.style.display = 'none';
    emptyState.style.display = 'block';
    return;
  }

  try {
    // Criar grupos (responsáveis)
    const groups = [...new Set(filteredData.map(item => item.TaskOwnerDisplayName))]
      .filter(Boolean)
      .sort()
      .map(name => ({ 
        id: name, 
        content: name,
        className: 'group-label'
      }));

    console.log('Grupos criados:', groups.length);

    // Consolidar dados por TaskID para evitar duplicatas
    const taskMap = new Map();
    
    filteredData.forEach((item, index) => {
      const taskId = item.TaskID || `task-${index}`;
      
      if (!taskMap.has(taskId)) {
        taskMap.set(taskId, item);
      } else {
        // Se já existe, manter o item mais recente (baseado na data de modificação)
        const existing = taskMap.get(taskId);
        const existingModDate = new Date(existing.ModificationDate || existing.TaskCreationDate);
        const currentModDate = new Date(item.ModificationDate || item.TaskCreationDate);
        
        if (currentModDate > existingModDate) {
          taskMap.set(taskId, item);
        }
      }
    });

    console.log(`Dados consolidados: ${filteredData.length} registros → ${taskMap.size} tarefas únicas`);

    // Criar items (tarefas) a partir dos dados consolidados
    const items = [];
    let itemCounter = 0;
    
    taskMap.forEach((item, taskId) => {
      try {
        // Criar ID único garantido
        const uniqueId = `item-${itemCounter}-${taskId}`;
        const isSubtask = item.ParentTaskID !== null && item.ParentTaskID !== undefined;
        const className = isSubtask ? 'subtarefa' : 'tarefa';
        const tipo = isSubtask ? 'Subtarefa' : 'Tarefa principal';

        // Tratar datas
        let startDate, endDate;
        
        try {
          startDate = new Date(item.TaskCreationDate);
          endDate = new Date(item.CurrentDueDate);
          
          // Verificar se as datas são válidas
          if (isNaN(startDate.getTime())) {
            console.warn('Data de início inválida para tarefa:', taskId);
            startDate = new Date(); // usar data atual como fallback
          }
          
          if (isNaN(endDate.getTime())) {
            console.warn('Data de fim inválida para tarefa:', taskId);
            endDate = new Date(startDate.getTime() + (7 * 24 * 60 * 60 * 1000)); // 7 dias após início
          }
          
          // Garantir que a data de fim seja após a de início
          if (endDate <= startDate) {
            endDate = new Date(startDate.getTime() + (24 * 60 * 60 * 1000)); // 1 dia após início
          }
        } catch (dateError) {
          console.error('Erro ao processar datas para tarefa:', taskId, dateError);
          startDate = new Date();
          endDate = new Date(startDate.getTime() + (7 * 24 * 60 * 60 * 1000));
        }

        const taskItem = {
          id: uniqueId,
          group: item.TaskOwnerDisplayName || 'Sem responsável',
          content: `${item.ClientNickname || 'N/A'} | ${item.RequestTypeName || 'N/A'} | ${item.TaskTitle || 'Sem título'}`,
          start: startDate,
          end: endDate,
          className: className,
          title: `
            <strong>${item.TaskTitle || 'Sem título'}</strong><br>
            Cliente: ${item.ClientNickname || 'N/A'}<br>
            Responsável: ${item.TaskOwnerDisplayName || 'N/A'}<br>
            Função: ${item.TaskOwnerUserFunctionTitle || 'N/A'}<br>
            Tipo: ${item.RequestTypeName || 'N/A'}<br>
            Categoria: ${tipo}<br>
            Task ID: ${taskId}<br>
            Status: ${item.PipelineStepTitle || 'N/A'}
          `.trim()
        };

        items.push(taskItem);
        itemCounter++;
        
      } catch (itemError) {
        console.error(`Erro ao processar item ${taskId}:`, itemError, item);
      }
    });

    console.log('Total de items criados:', items.length);

    if (items.length === 0) {
      throw new Error('Nenhum item válido foi criado a partir dos dados');
    }

    // Verificar se há IDs duplicados (debug)
    const ids = items.map(item => item.id);
    const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
    if (duplicateIds.length > 0) {
      console.warn('IDs duplicados encontrados:', duplicateIds);
    }

    // Opções do timeline
    const options = {
      width: '100%',
      height: '600px',
      orientation: 'top',
      showMajorLabels: true,
      showMinorLabels: true,
      zoomable: true,
      moveable: true,
      stack: true,
      showTooltips: true,
      tooltip: {
        followMouse: true,
        overflowMethod: 'cap'
      },
      margin: {
        item: { horizontal: 10, vertical: 5 }
      },
      locale: 'pt-BR',
      format: {
        minorLabels: {
          millisecond:'SSS',
          second:     's',
          minute:     'HH:mm',
          hour:       'HH:mm',
          weekday:    'ddd D',
          day:        'D',
          week:       'w',
          month:      'MMM',
          year:       'YYYY'
        },
        majorLabels: {
          millisecond:'HH:mm:ss',
          second:     'D MMMM HH:mm',
          minute:     'ddd D MMMM',
          hour:       'ddd D MMMM',
          weekday:    'MMMM YYYY',
          day:        'MMMM YYYY',
          week:       'MMMM YYYY',
          month:      'YYYY',
          year:       ''
        }
      }
    };

    // Destruir timeline anterior se existir
    if (timeline) {
      timeline.destroy();
      timeline = null;
    }

    // Criar novo timeline
    timeline = new vis.Timeline(container, items, groups, options);

    // Event listeners
    timeline.on('select', function (properties) {
      console.log('Item selecionado:', properties.items);
    });

    timeline.on('doubleClick', function (properties) {
      console.log('Double click:', properties);
    });

    // Mostrar container
    loading.style.display = 'none';
    emptyState.style.display = 'none';
    container.style.display = 'block';
    
    console.log('Timeline criado com sucesso');

  } catch (error) {
    console.error('Erro ao criar timeline:', error);
    showError(`Erro ao renderizar o gráfico: ${error.message}`);
  }
}

function showError(message) {
  const errorDiv = document.getElementById('error-message');
  const loading = document.getElementById('loading');
  const container = document.getElementById('gantt-container');
  
  errorDiv.textContent = message;
  errorDiv.style.display = 'block';
  loading.style.display = 'none';
  container.style.display = 'none';
}

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM carregado, inicializando aplicação...');
  initTabs();
  loadData();
});

// Funções de debug úteis (disponíveis no console)
window.debugDashboard = {
  // Verificar dados carregados
  getData: () => allData,
  getFilteredData: () => filteredData,
  
  // Analisar duplicatas
  findDuplicates: () => {
    const taskIds = allData.map(item => item.TaskID).filter(Boolean);
    const duplicates = {};
    
    taskIds.forEach(id => {
      duplicates[id] = (duplicates[id] || 0) + 1;
    });
    
    const duplicateIds = Object.keys(duplicates).filter(id => duplicates[id] > 1);
    console.log('TaskIDs com duplicatas:', duplicateIds.length);
    
    duplicateIds.forEach(id => {
      console.log(`TaskID ${id}: ${duplicates[id]} ocorrências`);
      const items = allData.filter(item => item.TaskID === id);
      console.table(items.map(item => ({
        TaskTitle: item.TaskTitle,
        ModificationDate: item.ModificationDate,
        PipelineStepTitle: item.PipelineStepTitle
      })));
    });
    
    return duplicateIds;
  },
  
  // Estatísticas gerais
  getStats: () => {
    const uniqueTasks = new Map();
    allData.forEach(item => {
      if (item.TaskID) uniqueTasks.set(item.TaskID, item);
    });
    
    return {
      totalRecords: allData.length,
      uniqueTasks: uniqueTasks.size,
      duplicates: allData.length - uniqueTasks.size,
      clients: [...new Set(allData.map(item => item.ClientNickname))].filter(Boolean).length,
      owners: [...new Set(allData.map(item => item.TaskOwnerDisplayName))].filter(Boolean).length
    };
  }
};

console.log('🔧 Debug: Use window.debugDashboard no console para análise dos dados');