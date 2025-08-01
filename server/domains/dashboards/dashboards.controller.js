const dashboardsService = require('./dashboards.service');
const { validationResult } = require('express-validator');

/**
 * Controlador principal para dashboards y métricas del sistema
 * Maneja vistas ejecutivas, operativas y personalizadas
 */
class DashboardsController {
  
  /**
   * Dashboard ejecutivo - Vista de alto nivel para gerencia
   * GET /api/dashboards/ejecutivo
   */
  async getDashboardEjecutivo(req, res) {
    try {
      const { periodo = '30d', include_trends = true } = req.query;
      
      console.log(`📊 Generando dashboard ejecutivo (período: ${periodo})`);
      
      const metricas = await dashboardsService.getExecutiveMetrics({
        periodo,
        include_trends: include_trends === 'true',
        usuario: req.user
      });
      
      res.json({
        success: true,
        data: {
          dashboard_type: 'ejecutivo',
          periodo,
          timestamp: new Date().toISOString(),
          metricas
        }
      });
      
    } catch (error) {
      console.error('❌ Error en dashboard ejecutivo:', error);
      res.status(500).json({
        success: false,
        message: 'Error generando dashboard ejecutivo',
        error: error.message
      });
    }
  }
  
  /**
   * Dashboard operativo - Vista detallada para auditores
   * GET /api/dashboards/operativo
   */
  async getDashboardOperativo(req, res) {
    try {
      const { 
        periodo = '7d', 
        auditor_id = req.user.id,
        include_alerts = true 
      } = req.query;
      
      console.log(`📋 Generando dashboard operativo para auditor ${auditor_id}`);
      
      const metricas = await dashboardsService.getOperationalMetrics({
        periodo,
        auditor_id,
        include_alerts: include_alerts === 'true',
        usuario: req.user
      });
      
      res.json({
        success: true,
        data: {
          dashboard_type: 'operativo',
          auditor_id,
          periodo,
          timestamp: new Date().toISOString(),
          metricas
        }
      });
      
    } catch (error) {
      console.error('❌ Error en dashboard operativo:', error);
      res.status(500).json({
        success: false,
        message: 'Error generando dashboard operativo',
        error: error.message
      });
    }
  }
  
  /**
   * Dashboard específico de proveedor
   * GET /api/dashboards/proveedor/:id
   */
  async getDashboardProveedor(req, res) {
    try {
      const { id: proveedor_id } = req.params;
      const { periodo = '90d', compare_peers = false } = req.query;
      
      console.log(`🏢 Generando dashboard para proveedor ${proveedor_id}`);
      
      const metricas = await dashboardsService.getProviderMetrics({
        proveedor_id,
        periodo,
        compare_peers: compare_peers === 'true',
        usuario: req.user
      });
      
      res.json({
        success: true,
        data: {
          dashboard_type: 'proveedor',
          proveedor_id,
          periodo,
          timestamp: new Date().toISOString(),
          metricas
        }
      });
      
    } catch (error) {
      console.error('❌ Error en dashboard proveedor:', error);
      res.status(500).json({
        success: false,
        message: 'Error generando dashboard de proveedor',
        error: error.message
      });
    }
  }
  
  /**
   * Métricas específicas de auditorías
   * GET /api/dashboards/metrics/auditorias
   */
  async getMetricasAuditorias(req, res) {
    try {
      const { 
        periodo = '30d',
        group_by = 'month',
        include_details = false 
      } = req.query;
      
      console.log(`📈 Calculando métricas de auditorías (${periodo})`);
      
      const metricas = await dashboardsService.getAuditoriasMetrics({
        periodo,
        group_by,
        include_details: include_details === 'true',
        usuario: req.user
      });
      
      res.json({
        success: true,
        data: {
          metric_type: 'auditorias',
          periodo,
          group_by,
          timestamp: new Date().toISOString(),
          metricas
        }
      });
      
    } catch (error) {
      console.error('❌ Error en métricas auditorías:', error);
      res.status(500).json({
        success: false,
        message: 'Error calculando métricas de auditorías',
        error: error.message
      });
    }
  }
  
  /**
   * Health check del módulo dashboards
   * GET /api/dashboards/health
   */
  async healthCheck(req, res) {
    try {
      const health = await dashboardsService.checkSystemHealth();
      
      res.json({
        success: true,
        data: {
          module: 'dashboards',
          status: health.status,
          timestamp: new Date().toISOString(),
          details: health.details
        }
      });
      
    } catch (error) {
      console.error('❌ Error en health check dashboards:', error);
      res.status(500).json({
        success: false,
        message: 'Error en verificación de salud del módulo',
        error: error.message
      });
    }
  }
}

module.exports = new DashboardsController();