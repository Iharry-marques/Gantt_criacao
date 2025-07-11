import React, { useEffect, useRef } from 'react';
import Gantt from 'frappe-gantt';
import 'frappe-gantt/dist/frappe-gantt.css';

const getZoomRange = (zoomLevel) => {
  switch (zoomLevel) {
    case 0: return 'Quarter Day';  // Horas
    case 1: return 'Day';          // Dias
    case 2: return 'Week';         // Semanas
    case 3: return 'Month';        // Meses
    default: return 'Week';
  }
};

export default function GanttTimeline({ tasks, zoomLevel }) {
  const containerRef = useRef(null);
  const ganttRef = useRef(null);

  useEffect(() => {
    if (!tasks || tasks.length === 0 || !containerRef.current) return;

    // Converter tarefas para o formato do Frappe Gantt
    const convertedTasks = tasks.map((task, idx) => {
      const isSubtask = task.ParentTaskID && task.ParentTaskID !== null && task.ParentTaskID !== undefined && task.ParentTaskID !== "";
      let startDate = new Date(task.TaskCreationDate);
      let endDate = new Date(task.CurrentDueDate);
      
      if (isNaN(startDate.getTime())) startDate = new Date();
      if (isNaN(endDate.getTime()) || endDate <= startDate) {
        endDate = new Date(startDate.getTime() + 24*60*60*1000);
      }

      return {
        id: task.UniqueTaskID || task.TaskID || `task-${idx}`,
        name: `${isSubtask ? '├─' : '📋'} ${task.ClientNickname || 'N/A'} | ${task.RequestTypeName || 'N/A'} | ${task.TaskTitle || 'Sem título'}`,
        start: startDate,
        end: endDate,
        progress: 0,
        dependencies: isSubtask ? [task.ParentTaskID] : '',
        custom_class: isSubtask ? 'subtarefa' : 'tarefa'
      };
    });

    // Limpar Gantt anterior se existir
    if (ganttRef.current) {
      containerRef.current.innerHTML = '';
    }

    // Criar novo Gantt
    ganttRef.current = new Gantt(containerRef.current, convertedTasks, {
      view_mode: getZoomRange(zoomLevel),
      language: 'pt-br',
      on_click: (task) => {
        console.log(task);
      },
      on_date_change: (task, start, end) => {
        console.log(task, start, end);
      },
      on_progress_change: (task, progress) => {
        console.log(task, progress);
      },
      custom_popup_html: (task) => {
        const originalTask = tasks.find(t => t.UniqueTaskID === task.id || t.TaskID === task.id);
        if (!originalTask) return '';
        
        return `
          <div class="details-container">
            <h4>${originalTask.TaskTitle || 'Sem título'}</h4>
            <p><strong>Cliente:</strong> ${originalTask.ClientNickname || 'N/A'}</p>
            <p><strong>Responsável:</strong> ${originalTask.TaskOwnerDisplayName || 'N/A'}</p>
            <p><strong>Status:</strong> ${originalTask.PipelineStepTitle || 'N/A'}</p>
            <p><strong>Início:</strong> ${new Date(task.start).toLocaleDateString('pt-BR')}</p>
            <p><strong>Prazo:</strong> ${new Date(task.end).toLocaleDateString('pt-BR')}</p>
          </div>
        `;
      }
    });

    // Atualizar view_mode quando o zoom mudar
    ganttRef.current.change_view_mode(getZoomRange(zoomLevel));

  }, [tasks, zoomLevel]);

  if (!tasks || tasks.length === 0) {
    return (
      <div className="empty-state">
        <h3>Nenhuma tarefa encontrada</h3>
        <p>Não há tarefas para os filtros selecionados.</p>
      </div>
    );
  }

  return (
    <div className="gantt-container" style={{ width: '100%', height: 400, background: '#fff', overflow: 'auto' }}>
      <svg ref={containerRef}></svg>
    </div>
  );
} 