import React, { useState, useEffect, useMemo } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import styles from './financial.module.css'; // MANTENDO SEU NOME DE ARQUIVO CSS Module

// -------------------- Icons --------------------
// (Ícones mantidos como SVG inline para simplicidade e portabilidade)
const DollarSignIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
);
const TrendingUpIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
);
const PackageIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m7.5 4.27 9 5.15"></path><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"></path><path d="m3.3 7 8.7 5 8.7-5"></path><path d="M12 22V12"></path></svg>
);
const BarChartIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="20" x2="12" y2="10"></line><line x1="18" y1="20" x2="18" y2="4"></line><line x1="6" y1="20" x2="6" y2="16"></line></svg>
);
const LoaderIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.animateSpin}><path d="M21 12a9 9 0 1 1-6.219-8.56"></path></svg>
);


// -------------------- Helpers / Constants --------------------
const BASE_URL = 'https://restaurant-2dfg.onrender.com';
const ENDPOINTS = {
  todayInfo: '/api/finance/today-info',
  topItems: '/api/finance/top-items',
  dailySales: '/api/finance/daily-sales',
};

// estado inicial
const initialDataState = {
  dailyInfo: { total_vendas: 0, total_pedidos: 0, ticket_medio: 0 },
  topItems: [],
  monthlyData: [],
};

// Mapeamento de cores para classes CSS
const colorMap = {
  green: styles.textGreen,
  blue: styles.textBlue,
  yellow: styles.textYellow,
};

// Card componente
const StatisticCard = ({ title, value, prefixIcon, description, color, isLoading }) => {
  const textColorClass = colorMap[color] || styles.textGreen;
  
  return (
    <div className={styles.statisticCard}>
      <div>
        <div className={`${styles.cardHeader} ${textColorClass}`}>
          <h3 className={styles.cardTitle}>{title}</h3>
          {React.cloneElement(prefixIcon, { className: styles.cardIcon })}
        </div>
        {isLoading ? (
          <div className={styles.cardValueLoading}></div>
        ) : (
          <p className={`${styles.cardValue} ${textColorClass}`}>
            {value}
          </p>
        )}
      </div>
      <p className={styles.cardDescription}>{description}</p>
    </div>
  );
};

// Tooltip custom
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const value = payload[0].value;
    const formatted = value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const date = new Date(label + 'T00:00:00');
    return (
      <div className={styles.customTooltip}>
        <p className={styles.tooltipDate}>
            {date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
        </p>
        <p className={styles.tooltipValue}>
          {formatted}
        </p>
      </div>
    );
  }
  return null;
};

// -------------------- Componente Principal --------------------
export default function FinancialDay({ date = null }) {
  const [data, setData] = useState(initialDataState);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // escolhe a data usada nas requests (YYYY-MM-DD)
  const requestDate = date ? (new Date(date)).toISOString().slice(0, 10) : (new Date()).toISOString().slice(0, 10);

  // função utilitária fetch POST JSON com logging
  const postJSON = async (path, body = {}) => {
    const url = `${BASE_URL}${path}`;
    
    console.log(`[FETCH] Iniciando POST para: ${url} com payload:`, body);

    try {
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!resp.ok) {
        const text = await resp.text().catch(() => '');
        console.error(`[FETCH ERROR] Falha na requisição para ${path}. Status: ${resp.status}`, text || resp.statusText);
        throw new Error(`HTTP ${resp.status} - ${text || resp.statusText}`);
      }

      const jsonResponse = await resp.json();
      console.log(`[FETCH SUCCESS] Dados de ${path} recebidos:`, jsonResponse);
      return jsonResponse;

    } catch (err) {
      console.error(`[FETCH CATCH] Erro ao processar requisição de ${path}:`, err);
      throw err; // Rejoga o erro para ser capturado no loadData
    }
  };

  // carrega dados dos 3 endpoints
  const loadData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // se a API aceita { date: 'YYYY-MM-DD' } no body — ajustável
      const payload = { date: requestDate };

      // Executa as chamadas em paralelo
      const [todayInfoRes, topItemsRes, dailySalesRes] = await Promise.all([
        postJSON(ENDPOINTS.todayInfo, payload),
        postJSON(ENDPOINTS.topItems, payload),
        postJSON(ENDPOINTS.dailySales, payload),
      ]);

      // --- Normalização dos dados ---
      // normaliza todayInfo (nomes podem variar)
      const dailyInfo = {
        total_vendas: todayInfoRes.total_vendido_hoje || 0,
        total_pedidos: todayInfoRes.total_pedidos_hoje || 0,
        ticket_medio: todayInfoRes.ticket_medio_hoje || 0,
      };

      // normaliza topItems
      const topItems = (topItemsRes && Array.isArray(topItemsRes)) ? topItemsRes.map((it, idx) => ({
        id: it.produto_id ?? it.id ?? idx,
        name: it.produto_nome ?? it.name ?? it.item ?? `Item ${idx + 1}`,
        quantity: it.total_quantidade_vendida ?? it.quantity ?? it.qty ?? 0,
        revenue: it.receita_gerada ?? it.revenue ?? it.total ?? 0,
      })) : (topItemsRes.items && Array.isArray(topItemsRes.items) ? topItemsRes.items.map((it, idx) => ({
        id: it.produto_id ?? it.id ?? idx,
        name: it.produto_nome ?? it.name ?? `Item ${idx + 1}`,
        quantity: it.total_quantidade_vendida ?? it.quantity ?? 0,
        revenue: it.receita_gerada ?? it.revenue ?? 0,
      })) : []);

      // normaliza daily sales
      let monthlyRaw = [];
      if (dailySalesRes) {
        if (Array.isArray(dailySalesRes)) {
          monthlyRaw = dailySalesRes;
        } else if (Array.isArray(dailySalesRes.salesData)) {
          monthlyRaw = dailySalesRes.salesData;
        } else if (Array.isArray(dailySalesRes.data)) {
          monthlyRaw = dailySalesRes.data;
        }
      }

      const monthlyData = monthlyRaw.map((it, idx) => {
        const dateField = it.date ?? it.dia ?? it.order_date ?? it.day ?? it.label;
        const salesField = it.sales ?? it.vendas_diarias ?? it.vendas ?? it.value ?? it.Vendas ?? 0;
        const day = (typeof dateField === 'string' && dateField.length >= 10) ? dateField.slice(0, 10) : `${requestDate}`;
        return { day, Vendas: Number(salesField) };
      });

      monthlyData.sort((a, b) => a.day.localeCompare(b.day));

      setData({
        dailyInfo,
        topItems,
        monthlyData,
      });
      // Fim da normalização

    } catch (err) {
      console.error('Erro geral no loadData:', err);
      setError(err.message || String(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestDate]);

  // --- derivados ---
  const totalMonthlySales = useMemo(() => {
    return (data.monthlyData || []).reduce((sum, item) => sum + Number(item.Vendas || 0), 0);
  }, [data.monthlyData]);

  const formatCurrency = (value) => Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const formattedTotalMonthlySales = formatCurrency(totalMonthlySales);
  const formattedDailySales = formatCurrency(data.dailyInfo.total_vendas);
  const formattedAvgTicket = formatCurrency(data.dailyInfo.ticket_medio);

  // Loading skeletons
  const LoadingSkeleton = () => (
    <div className={styles.loadingSkeleton}>
      <LoaderIcon className={styles.loaderIcon} />
      <span className={styles.loaderText}>Carregando dados...</span>
    </div>
  );

  const TopItemsSkeleton = () => (
    <div className={styles.topItemsCard}>
      <div className={styles.topItemsHeaderLoading}></div>
      <div className={styles.topItemsList}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} className={styles.topItemLoading}>
            <div className={styles.topItemNameLoading}></div>
            <div className={styles.topItemValueLoading}></div>
          </div>
        ))}
      </div>
    </div>
  );

  // Lógica de formatação de ticks do XAxis
  const tickFormatterXAxis = (value, index) => {
    const day = value.split('-')[2] ?? value;
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
    return isMobile && index % 5 !== 0 ? '' : day;
  };


  return (
    <div className={styles.dashboardContainer}>
      <h1 className={styles.dashboardTitle}>
        Dashboard Financeiro
      </h1>

      {error && (
        <div className={styles.errorMessage}>
          Erro carregando dados: **{error}**
        </div>
      )}

      {/* INFORMAÇÕES DO DIA */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Informações do Dia (Hoje)</h2>

        <div className={styles.cardsGrid}>
          <StatisticCard
            title="Vendas Totais Hoje"
            value={formattedDailySales}
            prefixIcon={<DollarSignIcon />}
            description="Total vendido até o momento."
            color="green"
            isLoading={isLoading}
          />
          <StatisticCard
            title="Pedidos Processados"
            value={isLoading ? '...' : (data.dailyInfo.total_pedidos ?? 0)}
            prefixIcon={<BarChartIcon />}
            description="Número de pedidos concluídos hoje."
            color="blue"
            isLoading={isLoading}
          />
          <StatisticCard
            title="Ticket Médio Diário"
            value={formattedAvgTicket}
            prefixIcon={<TrendingUpIcon />}
            description="Valor médio por pedido. Métrica relevante!"
            color="yellow"
            isLoading={isLoading}
          />
        </div>

        {/* Itens Top */}
        {isLoading ? <TopItemsSkeleton /> : (
          <div className={styles.topItemsCard}>
            <div className={styles.topItemsHeader}>
              <h3 className={styles.topItemsTitle}>
                <PackageIcon className={styles.topItemsIcon} />
                Itens que Mais Saíram (Top 4)
              </h3>
              <span className={styles.topItemsDate}>Dados do dia {requestDate}</span>
            </div>

            <div className={styles.tableContainer}>
              <table className={styles.itemsTable}>
                <thead className={styles.tableHead}>
                  <tr>
                    <th className={styles.tableHeader}>Item</th>
                    <th className={`${styles.tableHeader} ${styles.alignRight}`}>Quantidade</th>
                    <th className={`${styles.tableHeader} ${styles.alignRight} ${styles.hideOnMobile}`}>Receita Gerada</th>
                  </tr>
                </thead>
                <tbody className={styles.tableBody}>
                  {data.topItems.slice(0, 4).map((item, index) => (
                    <tr key={item.id ?? index} className={index < 2 ? styles.highlightRow : ''}>
                      <td className={styles.tableCellName}>
                        {index + 1}. **{item.name}**
                      </td>
                      <td className={`${styles.tableCell} ${styles.alignRight}`}>
                        <span className={styles.quantityValue}>{item.quantity}</span> unid.
                      </td>
                      <td className={`${styles.tableCell} ${styles.alignRight} ${styles.hideOnMobile}`}>
                        {formatCurrency(item.revenue)}
                      </td>
                    </tr>
                  ))}
                  {data.topItems.length === 0 && (
                    <tr>
                      <td colSpan={3} className={styles.noDataCell}>Sem dados para hoje</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* MÊS */}
      <section className={styles.section}>
        <div className={styles.monthlyHeader}>
          <h2 className={styles.sectionTitle}>
            Vendas Mensais - {new Date(requestDate).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
          </h2>
          <span className={styles.monthlyTotal}>
            Total Acumulado: {isLoading ? '...' : formattedTotalMonthlySales}
          </span>
        </div>

        {isLoading ? <LoadingSkeleton /> : (
          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.monthlyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorVendas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" vertical={false} />

                <XAxis
                  dataKey="day"
                  tick={{ fill: '#71717a', fontSize: 10 }}
                  tickLine={false}
                  axisLine={{ stroke: '#e0e0e0' }}
                  tickFormatter={tickFormatterXAxis}
                />

                <YAxis
                  tickFormatter={(value) => `R$ ${Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 }).format(value)}`}
                  tick={{ fill: '#71717a', fontSize: 10 }}
                  tickLine={false}
                  axisLine={{ stroke: '#e0e0e0' }}
                />

                <Tooltip content={<CustomTooltip />} />

                <Area
                  type="monotone"
                  dataKey="Vendas"
                  stroke="#059669"
                  fillOpacity={1}
                  fill="url(#colorVendas)"
                  strokeWidth={3}
                  activeDot={{ r: 6, fill: '#059669', stroke: '#fff', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        <p className={styles.chartFooter}>
            Passe o mouse (ou toque) sobre o gráfico para ver o detalhe das vendas por dia.
        </p>
      </section>

      <div className={styles.spacer}></div>
    </div>
  );
}